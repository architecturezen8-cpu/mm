import { NextRequest, NextResponse } from 'next/server';
import { getSiteData, setSiteData } from '@/lib/turso';
import { clearMaintenanceCache } from '@/lib/maintenance';
import { d1SetMaintenanceMode } from '@/lib/d1';

/**
 * Admin Settings API — Simplified to use Turso DB
 * Uses cookie-based auth check (avoids getServerSession crashes in dev)
 *
 * ⚠️ BUG FIX (2026-05-21):
 *   After saving settings, if a "critical" toggle changed (maintenanceMode,
 *   coming_soon, happening_now, home_visibility), we now AUTO-BAKE the data
 *   to KV/D1 so visitors with Turso Read OFF see the change immediately
 *   — without needing the admin to click "Publish & Rebuild" separately.
 */

// Simple cookie-based auth check
function isAdminRequest(req: NextRequest): boolean {
  // Production secure-prefix cookie OR plain cookie OR dev mode
  const sessionToken =
    req.cookies.get('__Secure-next-auth.session-token')?.value ||
    req.cookies.get('next-auth.session-token')?.value;
  if (sessionToken) return true;
  if (process.env.NODE_ENV === 'development') return true;
  return false;
}

// Settings keys that, when changed, should trigger an auto-bake
// so visitors see the change immediately (without "Publish & Rebuild")
const CRITICAL_KEYS = new Set([
  'maintenanceMode',
  'coming_soon',
  'happening_now',
  'home_visibility',
  'siteName',
  'siteLogo',
  'siteFavicon',
  'primaryColor',
  'accentColor',
]);

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Admin routes ALWAYS read from Turso (bypass toggle) so admin always sees current data
    const settings = (await getSiteData('settings', 'turso')) || {};
    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('[GET /api/admin/settings] Error:', error);
    return NextResponse.json(
      { error: 'Failed to load settings', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const incoming = await req.json();
    // Admin routes ALWAYS read from Turso (bypass toggle)
    const existing = (await getSiteData('settings', 'turso')) || {};
    const merged = { ...existing, ...incoming };
    // Deep merge nested objects (home_visibility, happening_now, coming_soon, etc.)
    for (const key of Object.keys(incoming)) {
      if (incoming[key] && typeof incoming[key] === 'object' && !Array.isArray(incoming[key]) && existing[key] && typeof existing[key] === 'object' && !Array.isArray(existing[key])) {
        merged[key] = { ...existing[key], ...incoming[key] };
      }
    }
    const result = await setSiteData('settings', merged);

    // If maintenanceMode was changed, also write to D1 and clear the server-side cache
    // D1 is the primary source for middleware in Cloudflare Workers — must stay in sync
    if ('maintenanceMode' in incoming) {
      clearMaintenanceCache();
      // Also persist to D1 so middleware can read it quickly
      try {
        const d1Result = await d1SetMaintenanceMode(!!incoming.maintenanceMode);
        if (!d1Result) {
          console.warn('[POST /api/admin/settings] Failed to sync maintenanceMode to D1 — Workers middleware may not pick up the change');
        }
      } catch (err) {
        console.warn('[POST /api/admin/settings] D1 maintenanceMode sync error:', err);
      }
    }

    // ✅ AUTO-BAKE: If any critical key changed, bake fresh data to KV/D1 so
    // visitors with Turso Read OFF see the change immediately. Without this,
    // toggling maintenance / coming-soon / branding had NO effect for those
    // visitors until the admin manually clicked "Publish & Rebuild".
    const changedKeys = Object.keys(incoming);
    const hasCriticalChange = changedKeys.some((k) => CRITICAL_KEYS.has(k));
    if (hasCriticalChange) {
      // Non-blocking — don't make admin wait
      (async () => {
        try {
          const { bakeTursoData, getAllSiteData, getBakedConfigAsync } = await import('@/lib/turso');
          const allData = await getAllSiteData('turso');
          const config = await getBakedConfigAsync();
          await bakeTursoData(allData, {
            tursoReadEnabled: config.tursoReadEnabled,
            lastPublished: new Date().toISOString(),
          });
          console.log('[POST /api/admin/settings] Auto-baked after critical change:', changedKeys.filter(k => CRITICAL_KEYS.has(k)).join(', '));
        } catch (bakeErr) {
          console.warn('[POST /api/admin/settings] Auto-bake failed:', bakeErr);
        }
      })().catch(() => {});
    }

    if (!result.turso) {
      console.warn('[POST /api/admin/settings] Saved locally but Turso write failed');
      return NextResponse.json({
        success: true,
        data: merged,
        warning: 'Settings saved locally but could not sync to cloud database. Changes may not persist for other visitors.',
        tursoSynced: false,
        autoBaked: hasCriticalChange,
      });
    }
    return NextResponse.json({
      success: true,
      data: merged,
      tursoSynced: true,
      autoBaked: hasCriticalChange,
    });
  } catch (error: any) {
    console.error('[POST /api/admin/settings] Error:', error);
    return NextResponse.json(
      { error: 'Failed to save settings', details: error.message },
      { status: 500 }
    );
  }
}
