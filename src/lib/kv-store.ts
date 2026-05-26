/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Cloudflare KV Store Utility
 *
 * Two KV namespaces:
 * 1. BAKED_DATA — baked site data (replaces filesystem on Workers)
 * 2. VOTE_QUEUE — vote batching queue backup
 *
 * Uses getCloudflareContext() from @opennextjs/cloudflare for binding access.
 * Falls back to no-op when KV is not available (local dev).
 */

// Lazy-load getCloudflareContext to avoid OOM from heavy @opennextjs/cloudflare module
let _getCloudflareContext: (() => { env: Record<string, unknown> }) | null = null;
let _cfContextLoaded = false;

function getCfContext(): { env: Record<string, unknown> } | null {
  if (!_cfContextLoaded) {
    _cfContextLoaded = true;
    try {
      // Use require for synchronous loading (only when actually called)
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

// ─── Types ─────────────────────────────────────────────────────────

export interface PendingVote {
  pollKey: string;
  optionKey: string;
  fingerprint: string;
  timestamp: number;
}

interface KVNamespace {
  get(key: string, options?: { type?: 'text' }): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; cursor?: string; limit?: number }): Promise<{
    keys: Array<{ name: string }>;
    list_complete: boolean;
    cursor?: string;
  }>;
}

// ─── KV Binding Access (cached) ────────────────────────────────────

let cachedKVBaked: KVNamespace | null | undefined = undefined;
let cachedKVVoteQueue: KVNamespace | null | undefined = undefined;

export function getKVBakedData(): KVNamespace | null {
  if (cachedKVBaked !== undefined) return cachedKVBaked;

  const ctx = getCfContext();
  if (ctx?.env?.BAKED_DATA) {
    console.log('[KV:BAKED_DATA] ✅ Cloudflare Workers KV binding found');
    cachedKVBaked = ctx.env.BAKED_DATA as KVNamespace;
    return cachedKVBaked;
  }

  console.warn('[KV:BAKED_DATA] ❌ KV binding not available — baked data will use fallback');
  cachedKVBaked = null;
  return null;
}

export function getKVVoteQueue(): KVNamespace | null {
  if (cachedKVVoteQueue !== undefined) return cachedKVVoteQueue;

  const ctx = getCfContext();
  if (ctx?.env?.VOTE_QUEUE) {
    console.log('[KV:VOTE_QUEUE] ✅ Cloudflare Workers KV binding found');
    cachedKVVoteQueue = ctx.env.VOTE_QUEUE as KVNamespace;
    return cachedKVVoteQueue;
  }

  console.warn('[KV:VOTE_QUEUE] ❌ KV binding not available — vote queue backup disabled');
  cachedKVVoteQueue = null;
  return null;
}

export function kvIsAvailable(): boolean {
  return getKVBakedData() !== null || getKVVoteQueue() !== null;
}

// ─── Baked Data Operations ──────────────────────────────────────────

export async function kvGetBakedData<T = unknown>(key: string): Promise<T | null> {
  const kv = getKVBakedData();
  if (!kv) return null;
  try {
    const raw = await kv.get(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`[KV:BAKED_DATA] Get key "${key}" error:`, err);
    return null;
  }
}

export async function kvSetBakedData(key: string, value: unknown): Promise<boolean> {
  const kv = getKVBakedData();
  if (!kv) return false;
  try {
    await kv.put(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error(`[KV:BAKED_DATA] Set key "${key}" error:`, err);
    return false;
  }
}

export async function kvGetAllBakedKeys(): Promise<string[]> {
  const kv = getKVBakedData();
  if (!kv) return [];
  try {
    const keys: string[] = [];
    let cursor: string | undefined;
    do {
      const listed = await kv.list({ cursor });
      for (const key of listed.keys) {
        keys.push(key.name);
      }
      cursor = listed.list_complete ? undefined : listed.cursor;
    } while (cursor);
    return keys;
  } catch (err) {
    console.error('[KV:BAKED_DATA] List keys error:', err);
    return [];
  }
}

export async function kvDeleteBakedData(key: string): Promise<boolean> {
  const kv = getKVBakedData();
  if (!kv) return false;
  try {
    await kv.delete(key);
    return true;
  } catch (err) {
    console.error(`[KV:BAKED_DATA] Delete key "${key}" error:`, err);
    return false;
  }
}

export async function kvBulkSetBakedData(items: Record<string, unknown>): Promise<number> {
  const kv = getKVBakedData();
  if (!kv) return 0;
  let successCount = 0;
  try {
    const entries = Object.entries(items);
    const results = await Promise.allSettled(
      entries.map(([key, value]) => kv.put(key, JSON.stringify(value)))
    );
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === 'fulfilled') {
        successCount++;
      } else {
        console.error(`[KV:BAKED_DATA] Bulk set key "${entries[i][0]}" error:`, result.reason);
      }
    }
    console.log(`[KV:BAKED_DATA] Bulk write: ${successCount}/${entries.length} keys succeeded`);
    return successCount;
  } catch (err) {
    console.error('[KV:BAKED_DATA] Bulk set error:', err);
    return successCount;
  }
}

// ─── Vote Queue Operations ──────────────────────────────────────────

const VOTE_QUEUE_KEY = 'pending_votes';
const LAST_FLUSH_KEY = 'last_flush_time';

export async function kvGetVoteQueue(): Promise<PendingVote[] | null> {
  const kv = getKVVoteQueue();
  if (!kv) return null;
  try {
    const raw = await kv.get(VOTE_QUEUE_KEY);
    if (raw === null) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('[KV:VOTE_QUEUE] Get pending votes error:', err);
    return null;
  }
}

export async function kvSetVoteQueue(votes: PendingVote[]): Promise<boolean> {
  const kv = getKVVoteQueue();
  if (!kv) return false;
  try {
    await kv.put(VOTE_QUEUE_KEY, JSON.stringify(votes));
    return true;
  } catch (err) {
    console.error('[KV:VOTE_QUEUE] Set pending votes error:', err);
    return false;
  }
}

export async function kvClearVoteQueue(): Promise<boolean> {
  const kv = getKVVoteQueue();
  if (!kv) return false;
  try {
    await kv.delete(VOTE_QUEUE_KEY);
    console.log('[KV:VOTE_QUEUE] ✅ Vote queue cleared after D1 flush');
    return true;
  } catch (err) {
    console.error('[KV:VOTE_QUEUE] Clear vote queue error:', err);
    return false;
  }
}

export async function kvGetLastFlushTime(): Promise<number | null> {
  const kv = getKVVoteQueue();
  if (!kv) return null;
  try {
    const raw = await kv.get(LAST_FLUSH_KEY);
    if (raw === null) return null;
    const parsed = Number(raw);
    return Number.isNaN(parsed) ? null : parsed;
  } catch (err) {
    console.error('[KV:VOTE_QUEUE] Get last flush time error:', err);
    return null;
  }
}

export async function kvSetLastFlushTime(time: number): Promise<boolean> {
  const kv = getKVVoteQueue();
  if (!kv) return false;
  try {
    await kv.put(LAST_FLUSH_KEY, String(time));
    return true;
  } catch (err) {
    console.error('[KV:VOTE_QUEUE] Set last flush time error:', err);
    return false;
  }
}

// ─── Cache Reset ────────────────────────────────────────────────────

export function resetKVCache(): void {
  cachedKVBaked = undefined;
  cachedKVVoteQueue = undefined;
}
