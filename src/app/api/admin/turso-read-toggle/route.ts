import { NextRequest, NextResponse } from 'next/server';
import { getSiteData, setSiteData, isTursoReadEnabledSync, getBakedConfigAsync, updateBakedConfig, setTursoReadEnabledCache } from '@/lib/turso';

export const dynamic = 'force-dynamic';

// Simple cookie-based auth check (consistent with other admin routes)
function isAdminRequest(req: NextRequest): boolean {
  const sessionToken = req.cookies.get('next-auth.session-token')?.value;
  if (sessionToken) return true;
  if (process.env.NODE_ENV === 'development') return true;
  return false;
}

// GET: Returns current Turso Read toggle state
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Try reading from Turso site_data first
    const toggleData = await getSiteData('turso_read_enabled', 'turso');
    let enabled = true; // default
    let lastUpdated: string | null = null;

    if (toggleData && typeof toggleData === 'object' && 'enabled' in toggleData) {
      enabled = toggleData.enabled === true;
      lastUpdated = toggleData.updatedAt || null;
    } else {
      // Fallback to baked config (with KV fallback for Workers)
      const config = await getBakedConfigAsync();
      enabled = config.tursoReadEnabled;
    }

    return NextResponse.json({ enabled, lastUpdated });
  } catch (error: any) {
    // If Turso read fails, fall back to baked config
    try {
      const enabled = isTursoReadEnabledSync();
      return NextResponse.json({ enabled, lastUpdated: null });
    } catch {
      return NextResponse.json(
        { error: 'Failed to read toggle state', details: error.message },
        { status: 500 }
      );
    }
  }
}

// POST: Toggle the Turso Read setting
export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();

    if (typeof body.enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request: "enabled" must be a boolean' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const toggleValue = { enabled: body.enabled, updatedAt: now };

    // Save to Turso site_data
    const result = await setSiteData('turso_read_enabled', toggleValue);

    // Immediately update in-memory cache so next request sees the new state
    setTursoReadEnabledCache(body.enabled);

    // Also update baked config with the new state
    try {
      updateBakedConfig({ tursoReadEnabled: body.enabled, lastPublished: now });
    } catch (bakeErr) {
      console.warn('[TursoReadToggle] Failed to update baked config:', bakeErr);
      // Non-fatal: the Turso write succeeded
    }

    return NextResponse.json({
      success: true,
      enabled: body.enabled,
      lastUpdated: now,
      tursoSynced: result.turso,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to toggle Turso Read', details: error.message },
      { status: 500 }
    );
  }
}
