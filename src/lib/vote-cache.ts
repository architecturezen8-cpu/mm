/**
 * Vote Cache — Server-side In-Memory Caching Layer
 *
 * Eliminates redundant D1 reads for voting operations.
 * Works ALONGSIDE CDN caching (not replacing it).
 *
 * Problem it solves:
 * ┌──────────────────────────────────────────────────────────────────┐
 * │ WITHOUT this cache:                                              │
 * │ - Every POST /api/vote → d1GetVoteResults() → 2 D1 reads       │
 * │ - Every GET /api/vote-results → d1GetVoteResults() → 2 D1 reads│
 * │ - Every vote → d1CheckFingerprint() → 1 D1 read                │
 * │ - Every vote → d1GetFingerprintRateCount() → 1 D1 read         │
 * │                                                                  │
 * │ WITH this cache:                                                 │
 * │ - Vote results cached 2min in memory → 99% fewer D1 reads       │
 * │ - Fingerprint dedup checked in-memory first → skip D1 if hit    │
 * │ - Rate limits tracked in-memory → skip D1 for recent voters     │
 * │                                                                  │
 * │ For 1M users with 100 Worker isolates:                          │
 * │ - WITHOUT: ~400K D1 reads/day just for results                  │
 * │ - WITH: ~86K D1 reads/day (2min cache per isolate)             │
 * └──────────────────────────────────────────────────────────────────┘
 *
 * Cache layers (in order of speed):
 * 1. In-memory (this file) — 0ms latency, per-Worker-isolate
 * 2. CDN (Cloudflare edge) — ~10ms latency, per-PoP
 * 3. D1 (database) — ~50ms latency, shared across all
 *
 * Invalidation:
 * - Vote results cache: invalidated after D1 flush + TTL (2min)
 * - Fingerprint cache: TTL-based (5min) + updated on new votes
 * - Rate limit cache: sliding window, auto-expires
 */

// ─── Vote Results Cache ─────────────────────────────────────────────

let cachedVoteResults: Record<string, unknown> | null = null;
let voteResultsCacheTime = 0;
const VOTE_RESULTS_CACHE_TTL = 30_000; // 30 seconds (was 2 min — fresher vote results)

/**
 * Get cached vote results if available and not expired.
 * Returns null if cache miss (caller should fetch from D1).
 */
export function getCachedVoteResults(): Record<string, unknown> | null {
  if (cachedVoteResults !== null && Date.now() - voteResultsCacheTime < VOTE_RESULTS_CACHE_TTL) {
    return cachedVoteResults;
  }
  return null;
}

/**
 * Store vote results in the in-memory cache.
 * Called after a successful D1 read.
 */
export function setCachedVoteResults(results: Record<string, unknown>): void {
  cachedVoteResults = results;
  voteResultsCacheTime = Date.now();
}

/**
 * Invalidate the vote results cache.
 * Called after D1 flush to ensure fresh data on next read.
 */
export function invalidateVoteResultsCache(): void {
  cachedVoteResults = null;
  voteResultsCacheTime = 0;
}

// ─── Fingerprint Dedup Cache ────────────────────────────────────────

interface FingerprintCacheEntry {
  pollKeys: Set<string>; // Polls this fingerprint has voted on
  lastSeen: number;      // Timestamp for TTL expiry
}

const fingerprintCache = new Map<string, FingerprintCacheEntry>();
const FINGERPRINT_CACHE_TTL = 3 * 60 * 1000; // 3 minutes (was 5 min — reduces false 'already voted')

/**
 * Check if a fingerprint has already voted on a poll (in-memory check).
 * Returns true if we KNOW they already voted (cache hit).
 * Returns false if cache miss (caller should check D1).
 *
 * This catches:
 * 1. Votes already in the pending queue (in-memory)
 * 2. Recent votes that were flushed to D1 (within 5min)
 */
export function isFingerprintCached(fingerprint: string, pollKey: string): boolean {
  const entry = fingerprintCache.get(fingerprint);
  if (!entry) return false;

  // Check TTL
  if (Date.now() - entry.lastSeen > FINGERPRINT_CACHE_TTL) {
    fingerprintCache.delete(fingerprint);
    return false;
  }

  return entry.pollKeys.has(pollKey);
}

/**
 * Mark a fingerprint as having voted on a poll.
 * Called when:
 * 1. A vote is added to the queue (optimistic)
 * 2. D1 confirms a fingerprint already voted (after D1 check)
 */
