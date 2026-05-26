/**
 * Vote Queue — Hybrid Memory + KV Batching System
 *
 * Reduces D1 writes from 3/vote to ~1/3min aggregate write.
 *
 * Architecture:
 * 1. Votes enter in-memory queue (instant response)
 * 2. Every 90s, queue state backed up to KV (crash recovery)
 * 3. Every 3min OR when 100 votes accumulated, flush to D1
 * 4. On worker start, recover any unflushed votes from KV
 *
 * D1 Write Reduction:
 * - Without queue: 50K voters × 3 ops = 150K writes/day
 * - With queue: ~480 aggregate writes/day (1 every 3 min × 24 hrs)
 *
 * Free Tier: 100K writes/day → easily handles 1M+ voters
 */

// ─── Types ──────────────────────────────────────────────────────────

interface QueuedVote {
  pollKey: string;
  optionKey: string;
  fingerprint: string;
  timestamp: number;
}

interface VoteAggregation {
  [pollKey_optionKey: string]: number; // e.g., "whoWillWin__STC": 5
}

interface FlushResult {
  success: boolean;
  votesFlushed: number;
  writeCount: number;
  error?: string;
}

// ─── Constants ──────────────────────────────────────────────────────

const FLUSH_INTERVAL_MS = 1 * 60 * 1000; // 1 minute (was 3 min — reduces vote visibility latency)
const MAX_BATCH_SIZE = 100;
const KV_BACKUP_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes (720 writes/day, safely under 1K free limit)

// ─── In-Memory State (module-level) ─────────────────────────────────

let pendingVotes: QueuedVote[] = [];
let lastFlushTime = Date.now();
let lastKvBackupTime = Date.now();
let isFlushing = false; // Prevent concurrent flushes
let kvRecovered = false; // Track if we've done initial KV recovery

// ─── In-Memory Fingerprint Index ────────────────────────────────────
// Quick lookup: fingerprint → Set of pollKeys they've voted on in this queue.
// This lets us skip D1 dedup reads for fingerprints already in the queue.

const queueFingerprintIndex = new Map<string, Set<string>>();

/**
 * Check if a fingerprint has a vote in the pending queue for a given poll.
 * This is the FIRST dedup check — if hit, we skip the D1 read entirely.
 */
export function isFingerprintInQueue(fingerprint: string, pollKey: string): boolean {
  const polls = queueFingerprintIndex.get(fingerprint);
  return polls ? polls.has(pollKey) : false;
}

/**
 * Get the count of votes from a fingerprint in the pending queue
 * within a time window (for rate limiting).
 * This is the FIRST rate limit check — reduces D1 reads.
 */
export function getQueueRateCount(fingerprint: string, windowStartMs: number): number {
  let count = 0;
  for (const vote of pendingVotes) {
    if (vote.fingerprint === fingerprint && vote.timestamp > windowStartMs) {
      count++;
    }
  }
  return count;
}

// ─── Core Functions ─────────────────────────────────────────────────

/**
 * Add a vote to the in-memory queue.
 *
 * The vote is held in memory until either:
 * - 3 minutes have passed since the last flush, OR
 * - 100 votes have accumulated in the queue
 *
 * When either condition is met, an async flush to D1 is triggered
 * (non-blocking — the caller gets an immediate response).
 *
 * KV backup is triggered every 30 seconds if there are pending votes.
 *
 * Returns queued status and current pending count for optimistic display.
 */
export function addToQueue(
  pollKey: string,
  optionKey: string,
  fingerprint: string
): { queued: boolean; pendingCount: number } {
  const vote: QueuedVote = {
    pollKey,
    optionKey,
    fingerprint,
    timestamp: Date.now(),
  };

  pendingVotes.push(vote);

  // Update fingerprint index (for in-memory dedup + rate limiting)
  let fpEntry = queueFingerprintIndex.get(fingerprint);
  if (!fpEntry) {
    fpEntry = new Set();
    queueFingerprintIndex.set(fingerprint, fpEntry);
  }
  fpEntry.add(pollKey);

  // Trigger async KV recovery on first call (non-blocking)
  if (!kvRecovered) {
    recoverFromKV().catch((err) => {
      console.error('[VoteQueue] KV recovery failed on first call:', err);
    });
    kvRecovered = true;
  }

  // Check if flush is needed (time or size threshold)
  const timeToFlush = Date.now() - lastFlushTime >= FLUSH_INTERVAL_MS;
  const sizeToFlush = pendingVotes.length >= MAX_BATCH_SIZE;

  if (timeToFlush || sizeToFlush) {
    // Non-blocking flush — don't await
    flushToD1().catch((err) => {
      console.error('[VoteQueue] Async flush failed:', err);
    });
  } else {
    // Check if KV backup is needed (every 30s)
    const timeToBackup = Date.now() - lastKvBackupTime >= KV_BACKUP_INTERVAL_MS;
    if (timeToBackup && pendingVotes.length > 0) {
      backupToKV().catch((err) => {
        console.error('[VoteQueue] Async KV backup failed:', err);
      });
    }
  }

  return {
    queued: true,
    pendingCount: pendingVotes.length,
  };
}

