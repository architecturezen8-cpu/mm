import { NextRequest, NextResponse } from 'next/server';
import { POLL_CONFIG, PollKey, DEFAULT_COMMUNITY, isPredictionPoll } from '@/lib/voting';
import {
  initD1Database,
  isD1Available,
  d1CheckFingerprint,
  d1GetFingerprintRateCount,
  d1GetVoteResults,
  isVotingConnected,
  d1GetVotingSettings,
} from '@/lib/d1';
import { addToQueue, getPendingCounts, checkAndFlush, isFingerprintInQueue, getQueueRateCount } from '@/lib/vote-queue';
import { mergePendingCounts } from '@/lib/vote-utils';
import {
  isFingerprintCached,
  cacheFingerprintVote,
  getCachedRateCount,
  cacheRateLimitVote,
} from '@/lib/vote-cache';

import { getEnv } from '@/lib/cf-env';
const MATCH_ID = getEnv('NEXT_PUBLIC_MATCH_ID') || 'match_001';

// Per-fingerprint lock for batch operations — prevents race conditions
const batchLocks = new Set<string>();

// Rate limit: max votes per fingerprint per minute window
// Increased from 10 to 20 because:
// - Crowd Choice: 6 polls × 1 vote each = 6 votes
// - Predictions: 4 polls × 1 vote each = 4 votes
// - Total: 10 votes per full session, need headroom
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;

/**
 * POST /api/vote
 *
 * Supports two modes:
 * 1. Single vote: { pollKey, optionKey, fingerprint }
 * 2. Batch votes: { votes: [{pollKey, optionKey}], fingerprint }
 *
 * VOTE QUEUE (Batching System):
 * ┌──────────────────────────────────────────────────────────────────┐
 * │ Votes are QUEUED in memory → flushed to D1 every 3 minutes      │
 * │ This reduces D1 writes from 3/vote to ~1 aggregate/3min         │
 * │                                                                  │
 * │ User sees IMMEDIATE result (optimistic) via pending counts       │
 * │ KV backup every 30s for crash recovery                           │
 * │                                                                  │
 * │ Without queue: 50K voters × 3 ops = 150K writes/day             │
 * │ With queue:    ~480 aggregate writes/day → handles 1M+ voters   │
 * └──────────────────────────────────────────────────────────────────┘
 *
 * CACHING LAYERS (3-tier dedup & rate limiting):
 * ┌──────────────────────────────────────────────────────────────────┐
 * │ Layer 1: In-memory queue index (0ms) — same Worker isolate      │
 * │   Checks pending votes for this fingerprint/pollKey             │
 * │   Hit → skip D1 read entirely                                   │
 * │                                                                  │
 * │ Layer 2: In-memory fingerprint cache (0ms) — 5min TTL           │
 * │   Checks recently-flushed fingerprints                          │
 * │   Hit → skip D1 read entirely                                   │
 * │                                                                  │
 * │ Layer 3: D1 database (~50ms) — authoritative check               │
 * │   Only reached on cache MISS                                    │
 * │   Result cached back to Layer 2                                 │
 * │                                                                  │
 * │ Rate limiting follows same 3-tier pattern:                      │
 * │   Layer 1: Queue index → Layer 2: Rate cache → Layer 3: D1     │
 * └──────────────────────────────────────────────────────────────────┘
 */
