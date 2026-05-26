/**
 * Server-side Supabase Connection Check
 *
 * Provides fast Supabase connection status detection for API routes.
 * When Supabase is disconnected (admin toggle), all Supabase-dependent
 * features (live data only) are forced offline — zero API calls to Supabase.
 * Voting runs independently on Turso and is not affected.
 *
 * Uses 5-second in-memory cache to avoid excessive Turso reads.
 */

import { getSiteData } from '@/lib/turso';

// In-memory cache for Supabase connection status
let cachedConnected: boolean | null = null;
let cachedTime = 0;
const CACHE_TTL = 5_000; // 5 seconds

/**
 * Check if Supabase connection is enabled.
 * Returns true by default (connected) — only false if admin explicitly toggled OFF.
 */
export async function isSupabaseConnected(): Promise<boolean> {
  // Check cache first
  if (cachedConnected !== null && Date.now() - cachedTime < CACHE_TTL) {
    return cachedConnected;
  }

  try {
    const settings = (await getSiteData('settings')) || {};
    const connected = settings.supabaseConnected !== false; // Default true
    cachedConnected = connected;
    cachedTime = Date.now();
    return connected;
  } catch (err) {
    console.warn('[SupabaseConnection] Failed to check status:', err);
    return cachedConnected ?? true; // Default to connected if unreachable
  }
}

/**
 * Force-clear the Supabase connection cache.
 * Called after admin toggles the connection so the next request
 * picks up the change immediately.
 */
export function clearSupabaseConnectionCache(): void {
  cachedConnected = null;
  cachedTime = 0;
}
