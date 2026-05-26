import { NextResponse } from 'next/server';
import { getSiteData } from '@/lib/turso';
import { isMaintenanceModeEnabled } from '@/lib/maintenance';

export const dynamic = 'force-dynamic';

/**
 * Public Site Settings API
 * Used by ClientLayout to check maintenance mode, coming soon, etc.
 * Respects the Turso Read toggle — ON reads from Turso, OFF reads from baked data.
 * No auth required — this endpoint only returns safe/public data.
 *
 * ⚠️ BUG FIX (2026-05-21):
 *   maintenanceMode now reads from D1 first via isMaintenanceModeEnabled().
 *   Previously, when Turso Read was OFF, this endpoint returned stale `maintenanceMode`
 *   from baked data — so admins toggling maintenance ON had NO effect on visitors
 *   until they clicked "Publish & Rebuild". D1 is always fresh.
 */
export async function GET() {
  try {
    // 'auto' mode: respects turso_read_enabled toggle
    // ON → reads from Turso, OFF → reads from baked data
    const data = (await getSiteData('settings')) || {};

    // ✅ FIX: Always read maintenanceMode from D1 (fresh source-of-truth in Workers)
    // Falls back to baked/Turso data only if D1 unavailable or key never set.
    let maintenanceMode: boolean;
    try {
      maintenanceMode = await isMaintenanceModeEnabled();
    } catch {
      maintenanceMode = (data.maintenanceMode as boolean) || false;
    }

    const comingSoon = (data.coming_soon as Record<string, unknown>) || {};
    const homeVisibility = (data.home_visibility as Record<string, unknown>) || {};
    const happeningNow = (data.happening_now as Record<string, unknown>) || {};

    return NextResponse.json({
      siteName: (data.siteName as string) || 'Battle of the Golds',
      siteDescription: (data.siteDescription as string) || '',
      siteLogo: (data.siteLogo as string) || '',
      siteFavicon: (data.siteFavicon as string) || '',
      siteUrl: (data.siteUrl as string) || '',
      primaryColor: (data.primaryColor as string) || '#FFC300',
      accentColor: (data.accentColor as string) || '#E63946',
      stThomasEmblem: (data.stThomasEmblem as string) || '',
      royalEmblem: (data.royalEmblem as string) || '',
      maintenanceMode,
      googleAnalyticsId: (data.googleAnalyticsId as string) || '',
      allowedEmails: (data.allowedEmails as string) || '',
      enableNotifications: (data.enableNotifications as boolean) || false,
      coming_soon: {
        enabled: (comingSoon.enabled as boolean) || false,
        title: (comingSoon.title as string) || 'Coming Soon',
        details: (comingSoon.details as string) || 'Score will be updated on 15th May 2026',
        countdownDate: (comingSoon.countdownDate as string) || '2026-05-15T09:00',
      },
      home_visibility: {
        showLiveScoreCard: (homeVisibility.showLiveScoreCard as boolean) !== false,
        showMatchHighlights: (homeVisibility.showMatchHighlights as boolean) !== false,
      },
      happening_now: {
        enabled: (happeningNow.enabled as boolean) || false,
      },
    }, {
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
    });
  } catch {
    // Fall through to empty response
  }
  return NextResponse.json({});
}
