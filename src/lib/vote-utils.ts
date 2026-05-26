/**
 * Shared Vote Utility — mergePendingCounts
 *
 * Merges pending vote counts from the in-memory queue with D1 persisted results.
 * This provides "optimistic" display — users see votes that are queued but
 * not yet flushed to D1, so their vote appears immediately.
 *
 * Extracted to a shared module to avoid duplication between
 * /api/vote/route.ts and /api/vote-results/route.ts.
 */

/**
 * Merge pending vote counts from the queue with D1 persisted results.
 *
 * pendingCounts format: { "pollKey__optionKey": count }
 * community format: { pollKey: { optionKey: count }, totalVotes: N }
 *
 * Returns a new community object with pending counts added to D1 counts.
 */
export function mergePendingCounts(
  community: Record<string, unknown>,
  pendingCounts: Record<string, number>
): Record<string, unknown> {
  if (!pendingCounts || Object.keys(pendingCounts).length === 0) {
    return community;
  }

  const merged = { ...community };

  for (const [compositeKey, count] of Object.entries(pendingCounts)) {
    const separatorIndex = compositeKey.indexOf('__');
    const pollKey = compositeKey.substring(0, separatorIndex);
    const optionKey = compositeKey.substring(separatorIndex + 2);

    // Ensure the poll key exists in community
    if (!merged[pollKey] || typeof merged[pollKey] !== 'object') {
      (merged as Record<string, unknown>)[pollKey] = {};
    }

    // Add pending count to existing count
    const pollData = merged[pollKey] as Record<string, number>;
    pollData[optionKey] = (pollData[optionKey] || 0) + count;
  }

  // Update totalVotes with pending count
  const totalPending = Object.values(pendingCounts).reduce((sum, c) => sum + c, 0);
  if (typeof merged.totalVotes === 'number') {
    merged.totalVotes = (merged.totalVotes as number) + totalPending;
  } else {
    merged.totalVotes = totalPending;
  }

  return merged;
}
