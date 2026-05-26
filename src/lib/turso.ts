/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Turso + Local Fallback Storage + Baked Data Support
 *
 * Primary: @libsql/client (Turso cloud database)
 * Fallback: Local per-key JSON files (data/site-data/*.json)
 * Baked:    Static JSON files (data/baked/*.json) for Turso Read OFF mode
 *
 * When Turso is unreachable (DNS issues, network problems, etc.),
 * automatically falls back to local file storage so the admin panel
 * always works. Background retry every 30s to reconnect.
 *
 * When Turso Read is disabled (via admin toggle), the site reads from
 * baked static JSON files instead of hitting Turso at runtime. This
 * enables a "publish" workflow where admin bakes current Turso data
 * to static files, then the site runs without Turso dependency.
 *
 * IMPORTANT: Starts in "local-first" mode to avoid blocking requests
 * on slow/broken Turso connections. Turso availability is checked
 * in the background.
 *
 * Storage structure:
 *   Seed data:  data/site-data/{key}.json   (per-key files in repo)
 *   Cache:      /tmp/botg-site-data/{key}.json (per-key runtime cache)
 *   Baked data: data/baked/{key}.json        (static files for Turso Read OFF)
 *   Baked cfg:  data/baked/config.json       (tursoReadEnabled, lastPublished, version)
 *   Old format: data/site-data-local.json    (migrated automatically)
 */

// NOTE: @libsql/client is imported DYNAMICALLY to prevent bundling on Cloudflare Workers.
// Static imports cause the heavy libsql library to be included in the edge bundle,
// exceeding the 3 MiB Workers free plan limit.
// The Turso client is only created when TURSO_DATABASE_URL is set AND we're on Node.js.

import { join } from 'path';
import { createHash } from 'crypto';
import { getEnv } from '@/lib/cf-env';
// ⚠️ FIX 2026-05-21: Static import for HTTP-based Turso client.
// Works on Cloudflare Workers (no Node native deps).
import { createTursoHttpClient } from '@/lib/turso-http';

// ─── Filesystem Detection for Cloudflare Workers ──────────────────
// Cloudflare Workers has NO filesystem — all fs operations throw:
//   [unenv] fs.xxx is not implemented yet!
// We detect this once and skip all fs operations gracefully.

let fsAvailable: boolean | null = null;

/**
 * Check if the filesystem is available.
 * Returns false on Cloudflare Workers (no fs).
 * Cached after first check.
 */
function isFileSystemAvailable(): boolean {
  if (fsAvailable !== null) return fsAvailable;
  try {
    // Try a safe fs operation — if it throws with [unenv], fs is not available
    // Use eval('require') to prevent esbuild from bundling 'fs' on edge
    // eslint-disable-next-line no-eval
    const { existsSync } = eval('require')('fs');
    // Try calling it on a path that definitely doesn't need to exist
    // Just the act of calling it will throw on Workers if fs is unenv-polyfilled
    existsSync('/tmp');
    fsAvailable = true;
  } catch (err: any) {
    if (err?.message?.includes('not implemented') || err?.message?.includes('unenv')) {
      console.log('[Turso] ⚠️ Filesystem not available (Cloudflare Workers) — using memory-only cache');
      fsAvailable = false;
    } else {
      // Some other error — fs might be available but /tmp might not exist
      // This is fine, fs is available
      fsAvailable = true;
    }
  }
  return fsAvailable;
}

// Safe wrappers for fs operations — no-op on Cloudflare Workers
function safeExistsSync(path: string): boolean {
  if (!isFileSystemAvailable()) return false;
  try {
    // eslint-disable-next-line no-eval
    const { existsSync } = eval('require')('fs');
    return existsSync(path);
  } catch { return false; }
}

function safeReadFileSync(path: string, encoding: string): string | null {
  if (!isFileSystemAvailable()) return null;
  try {
    // eslint-disable-next-line no-eval
    const { readFileSync } = eval('require')('fs');
    return readFileSync(path, encoding);
  } catch { return null; }
}

function safeWriteFileSync(path: string, data: string, encoding: string): boolean {
  if (!isFileSystemAvailable()) return false;
  try {
    // eslint-disable-next-line no-eval
    const { writeFileSync } = eval('require')('fs');
    writeFileSync(path, data, encoding);
    return true;
  } catch { return false; }
}

function safeMkdirSync(path: string, options?: { recursive?: boolean }): boolean {
  if (!isFileSystemAvailable()) return false;
  try {
    // eslint-disable-next-line no-eval
    const { mkdirSync } = eval('require')('fs');
    mkdirSync(path, options);
    return true;
  } catch { return false; }
}

function safeRenameSync(oldPath: string, newPath: string): boolean {
  if (!isFileSystemAvailable()) return false;
  try {
    // eslint-disable-next-line no-eval
    const { renameSync } = eval('require')('fs');
    renameSync(oldPath, newPath);
    return true;
  } catch { return false; }
}

function safeReaddirSync(path: string): string[] {
  if (!isFileSystemAvailable()) return [];
  try {
    // eslint-disable-next-line no-eval
    const { readdirSync } = eval('require')('fs');
    return readdirSync(path);
  } catch { return []; }
}

// ⚠️ FIX 2026-05-21:
// On Cloudflare Workers, env vars are NOT available at module-load time
// (only inside request handlers via getCloudflareContext). So we use lazy
// getter functions instead of module-level constants.
function getTursoUrl(): string { return getEnv('TURSO_DATABASE_URL') || ''; }
function getTursoAuthToken(): string { return getEnv('TURSO_AUTH_TOKEN') || ''; }
// Backwards-compatible getters (some legacy code paths still reference these names)
const TURSO_URL = ''; // placeholder, do not use — use getTursoUrl()
const TURSO_AUTH_TOKEN = ''; // placeholder, do not use — use getTursoAuthToken()
// Suppress unused warnings
void TURSO_URL; void TURSO_AUTH_TOKEN;

// ─── Path Configuration ─────────────────────────────────────────────
// Per-key seed data directory (in repo, read-only at runtime)
const SEED_DATA_DIR = join(process.cwd(), 'data', 'site-data');
// Per-key runtime cache directory (in /tmp to avoid Turbopack hot reload)
const CACHE_DATA_DIR = join('/tmp', 'botg-site-data');
// Baked static data directory (for Turso Read OFF mode)
export const BAKED_DATA_DIR = join(process.cwd(), 'data', 'baked');
// Old single-file paths (for migration)
const OLD_SEED_PATH = join(process.cwd(), 'data', 'site-data-local.json');
const OLD_CACHE_PATH = join('/tmp', 'botg-site-data.json');

// ─── Connection State ────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let tursoClient: any | null = null;
// Start as FALSE to avoid blocking the first request on a slow Turso connection
let tursoAvailable = false;
let lastCheckTime = 0;
const RECHECK_INTERVAL = 120_000; // retry Turso every 2min in background (saves free tier limits)
const TURSO_TIMEOUT = 5_000; // 5 second timeout for Turso operations

// Default data structure for empty database
const DEFAULTS: Record<string, any> = {
  sections: [],
  settings: {},
  preloader: {},
  pages: {},
  nav_items: [],
  media: [],
  poll_config: { pollInterval: 10000, jitterMax: 3000 },
  actual_results: {},
  community: {},
  vote_fingerprints: {},
};

// Valid data keys (from DEFAULTS)
const VALID_KEYS = Object.keys(DEFAULTS);

// ─── Timeout helper ──────────────────────────────────────────────────
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

// ─── Migration ───────────────────────────────────────────────────────
let migrationDone = false;

/**
 * Migrate old single-file format to per-key files.
 * - Migrates data/site-data-local.json → data/site-data/*.json
 * - Migrates /tmp/botg-site-data.json → /tmp/botg-site-data/*.json
 * - Renames old files to .bak after successful migration
 */
export function migrateOldFormat(): void {
  if (migrationDone) return;
  migrationDone = true;

  // Migrate old seed file → per-key seed files
  try {
    if (safeExistsSync(OLD_SEED_PATH)) {
      const content = safeReadFileSync(OLD_SEED_PATH, 'utf-8');
      if (content) {
        const data = JSON.parse(content);

        // Only migrate if the new directory doesn't have files yet
        if (!safeExistsSync(SEED_DATA_DIR) || safeReaddirSync(SEED_DATA_DIR).length === 0) {
          safeMkdirSync(SEED_DATA_DIR, { recursive: true });
          for (const key of VALID_KEYS) {
            if (key in data) {
              safeWriteFileSync(
                join(SEED_DATA_DIR, `${key}.json`),
                JSON.stringify(data[key], null, 2),
                'utf-8'
              );
            }
          }
          console.log('[Migration] Migrated old seed file to per-key format');
        }

        // Rename old file to .bak
        safeRenameSync(OLD_SEED_PATH, OLD_SEED_PATH + '.bak');
        console.log('[Migration] Renamed old seed file to .bak');
      }
    }
  } catch (err) {
    console.warn('[Migration] Failed to migrate old seed file:', (err as any)?.message);
  }

  // Migrate old cache file → per-key cache files
  try {
    if (safeExistsSync(OLD_CACHE_PATH)) {
      const content = safeReadFileSync(OLD_CACHE_PATH, 'utf-8');
      if (content) {
        const data = JSON.parse(content);

        safeMkdirSync(CACHE_DATA_DIR, { recursive: true });
        for (const key of VALID_KEYS) {
          if (key in data) {
            safeWriteFileSync(
              join(CACHE_DATA_DIR, `${key}.json`),
              JSON.stringify(data[key], null, 2),
              'utf-8'
            );
          }
        }
        console.log('[Migration] Migrated old cache file to per-key format');

        // Rename old file to .bak
        safeRenameSync(OLD_CACHE_PATH, OLD_CACHE_PATH + '.bak');
        console.log('[Migration] Renamed old cache file to .bak');
      }
    }
  } catch (err) {
    console.warn('[Migration] Failed to migrate old cache file:', (err as any)?.message);
  }
}

// ─── Baked Data System ──────────────────────────────────────────────

interface BakedConfig {
  tursoReadEnabled: boolean;
  lastPublished: string | null;
  version: string;
}

const DEFAULT_BAKED_CONFIG: BakedConfig = {
  tursoReadEnabled: true,
  lastPublished: null,
  version: '1.0.0',
};

// In-memory cache for baked config to avoid repeated file reads
let bakedConfigCache: BakedConfig | null = null;

/**
 * Read the baked config from data/baked/config.json.
 * Returns default config if file doesn't exist or can't be parsed.
 * Synchronous — only checks filesystem and in-memory cache, does NOT check KV.
 */
export function getBakedConfig(): BakedConfig {
  if (bakedConfigCache) return bakedConfigCache;

  try {
    const configPath = join(BAKED_DATA_DIR, 'config.json');
    if (safeExistsSync(configPath)) {
      const content = safeReadFileSync(configPath, 'utf-8');
      if (content) {
        const parsed = JSON.parse(content);
        bakedConfigCache = {
          tursoReadEnabled: parsed.tursoReadEnabled !== undefined ? parsed.tursoReadEnabled : true,
          lastPublished: parsed.lastPublished ?? null,
          version: parsed.version ?? '1.0.0',
        };
        return bakedConfigCache;
      }
    }
  } catch (err) {
    console.warn('[Baked] Failed to read config.json, using defaults:', (err as any)?.message);
  }

  bakedConfigCache = { ...DEFAULT_BAKED_CONFIG };
  return bakedConfigCache;
}

/**
 * Async version of getBakedConfig — tries filesystem → in-memory cache → KV → defaults.
 * Use this in async contexts for Workers+KV support.
 */
export async function getBakedConfigAsync(): Promise<BakedConfig> {
  // 1. Try in-memory cache first
  if (bakedConfigCache) return bakedConfigCache;

  // 2. Try filesystem
  try {
    const configPath = join(BAKED_DATA_DIR, 'config.json');
    if (safeExistsSync(configPath)) {
      const content = safeReadFileSync(configPath, 'utf-8');
      if (content) {
        const parsed = JSON.parse(content);
        bakedConfigCache = {
          tursoReadEnabled: parsed.tursoReadEnabled !== undefined ? parsed.tursoReadEnabled : true,
          lastPublished: parsed.lastPublished ?? null,
          version: parsed.version ?? '1.0.0',
        };
        return bakedConfigCache;
      }
    }
  } catch (err) {
    console.warn('[Baked] Failed to read config.json:', (err as any)?.message);
  }

  // 3. Try KV (Cloudflare Workers persistence)
  try {
    const { kvGetBakedData, kvIsAvailable } = await import('@/lib/kv-store');
    if (kvIsAvailable()) {
      const kvConfig = await kvGetBakedData<Partial<BakedConfig>>('config');
      if (kvConfig !== null) {
        bakedConfigCache = {
          tursoReadEnabled: kvConfig.tursoReadEnabled !== undefined ? kvConfig.tursoReadEnabled : true,
          lastPublished: kvConfig.lastPublished ?? null,
          version: kvConfig.version ?? '1.0.0',
        };
        return bakedConfigCache;
      }
    }
  } catch (kvErr: any) {
    console.warn('[Baked] KV config read failed:', kvErr?.message);
  }

  // 4. Try D1 baked data (always available on Workers)
  try {
    const { d1GetBakedData } = await import('@/lib/d1');
    const d1Config = await d1GetBakedData<Partial<BakedConfig>>('config');
    if (d1Config !== null) {
      bakedConfigCache = {
        tursoReadEnabled: d1Config.tursoReadEnabled !== undefined ? d1Config.tursoReadEnabled : true,
        lastPublished: d1Config.lastPublished ?? null,
        version: d1Config.version ?? '1.0.0',
      };
      return bakedConfigCache;
    }
  } catch (d1Err: any) {
    console.warn('[Baked] D1 config read failed:', d1Err?.message);
  }

  bakedConfigCache = { ...DEFAULT_BAKED_CONFIG };
  return bakedConfigCache;
}

/**
 * In-memory cache for the Turso Read toggle state.
 * Avoids hitting Turso DB on every single request.
 * Refreshed every 30 seconds (same as RECHECK_INTERVAL).
 */
let cachedTursoReadEnabled: boolean | null = null;
let cachedTursoReadTime = 0;
const TURSO_READ_CACHE_TTL_ON = 30_000; // 30 seconds when toggle ON (quick reflection of admin changes)
const TURSO_READ_CACHE_TTL_OFF = 120_000; // 2 minutes when toggle OFF (save limits, no need to check frequently)

/**
 * Returns true if Turso Read is enabled.
 *
 * Priority:
 * 1. In-memory cache (if fresh, < 30s old)
 * 2. Turso DB (reads 'turso_read_enabled' key) — the source of truth
 * 3. Baked config file (data/baked/config.json) — fallback
 * 4. Default: true
 *
 * This is critical because on Vercel serverless, file system changes don't
 * persist across instances. The toggle state must come from Turso DB.
 */
export async function isTursoReadEnabled(): Promise<boolean> {
  // Check in-memory cache first (avoids DB hit on every request)
  // Dynamic TTL: shorter when ON (need quick reflection of admin changes),
  // longer when OFF (no need to check frequently, saves DB limits)
  const currentTTL = cachedTursoReadEnabled ? TURSO_READ_CACHE_TTL_ON : TURSO_READ_CACHE_TTL_OFF;
  if (cachedTursoReadEnabled !== null && Date.now() - cachedTursoReadTime < currentTTL) {
    return cachedTursoReadEnabled;
  }

  // Try reading from Turso DB (source of truth for the toggle)
  try {
    const client = getTursoClient();
    if (client) {
      const result = await withTimeout(
        client.execute({
          sql: 'SELECT content FROM site_data WHERE key = ?',
          args: ['turso_read_enabled'],
        }),
        TURSO_TIMEOUT,
        'Turso read toggle check'
      );
      if (result.rows.length > 0) {
        const data = JSON.parse(result.rows[0].content as string);
        if (data && typeof data === 'object' && 'enabled' in data) {
          const enabled = data.enabled === true;
          cachedTursoReadEnabled = enabled;
          cachedTursoReadTime = Date.now();
          return enabled;
        }
      }
    }
  } catch (err) {
    // Turso unreachable — fall through to baked config
    console.warn('[TursoRead] Failed to check toggle from DB, using baked config:', (err as any)?.message);
  }

  // Fallback to baked config (with KV fallback for Workers)
  const config = await getBakedConfigAsync();
  cachedTursoReadEnabled = config.tursoReadEnabled;
  cachedTursoReadTime = Date.now();
  return config.tursoReadEnabled;
}

/**
 * Synchronous version for non-async contexts.
 * Only uses in-memory cache + baked config file (no DB check).
 * Should NOT be used for request-time decisions — use async isTursoReadEnabled() instead.
 */
export function isTursoReadEnabledSync(): boolean {
  // Check in-memory cache first
  if (cachedTursoReadEnabled !== null) {
    return cachedTursoReadEnabled;
  }
  // Fallback to baked config
  return getBakedConfig().tursoReadEnabled;
}

/**
 * Force-set the cached Turso Read toggle state.
 * Called by the admin toggle API after saving to DB.
 */
export function setTursoReadEnabledCache(enabled: boolean): void {
  cachedTursoReadEnabled = enabled;
  cachedTursoReadTime = Date.now();
}

/**
 * Update the baked config and write it to disk.
 * Also clears the in-memory cache.
 */
export function updateBakedConfig(updates: Partial<BakedConfig>): void {
  const current = getBakedConfig();
  const updated = { ...current, ...updates };
  bakedConfigCache = updated;

  // On Workers, baked config lives in memory only (no filesystem)
  if (!isFileSystemAvailable()) {
    console.log('[Baked] Config updated in memory (no filesystem on Workers)');
    return;
  }

  try {
    safeMkdirSync(BAKED_DATA_DIR, { recursive: true });
    safeWriteFileSync(
      join(BAKED_DATA_DIR, 'config.json'),
      JSON.stringify(updated, null, 2),
      'utf-8'
    );
  } catch (err) {
    console.warn('[Baked] Failed to write config.json:', (err as any)?.message);
  }
}

/**
 * Read all data from baked JSON files in data/baked/*.json.
 * Returns a Record<string, any> with all valid keys.
 * Falls back to DEFAULTS for missing keys.
 * Synchronous — only checks filesystem, does NOT check KV.
 */
export function readBakedData(): Record<string, any> {
  const data: Record<string, any> = {};

  for (const key of VALID_KEYS) {
    const value = readBakedKey(key);
    if (value !== null) {
      data[key] = value;
    } else {
      // Fall back to default
      data[key] = typeof DEFAULTS[key] === 'object'
        ? JSON.parse(JSON.stringify(DEFAULTS[key]))
        : DEFAULTS[key];
    }
  }

  return data;
}

/**
 * Async version of readBakedData — tries filesystem → memory cache → KV → defaults.
 * Use this in async contexts for Workers+KV support.
 */
export async function readBakedDataAsync(): Promise<Record<string, any>> {
  const data: Record<string, any> = {};

  for (const key of VALID_KEYS) {
    const value = await readBakedKeyAsync(key);
    if (value !== null) {
      data[key] = value;
    } else {
      // Fall back to default
      data[key] = typeof DEFAULTS[key] === 'object'
        ? JSON.parse(JSON.stringify(DEFAULTS[key]))
        : DEFAULTS[key];
    }
  }

  return data;
}

/**
 * Read a single key from baked data file data/baked/{key}.json.
 * Returns null if the file doesn't exist or can't be parsed.
 * Synchronous — only checks filesystem, does NOT check KV.
 */
export function readBakedKey(key: string): any | null {
  try {
    const filePath = join(BAKED_DATA_DIR, `${key}.json`);
    if (safeExistsSync(filePath)) {
      const content = safeReadFileSync(filePath, 'utf-8');
      if (content) return JSON.parse(content);
    }
  } catch (err) {
    console.warn(`[Baked] Failed to read ${key}.json:`, (err as any)?.message);
  }
  return null;
}

/**
 * Async version of readBakedKey — tries filesystem → memory cache → KV → returns null.
 * Use this in async contexts (getAllSiteData, getSiteData) for Workers+KV support.
 */
export async function readBakedKeyAsync(key: string): Promise<any | null> {
  // 1. Try filesystem first (fast, works on Node.js)
  const fsValue = readBakedKey(key);
  if (fsValue !== null) return fsValue;

  // 2. Try memory cache
  if (memoryCache && key in memoryCache) {
    return memoryCache[key];
  }

  // 3. Try KV (Cloudflare Workers persistence)
  try {
    const { kvGetBakedData, kvIsAvailable } = await import('@/lib/kv-store');
    if (kvIsAvailable()) {
      const kvData = await kvGetBakedData(key);
      if (kvData !== null) {
        // Found in KV — cache in memory for fast subsequent reads
        if (!memoryCache) memoryCache = {};
        (memoryCache as Record<string, any>)[key] = kvData;
        return kvData;
      }
    }
  } catch (kvErr: any) {
    console.warn('[Baked] KV read failed:', kvErr?.message);
  }

  // 4. Try D1 baked data (always available on Workers)
  try {
    const { d1GetBakedData } = await import('@/lib/d1');
    const d1Data = await d1GetBakedData(key);
    if (d1Data !== null) {
      // Found in D1 — cache in memory for fast subsequent reads
      if (!memoryCache) memoryCache = {};
      (memoryCache as Record<string, any>)[key] = d1Data;
      return d1Data;
    }
  } catch (d1Err: any) {
    console.warn('[Baked] D1 read failed:', d1Err?.message);
  }

  return null;
}

/**
 * Bake (write) Turso data to data/baked/*.json files for the Publish & Rebuild feature.
 * Takes the full data object and optional config, writes each key to its own JSON file,
 * and also writes/updates config.json with the current timestamp.
 * Also writes to Cloudflare KV when available for Workers persistence.
 *
 * @param data - The full site data object (keyed by data key names)
 * @param config - Optional partial config to update (tursoReadEnabled, version, etc.)
 */
export async function bakeTursoData(data: Record<string, any>, config?: Partial<BakedConfig>): Promise<void> {
  const configUpdates: Partial<BakedConfig> = {
    lastPublished: new Date().toISOString(),
    ...config,
  };

  // On Workers, baking to filesystem is not possible — update memory + KV
  if (!isFileSystemAvailable()) {
    updateBakedConfig(configUpdates);
    // Update memory cache with the baked data
    for (const key of VALID_KEYS) {
      if (key in data) {
        if (!memoryCache) memoryCache = {};
        (memoryCache as Record<string, any>)[key] = data[key];
      }
    }
    console.log('[Baked] Data baked to memory (no filesystem on Workers) at', configUpdates.lastPublished);

    // Also write to KV for persistence across Worker restarts
    try {
      const { kvBulkSetBakedData, kvIsAvailable } = await import('@/lib/kv-store');
      if (kvIsAvailable()) {
        const kvItems: Record<string, any> = {};
        for (const key of VALID_KEYS) {
          if (key in data) {
            kvItems[key] = data[key];
          }
        }
        // Also bake config
        kvItems['config'] = {
          tursoReadEnabled: configUpdates.tursoReadEnabled ?? getBakedConfig().tursoReadEnabled,
          lastPublished: configUpdates.lastPublished,
          version: configUpdates.version ?? getBakedConfig().version,
        };
        const kvWritten = await kvBulkSetBakedData(kvItems);
        console.log(`[Baked] KV: ${kvWritten} keys written to Cloudflare KV`);
      }
    } catch (kvErr: any) {
      console.warn('[Baked] KV write failed (non-fatal):', kvErr?.message);
    }

    // Also write to D1 for persistent baked data storage
    try {
      const { d1SetBakedData } = await import('@/lib/d1');
      const d1Keys: string[] = [];
      for (const key of VALID_KEYS) {
        if (key in data) {
          const ok = await d1SetBakedData(key, data[key]);
          if (ok) d1Keys.push(key);
        }
      }
      // Also bake config to D1
      const configToBake = {
        tursoReadEnabled: configUpdates.tursoReadEnabled ?? getBakedConfig().tursoReadEnabled,
        lastPublished: configUpdates.lastPublished,
        version: configUpdates.version ?? getBakedConfig().version,
      };
      const configOk = await d1SetBakedData('config', configToBake);
      if (configOk) d1Keys.push('config');
      if (d1Keys.length > 0) {
        console.log(`[Baked] D1: ${d1Keys.length} keys written to D1 baked_data table`);
      }
    } catch (d1Err: any) {
      console.warn('[Baked] D1 write failed (non-fatal):', d1Err?.message);
    }
    return;
  }

  try {
    // Ensure the baked directory exists
    safeMkdirSync(BAKED_DATA_DIR, { recursive: true });

    // Write each valid key to its own JSON file
    for (const key of VALID_KEYS) {
      if (key in data) {
        safeWriteFileSync(
          join(BAKED_DATA_DIR, `${key}.json`),
          JSON.stringify(data[key], null, 2),
          'utf-8'
        );
      }
    }

    // Update config with lastPublished timestamp and any overrides
    updateBakedConfig(configUpdates);

    // Also update memory cache
    for (const key of VALID_KEYS) {
      if (key in data) {
        if (!memoryCache) memoryCache = {};
        (memoryCache as Record<string, any>)[key] = data[key];
      }
    }

    console.log('[Baked] Data baked successfully at', configUpdates.lastPublished);

    // Also write to KV as a secondary backup (for environments with both fs + KV)
    try {
      const { kvBulkSetBakedData, kvIsAvailable } = await import('@/lib/kv-store');
      if (kvIsAvailable()) {
        const kvItems: Record<string, any> = {};
        for (const key of VALID_KEYS) {
          if (key in data) {
            kvItems[key] = data[key];
          }
        }
        // Also bake config
        kvItems['config'] = {
          tursoReadEnabled: configUpdates.tursoReadEnabled ?? getBakedConfig().tursoReadEnabled,
          lastPublished: configUpdates.lastPublished,
          version: configUpdates.version ?? getBakedConfig().version,
        };
        const kvWritten = await kvBulkSetBakedData(kvItems);
        console.log(`[Baked] KV backup: ${kvWritten} keys written to Cloudflare KV`);
      }
    } catch (kvErr: any) {
      console.warn('[Baked] KV backup write failed (non-fatal):', kvErr?.message);
    }

    // Also write to D1 as a secondary backup (for environments with both fs + D1)
    try {
      const { d1SetBakedData } = await import('@/lib/d1');
      const d1Keys: string[] = [];
      for (const key of VALID_KEYS) {
        if (key in data) {
          const ok = await d1SetBakedData(key, data[key]);
          if (ok) d1Keys.push(key);
        }
      }
      // Also bake config to D1
      const configToBake = {
        tursoReadEnabled: configUpdates.tursoReadEnabled ?? getBakedConfig().tursoReadEnabled,
        lastPublished: configUpdates.lastPublished,
        version: configUpdates.version ?? getBakedConfig().version,
      };
      const configOk = await d1SetBakedData('config', configToBake);
      if (configOk) d1Keys.push('config');
      if (d1Keys.length > 0) {
        console.log(`[Baked] D1 backup: ${d1Keys.length} keys written to D1 baked_data table`);
      }
    } catch (d1Err: any) {
      console.warn('[Baked] D1 backup write failed (non-fatal):', d1Err?.message);
    }
  } catch (err) {
    console.error('[Baked] Failed to bake data:', (err as any)?.message);
  }
}

// ─── Turso Client ────────────────────────────────────────────────────
/**
 * Get a Turso client.
 *
 * ⚠️ FIX 2026-05-21:
 * Previously this used eval('require')('@libsql/client'), which silently
 * fails on Cloudflare Workers (no Node.js require, no native libs).
 * Now we use the HTTP-based client (createTursoHttpClient) which works
 * everywhere — Node.js, Cloudflare Workers, Vercel Edge, etc.
 *
 * The HTTP client implements the same execute() / batch() interface as
 * @libsql/client, so all downstream code keeps working unchanged.
 *
 * On local Node.js dev, we still try @libsql/client first for slightly
 * faster connection re-use; on Workers / Edge we always use HTTP.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getTursoClient(): any | null {
  if (!getTursoUrl() || !getTursoAuthToken()) return null;

  if (tursoClient) return tursoClient;

  // Detect Cloudflare Workers / Edge runtime — must use HTTP client
  const isWorkersOrEdge =
    process.env.NEXT_RUNTIME === 'edge' ||
    process.env.EDGE_RUNTIME === '1' ||
    (typeof navigator !== 'undefined' &&
     (navigator as { userAgent?: string }).userAgent === 'Cloudflare-Workers');

  if (isWorkersOrEdge) {
    try {
      tursoClient = createTursoHttpClient();
      return tursoClient;
    } catch (err) {
      console.error('[Turso] Failed to create HTTP client:', err);
      return null;
    }
  }

  // Local Node.js dev — try @libsql/client first, fall back to HTTP
  try {
    // eslint-disable-next-line no-eval
    const { createClient } = eval('require')('@libsql/client');
    tursoClient = createClient({
      url: getTursoUrl(),
      authToken: getTursoAuthToken(),
    });
    return tursoClient;
  } catch {
    // @libsql/client not available — fall back to HTTP client (static import)
    try {
      tursoClient = createTursoHttpClient();
      console.log('[Turso] Using HTTP client (no @libsql/client available)');
      return tursoClient;
    } catch (err) {
      console.error('[Turso] Failed to create any Turso client:', err);
      return null;
    }
  }
}

/**
 * Check if Turso is available. Non-blocking: if recently checked and
 * unavailable, returns false immediately. If it's time to recheck,
 * does a quick SELECT 1 with a short timeout.
 */
async function checkTursoAvailability(): Promise<boolean> {
  // If already known to be available, return true immediately (no health check needed)
  if (tursoAvailable) return true;

  // If recently marked unavailable and not time to recheck yet
  if (lastCheckTime > 0 && Date.now() - lastCheckTime < RECHECK_INTERVAL) {
    return false;
  }

  const client = getTursoClient();
  if (!client) {
    tursoAvailable = false;
    lastCheckTime = Date.now();
    return false;
  }

  try {
    await withTimeout(client.execute('SELECT 1'), TURSO_TIMEOUT, 'Turso health check');
    tursoAvailable = true;
    lastCheckTime = 0;
    console.log('[Turso] ✅ Connected successfully');
    return true;
  } catch (err: any) {
    tursoAvailable = false;
    lastCheckTime = Date.now();
    if (!err?.message?.includes('timed out')) {
      console.warn('[Turso] Unreachable, using local fallback:', err?.message || err);
    } else {
      console.warn('[Turso] Connection timed out, using local fallback');
    }
    return false;
  }
}

/**
 * Background check: attempts to reconnect to Turso periodically.
 * Called from a non-blocking context (e.g., after responding to a request).
 */
let bgCheckRunning = false;
function backgroundTursoCheck(): void {
  if (bgCheckRunning) return;
  if (tursoAvailable) return;
  if (Date.now() - lastCheckTime < RECHECK_INTERVAL) return;

  bgCheckRunning = true;
  checkTursoAvailability()
    .catch(() => {})
    .finally(() => { bgCheckRunning = false; });
}

// ─── Local Per-Key File Storage ──────────────────────────────────────
// In-memory cache to minimize file reads
let memoryCache: Record<string, any> | null = null;

/**
 * Ensure the cache directory exists.
 */
function ensureCacheDir(): void {
  if (!isFileSystemAvailable()) return; // No-op on Workers
  if (!safeExistsSync(CACHE_DATA_DIR)) {
    safeMkdirSync(CACHE_DATA_DIR, { recursive: true });
  }
}

/**
 * Read a single key's data from a specific directory.
 * Returns null if the file doesn't exist or can't be parsed.
 */
function readKeyFile(dir: string, key: string): any | null {
  try {
    const filePath = join(dir, `${key}.json`);
    if (safeExistsSync(filePath)) {
      const content = safeReadFileSync(filePath, 'utf-8');
      if (content) return JSON.parse(content);
    }
  } catch (err) {
    // Ignore parse errors
  }
  return null;
}

/**
 * Write a single key's data to a specific directory.
 */
function writeKeyFile(dir: string, key: string, content: any): void {
  if (!isFileSystemAvailable()) return; // No-op on Workers (memory cache handles it)
  try {
    safeMkdirSync(dir, { recursive: true });
    safeWriteFileSync(join(dir, `${key}.json`), JSON.stringify(content, null, 2), 'utf-8');
  } catch (err) {
    console.warn(`[Local] Failed to write key file ${key}:`, (err as any)?.message);
  }
}

/**
 * Read all local data from per-key files.
 * Priority: memory cache → /tmp cache → seed data → defaults
 */
function readLocalData(): Record<string, any> {
  // Use memory cache if available
  if (memoryCache) return memoryCache;

  // Ensure migration has run
  migrateOldFormat();

  const data: Record<string, any> = {};

  for (const key of VALID_KEYS) {
    // Try /tmp cache first
    let value = readKeyFile(CACHE_DATA_DIR, key);

    // Try seed data directory next
    if (value === null) {
      value = readKeyFile(SEED_DATA_DIR, key);
      // If found in seed, also copy to /tmp cache
      if (value !== null) {
        ensureCacheDir();
        writeKeyFile(CACHE_DATA_DIR, key, value);
      }
    }

    // Fall back to default
    if (value === null) {
      value = typeof DEFAULTS[key] === 'object'
        ? JSON.parse(JSON.stringify(DEFAULTS[key]))
        : DEFAULTS[key];
    }

    data[key] = value;
  }

  memoryCache = data;
  return data;
}

/**
 * Write full data record to per-key files (both memory and /tmp cache).
 */
function writeLocalData(data: Record<string, any>): void {
  // Always update memory cache
  memoryCache = data;

  // Write each key to its own file in the cache directory
  ensureCacheDir();
  for (const key of VALID_KEYS) {
    if (key in data) {
      writeKeyFile(CACHE_DATA_DIR, key, data[key]);
    }
  }
}

/**
 * Get a single key's value from local storage.
 */
function getLocalKey(key: string): any | null {
  // Check memory cache first
  if (memoryCache && key in memoryCache) {
    return memoryCache[key];
  }

  // Try /tmp cache
  let value = readKeyFile(CACHE_DATA_DIR, key);

  // Try seed data
  if (value === null) {
    value = readKeyFile(SEED_DATA_DIR, key);
    if (value !== null) {
      ensureCacheDir();
      writeKeyFile(CACHE_DATA_DIR, key, value);
    }
  }

  // Fall back to default
  if (value === null) {
    value = DEFAULTS[key] !== undefined
      ? (typeof DEFAULTS[key] === 'object' ? JSON.parse(JSON.stringify(DEFAULTS[key])) : DEFAULTS[key])
      : null;
  }

  // Update memory cache
  if (memoryCache) {
    memoryCache[key] = value;
  }

  return value;
}

/**
 * Set a single key's value in local storage.
 */
function setLocalKey(key: string, content: any): void {
  // Update memory cache
  if (!memoryCache) {
    memoryCache = readLocalData();
  }
  memoryCache[key] = content;

  // Write to /tmp cache
  ensureCacheDir();
  writeKeyFile(CACHE_DATA_DIR, key, content);
}

/**
 * Set multiple keys' values in local storage.
 */
function setLocalMultiple(items: Array<{ key: string; content: any }>): void {
  // Update memory cache
  if (!memoryCache) {
    memoryCache = readLocalData();
  }

  for (const item of items) {
    memoryCache[item.key] = item.content;
  }

  // Write to /tmp cache
  ensureCacheDir();
  for (const item of items) {
    writeKeyFile(CACHE_DATA_DIR, item.key, item.content);
  }
}

// ─── Data Normalization ──────────────────────────────────────────────
// Ensures consistent key formats between snake_case (frontend) and camelCase (legacy DB)

/**
 * Normalize data in-place to ensure both snake_case and camelCase keys exist.
 * Called when data is read from Turso so all consumers get consistent data.
 */
function normalizeDataInPlace(data: Record<string, any>): void {
  // Normalize preloader data
  if (data.preloader && typeof data.preloader === 'object' && !Array.isArray(data.preloader)) {
    const pre = data.preloader as Record<string, unknown>;
    const preMappings: Array<[string, string]> = [
      ['background_color', 'backgroundColor'],
      ['primary_color', 'primaryColor'],
      ['secondary_color', 'secondaryColor'],
      ['tertiary_color', 'tertiaryColor'],
      ['text_color', 'textColor'],
      ['bar_color', 'barColor'],
    ];
    for (const [snake, camel] of preMappings) {
      const value = pre[snake] ?? pre[camel];
      if (value !== undefined) {
        pre[snake] = value;
        pre[camel] = value;
      }
    }
    // Normalize sentences
    if (pre.sentences && Array.isArray(pre.sentences)) {
      pre.sentences = pre.sentences.map((s: unknown) =>
        typeof s === 'string' ? { text: s } : s
      );
    }
    data.preloader = pre;
  }

  // Normalize nav_items data
  if (data.nav_items && Array.isArray(data.nav_items)) {
    data.nav_items = data.nav_items.map((item: Record<string, unknown>) => {
      const visible = item.isVisible ?? item.is_visible ?? item.visible ?? true;
      const external = item.isExternal ?? item.is_external ?? false;
      return {
        ...item,
        isVisible: visible,
        is_visible: visible,
        visible: visible,
        isExternal: external,
        is_external: external,
      };
    });
  }
}

// ─── Turso DB Operations ─────────────────────────────────────────────
async function tursoInitDatabase(): Promise<void> {
  const client = getTursoClient();
  if (!client) throw new Error('No Turso client');

  await withTimeout(
    client.execute(`
      CREATE TABLE IF NOT EXISTS site_data (
        key TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        updated_at TEXT DEFAULT (datetime('now')),
        updated_by TEXT DEFAULT 'admin'
      )
    `),
    TURSO_TIMEOUT,
    'Turso init DB'
  );

  // Seed if empty
  const result = await withTimeout(
    client.execute('SELECT COUNT(*) as cnt FROM site_data'),
    TURSO_TIMEOUT,
    'Turso count rows'
  );
  const count = Number(result.rows[0]?.cnt ?? 0);
  if (count === 0) {
    console.log('[Turso] Database empty, seeding defaults...');
    for (const [key, value] of Object.entries(DEFAULTS)) {
      await withTimeout(
        client.execute({
          sql: "INSERT INTO site_data (key, content, updated_at) VALUES (?, ?, datetime('now'))",
          args: [key, JSON.stringify(value)],
        }),
        TURSO_TIMEOUT,
        `Turso seed ${key}`
      );
    }
    console.log('[Turso] Defaults seeded');
  }
}

async function tursoGetAll(): Promise<Record<string, any>> {
  const client = getTursoClient();
  if (!client) throw new Error('No Turso client');

  const result = await withTimeout(
    client.execute('SELECT key, content FROM site_data'),
    TURSO_TIMEOUT,
    'Turso getAll'
  );
  const data: Record<string, any> = {};
  for (const row of result.rows) {
    try {
      data[row.key as string] = JSON.parse(row.content as string);
    } catch {
      data[row.key as string] = {};
    }
  }
  // Normalize data to ensure consistent key formats
  normalizeDataInPlace(data);
  return data;
}

async function tursoGet(key: string): Promise<any | null> {
  const client = getTursoClient();
  if (!client) throw new Error('No Turso client');

  const result = await withTimeout(
    client.execute({
      sql: 'SELECT content FROM site_data WHERE key = ?',
      args: [key],
    }),
    TURSO_TIMEOUT,
    `Turso get ${key}`
  );
  if (result.rows.length === 0) return null;
  try {
    return JSON.parse(result.rows[0].content as string);
  } catch {
    return null;
  }
}

async function tursoSet(key: string, content: any): Promise<void> {
  const client = getTursoClient();
  if (!client) throw new Error('No Turso client');

  const jsonStr = typeof content === 'string' ? content : JSON.stringify(content);
  await withTimeout(
    client.execute({
      sql: "INSERT OR REPLACE INTO site_data (key, content, updated_at, updated_by) VALUES (?, ?, datetime('now'), 'admin')",
      args: [key, jsonStr],
    }),
    TURSO_TIMEOUT,
    `Turso set ${key}`
  );
}

async function tursoSetMultiple(items: Array<{ key: string; content: any }>): Promise<void> {
  const client = getTursoClient();
  if (!client) throw new Error('No Turso client');

  // Use a transaction for batch writes
  await withTimeout(
    client.batch(
      items.map(item => ({
        sql: "INSERT OR REPLACE INTO site_data (key, content, updated_at, updated_by) VALUES (?, ?, datetime('now'), 'admin')",
        args: [item.key, typeof item.content === 'string' ? item.content : JSON.stringify(item.content)],
      }))
    ),
    TURSO_TIMEOUT * 3, // More time for batch operations
    'Turso setMultiple'
  );
}

async function tursoDelete(key: string): Promise<void> {
  const client = getTursoClient();
  if (!client) throw new Error('No Turso client');

  await withTimeout(
    client.execute({
      sql: 'DELETE FROM site_data WHERE key = ?',
      args: [key],
    }),
    TURSO_TIMEOUT,
    `Turso delete ${key}`
  );
}

async function tursoGetVersion(): Promise<string> {
  const client = getTursoClient();
  if (!client) throw new Error('No Turso client');

  const result = await withTimeout(
    client.execute("SELECT MAX(updated_at) as ver FROM site_data"),
    TURSO_TIMEOUT,
    'Turso getVersion'
  );
  return (result.rows[0]?.ver as string) || 'unknown';
}

// ─── Public API (dual-layer: Turso primary, local fallback) ──────────

export async function initDatabase(): Promise<void> {
  if (await checkTursoAvailability()) {
    try {
      await tursoInitDatabase();
      return;
    } catch (err) {
      console.warn('[Turso] initDatabase failed, using local:', err);
    }
  }
  // Local fallback: ensure per-key files exist with defaults
  const data = readLocalData();
  writeLocalData(data);
  // Trigger background check for next time
  backgroundTursoCheck();
}

/**
 * Get all site data from the specified source.
 *
 * @param source - Data source:
 *   - 'auto' (default): check baked config → if tursoReadEnabled, read from Turso; if not, read from baked data
 *   - 'turso': always read from Turso (for admin preview)
 *   - 'baked': always read from baked data files
 */
export async function getAllSiteData(source?: 'auto' | 'turso' | 'baked'): Promise<Record<string, any>> {
  const resolvedSource = source ?? 'auto';

  // If explicitly requesting baked data
  if (resolvedSource === 'baked') {
    return readBakedDataAsync();
  }

  // If explicitly requesting Turso data
  if (resolvedSource === 'turso') {
    try {
      const tursoData = await tursoGetAll();
      // Also update local cache
      writeLocalData(tursoData);
      return tursoData;
    } catch (err) {
      console.warn('[Turso] getAllSiteData(turso) failed, falling back to local:', err);
      return readLocalData();
    }
  }

  // 'auto' mode: check Turso DB for toggle state to determine source
  if (!(await isTursoReadEnabled())) {
    // Turso Read is OFF → read from baked data (with KV fallback for Workers)
    console.log('[Data] Turso Read OFF, using baked data');
    return readBakedDataAsync();
  }

  // Turso Read is ON → existing behavior (Turso primary, local fallback)
  if (await checkTursoAvailability()) {
    try {
      const tursoData = await tursoGetAll();
      // Also update local cache
      writeLocalData(tursoData);
      return tursoData;
    } catch (err) {
      console.warn('[Turso] getAllSiteData failed, using local:', err);
    }
  }
  // Trigger background check for next time
  backgroundTursoCheck();
  return readLocalData();
}

/**
 * Get a single key's site data from the specified source.
 *
 * @param key - The data key to retrieve
 * @param source - Data source:
 *   - 'auto' (default): check baked config → if tursoReadEnabled, read from Turso; if not, read from baked data
 *   - 'turso': always read from Turso (for admin preview)
 *   - 'baked': always read from baked data files
 */
export async function getSiteData(key: string, source?: 'auto' | 'turso' | 'baked'): Promise<any | null> {
  const resolvedSource = source ?? 'auto';

  // If explicitly requesting baked data
  if (resolvedSource === 'baked') {
    return readBakedKeyAsync(key);
  }

  // If explicitly requesting Turso data
  if (resolvedSource === 'turso') {
    try {
      const value = await tursoGet(key);
      if (value !== null) {
        // Update local cache for this key
        setLocalKey(key, value);
        return value;
      }
    } catch (err) {
      console.warn(`[Turso] getSiteData('${key}', turso) failed, falling back to local:`, err);
    }
    return getLocalKey(key);
  }

  // 'auto' mode: check Turso DB for toggle state to determine source
  if (!(await isTursoReadEnabled())) {
    // Turso Read is OFF → read from baked data (with KV fallback for Workers)
    return readBakedKeyAsync(key);
  }

  // Turso Read is ON → existing behavior (Turso primary, local fallback)
  if (await checkTursoAvailability()) {
    try {
      const value = await tursoGet(key);
      if (value !== null) {
        // Update local cache for this key
        setLocalKey(key, value);
        return value;
      }
    } catch (err) {
      console.warn(`[Turso] getSiteData('${key}') failed, using local:`, err);
    }
  }
  // Trigger background check for next time
  backgroundTursoCheck();
  return getLocalKey(key);
}

export async function setSiteData(key: string, content: any): Promise<{ local: boolean; turso: boolean }> {
  // Always write to local first (fast, guaranteed)
  setLocalKey(key, content);

  // Always attempt Turso write directly (don't rely on cached availability)
  // This ensures that even if a previous health check failed, we still try to write.
  // The local write is the fast path; Turso write is the persistent path.
  const client = getTursoClient();
  if (client) {
    try {
      await withTimeout(
        client.execute({
          sql: "INSERT OR REPLACE INTO site_data (key, content, updated_at, updated_by) VALUES (?, ?, datetime('now'), 'admin')",
          args: [key, typeof content === 'string' ? content : JSON.stringify(content)],
        }),
        TURSO_TIMEOUT,
        `Turso set ${key}`
      );
      // If we get here, Turso is working — mark it as available for future reads
      tursoAvailable = true;
      lastCheckTime = 0;
      return { local: true, turso: true };
    } catch (err) {
      console.warn(`[Turso] setSiteData('${key}') failed, data saved locally:`, err);
      tursoAvailable = false;
      lastCheckTime = Date.now();
    }
  }

  // If we couldn't write to Turso, trigger a background check
  backgroundTursoCheck();
  return { local: true, turso: false };
}

export async function setMultipleSiteData(items: Array<{ key: string; content: any }>): Promise<{ local: boolean; turso: boolean }> {
  // Always write to local first
  setLocalMultiple(items);

  // Always attempt Turso write directly (don't rely on cached availability)
  const client = getTursoClient();
  if (client) {
    try {
      // Ensure table exists
      await withTimeout(
        client.execute(`
          CREATE TABLE IF NOT EXISTS site_data (
            key TEXT PRIMARY KEY,
            content TEXT NOT NULL,
            updated_at TEXT DEFAULT (datetime('now')),
            updated_by TEXT DEFAULT 'admin'
          )
        `),
        TURSO_TIMEOUT,
        'Turso init DB for setMultiple'
      );

      await withTimeout(
        client.batch(
          items.map(item => ({
            sql: "INSERT OR REPLACE INTO site_data (key, content, updated_at, updated_by) VALUES (?, ?, datetime('now'), 'admin')",
            args: [item.key, typeof item.content === 'string' ? item.content : JSON.stringify(item.content)],
          }))
        ),
        TURSO_TIMEOUT * 3,
        'Turso setMultiple'
      );
      tursoAvailable = true;
      lastCheckTime = 0;
      return { local: true, turso: true };
    } catch (err) {
      console.warn('[Turso] setMultipleSiteData failed, data saved locally:', err);
      tursoAvailable = false;
      lastCheckTime = Date.now();
    }
  }

  backgroundTursoCheck();
  return { local: true, turso: false };
}

export async function deleteSiteData(key: string): Promise<void> {
  // Delete from local (memory + cache file)
  if (memoryCache) {
    delete memoryCache[key];
  }
  try {
    const cachePath = join(CACHE_DATA_DIR, `${key}.json`);
    if (safeExistsSync(cachePath) && isFileSystemAvailable()) {
      try {
        // eslint-disable-next-line no-eval
        const { unlinkSync } = eval('require')('fs');
        unlinkSync(cachePath);
      } catch { /* ignore on Workers */ }
    }
  } catch (err) {
    // Ignore file deletion errors
  }

  // Then try Turso
  if (await checkTursoAvailability()) {
    try {
      await tursoDelete(key);
    } catch (err) {
      console.warn(`[Turso] deleteSiteData('${key}') failed:`, err);
      tursoAvailable = false;
    }
  }
}

export async function getSiteDataVersion(): Promise<string> {
  if (await checkTursoAvailability()) {
    try {
      return await tursoGetVersion();
    } catch (err) {
      console.warn('[Turso] getSiteDataVersion failed, using local:', err);
    }
  }
  // Local version: use most recent file modification time
  try {
    if (isFileSystemAvailable()) {
      // eslint-disable-next-line no-eval
      const { statSync } = eval('require')('fs');
      let latestTime = 0;
      ensureCacheDir();
      for (const key of VALID_KEYS) {
        const cachePath = join(CACHE_DATA_DIR, `${key}.json`);
        try {
          if (safeExistsSync(cachePath)) {
            const stat = statSync(cachePath);
            if (stat.mtimeMs > latestTime) {
              latestTime = stat.mtimeMs;
            }
          }
        } catch {
          // Ignore individual file stat errors
        }
      }
      if (latestTime > 0) {
        return new Date(latestTime).toISOString();
      }
    }
  } catch {}
  return new Date().toISOString();
}

/**
 * Force sync local data to Turso (for "Go Live" / publish operations).
 * Returns true if sync succeeded.
 */
export async function forceSyncToTurso(): Promise<boolean> {
  try {
    // Reset availability flag to force a fresh check
    tursoAvailable = true;
    lastCheckTime = 0;

    if (!(await checkTursoAvailability())) {
      console.error('[Turso] Still unreachable for sync');
      return false;
    }

    await tursoInitDatabase();
    const localData = readLocalData();
    const items = Object.entries(localData)
      .filter(([key]) => key in DEFAULTS || !key.startsWith('_'))
      .map(([key, content]) => ({ key, content }));

    if (items.length > 0) {
      await tursoSetMultiple(items);
      console.log('[Turso] Force sync completed successfully');
    }
    return true;
  } catch (err) {
    console.error('[Turso] Force sync failed:', err);
    return false;
  }
}

/**
 * Get current Turso connection status (for admin UI display).
 */
export function getTursoStatus(): { available: boolean; lastCheck: number } {
  return { available: tursoAvailable, lastCheck: lastCheckTime };
}

// ─── Data Consistency Verification ───────────────────────────────────

/**
 * Verify data consistency between Turso and local storage.
 * Compares all keys and returns mismatches with hash and length info.
 */
export async function verifyDataConsistency(): Promise<{
  consistent: boolean;
  mismatches: Array<{
    key: string;
    tursoLength: number;
    localLength: number;
    tursoHash: string;
    localHash: string;
  }>;
}> {
  const mismatches: Array<{
    key: string;
    tursoLength: number;
    localLength: number;
    tursoHash: string;
    localHash: string;
  }> = [];

  let tursoData: Record<string, any> = {};
  let tursoAvailable = false;

  try {
    if (await checkTursoAvailability()) {
      tursoData = await tursoGetAll();
      tursoAvailable = true;
    }
  } catch (err) {
    console.warn('[Consistency] Failed to read Turso data:', err);
  }

  const localData = readLocalData();

  // Check all valid keys
  for (const key of VALID_KEYS) {
    const tursoValue = tursoAvailable ? tursoData[key] : undefined;
    const localValue = localData[key];

    // If Turso is not available, we can't compare — skip
    if (!tursoAvailable) continue;

    // If the key doesn't exist in Turso, it's not a mismatch per se
    // (Turso might not have been seeded yet), but we report it
    const tursoStr = tursoValue !== undefined ? JSON.stringify(tursoValue) : '';
    const localStr = localValue !== undefined ? JSON.stringify(localValue) : '';

    const tursoHash = createHash('md5').update(tursoStr).digest('hex');
    const localHash = createHash('md5').update(localStr).digest('hex');

    if (tursoHash !== localHash) {
      mismatches.push({
        key,
        tursoLength: tursoStr.length,
        localLength: localStr.length,
        tursoHash,
        localHash,
      });
    }
  }

  return {
    consistent: mismatches.length === 0,
    mismatches,
  };
}
