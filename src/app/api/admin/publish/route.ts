import { NextRequest, NextResponse } from 'next/server';
import { setMultipleSiteData, getAllSiteData, getSiteData, getSiteDataVersion, initDatabase, bakeTursoData } from '@/lib/turso';
import { pushBakedDataToGitHub, isGitHubBakeConfigured } from '@/lib/github-bake';
import { getEnv } from '@/lib/cf-env';

export const dynamic = 'force-dynamic';

// Simple cookie-based auth check
function isAdminRequest(req: NextRequest): boolean {
  const sessionToken = req.cookies.get('next-auth.session-token')?.value;
  if (sessionToken) return true;
  if (process.env.NODE_ENV === 'development') return true;
  return false;
}

/**
 * POST /api/admin/publish?action=go-live
 *
 * Publish & Rebuild flow (Workers+KV aware):
 * 1. Read ALL data from Turso (source of truth for admin)
 * 2. Read toggle state from Turso DB (not local config.json)
 * 3. Bake data to memory + KV (+ filesystem if available)
 * 4. Push to GitHub CMS repo if configured (triggers Vercel auto-deploy)
 * 5. Fallback: deploy webhook if GitHub push not configured
 * 6. Return success if at least KV write worked (Workers) or files written (Node.js)
 */
export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const action = request.nextUrl.searchParams.get('action');

  if (action === 'go-live') {
    try {
      // ── Step 1: Read data from Turso (always, regardless of toggle) ──
      let data: Record<string, any> = {};
      let readSource = 'turso';
      try {
        data = await getAllSiteData('turso');
      } catch (readErr: any) {
        console.warn('[Publish] Failed to read Turso data, trying auto fallback:', readErr.message);
        try {
          data = await getAllSiteData('auto');
          readSource = 'auto';
        } catch (fallbackErr: any) {
          console.warn('[Publish] Auto fallback also failed:', fallbackErr.message);
        }
      }

      // ── Step 2: Read toggle state from Turso DB (NOT local config.json) ──
      // This is critical: on Workers, local config.json may not exist.
      // The Turso DB is the source of truth for the toggle state.
      let tursoReadEnabled = true; // default
      try {
        const toggleData = await getSiteData('turso_read_enabled', 'turso');
        if (toggleData && typeof toggleData === 'object' && 'enabled' in toggleData) {
          tursoReadEnabled = toggleData.enabled === true;
        }
      } catch (toggleErr: any) {
        console.warn('[Publish] Failed to read toggle from Turso, defaulting to true:', toggleErr.message);
      }

      // ── Step 3: Bake data to memory + KV (+ filesystem if available) ──
      let bakeOk = false;
      try {
        const now = new Date().toISOString();
        await bakeTursoData(data, { tursoReadEnabled, lastPublished: now });
        bakeOk = true;
        console.log('[Publish] Data baked successfully from', readSource, 'tursoReadEnabled:', tursoReadEnabled);
      } catch (bakeErr: any) {
        console.warn('[Publish] Bake failed:', bakeErr.message);
      }

      // ── Check KV bake status ──
      let kvBakeOk = false;
      try {
        const { kvIsAvailable } = await import('@/lib/kv-store');
        kvBakeOk = kvIsAvailable();
      } catch {
        // KV not available — that's fine, not an error
      }

      // ── Check D1 bake status ──
      let d1BakeOk = false;
      try {
        const { isD1Available: checkD1 } = await import('@/lib/d1');
        d1BakeOk = checkD1();
      } catch {
        // D1 not available — that's fine
      }

      // ── Step 4: Push to GitHub CMS repo (triggers Vercel auto-deploy) ──
      let githubPushOk = false;
      let githubPushError: string | null = null;
      let githubCommitSha: string | null = null;
      let githubFilesPushed = 0;

      if (isGitHubBakeConfigured()) {
        try {
          console.log('[Publish] Pushing baked data to GitHub CMS repo...');
          const pushResult = await pushBakedDataToGitHub();
          if (pushResult.success) {
            githubPushOk = true;
            githubCommitSha = pushResult.commitSha || null;
            githubFilesPushed = pushResult.filesPushed;
            console.log('[Publish] GitHub push successful. Commit:', pushResult.commitSha?.slice(0, 7), 'Files:', pushResult.filesPushed);
          } else {
            githubPushError = pushResult.error || 'Unknown GitHub push error';
            console.warn('[Publish] GitHub push failed:', githubPushError);
          }
        } catch (githubErr: any) {
          githubPushError = githubErr.message;
          console.warn('[Publish] GitHub push exception:', githubErr.message);
        }
      }

      // ── Step 5: Fallback — deploy webhook if GitHub push not configured ──
      let deployStatus: number | null = null;
      let deployError: string | null = null;

      if (!githubPushOk) {
        const deployHookUrl = getEnv('REBUILD_WEBHOOK_URL') || getEnv('DEPLOY_HOOK_URL');
        if (deployHookUrl) {
          try {
            console.log('[Publish] Falling back to deploy webhook...');
            const deployResponse = await fetch(deployHookUrl, {
              method: 'POST',
              signal: AbortSignal.timeout(30000),
            });
            deployStatus = deployResponse.status;
            if (!deployResponse.ok) {
              const responseText = await deployResponse.text().catch(() => '');
              deployError = `Webhook returned HTTP ${deployStatus}${responseText ? ': ' + responseText.slice(0, 200) : ''}`;
              console.warn('[Publish] Deploy webhook returned non-OK:', deployStatus);
            } else {
              console.log('[Publish] Deploy webhook triggered, status:', deployStatus);
            }
          } catch (deployErr: any) {
            deployError = deployErr.message;
            console.warn('[Publish] Deploy webhook failed:', deployErr.message);
          }
        }
      }

      // ── Build response message based on environment ──
      let message = '';
      if (bakeOk) {
        if (githubPushOk) {
          message = `Published! ${githubFilesPushed} files pushed to GitHub. Site will auto-deploy.`;
        } else if (kvBakeOk && d1BakeOk) {
          message = `Published! Data baked to Cloudflare KV + D1. Visitors will see updates on next request.`;
        } else if (d1BakeOk) {
          message = `Published! Data baked to Cloudflare D1. Visitors will see updates on next request.`;
        } else if (kvBakeOk) {
          message = `Published! Data baked to Cloudflare KV. Visitors will see updates on next request.`;
        } else if (deployStatus) {
          message = deployError
            ? `Data baked but deploy failed (${deployError}).`
            : `Data baked and rebuild triggered! Site will update in 1-2 minutes.`;
        } else {
          message = `Data baked to memory. For persistence, configure Cloudflare KV or D1.`;
        }
      } else {
        message = 'Bake failed — check server logs.';
      }

      return NextResponse.json({
        success: bakeOk,
        message,
        bakeOk,
        readSource,
        tursoReadEnabled,
        kvBakeOk,
        d1BakeOk,
        githubPushOk,
        githubCommitSha,
        githubFilesPushed,
        githubPushError,
        deployStatus,
        deployError,
        dataKeys: Object.keys(data),
      });
    } catch (error: any) {
      console.error('[Publish] Go-live failed:', error.message);
      return NextResponse.json({ error: 'Publish & Rebuild failed', details: error.message }, { status: 500 });
    }
  }

  // ── Save & Publish with NDJSON streaming (legacy flow) ──
  try {
    const body = await request.json();
    const steps: Array<{ key: string; label: string; data: any }> = [];

    if (body.sections) steps.push({ key: 'sections', label: 'Saving sections', data: body.sections });
    if (body.settings || body.siteSettings) steps.push({ key: 'settings', label: 'Saving settings', data: body.settings || body.siteSettings });
    if (body.preloaderSettings || body.preloader) steps.push({ key: 'preloader', label: 'Saving preloader settings', data: body.preloaderSettings || body.preloader });
    if (body.pages) steps.push({ key: 'pages', label: 'Saving pages', data: body.pages });
    if (body.navItems || body.nav_items) steps.push({ key: 'nav_items', label: 'Saving navigation', data: body.navItems || body.nav_items });
    if (body.media) steps.push({ key: 'media', label: 'Saving media library', data: body.media });
    if (body.pollConfig || body.poll_config) steps.push({ key: 'poll_config', label: 'Saving poll config', data: body.pollConfig || body.poll_config });

    if (steps.length === 0) {
      return NextResponse.json({ error: 'No data provided to publish' }, { status: 400 });
    }

    // NDJSON streaming for progress
    const encoder = new TextEncoder();
    const totalSteps = steps.length + 3; // save steps + verify + bake + github push
    const stream = new ReadableStream({
      async start(controller) {
        const send = (obj: any) => {
          controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'));
        };

        try {
          let failedSteps = 0;

          // Save individual data keys
          for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            send({ step: i + 1, total: totalSteps, message: `${step.label}...`, status: 'processing', key: step.key });
            try {
              await setMultipleSiteData([{ key: step.key, content: step.data }]);
              send({ step: i + 1, total: totalSteps, message: `✅ ${step.label} saved`, status: 'done', key: step.key });
            } catch (err: any) {
              failedSteps++;
              send({ step: i + 1, total: totalSteps, message: `❌ ${step.label} failed: ${err.message}`, status: 'error', key: step.key });
            }
          }

          // Verify
          const verifyStep = steps.length + 1;
          send({ step: verifyStep, total: totalSteps, message: 'Verifying saved data...', status: 'processing' });
          try {
            const version = await getSiteDataVersion();
            const allData = await getAllSiteData('turso');
            send({ step: verifyStep, total: totalSteps, message: `✅ Verified: ${Object.keys(allData).length} keys in database`, status: 'done' });
          } catch {
            send({ step: verifyStep, total: totalSteps, message: '⚠️ Verification skipped', status: 'skipped' });
          }

          // Bake
          const bakeStep = steps.length + 2;
          send({ step: bakeStep, total: totalSteps, message: 'Baking data to static files...', status: 'processing' });
          try {
            const allData = await getAllSiteData('turso');
            // Read toggle from Turso DB (source of truth)
            let tursoReadEnabled = true;
            try {
              const toggleData = await getSiteData('turso_read_enabled', 'turso');
              if (toggleData && typeof toggleData === 'object' && 'enabled' in toggleData) {
                tursoReadEnabled = toggleData.enabled === true;
              }
            } catch {}
            await bakeTursoData(allData, { tursoReadEnabled, lastPublished: new Date().toISOString() });
            send({ step: bakeStep, total: totalSteps, message: '✅ Data baked successfully', status: 'done' });
          } catch (bakeErr: any) {
            failedSteps++;
            send({ step: bakeStep, total: totalSteps, message: `❌ Bake failed: ${bakeErr.message}`, status: 'error' });
          }

          // GitHub push
          const githubStep = steps.length + 3;
          if (isGitHubBakeConfigured()) {
            send({ step: githubStep, total: totalSteps, message: 'Pushing to GitHub CMS repo...', status: 'processing' });
            const pushResult = await pushBakedDataToGitHub();
            if (pushResult.success) {
              send({ step: githubStep, total: totalSteps, message: `✅ Pushed ${pushResult.filesPushed} files to GitHub. Vercel will auto-deploy.`, status: 'done' });
            } else {
              failedSteps++;
              send({ step: githubStep, total: totalSteps, message: `❌ GitHub push failed: ${pushResult.error}`, status: 'error' });
            }
          } else {
            send({ step: githubStep, total: totalSteps, message: '⏭️ GitHub CMS not configured — set GITHUB_CMS_* env vars', status: 'skipped' });
          }

          // Final
          if (failedSteps > 0) {
            send({ step: 'final', message: `⚠️ Published with ${failedSteps} errors.`, status: 'partial' });
          } else {
            send({ step: 'final', message: '🎉 All changes published and pushed to GitHub!', status: 'complete' });
          }
        } catch (error: any) {
          send({ step: 'final', message: `❌ Publish failed: ${error.message}`, status: 'error' });
        }
        controller.close();
      }
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'application/x-ndjson', 'Cache-Control': 'no-store' }
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Publish failed', details: error.message }, { status: 500 });
  }
}

// GET: Return current data version/status
export async function GET() {
  try {
    const version = await getSiteDataVersion();
    const data = await getAllSiteData('turso');

    return NextResponse.json({
      version,
      keys: Object.keys(data),
      lastUpdated: version,
      hasData: Object.keys(data).length > 0
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
