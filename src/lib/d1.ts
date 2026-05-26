/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Cloudflare D1 Voting Database — D1 ONLY (No Turso)
 *
 * D1 = SQLite at the edge — 100K writes/day, 5M reads/day (FREE)
 * Atomic SQL operations = no race conditions (unlike read-modify-write)!
 *
 * Two access modes (auto-detected):
 * 1. D1 Binding — OpenNext getCloudflareContext() (fastest, in-process)
 * 2. D1 REST API — Any environment with Cloudflare API token + env vars
 *
 * When D1 is available, voting uses atomic SQL:
 *   INSERT INTO vote_counts ... ON CONFLICT DO UPDATE SET count = count + 1
 *   (single operation, no race condition!)
 *
 * When D1 is NOT available, voting returns an error.
 *
 * VOTING SETTINGS are also stored in D1 (vote_meta table):
 *   - votingEnabled: 'true'/'false' — admin toggle for voting
 *   - votingD1Connected: 'true'/'false' — admin toggle for D1 connection
 *   This replaces the old Turso-based settings storage.
 */

import { DEFAULT_COMMUNITY } from '@/lib/voting';
import { getEnv } from '@/lib/cf-env';

// Lazy-load getCloudflareContext to avoid OOM from heavy @opennextjs/cloudflare module
let _getCloudflareContext: (() => { env: Record<string, unknown> }) | null = null;
let _cfContextLoaded = false;

function getCfContext(): { env: Record<string, unknown> } | null {
  if (!_cfContextLoaded) {
    _cfContextLoaded = true;
    try {
      const mod = require('@opennextjs/cloudflare');
      _getCloudflareContext = mod.getCloudflareContext;
    } catch {
      _getCloudflareContext = null;
    }
  }
  if (!_getCloudflareContext) return null;
  try {
    return _getCloudflareContext();
  } catch {
    return null;
  }
}

// ─── D1 Row Types ────────────────────────────────────────────────────

interface VoteCountRow {
  poll_key: string;
  option_key: string;
  count: number;
}

interface FingerprintCountRow {
  cnt: number;
}

interface MetaRow {
  key: string;
  value: string;
}

// ─── D1 REST API Helper ─────────────────────────────────────────────

const CLOUDFLARE_ACCOUNT_ID = getEnv('CLOUDFLARE_ACCOUNT_ID') || '';
const CLOUDFLARE_D1_DATABASE_ID = getEnv('CLOUDFLARE_D1_DATABASE_ID') || '';
const CLOUDFLARE_API_TOKEN = getEnv('CLOUDFLARE_API_TOKEN') || '';

interface D1Result<T = Record<string, unknown>> {
  results?: T[];
  success: boolean;
  meta?: { changed_db?: boolean; changes?: number; duration: number };
  error?: string;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(colName?: string): Promise<T | null>;
  run(): Promise<D1Result>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
}

interface D1Database {
  prepare(sql: string): D1PreparedStatement;
  batch<T = Record<string, unknown>>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<D1ExecResult>;
}

interface D1ExecResult {
  count: number;
  duration: number;
}

/**
 * Execute a SQL query via Cloudflare D1 REST API.
 * Used when D1 binding is not available (e.g., local dev without wrangler).
 */
async function d1RestQuery<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<D1Result<T>> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/d1/database/${CLOUDFLARE_D1_DATABASE_ID}/query`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql, params }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`D1 REST API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(`D1 REST API error: ${data.errors?.[0]?.message || 'Unknown error'}`);
  }

  return data.result?.[0] || { success: true, results: [] };
}

// ─── D1 Database Access ─────────────────────────────────────────────

let cachedD1: D1Database | null | undefined = undefined; // undefined = not checked yet

/**
 * Get the D1 database instance.
 * Priority:
 * 1. Cloudflare Workers binding (via getCloudflareContext from OpenNext)
 * 2. D1 REST API (via env vars)
 * 3. null (voting unavailable)
 */