/**
 * Check if flush conditions are met and trigger flush if needed.
 *
 * Should be called on every vote AND every vote-results read
 * to ensure timely flushing even if votes are sparse.
 *
 * Also triggers KV backup if the 30-second interval has elapsed.
 *
 * This is non-blocking — it fires and forgets the flush/backup.
 */
export async function checkAndFlush(): Promise<void> {
  // Trigger KV recovery on first call if not done yet
  if (!kvRecovered) {
    try {
      await recoverFromKV();
    } catch (err) {
      console.error('[VoteQueue] KV recovery failed in checkAndFlush:', err);
    }
    kvRecovered = true;
  }

  const now = Date.now();
  const timeToFlush = now - lastFlushTime >= FLUSH_INTERVAL_MS;
  const sizeToFlush = pendingVotes.length >= MAX_BATCH_SIZE;

  if ((timeToFlush || sizeToFlush) && !isFlushing && pendingVotes.length > 0) {
    // Fire and forget — don't block the caller
    flushToD1().catch((err) => {
      console.error('[VoteQueue] Flush triggered by checkAndFlush failed:', err);
    });
    return;
  }

  // Check KV backup interval
  const timeToBackup = now - lastKvBackupTime >= KV_BACKUP_INTERVAL_MS;
  if (timeToBackup && pendingVotes.length > 0) {
    backupToKV().catch((err) => {
      console.error('[VoteQueue] KV backup triggered by checkAndFlush failed:', err);
    });
  }
}

/**
 * Flush all pending votes to D1 as an aggregated batch.
 *
 * Instead of writing 3 operations per vote (increment + fingerprint + totalVotes),
 * we aggregate all votes by pollKey+optionKey and write a single
 * INSERT ... ON CONFLICT UPDATE per group, plus all fingerprints,
 * plus one totalVotes update.
 *
 * This reduces D1 writes from 3N (where N = number of votes) to
 * approximately G + N + 1 (where G = number of unique poll+option groups).
 *
 * For 100 votes across 6 poll options: 6 + 100 + 1 = 107 writes
 * vs. 300 writes without batching.
 *
 * On failure, votes are put back into the queue for retry.
 */
