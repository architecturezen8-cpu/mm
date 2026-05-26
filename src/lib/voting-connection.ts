/**
 * Server-side Voting Connection Check — D1 ONLY (No Turso)
 *
 * Provides fast voting connection status detection for API routes.
 * When Voting Connection is disconnected (admin toggle), all voting
 * API endpoints return immediately — ZERO database reads/writes.
 * This saves free tier limits during off-season.
 *
 * Uses 5-second in-memory cache to avoid excessive D1 reads.
 *
 * Voting Connection = D1 Availability + Admin Toggle:
 * 1. If D1 is not available → voting is disconnected (auto)
 * 2. If admin toggled OFF → voting is disconnected (manual)
 * 3. Otherwise → voting is connected
 *
 * All settings are stored in D1 vote_meta table (no Turso dependency).
 */

import { isD1Available, isVotingConnected, clearVotingConnectionCache } from '@/lib/d1';

// Re-export for backward compatibility
export { isVotingConnected as isVotingTursoConnected, clearVotingConnectionCache as clearVotingTursoConnectionCache };