export function getD1Database(): D1Database | null {
  if (cachedD1 !== undefined) return cachedD1;

  // Mode 1: Try OpenNext Cloudflare binding
  const ctx = getCfContext();
  if (ctx?.env?.DB) {
    console.log('[D1] ✅ Using Cloudflare Workers binding (OpenNext)');
    cachedD1 = ctx.env.DB as D1Database;
    return cachedD1;
  }

  // Mode 2: Try D1 REST API
  if (CLOUDFLARE_ACCOUNT_ID && CLOUDFLARE_D1_DATABASE_ID && CLOUDFLARE_API_TOKEN) {
    console.log('[D1] ✅ Using REST API');
    // Wrap REST API in D1Database-like interface
    cachedD1 = createRestApiD1();
    return cachedD1;
  }

  // No D1 available
  console.warn('[D1] ❌ No D1 available — voting will be unavailable');
  cachedD1 = null;
  return null;
}

/**
 * Create a D1Database-like wrapper around the REST API.
 * This allows the same code to work with both binding and REST API.
 */
function createRestApiD1(): D1Database {
  return {
    prepare(sql: string): D1PreparedStatement {
      const params: unknown[] = [];
      return {
        bind(...values: unknown[]): D1PreparedStatement {
          params.push(...values);
          return this;
        },
        async first<T = Record<string, unknown>>(colName?: string): Promise<T | null> {
          const result = await d1RestQuery<T>(sql, params);
          if (!result.results || result.results.length === 0) return null;
          if (colName) return (result.results[0] as Record<string, unknown>)[colName] as T ?? null;
          return result.results[0] as T;
        },
        async run(): Promise<D1Result> {
          return d1RestQuery(sql, params);
        },
        async all<T = Record<string, unknown>>(): Promise<D1Result<T>> {
          return d1RestQuery<T>(sql, params);
        },
      };
    },
    async batch<T = Record<string, unknown>>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
      // D1 REST API doesn't support batch directly — execute sequentially
      const results: D1Result<T>[] = [];
      for (const stmt of statements) {
        const result = await stmt.run();
        results.push(result as D1Result<T>);
      }
      return results;
    },
    async exec(query: string): Promise<D1ExecResult> {
      // Split by semicolons and execute each statement
      const statements = query.split(';').filter(s => s.trim());
      let totalChanges = 0;
      let totalDuration = 0;
      for (const stmt of statements) {
        const result = await d1RestQuery(stmt.trim());
        totalChanges += result.meta?.changes ?? 0;
        totalDuration += result.meta?.duration ?? 0;
      }
      return { count: totalChanges, duration: totalDuration };
    },
  };
}

// ─── D1 Initialization ──────────────────────────────────────────────

