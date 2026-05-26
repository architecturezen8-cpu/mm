import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_COMMUNITY } from '@/lib/voting';
import { initD1Database, isD1Available, d1GetVoteResults, isVotingConnected, d1GetVotingSettings } from '@/lib/d1';
import { checkAndFlush, getPendingCounts } from '@/lib/vote-queue';
import { mergePendingCounts } from '@/lib/vote-utils';
import { runPeriodicCleanup, getVoteCacheStats } from '@/lib/vote-cache';

import { getEnv } from '@/lib/cf-env';
const MATCH_ID = getEnv('NEXT_PUBLIC_MATCH_ID') || 'match_001';

/**
 * GET /api/vote-results
 *
 * CDN + In-Memory Caching Strategy:
 * ┌──────────────────────────────────────────────────────────────────┐
 * │ Layer 1: CDN (Cloudflare edge) — s-maxage=30                    │
 * │   100K users → only 1-3 requests hit Worker per 30s window      │
 * │                                                                  │
 * │ Layer 2: In-Memory cache (per Worker isolate) — 30s TTL         │
 * │   Requests that bypass CDN hit this cache → skip D1 read        │
 * │   Invalidated after every D1 flush                              │
 * │                                                                  │
 * │ Layer 3: D1 database — authoritative source                      │
 * │   Only reached on double-cache miss                             │
 * │   Result stored back in Layer 2 cache                           │
 * │                                                                  │
 * │ Total D1 reads for 1M users (100 isolates):                     │
 * │   ~86K/day (10s cache per isolate × 100 isolates)              │
 * │   vs ~400K/day without in-memory cache                          │
 * └──────────────────────────────────────────────────────────────────┘
 *
 * VOTE QUEUE Integration:
 * - Includes pending (unflushed) vote counts in the response
 * - Calls checkAndFlush() to ensure timely D1 flushing
 * - Pending counts are merged with D1 results for accurate display
 *
 * D1 ONLY — No Turso dependency
 */
export async function GET(request: NextRequest) {
  const noCache = request.nextUrl.searchParams.get('noCache') === '1';

  // ─── Cache Headers ───
  const cacheHeaders: Record<string, string> = noCache
    ? { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
    : {
        // max-age=0 → browser NEVER caches (always hits CDN)
        // s-maxage=30 → CDN caches for 30s (saves origin/D1 reads)
        // stale-while-revalidate=10 → serve stale while revalidating at CDN
        'Cache-Control': 'public, max-age=0, s-maxage=30, stale-while-revalidate=10',
        'Surrogate-Key': `vote-results-${MATCH_ID}`,
        'CDN-Cache-Control': 'public, s-maxage=30',
        'Vary': 'Accept-Encoding',
      };

  try {
    // ─── Trigger queue flush check (non-blocking) ───
    checkAndFlush().catch(() => {});

    // ─── Run periodic cache cleanup (non-blocking) ───
    runPeriodicCleanup();

    // ─── CHECK 0: D1 Availability ───
    if (!isD1Available()) {
      return NextResponse.json(
        { community: DEFAULT_COMMUNITY, votingEnabled: false, d1Unavailable: true },
        { status: 200, headers: cacheHeaders }
      );
    }

    // ─── CHECK 1: Voting Connection (D1-based) ───
    const connected = await isVotingConnected();
    if (!connected) {
      return NextResponse.json(
        { community: DEFAULT_COMMUNITY, votingEnabled: false, d1Disconnected: true },
        { status: 200, headers: cacheHeaders }
      );
    }

    // ─── CHECK 2: Voting Control Toggle (from D1 settings) ───
    await initD1Database();
    const settings = await d1GetVotingSettings();
    const votingEnabled = settings.votingEnabled;

    // ─── Read community data from D1 (with in-memory cache) ───
    const community = await d1GetVoteResults();

    // ─── Merge pending vote counts from queue (optimistic display) ───
    const pendingCounts = getPendingCounts();
    const mergedCommunity = mergePendingCounts(community || { ...DEFAULT_COMMUNITY }, pendingCounts);

    return NextResponse.json(
      { community: mergedCommunity, votingEnabled },
      { status: 200, headers: cacheHeaders }
    );
  } catch (error) {
    console.error('Vote results API error:', error);
    return NextResponse.json(
      { community: DEFAULT_COMMUNITY, votingEnabled: true, fallback: true },
      { status: 200, headers: cacheHeaders }
    );
  }
}