export async function flushToD1(): Promise<FlushResult> {
  if (isFlushing || pendingVotes.length === 0) {
    return { success: false, votesFlushed: 0, writeCount: 0 };
  }

  isFlushing = true;
  const votesToFlush = [...pendingVotes];
  pendingVotes = [];

  try {
    const { getD1Database, initD1Database } = await import('@/lib/d1');
    await initD1Database();
    const db = getD1Database();
    if (!db) throw new Error('D1 not available');

    // ─── Cross-isolate dedup: remove duplicate fingerprint+pollKey pairs ───
    // If the same fingerprint voted on the same poll in different isolates,
    // keep only the FIRST vote (earliest timestamp) to prevent double-counting.
    const dedupMap = new Map<string, QueuedVote>(); // key: "fingerprint__pollKey"
    for (const vote of votesToFlush) {
      const dedupKey = `${vote.fingerprint}__${vote.pollKey}`;
      if (!dedupMap.has(dedupKey)) {
        dedupMap.set(dedupKey, vote);
      }
    }
    const dedupedVotes = Array.from(dedupMap.values());

    if (dedupedVotes.length < votesToFlush.length) {
      console.log(`[VoteQueue] Deduped ${votesToFlush.length - dedupedVotes.length} duplicate fingerprint+poll pairs before flush`);
    }

    // Aggregate votes by pollKey + optionKey (using deduped votes)
    const aggregation: VoteAggregation = {};
    for (const vote of dedupedVotes) {
      const key = `${vote.pollKey}__${vote.optionKey}`;
      aggregation[key] = (aggregation[key] || 0) + 1;
    }

    // Build batch statements
    const statements: ReturnType<typeof db.prepare>[] = [];

    // 1. Increment vote counts (aggregated)
    for (const [compositeKey, count] of Object.entries(aggregation)) {
      const separatorIndex = compositeKey.indexOf('__');
      const pollKey = compositeKey.substring(0, separatorIndex);
      const optionKey = compositeKey.substring(separatorIndex + 2);

      statements.push(
        db.prepare(
          `INSERT INTO vote_counts (poll_key, option_key, count, updated_at)
           VALUES (?, ?, ?, datetime('now'))
           ON CONFLICT(poll_key, option_key)
           DO UPDATE SET count = count + ?, updated_at = datetime('now')`
        ).bind(pollKey, optionKey, count, count)
      );
    }

    // 2. Save fingerprints (dedup — INSERT OR IGNORE skips database-level duplicates)
    for (const vote of dedupedVotes) {
      statements.push(
        db.prepare(
          'INSERT OR IGNORE INTO vote_fingerprints (fingerprint, poll_key, created_at) VALUES (?, ?, ?)'
        ).bind(vote.fingerprint, vote.pollKey, vote.timestamp)
      );
    }

    // 3. Update total votes counter (using deduped count for accuracy)
    statements.push(
      db.prepare(
        `INSERT INTO vote_meta (key, value) VALUES ('totalVotes', ?)
         ON CONFLICT(key) DO UPDATE SET value = CAST(CAST(value AS INTEGER) + ? AS TEXT)`
      ).bind(String(dedupedVotes.length), String(dedupedVotes.length))
    );

    // Execute batch atomically
    await db.batch(statements);

    // Clear KV backup after successful flush
    try {
      const { kvClearVoteQueue } = await import('@/lib/kv-store');
      await kvClearVoteQueue();
    } catch {
      // KV clear failure is non-critical — votes are already in D1
      console.warn('[VoteQueue] Failed to clear KV backup after flush (non-critical)');
    }

    // Invalidate vote results cache — data has changed in D1
    // Also move rate limit tracking from queue (Layer1) to cache (Layer2)
    // This prevents double-counting: same vote won't be in both queue AND cache
    try {
      const { invalidateVoteResultsCache, cacheFingerprintVote, cacheRateLimitVote } = await import('@/lib/vote-cache');
      invalidateVoteResultsCache();
      // Track which fingerprints have had their rate limit moved to cache
      const rateLimitMoved = new Set<string>();
      // All flushed fingerprints are now confirmed in D1 — update cache
      for (const vote of votesToFlush) {
        cacheFingerprintVote(vote.fingerprint, vote.pollKey);
        // Move rate limit tracking: queue → cache (one entry per fingerprint per flush)
        // Not one per vote — that would over-count batch submissions
        if (!rateLimitMoved.has(vote.fingerprint)) {
          cacheRateLimitVote(vote.fingerprint, vote.timestamp);
          rateLimitMoved.add(vote.fingerprint);
        }
      }
    } catch {
      // Non-critical
    }

    lastFlushTime = Date.now();

    // Rebuild fingerprint index from remaining pending votes
    rebuildFingerprintIndex();

    console.log(
      `[VoteQueue] ✅ Flushed ${dedupedVotes.length}/${votesToFlush.length} votes to D1 ` +
      `(${Object.keys(aggregation).length} groups, ${statements.length} total writes)`
    );

    return {
      success: true,
      votesFlushed: votesToFlush.length,
      writeCount: statements.length,
    };
  } catch (err: unknown) {
    // Flush failed — put votes back into queue for retry
    pendingVotes = [...votesToFlush, ...pendingVotes];
    const message = err instanceof Error ? err.message : String(err);
    console.error('[VoteQueue] ❌ Flush failed:', message);
    return {
      success: false,
      votesFlushed: 0,
      writeCount: 0,
      error: message,
    };
  } finally {
    isFlushing = false;
  }
}

/**
 * Backup current pending votes to KV store.
 *
 * This provides crash recovery — if the Worker restarts before
 * a D1 flush, votes can be recovered from KV on the next startup.
 *
 * Called every 30 seconds when there are pending votes.
 * Returns true if backup succeeded, false otherwise.
 */
export async function backupToKV(): Promise<boolean> {
  if (pendingVotes.length === 0) {
    return true; // Nothing to backup — success by definition
  }

  try {
    const { kvSetVoteQueue } = await import('@/lib/kv-store');
    const success = await kvSetVoteQueue(pendingVotes);

    if (success) {
      lastKvBackupTime = Date.now();
      console.log(`[VoteQueue] 📦 Backed up ${pendingVotes.length} votes to KV`);
    }

    return success;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[VoteQueue] KV backup failed:', message);
    return false;
  }
}

