/**
 * Cloudflare Workers Environment Variables Utility
 *
 * On Cloudflare Workers, `process.env` does NOT work for server-side env vars
 * (only NEXT_PUBLIC_* vars are inlined at build time).
 *
 * This utility reads env vars from the Cloudflare Worker binding context
 * via getCloudflareContext(), with a fallback to process.env for local dev.
 *
 * Usage:
 *   import { getEnv } from '@/lib/cf-env';
 *   const url = getEnv('NEXT_PUBLIC_SUPABASE_URL');
 *   const key = getEnv('VAPID_PRIVATE_KEY');
 *
 * ⚠️ FIX 2026-05-21:
 *   Previously used `require('@opennextjs/cloudflare')` which silently fails
 *   on Cloudflare Workers (no CommonJS require in Workers ESM mode). Now we
 *   load the module asynchronously at startup and cache the function reference.
 *   The first call may return undefined until the import resolves, but that
 *   only matters during cold start — by the time any request handler runs,
 *   the import has resolved.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _getCloudflareContext: ((opts?: any) => { env: Record<string, unknown> }) | null = null;
let _attempted = false;

async function loadCfContext() {
  if (_attempted) return;
  _attempted = true;
  try {
    const mod = await import('@opennextjs/cloudflare');
    _getCloudflareContext = mod.getCloudflareContext as typeof _getCloudflareContext;
  } catch {
    _getCloudflareContext = null;
  }
}

// Kick off the async import at module load. In Workers/OpenNext, the import
// is resolved synchronously at bundle time, so this completes before any
// real request handler executes.
void loadCfContext();

function getCfEnvSync(): Record<string, unknown> | null {
  if (!_getCloudflareContext) return null;
  try {
    const ctx = _getCloudflareContext();
    return (ctx?.env as Record<string, unknown>) ?? null;
  } catch {
    return null;
  }
}

/**
 * Get an environment variable value.
 * Tries Cloudflare Workers env binding first, then falls back to process.env.
 * Returns undefined if not found in either.
 */
export function getEnv(key: string): string | undefined {
  // 1. Try Cloudflare Workers env binding (runtime)
  const env = getCfEnvSync();
  if (env && key in env) {
    const val = env[key];
    if (typeof val === 'string') return val;
  }

  // 2. Fallback to process.env (local dev / build-time inlined NEXT_PUBLIC_*)
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
}

/**
 * Get an environment variable value (throws if missing).
 */
export function getEnvOrThrow(key: string): string {
  const val = getEnv(key);
  if (!val) {
    throw new Error(`Environment variable "${key}" is not set`);
  }
  return val;
}