export function cacheFingerprintVote(fingerprint: string, pollKey: string): void {
  let entry = fingerprintCache.get(fingerprint);
  if (!entry || Date.now() - entry.lastSeen > FINGERPRINT_CACHE_TTL) {
    entry = { pollKeys: new Set(), lastSeen: Date.now() };
    fingerprintCache.set(fingerprint, entry);
  }
  entry.pollKeys.add(pollKey);
  entry.lastSeen = Date.now();
}

/**
 * Clean up expired fingerprint cache entries.
 * Called periodically to prevent memory leaks.
 * Returns number of entries removed.
 */
export function cleanupFingerprintCache(): number {
  const now = Date.now();
  let removed = 0;
  for (const [key, entry] of fingerprintCache.entries()) {
    if (now - entry.lastSeen > FINGERPRINT_CACHE_TTL) {
      fingerprintCache.delete(key);
      removed++;
    }
  }
  return removed;
}

// ─── Rate Limit Cache ───────────────────────────────────────────────

interface RateLimitEntry {
  timestamps: number[]; // Vote timestamps for this fingerprint
  lastCleaned: number;  // Last time old entries were pruned
}

const rateLimitCache = new Map<string, RateLimitEntry>();

/**
 * Get the count of recent votes from a fingerprint (in-memory).
 * Returns the count if we have data, or -1 if cache miss.
 *
 * Uses a sliding window — only counts votes within the window.
 * Prunes old entries periodically to prevent memory bloat.
 */
export function getCachedRateCount(fingerprint: string, windowStartMs: number): number {
  const entry = rateLimitCache.get(fingerprint);
  if (!entry) return -1; // Cache miss — caller should check D1

  // Prune old timestamps periodically (every 30s per entry)
  const now = Date.now();
  if (now - entry.lastCleaned > 30_000) {
    entry.timestamps = entry.timestamps.filter(t => t > now - 60_000); // Keep last 1min
    entry.lastCleaned = now;
  }

  // Count votes within the window
  const count = entry.timestamps.filter(t => t > windowStartMs).length;
  return count;
}

/**
 * Record a vote timestamp for rate limiting.
 * Called when a vote is added to the queue.
 */
export function cacheRateLimitVote(fingerprint: string, timestampMs: number): void {
  let entry = rateLimitCache.get(fingerprint);
  if (!entry) {
    entry = { timestamps: [], lastCleaned: Date.now() };
    rateLimitCache.set(fingerprint, entry);
  }
  entry.timestamps.push(timestampMs);
}

/**
 * Clean up expired rate limit entries.
 * Called periodically to prevent memory leaks.
 * Returns number of entries removed.
 */
export function cleanupRateLimitCache(): number {
  const cutoff = Date.now() - 60_000; // 1 minute ago
  let removed = 0;
  for (const [key, entry] of rateLimitCache.entries()) {
    // Remove old timestamps
    entry.timestamps = entry.timestamps.filter(t => t > cutoff);
    // Remove empty entries
    if (entry.timestamps.length === 0) {
      rateLimitCache.delete(key);
      removed++;
    }
  }
  return removed;
}

// ─── Batch Cleanup ───────────────────────────────────────────────────

let lastCleanupTime = 0;
const CLEANUP_INTERVAL = 60_000; // 1 minute

/**
 * Run periodic cleanup of all caches.
 * Called from vote-results route (non-blocking).
 * Prevents memory leaks from accumulated cache entries.
 */
export function runPeriodicCleanup(): void {
  const now = Date.now();
  if (now - lastCleanupTime < CLEANUP_INTERVAL) return;
  lastCleanupTime = now;

  const fpRemoved = cleanupFingerprintCache();
  const rlRemoved = cleanupRateLimitCache();

  if (fpRemoved > 0 || rlRemoved > 0) {
    console.log(`[VoteCache] 🧹 Cleaned up: ${fpRemoved} fingerprint entries, ${rlRemoved} rate limit entries`);
  }
}

// ─── Stats (for admin monitoring) ────────────────────────────────────

export interface VoteCacheStats {
  voteResultsCacheAge: number;     // ms since last cache set
  voteResultsCacheHit: boolean;    // whether results cache is valid
  fingerprintCacheSize: number;    // number of tracked fingerprints
  rateLimitCacheSize: number;      // number of tracked fingerprints for rate limiting
}

/**
 * Get cache statistics for admin monitoring.
 */
export function getVoteCacheStats(): VoteCacheStats {
  return {
    voteResultsCacheAge: cachedVoteResults ? Date.now() - voteResultsCacheTime : -1,
    voteResultsCacheHit: cachedVoteResults !== null && Date.now() - voteResultsCacheTime < VOTE_RESULTS_CACHE_TTL,
    fingerprintCacheSize: fingerprintCache.size,
    rateLimitCacheSize: rateLimitCache.size,
  };
}