/**
 * Recover unflushed votes from KV store.
 *
 * Called on module init (first vote or first checkAndFlush call)
 * to restore votes that were in the queue when the Worker crashed
 * or restarted.
 *
 * If recovered votes meet the flush threshold (100 votes),
 * an automatic flush is triggered.
 *
 * Returns the number of votes recovered from KV.
 */
export async function recoverFromKV(): Promise<number> {
  try {
    const { kvGetVoteQueue } = await import('@/lib/kv-store');
    const recovered = await kvGetVoteQueue();

    if (!recovered || recovered.length === 0) {
      console.log('[VoteQueue] No votes to recover from KV');
      return 0;
    }

    // Add recovered votes to the front of the queue (they were there first)
    pendingVotes = [...recovered, ...pendingVotes];

    console.log(`[VoteQueue] ♻️ Recovered ${recovered.length} votes from KV`);

    // Auto-flush if recovered votes meet the size threshold
    if (pendingVotes.length >= MAX_BATCH_SIZE) {
      console.log('[VoteQueue] Recovered votes exceed threshold — triggering flush');
      flushToD1().catch((err) => {
        console.error('[VoteQueue] Auto-flush after recovery failed:', err);
      });
    }

    return recovered.length;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[VoteQueue] KV recovery failed:', message);
    return 0;
  }
}

/**
 * Get aggregated counts of pending votes for optimistic display.
 *
 * Used by /api/vote-results to include pending counts alongside
 * D1 persisted counts, so users see their vote reflected immediately
 * even though it hasn't been flushed to D1 yet.
 *
 * Returns an object mapping "pollKey__optionKey" to count.
 */
export function getPendingCounts(): VoteAggregation {
  const aggregation: VoteAggregation = {};

  for (const vote of pendingVotes) {
    const key = `${vote.pollKey}__${vote.optionKey}`;
    aggregation[key] = (aggregation[key] || 0) + 1;
  }

  return aggregation;
}

/**
 * Get the total number of pending votes in the queue.
 *
 * Useful for monitoring and debugging.
 */
export function getPendingVoteCount(): number {
  return pendingVotes.length;
}

/**
 * Clear all pending votes from the queue.
 *
 * Admin action — use with caution. This does NOT clear votes
 * that have already been flushed to D1.
 *
 * Also attempts to clear the KV backup.
 */
/**
 * Rebuild the fingerprint index from the pending votes array.
 * Called after a flush to keep the index in sync.
 */
function rebuildFingerprintIndex(): void {
  queueFingerprintIndex.clear();
  for (const vote of pendingVotes) {
    let fpEntry = queueFingerprintIndex.get(vote.fingerprint);
    if (!fpEntry) {
      fpEntry = new Set();
      queueFingerprintIndex.set(vote.fingerprint, fpEntry);
    }
    fpEntry.add(vote.pollKey);
  }
}

export async function clearQueue(): Promise<void> {
  const count = pendingVotes.length;
  pendingVotes = [];
  queueFingerprintIndex.clear();
  lastFlushTime = Date.now();

  // Clear KV backup too
  try {
    const { kvClearVoteQueue } = await import('@/lib/kv-store');
    await kvClearVoteQueue();
  } catch {
    // Non-critical
  }

  console.log(`[VoteQueue] 🗑️ Cleared ${count} pending votes from queue`);
}

// ─── Queue Status (for monitoring / admin) ──────────────────────────

interface QueueStatus {
  pendingCount: number;
  lastFlushTime: number;
  lastKvBackupTime: number;
  isFlushing: boolean;
  timeSinceLastFlush: number;
  timeSinceLastBackup: number;
  flushOverdue: boolean;
  backupOverdue: boolean;
}

/**
 * Get detailed status of the vote queue.
 *
 * Useful for admin dashboards and debugging.
 */
export function getQueueStatus(): QueueStatus {
  const now = Date.now();
  return {
    pendingCount: pendingVotes.length,
    lastFlushTime,
    lastKvBackupTime,
    isFlushing,
    timeSinceLastFlush: now - lastFlushTime,
    timeSinceLastBackup: now - lastKvBackupTime,
    flushOverdue: now - lastFlushTime > FLUSH_INTERVAL_MS && pendingVotes.length > 0,
    backupOverdue: now - lastKvBackupTime > KV_BACKUP_INTERVAL_MS && pendingVotes.length > 0,
  };
}
