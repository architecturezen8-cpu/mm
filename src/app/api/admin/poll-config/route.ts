import { NextRequest, NextResponse } from 'next/server';
import { getSiteData, setSiteData } from '@/lib/turso';

/**
 * Poll Config Admin API
 *
 * GET  /api/admin/poll-config — Read current poll config
 * POST /api/admin/poll-config — Update poll config
 *
 * Poll config controls the frontend polling behavior:
 *   pollInterval: Base polling interval in ms (1000–60000, default 10000)
 *   jitterMax:    Random jitter added to each poll in ms (0–10000, default 3000)
 *
 * The actual poll interval for each request = pollInterval + random(0, jitterMax)
 * This prevents all clients from hitting the server at the same moment (thundering herd).
 *
 * Changes are saved to Turso and take effect on the NEXT poll cycle.
 * No rebuild needed — the /api/live endpoint reads this config on every request.
 */

// Simple cookie-based auth check
function isAdminRequest(req: NextRequest): boolean {
  const sessionToken = req.cookies.get('next-auth.session-token')?.value;
  if (sessionToken) return true;
  if (process.env.NODE_ENV === 'development') return true;
  return false;
}

// Default poll config values
const DEFAULT_POLL_CONFIG = {
  pollInterval: 10_000, // 10 seconds
  jitterMax: 3_000,     // 0-3 seconds jitter
};

// Validation constraints
const POLL_INTERVAL_MIN = 1_000;   // 1 second minimum
const POLL_INTERVAL_MAX = 60_000;  // 60 seconds maximum
const JITTER_MAX_MIN = 0;          // No jitter is valid
const JITTER_MAX_MAX = 10_000;     // 10 seconds max jitter

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Admin routes ALWAYS read from Turso (bypass toggle)
    const config = await getSiteData('poll_config', 'turso');
    const mergedConfig = {
      ...DEFAULT_POLL_CONFIG,
      ...(config || {}),
    };

    return NextResponse.json({
      config: mergedConfig,
      defaults: DEFAULT_POLL_CONFIG,
      constraints: {
        pollInterval: { min: POLL_INTERVAL_MIN, max: POLL_INTERVAL_MAX },
        jitterMax: { min: JITTER_MAX_MIN, max: JITTER_MAX_MAX },
      },
    });
  } catch (error: any) {
    console.error('[GET /api/admin/poll-config] Error:', error);
    return NextResponse.json(
      { error: 'Failed to load poll config', details: error.message, config: DEFAULT_POLL_CONFIG },
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
    const errors: string[] = [];

    // Read current config
    const current = (await getSiteData('poll_config', 'turso')) || DEFAULT_POLL_CONFIG;
    const merged = { ...current };

    // Validate and apply pollInterval
    if ('pollInterval' in incoming) {
      const val = Number(incoming.pollInterval);
      if (isNaN(val) || val < POLL_INTERVAL_MIN || val > POLL_INTERVAL_MAX) {
        errors.push(`pollInterval must be between ${POLL_INTERVAL_MIN} and ${POLL_INTERVAL_MAX} ms`);
      } else {
        merged.pollInterval = val;
      }
    }

    // Validate and apply jitterMax
    if ('jitterMax' in incoming) {
      const val = Number(incoming.jitterMax);
      if (isNaN(val) || val < JITTER_MAX_MIN || val > JITTER_MAX_MAX) {
        errors.push(`jitterMax must be between ${JITTER_MAX_MIN} and ${JITTER_MAX_MAX} ms`);
      } else {
        merged.jitterMax = val;
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 });
    }

    // Save to Turso
    const result = await setSiteData('poll_config', merged);

    if (!result.turso) {
      console.warn('[POST /api/admin/poll-config] Saved locally but Turso write failed');
      return NextResponse.json({
        success: true,
        config: merged,
        warning: 'Poll config saved locally but could not sync to cloud database.',
        tursoSynced: false,
      });
    }

    return NextResponse.json({
      success: true,
      config: merged,
      tursoSynced: true,
      message: `Poll config updated: ${merged.pollInterval}ms interval + ${merged.jitterMax}ms jitter. Takes effect on next poll cycle.`,
    });
  } catch (error: any) {
    console.error('[POST /api/admin/poll-config] Error:', error);
    return NextResponse.json(
      { error: 'Failed to save poll config', details: error.message },
      { status: 500 }
    );
  }
}
