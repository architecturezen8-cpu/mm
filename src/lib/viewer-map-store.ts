/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Cloudflare KV Store Utility — Viewer Map
 *
 * KV namespace: VIEWER_MAP
 *
 * Data stored:
 * 1. Key `viewer:countries` — JSON object mapping country codes to viewer counts
 * 2. Key `viewer:last_reset` — Timestamp of last daily reset (string)
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

/** Country code → viewer count mapping */
export type CountryMap = Record<string, number>;

// ─── KV Keys ───────────────────────────────────────────────────────

const COUNTRIES_KEY = 'viewer:countries';
const LAST_RESET_KEY = 'viewer:last_reset';

// ─── KV Binding Access (cached) ────────────────────────────────────

let cachedKVViewerMap: KVNamespace | null | undefined = undefined;

/** Get the VIEWER_MAP KV namespace */
export function getKVViewerMap(): KVNamespace | null {
  if (cachedKVViewerMap !== undefined) return cachedKVViewerMap;

  const ctx = getCfContext();
  if (ctx?.env?.VIEWER_MAP) {
    console.log('[KV:VIEWER_MAP] ✅ Cloudflare Workers KV binding found');
    cachedKVViewerMap = ctx.env.VIEWER_MAP as KVNamespace;
    return cachedKVViewerMap;
  }

  console.warn('[KV:VIEWER_MAP] ❌ KV binding not available — viewer map feature disabled');
  cachedKVViewerMap = null;
  return null;
}

// ─── Viewer Map Operations ─────────────────────────────────────────

/**
 * Increment a country's viewer count (called on each page load).
 * Reads the current map, increments the country, and writes it back.
 * Uses atomic read-modify-write (best effort for KV).
 * If the value doesn't exist yet, creates it starting at 1.
 */
export async function kvIncrementCountry(countryCode: string): Promise<boolean> {
  const kv = getKVViewerMap();
  if (!kv) return false;

  try {
    const raw = await kv.get(COUNTRIES_KEY);
    const map: CountryMap = raw ? JSON.parse(raw) : {};
    map[countryCode] = (map[countryCode] ?? 0) + 1;
    await kv.put(COUNTRIES_KEY, JSON.stringify(map));
    console.log(`[KV:VIEWER_MAP] ✅ Incremented "${countryCode}" to ${map[countryCode]}`);
    return true;
  } catch (err) {
    console.error(`[KV:VIEWER_MAP] Increment country "${countryCode}" error:`, err);
    return false;
  }
}

/** Get all country counts */
export async function kvGetCountryMap(): Promise<Record<string, number>> {
  const kv = getKVViewerMap();
  if (!kv) return {};

  try {
    const raw = await kv.get(COUNTRIES_KEY);
    if (raw === null) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? parsed : {};
  } catch (err) {
    console.error('[KV:VIEWER_MAP] Get country map error:', err);
    return {};
  }
}

/** Get total viewer count (sum of all countries) */
export async function kvGetTotalViewers(): Promise<number> {
  const map = await kvGetCountryMap();
  let total = 0;
  for (const count of Object.values(map)) {
    total += count;
  }
  return total;
}

/**
 * Reset all country counts (called daily via cron or manually).
 * Writes an empty map and updates the last_reset timestamp.
 */
export async function kvResetCountryMap(): Promise<boolean> {
  const kv = getKVViewerMap();
  if (!kv) return false;

  try {
    const now = new Date().toISOString();
    await Promise.all([
      kv.put(COUNTRIES_KEY, JSON.stringify({})),
      kv.put(LAST_RESET_KEY, now),
    ]);
    console.log(`[KV:VIEWER_MAP] ✅ Country map reset at ${now}`);
    return true;
  } catch (err) {
    console.error('[KV:VIEWER_MAP] Reset country map error:', err);
    return false;
  }
}

// ─── Cache Reset ────────────────────────────────────────────────────

/** Reset the cached KV binding (useful for testing or hot-reload) */
export function resetViewerMapKVCache(): void {
  cachedKVViewerMap = undefined;
}