export async function POST(request: NextRequest) {
  try {
    // ─── CHECK 0: D1 Availability ───
    if (!isD1Available()) {
      return NextResponse.json(
        { error: 'Voting database not available. Please configure Cloudflare D1.', votingEnabled: false, d1Unavailable: true },
        { status: 503 }
      );
    }

    // ─── CHECK 1: Voting Connection (D1-based) ───
    const connected = await isVotingConnected();
    if (!connected) {
      return NextResponse.json(
        { error: 'Voting is currently unavailable', votingEnabled: false, d1Disconnected: true },
        { status: 503 }
      );
    }

    // ─── CHECK 2: Voting Toggle (from D1 settings) ───
    await initD1Database();
    const settings = await d1GetVotingSettings();
    if (!settings.votingEnabled) {
      return NextResponse.json({ error: 'Voting is currently closed', votingEnabled: false }, { status: 403 });
    }

    const body = await request.json();
    const { pollKey, optionKey, fingerprint, votes } = body as {
      pollKey?: string;
      optionKey?: string;
      fingerprint?: string;
      votes?: Array<{ pollKey: string; optionKey: string }>;
    };

    // Validate fingerprint
    if (!fingerprint || typeof fingerprint !== 'string') {
      return NextResponse.json({ error: 'Missing fingerprint' }, { status: 400 });
    }

    // ─── 3-Tier Rate Limiting ───
    // IMPORTANT: We do NOT sum queue + cache counts because they overlap.
    // A vote is either in the queue (pending) OR in the cache (flushed to D1).
    // When a vote moves from queue→D1 (flush), it moves from Layer1→Layer2/3.
    // So we use the MAX of queue vs (cache or D1), not the sum.
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW_MS;

    // Layer 1: Check in-memory queue first (0ms)
    const queueRateCount = getQueueRateCount(fingerprint, windowStart);
    if (queueRateCount >= RATE_LIMIT_MAX) {
      return NextResponse.json({ error: 'Too many votes. Please wait a minute and try again.' }, { status: 429 });
    }

    // Layer 2: Check in-memory rate limit cache (0ms)
    const cachedRateCount = getCachedRateCount(fingerprint, windowStart);
    if (cachedRateCount >= 0) {
      // Cache hit — use MAX (not sum) to avoid double-counting
      // Queue votes and cache votes represent the SAME votes at different stages
      if (Math.max(queueRateCount, cachedRateCount) >= RATE_LIMIT_MAX) {
        return NextResponse.json({ error: 'Too many votes. Please wait a minute and try again.' }, { status: 429 });
      }
    } else {
      // Layer 3: D1 rate limit check (only on cache miss)
      const d1RateCount = await d1GetFingerprintRateCount(fingerprint, windowStart);
      // Use MAX (not sum) — queue votes that were just flushed are also in D1
      if (Math.max(queueRateCount, d1RateCount) >= RATE_LIMIT_MAX) {
        return NextResponse.json({ error: 'Too many votes. Please wait a minute and try again.' }, { status: 429 });
      }
    }

    // ─── Mode 1: Batch votes (PredictionsTab) ───
    if (votes && Array.isArray(votes) && votes.length > 0) {
      // Acquire per-fingerprint lock to prevent race conditions in batch votes
      if (batchLocks.has(fingerprint)) {
        return NextResponse.json({ error: 'Batch vote already in progress' }, { status: 429 });
      }
      batchLocks.add(fingerprint);
      try {
      // Deduplicate batch: only one vote per pollKey per fingerprint
      // This prevents duplicate poll submissions in a single batch request
      const seenPolls = new Set<string>();
      const dedupVotes = votes.filter(vote => {
        if (seenPolls.has(vote.pollKey)) return false;
        seenPolls.add(vote.pollKey);
        return true;
      });

      // Validate all votes in the batch
      for (const vote of dedupVotes) {
        const isPred = isPredictionPoll(vote.pollKey);
        if (!vote.pollKey || (!POLL_CONFIG[vote.pollKey as PollKey] && !isPred)) {
          return NextResponse.json({ error: `Invalid poll key: ${vote.pollKey}` }, { status: 400 });
        }
        if (!isPred) {
          const pollConfig = POLL_CONFIG[vote.pollKey as PollKey];
          if (pollConfig.options && !pollConfig.options[vote.optionKey]) {
            return NextResponse.json({ error: `Invalid option key: ${vote.optionKey} for poll ${vote.pollKey}` }, { status: 400 });
          }
        }
        if (isPred && (!vote.optionKey || typeof vote.optionKey !== 'string' || vote.optionKey.trim().length === 0)) {
          return NextResponse.json({ error: `Invalid option key for prediction poll: ${vote.pollKey}` }, { status: 400 });
        }
      }

      // ─── 3-Tier Fingerprint Dedup for batch ───
      // Instead of rejecting the ENTIRE batch when one poll is already voted,
      // we SKIP already-voted polls and submit the remaining ones.
      // This handles the case where a user voted on "whoWillWin" in CommunityTab
      // and then tries to submit predictions (which also includes "whoWillWin").
      const skippedPolls: string[] = [];
      const votesToSubmit = [];

      for (const vote of dedupVotes) {
        // Layer 1: Check in-memory queue (0ms)
        if (isFingerprintInQueue(fingerprint, vote.pollKey)) {
          skippedPolls.push(vote.pollKey);
          continue;
        }
        // Layer 2: Check in-memory fingerprint cache (0ms)
        if (isFingerprintCached(fingerprint, vote.pollKey)) {
          skippedPolls.push(vote.pollKey);
          continue;
        }
        // Layer 3: D1 check (only on cache miss)
        const alreadyVoted = await d1CheckFingerprint(fingerprint, vote.pollKey);
        if (alreadyVoted) {
          // Cache the result for future requests
          cacheFingerprintVote(fingerprint, vote.pollKey);
          skippedPolls.push(vote.pollKey);
          continue;
        }
        votesToSubmit.push(vote);
      }

      // If ALL polls were already voted, return a helpful error
      if (votesToSubmit.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'You have already voted on all these polls.',
          alreadyVoted: skippedPolls,
        }, { status: 403 });
      }

      // Add remaining votes to queue
      for (const vote of votesToSubmit) {
        addToQueue(vote.pollKey, vote.optionKey, fingerprint);
        // Update fingerprint dedup cache only (NOT rate limit cache)
        cacheFingerprintVote(fingerprint, vote.pollKey);
      }
      // Record as 1 rate limit hit (single user action)
      cacheRateLimitVote(fingerprint, Date.now());

      // Build community response: D1 results + pending counts (optimistic)
      const community = await d1GetVoteResults();
      const pendingCounts = getPendingCounts();
      const mergedCommunity = mergePendingCounts(community || { ...DEFAULT_COMMUNITY }, pendingCounts);

      return NextResponse.json({
        success: true,
        community: mergedCommunity,
        votingEnabled: true,
        queued: true,
        pendingCount: Object.values(pendingCounts).reduce((sum, c) => sum + c, 0),
        submittedPolls: votesToSubmit.map(v => v.pollKey),
        skippedPolls: skippedPolls.length > 0 ? skippedPolls : undefined,
      }, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Surrogate-Key': `vote-results-${MATCH_ID}`,
        },
      });
      } finally {
        batchLocks.delete(fingerprint);
      }
    }

    // ─── Mode 2: Single vote (VotingCard) ───
    if (!pollKey) {
      return NextResponse.json({ error: 'Missing pollKey' }, { status: 400 });
    }

    const isPrediction = isPredictionPoll(pollKey);

    // Validate poll key
    if (!POLL_CONFIG[pollKey as PollKey] && !isPrediction) {
      return NextResponse.json({ error: 'Invalid poll key' }, { status: 400 });
    }

    // Validate option key
    if (!isPrediction) {
      const pollConfig = POLL_CONFIG[pollKey as PollKey];
      if (pollConfig.options && !pollConfig.options[optionKey || '']) {
        return NextResponse.json({ error: 'Invalid option key' }, { status: 400 });
      }
    }

    if (isPrediction && (!optionKey || typeof optionKey !== 'string' || optionKey.trim().length === 0)) {
      return NextResponse.json({ error: 'Invalid option key for prediction poll' }, { status: 400 });
    }

    // ─── 3-Tier Fingerprint Dedup ───
    // Layer 1: Check in-memory queue (0ms)
    if (isFingerprintInQueue(fingerprint, pollKey)) {
      return NextResponse.json({ error: 'Already voted on this poll' }, { status: 403 });
    }
    // Layer 2: Check in-memory fingerprint cache (0ms, 5min TTL)
    if (isFingerprintCached(fingerprint, pollKey)) {
      return NextResponse.json({ error: 'Already voted on this poll' }, { status: 403 });
    }
    // Layer 3: D1 check (only on cache miss, ~50ms)
    const alreadyVoted = await d1CheckFingerprint(fingerprint, pollKey);
    if (alreadyVoted) {
      // Cache the D1 result for future requests — skip D1 next time
      cacheFingerprintVote(fingerprint, pollKey);
      return NextResponse.json({ error: 'Already voted on this poll' }, { status: 403 });
    }

    // Add vote to queue (instead of direct D1 write)
    const { pendingCount } = addToQueue(pollKey, optionKey!, fingerprint);

    // Update fingerprint dedup cache (NOT rate limit cache here)
    // Rate limit is tracked by the queue while the vote is pending.
    // When flushed to D1, the flush function will update the rate limit cache.
    cacheFingerprintVote(fingerprint, pollKey);
    cacheRateLimitVote(fingerprint, Date.now());

    // Build community response: D1 results + pending counts (optimistic)
    const community = await d1GetVoteResults();
    const pendingCounts = getPendingCounts();
    const mergedCommunity = mergePendingCounts(community || { ...DEFAULT_COMMUNITY }, pendingCounts);

    return NextResponse.json({
      success: true,
      community: mergedCommunity,
      votingEnabled: true,
      queued: true,
      pendingCount,
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Surrogate-Key': `vote-results-${MATCH_ID}`,
      },
    });
  } catch (error) {
    console.error('Vote API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