// Individual migration statements — run one at a time for D1 compatibility
const D1_MIGRATION_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS vote_counts (poll_key TEXT NOT NULL, option_key TEXT NOT NULL, count INTEGER DEFAULT 0, updated_at TEXT DEFAULT (datetime('now')), PRIMARY KEY (poll_key, option_key))`,
  `CREATE TABLE IF NOT EXISTS vote_fingerprints (id INTEGER PRIMARY KEY AUTOINCREMENT, fingerprint TEXT NOT NULL, poll_key TEXT NOT NULL, created_at INTEGER NOT NULL, UNIQUE(fingerprint, poll_key))`,
  `CREATE INDEX IF NOT EXISTS idx_fingerprints_lookup ON vote_fingerprints(fingerprint, created_at)`,
  `CREATE TABLE IF NOT EXISTS vote_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS baked_data (key TEXT PRIMARY KEY, content TEXT NOT NULL, updated_at TEXT DEFAULT (datetime('now')))`,
];

let d1Initialized = false;

/**
 * Initialize D1 tables (create if not exist).
 * Safe to call multiple times — uses IF NOT EXISTS.
 * Runs each statement individually for D1 compatibility.
 */
export async function initD1Database(): Promise<void> {
  const db = getD1Database();
  if (!db || d1Initialized) return;

  try {
    for (const sql of D1_MIGRATION_STATEMENTS) {
      await db.prepare(sql).run();
    }
    d1Initialized = true;
    console.log('[D1] ✅ Tables initialized');
  } catch (err) {
    console.error('[D1] Failed to initialize tables:', err);
    // Don't mark as initialized — will retry on next call
  }
}

// ─── D1 Voting Operations ───────────────────────────────────────────

/**
 * Check if a fingerprint has already voted on a poll.
 * Returns true if already voted (dedup).
 */
export async function d1CheckFingerprint(
  fingerprint: string,
  pollKey: string
): Promise<boolean> {
  const db = getD1Database();
  if (!db) return false;

  try {
    const row = await db
      .prepare('SELECT 1 as found FROM vote_fingerprints WHERE fingerprint = ? AND poll_key = ?')
      .bind(fingerprint, pollKey)
      .first<{ found: number }>('found');
    return row !== null;
  } catch (err) {
    console.error('[D1] Check fingerprint error:', err);
    return false;
  }
}

/**
 * Get the count of recent votes from a fingerprint (for rate limiting).
 */
export async function d1GetFingerprintRateCount(
  fingerprint: string,
  windowStartMs: number
): Promise<number> {
  const db = getD1Database();
  if (!db) return 0;

  try {
    const row = await db
      .prepare('SELECT COUNT(*) as cnt FROM vote_fingerprints WHERE fingerprint = ? AND created_at > ?')
      .bind(fingerprint, windowStartMs)
      .first<FingerprintCountRow>('cnt');
    return typeof row === 'number' ? row : 0;
  } catch (err) {
    console.error('[D1] Rate count error:', err);
    return 0;
  }
}

/**
 * Increment a vote count atomically.
 * Uses INSERT ... ON CONFLICT DO UPDATE for atomic increment (no race condition!).
 */
export async function d1IncrementVote(
  pollKey: string,
  optionKey: string
): Promise<boolean> {
  const db = getD1Database();
  if (!db) return false;

  try {
    await db
      .prepare(`INSERT INTO vote_counts (poll_key, option_key, count, updated_at)
                VALUES (?, ?, 1, datetime('now'))
                ON CONFLICT(poll_key, option_key)
                DO UPDATE SET count = count + 1, updated_at = datetime('now')`)
      .bind(pollKey, optionKey)
      .run();
    return true;
  } catch (err) {
    console.error('[D1] Increment vote error:', err);
    return false;
  }
}

/**
 * Save a fingerprint record (dedup + rate limiting).
 */
export async function d1SaveFingerprint(
  fingerprint: string,
  pollKey: string,
  timestampMs: number
): Promise<boolean> {
  const db = getD1Database();
  if (!db) return false;

  try {
    await db
      .prepare('INSERT OR IGNORE INTO vote_fingerprints (fingerprint, poll_key, created_at) VALUES (?, ?, ?)')
      .bind(fingerprint, pollKey, timestampMs)
      .run();
    return true;
  } catch (err) {
    console.error('[D1] Save fingerprint error:', err);
    return false;
  }
}

/**
 * Increment total votes counter.
 */
export async function d1IncrementTotalVotes(): Promise<void> {
  const db = getD1Database();
  if (!db) return;

  try {
    await db
      .prepare(`INSERT INTO vote_meta (key, value) VALUES ('totalVotes', '1')
                ON CONFLICT(key) DO UPDATE SET value = CAST(CAST(value AS INTEGER) + 1 AS TEXT)`)
      .run();
  } catch (err) {
    console.error('[D1] Increment total votes error:', err);
  }
}

/**
 * Batch vote operation — increment multiple votes + save fingerprints in one D1 batch.
 * Used for PredictionsTab (4 votes at once).
 * Returns true if ALL operations succeeded.
 */
export async function d1BatchVote(
  votes: Array<{ pollKey: string; optionKey: string }>,
  fingerprint: string,
  timestampMs: number
): Promise<boolean> {
  const db = getD1Database();
  if (!db) return false;

  try {
    const statements: D1PreparedStatement[] = [];

    for (const vote of votes) {
      // Increment vote count
      statements.push(
        db.prepare(`INSERT INTO vote_counts (poll_key, option_key, count, updated_at)
                    VALUES (?, ?, 1, datetime('now'))
                    ON CONFLICT(poll_key, option_key)
                    DO UPDATE SET count = count + 1, updated_at = datetime('now')`)
          .bind(vote.pollKey, vote.optionKey)
      );

      // Save fingerprint
      statements.push(
        db.prepare('INSERT OR IGNORE INTO vote_fingerprints (fingerprint, poll_key, created_at) VALUES (?, ?, ?)')
          .bind(fingerprint, vote.pollKey, timestampMs)
      );
    }

    // Increment total votes by number of votes in batch
    statements.push(
      db.prepare(`INSERT INTO vote_meta (key, value) VALUES ('totalVotes', ?)
                  ON CONFLICT(key) DO UPDATE SET value = CAST(CAST(value AS INTEGER) + ? AS TEXT)`)
        .bind(String(votes.length), String(votes.length))
    );

    await db.batch(statements);
    return true;
  } catch (err) {
    console.error('[D1] Batch vote error:', err);
    return false;
  }
}

/**
 * Read all vote results from D1 and return as community data object
 * (same format as existing Turso community data for backward compatibility).
 *
 * Uses in-memory cache (10s TTL) to avoid redundant D1 reads.
 * Cache is invalidated after every D1 flush.
 */
export async function d1GetVoteResults(): Promise<Record<string, unknown> | null> {
  // ─── Check in-memory cache first ───
  try {
    const { getCachedVoteResults, setCachedVoteResults } = await import('@/lib/vote-cache');
    const cached = getCachedVoteResults();
    if (cached) {
      return cached;
    }
  } catch {
    // vote-cache not available — proceed to D1
  }

  const db = getD1Database();
  if (!db) return null;

  try {
    // Read vote counts
    const countsResult = await db
      .prepare('SELECT poll_key, option_key, count FROM vote_counts')
      .all<VoteCountRow>();

    // Read total votes
    const totalResult = await db
      .prepare("SELECT value FROM vote_meta WHERE key = 'totalVotes'")
      .first<MetaRow>('value');

    // Aggregate into community format (same as Turso JSON blob)
    const community: Record<string, unknown> = { ...DEFAULT_COMMUNITY };

    if (countsResult.results && countsResult.results.length > 0) {
      for (const row of countsResult.results) {
        if (!community[row.poll_key] || typeof community[row.poll_key] !== 'object') {
          (community as Record<string, unknown>)[row.poll_key] = {};
        }
        (community[row.poll_key] as Record<string, number>)[row.option_key] = row.count;
      }
    }

    // Set total votes
    community.totalVotes = totalResult ? parseInt(String(totalResult), 10) : 0;

    // ─── Store in cache for subsequent reads ───
    try {
      const { setCachedVoteResults } = await import('@/lib/vote-cache');
      setCachedVoteResults(community);
    } catch {
      // Non-critical
    }

    return community;
  } catch (err) {
    console.error('[D1] Get vote results error:', err);
    return null;
  }
}

/**
 * Clear all vote data from D1 (admin action).
 */
export async function d1ClearVotes(): Promise<boolean> {
  const db = getD1Database();
  if (!db) return false;

  try {
    await db.prepare('DELETE FROM vote_counts').run();
    await db.prepare('DELETE FROM vote_fingerprints').run();
    await db.prepare('DELETE FROM vote_meta').run();
    console.log('[D1] ✅ All vote data cleared');
    return true;
  } catch (err) {
    console.error('[D1] Clear votes error:', err);
    return false;
  }
}

/**
 * Check if D1 is available and configured.
 * Returns true if D1 binding or REST API is available.
 */
export function isD1Available(): boolean {
  return getD1Database() !== null;
}

/**
 * Reset the D1 cache (for testing or after env var changes).
 */
export function resetD1Cache(): void {
  cachedD1 = undefined;
  d1Initialized = false;
}

// ─── D1 Voting Settings (replaces Turso settings) ──────────────────

/**
 * Get a voting setting from D1 vote_meta table.
 * Returns null if key not found.
 */
export async function d1GetSetting(key: string): Promise<string | null> {
  const db = getD1Database();
  if (!db) return null;

  try {
    const value = await db
      .prepare('SELECT value FROM vote_meta WHERE key = ?')
      .bind(key)
      .first<MetaRow>('value');
    return value;
  } catch (err) {
    console.error(`[D1] Get setting '${key}' error:`, err);
    return null;
  }
}

/**
 * Set a voting setting in D1 vote_meta table.
 * Uses INSERT ... ON CONFLICT for atomic upsert.
 */
export async function d1SetSetting(key: string, value: string): Promise<boolean> {
  const db = getD1Database();
  if (!db) return false;

  try {
    await db
      .prepare(`INSERT INTO vote_meta (key, value) VALUES (?, ?)
                ON CONFLICT(key) DO UPDATE SET value = excluded.value`)
      .bind(key, value)
      .run();
    return true;
  } catch (err) {
    console.error(`[D1] Set setting '${key}' error:`, err);
    return false;
  }
}

/**
 * Get all voting-related settings from D1.
 * Returns an object with votingEnabled and votingD1Connected.
 * Defaults: votingEnabled=true, votingD1Connected=true
 */
export async function d1GetVotingSettings(): Promise<{
  votingEnabled: boolean;
  votingD1Connected: boolean;
  votingEnabledLastUpdated: string | null;
  votingD1ConnectedLastUpdated: string | null;
}> {
  const db = getD1Database();
  if (!db) {
    // D1 not available — defaults
    return {
      votingEnabled: true,
      votingD1Connected: true,
      votingEnabledLastUpdated: null,
      votingD1ConnectedLastUpdated: null,
    };
  }

  try {
    // Read all voting-related settings in one query
    const result = await db
      .prepare("SELECT key, value FROM vote_meta WHERE key IN ('votingEnabled', 'votingD1Connected', 'votingEnabledLastUpdated', 'votingD1ConnectedLastUpdated')")
      .all<MetaRow>();

    const settings: Record<string, string> = {};
    if (result.results) {
      for (const row of result.results) {
        settings[row.key] = row.value;
      }
    }

    return {
      votingEnabled: settings.votingEnabled !== 'false', // Default true
      votingD1Connected: settings.votingD1Connected !== 'false', // Default true
      votingEnabledLastUpdated: settings.votingEnabledLastUpdated || null,
      votingD1ConnectedLastUpdated: settings.votingD1ConnectedLastUpdated || null,
    };
  } catch (err) {
    console.error('[D1] Get voting settings error:', err);
    return {
      votingEnabled: true,
      votingD1Connected: true,
      votingEnabledLastUpdated: null,
      votingD1ConnectedLastUpdated: null,
    };
  }
}

// ─── Maintenance Mode in D1 ────────────────────────────────────────

/**
 * Get maintenance mode state from D1.
 * Returns true if maintenanceMode key exists and is 'true'.
 * Returns null if key doesn't exist in D1 (not yet set by admin).
 * Used by middleware for fast, reliable maintenance mode check in Workers.
 */
export async function d1GetMaintenanceMode(): Promise<boolean | null> {
  const db = getD1Database();
  if (!db) return null; // D1 not available — caller should fall through to Turso

  try {
    const row = await db
      .prepare("SELECT value FROM vote_meta WHERE key = 'maintenanceMode'")
      .first<MetaRow>();
    if (row === null) return null; // Key doesn't exist — never been set
    return row.value === 'true';
  } catch (err) {
    console.error('[D1] Get maintenance mode error:', err);
    return null; // Error — fall through to other sources
  }
}

/**
 * Set maintenance mode state in D1.
 * Called by admin settings API when maintenanceMode is toggled.
 */
export async function d1SetMaintenanceMode(enabled: boolean): Promise<boolean> {
  const db = getD1Database();
  if (!db) return false;

  try {
    await db
      .prepare(`INSERT INTO vote_meta (key, value) VALUES ('maintenanceMode', ?)
                ON CONFLICT(key) DO UPDATE SET value = excluded.value`)
      .bind(enabled ? 'true' : 'false')
      .run();
    console.log(`[D1] Maintenance mode set to ${enabled}`);
    return true;
  } catch (err) {
    console.error('[D1] Set maintenance mode error:', err);
    return false;
  }
}

/**
 * Check if voting connection is enabled.
 * Returns true only when:
 * 1. D1 is available
 * 2. votingD1Connected is not explicitly set to 'false'
 *
 * This replaces isVotingTursoConnected() from voting-connection.ts.
 * Uses a 5-minute in-memory cache to avoid excessive D1 reads.
 */
let cachedVotingConnected: boolean | null = null;
let cachedVotingConnectedTime = 0;
const VOTING_CONNECTED_CACHE_TTL = 300_000; // 5 minutes

export async function isVotingConnected(): Promise<boolean> {
  // Check cache first
  if (cachedVotingConnected !== null && Date.now() - cachedVotingConnectedTime < VOTING_CONNECTED_CACHE_TTL) {
    return cachedVotingConnected;
  }

  // D1 must be available
  if (!isD1Available()) {
    cachedVotingConnected = false;
    cachedVotingConnectedTime = Date.now();
    return false;
  }

  try {
    const settings = await d1GetVotingSettings();
    const connected = settings.votingD1Connected;
    cachedVotingConnected = connected;
    cachedVotingConnectedTime = Date.now();
    return connected;
  } catch (err) {
    console.warn('[D1] Failed to check voting connection:', err);
    return cachedVotingConnected ?? false;
  }
}

/**
 * Force-clear the voting connection cache.
 * Called after admin toggles the connection.
 */
export function clearVotingConnectionCache(): void {
  cachedVotingConnected = null;
  cachedVotingConnectedTime = 0;
}

// ─── Baked Data in D1 (Workers persistence) ──────────────────────

/**
 * Store baked site data in D1 for Workers persistence.
 * Uses a `baked_data` table to persist baked site data across Worker restarts.
 * This is the primary persistence mechanism on Cloudflare Workers
 * where filesystem is not available and KV may not be configured.
 */
export async function d1SetBakedData(key: string, value: unknown): Promise<boolean> {
  const db = getD1Database();
  if (!db) return false;

  try {
    const jsonStr = JSON.stringify(value);
    await db
      .prepare(`INSERT INTO baked_data (key, content, updated_at) VALUES (?, ?, datetime('now'))
                ON CONFLICT(key) DO UPDATE SET content = excluded.content, updated_at = datetime('now')`)
      .bind(key, jsonStr)
      .run();
    return true;
  } catch (err) {
    console.error(`[D1] Set baked data '${key}' error:`, err);
    return false;
  }
}

/**
 * Read baked site data from D1.
 * Returns parsed JSON value, or null if key doesn't exist.
 */
export async function d1GetBakedData<T = unknown>(key: string): Promise<T | null> {
  const db = getD1Database();
  if (!db) return null;

  try {
    const row = await db
      .prepare('SELECT content FROM baked_data WHERE key = ?')
      .bind(key)
      .first<{ content: string }>();
    if (row === null) return null;
    return JSON.parse(row.content) as T;
  } catch (err) {
    console.error(`[D1] Get baked data '${key}' error:`, err);
    return null;
  }
}

/**
 * Read all baked data keys from D1.
 * Returns a Record<string, any> with all stored baked data.
 */
export async function d1GetAllBakedData(): Promise<Record<string, any> | null> {
  const db = getD1Database();
  if (!db) return null;

  try {
    const result = await db
      .prepare('SELECT key, content FROM baked_data')
      .all<{ key: string; content: string }>();

    if (!result.results || result.results.length === 0) return null;

    const data: Record<string, any> = {};
    for (const row of result.results) {
      try {
        data[row.key] = JSON.parse(row.content);
      } catch {
        data[row.key] = {};
      }
    }
    return data;
  } catch (err) {
    console.error('[D1] Get all baked data error:', err);
    return null;
  }
}

/**
 * Clear all baked data from D1.
 * Used when re-baking all data.
 */
export async function d1ClearBakedData(): Promise<boolean> {
  const db = getD1Database();
  if (!db) return false;

  try {
    await db.prepare('DELETE FROM baked_data').run();
    return true;
  } catch (err) {
    console.error('[D1] Clear baked data error:', err);
    return false;
  }
}
