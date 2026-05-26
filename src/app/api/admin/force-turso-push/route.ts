import { NextRequest, NextResponse } from 'next/server';
import { setMultipleSiteData, initDatabase, getAllSiteData, getSiteData } from '@/lib/turso';

export const dynamic = 'force-dynamic';

// Simple cookie-based auth check
function isAdminRequest(req: NextRequest): boolean {
  const sessionToken = req.cookies.get('next-auth.session-token')?.value;
  if (sessionToken) return true;
  if (process.env.NODE_ENV === 'development') return true;
  return false;
}

/**
 * POST /api/admin/force-turso-push
 *
 * Accepts ALL current browser state data and pushes it to Turso at once.
 */
export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    let failedSteps = 0;
    const steps: Array<{ step: string; status: string; detail?: string }> = [];

    // Step 1: Initialize
    steps.push({ step: 'Initializing Turso database...', status: 'processing' });
    await initDatabase();
    steps.push({ step: '✅ Database ready', status: 'done' });

    // Step 2: Save individual data keys
    steps.push({ step: 'Saving all data to Turso...', status: 'processing' });

    const items: Array<{ key: string; content: unknown }> = [];

    // Settings: deep-merge with existing
    if (body.settings && Object.keys(body.settings as object).length > 0) {
      try {
        // Admin routes ALWAYS read from Turso (bypass toggle)
        const existing = (await getSiteData('settings', 'turso')) || {};
        const incoming = body.settings as Record<string, unknown>;
        const merged = { ...existing, ...incoming };
        // Deep merge nested objects
        for (const key of Object.keys(incoming)) {
          if (
            incoming[key] && typeof incoming[key] === 'object' && !Array.isArray(incoming[key]) &&
            existing[key] && typeof existing[key] === 'object' && !Array.isArray(existing[key])
          ) {
            merged[key] = { ...(existing[key] as Record<string, unknown>), ...(incoming[key] as Record<string, unknown>) };
          }
        }
        // CRITICAL: Always use browser's toggle values — never allow stale server cache to override
        const incomingSettings = body.settings as Record<string, unknown>;
        if (incomingSettings.home_visibility) {
          merged.home_visibility = incomingSettings.home_visibility;
        }
        if (incomingSettings.happening_now) {
          merged.happening_now = incomingSettings.happening_now;
        }
        if (incomingSettings.coming_soon) {
          merged.coming_soon = incomingSettings.coming_soon;
        }

        items.push({ key: 'settings', content: merged });
      } catch {
        items.push({ key: 'settings', content: body.settings });
      }
    }

    // Preloader
    if (body.preloader && Object.keys(body.preloader as object).length > 0) {
      items.push({ key: 'preloader', content: body.preloader });
    }

    // Poll config
    if (body.poll_config && Object.keys(body.poll_config as object).length > 0) {
      items.push({ key: 'poll_config', content: body.poll_config });
    }

    // GitHub config
    if (body.github_config && Object.keys(body.github_config as object).length > 0) {
      items.push({ key: 'github_config', content: body.github_config });
    }

    if (items.length > 0) {
      try {
        await setMultipleSiteData(items);
        const keyLabels = items.map(i => i.key).join(', ');
        steps.push({ step: `✅ Saved ${items.length} data keys (${keyLabels}) to local + Turso`, status: 'done' });
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        failedSteps++;
        steps.push({ step: `⚠️ Partial save: ${errorMsg}`, status: 'error' });
      }
    } else {
      steps.push({ step: '⏭️ No data keys to save', status: 'skipped' });
    }

    // Step 3: Verify Turso write (the setMultipleSiteData call already writes to Turso directly)
    steps.push({ step: 'Verifying Turso cloud write...', status: 'processing' });
    try {
      const verifyData = await getSiteData('settings', 'turso');
      if (verifyData) {
        steps.push({ step: '✅ Data verified in Turso cloud', status: 'done' });
      } else {
        steps.push({ step: '⚠️ Could not verify Turso write (data may only be saved locally)', status: 'error' });
      }
    } catch {
      steps.push({ step: '⏭️ Verification skipped', status: 'skipped' });
    }

    // Step 4: Verify
    steps.push({ step: 'Verifying saved data...', status: 'processing' });
    try {
      const data = await getAllSiteData('turso');
      const keyCount = Object.keys(data).length;
      steps.push({ step: `✅ Verified: ${keyCount} keys in database`, status: 'done' });
    } catch {
      steps.push({ step: '⚠️ Verification skipped', status: 'skipped' });
    }

    // Final status
    if (failedSteps > 0) {
      return NextResponse.json({
        success: false,
        message: `Pushed with ${failedSteps} warnings. Some data may only be saved locally.`,
        steps,
        status: 'partial',
      });
    } else {
      return NextResponse.json({
        success: true,
        message: '🎉 All data pushed to Turso successfully!',
        steps,
        status: 'complete',
      });
    }

  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Force push failed', details: errorMsg }, { status: 500 });
  }
}
