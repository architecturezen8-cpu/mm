/**
 * Server-side Maintenance Mode Check
 *
 * Provides fast maintenance mode detection for server components and API routes.
 * Uses a layered approach:
 *   1. D1 (fastest, most reliable in Cloudflare Workers)
 *   2. Turso (respects the Turso Read toggle)
 *   3. Default: false
 *
 * Admin toggles to maintenance mode always clear the cache immediately,
 * so changes are picked up on the next request.
 */

// In-memory cache for maintenance mode state
let cachedMaintenanceMode: boolean | null = null;
let cachedTime = 0;
const CACHE_TTL = 5_000; // 5 seconds — fast enough for toggle changes

/**
 * Check if maintenance mode is enabled.
 * Layered approach:
 *   1. D1 binding (fast, reliable in Cloudflare Workers)
 *   2. Turso (respects the Turso Read toggle)
 *   3. Default: false
 */
export async function isMaintenanceModeEnabled(): Promise<boolean> {
  // Check cache first
  if (cachedMaintenanceMode !== null && Date.now() - cachedTime < CACHE_TTL) {
    return cachedMaintenanceMode;
  }

  // Layer 1: Try D1 (fastest, most reliable in Workers)
  try {
    const { d1GetMaintenanceMode } = await import('@/lib/d1');
    const d1Result = await d1GetMaintenanceMode();
    if (d1Result !== null) {
      // D1 has the key — trust it
      cachedMaintenanceMode = d1Result;
      cachedTime = Date.now();
      return d1Result;
    }
    // Key doesn't exist in D1 — fall through to Turso
  } catch (err) {
    console.warn('[Maintenance] D1 check failed:', err);
  }

  // Layer 2: Try Turso (respects the Turso Read toggle)
  try {
    const { getSiteData } = await import('@/lib/turso');
    const settings = (await getSiteData('settings')) || {};
    const enabled = settings.maintenanceMode === true;
    cachedMaintenanceMode = enabled;
    cachedTime = Date.now();
    return enabled;
  } catch (err) {
    console.warn('[Maintenance] Turso check failed:', err);
    // If data source is unreachable, keep previous cache or default to false
    return cachedMaintenanceMode ?? false;
  }
}

/**
 * Force-clear the maintenance mode cache.
 * Called after admin toggles maintenance mode so the next server
 * render picks up the change immediately.
 */
export function clearMaintenanceCache(): void {
  cachedMaintenanceMode = null;
  cachedTime = 0;
}
