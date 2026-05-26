import { NextRequest, NextResponse } from 'next/server';
import { kvGetCountryMap, kvResetCountryMap } from '@/lib/viewer-map-store';

/**
 * Viewer Map Admin API
 *
 * GET  /api/admin/viewer-map — Get detailed viewer map stats
 * POST /api/admin/viewer-map — Reset all country counts ({ action: "reset" })
 *
 * Both endpoints require admin auth (cookie-based session check).
 * In development mode, auth is automatically bypassed.
 *
 * GET Response:
 *   { countries: { "LK": 4520, ... }, total: 21000, topCountries: [...] }
 *
 * POST Response:
 *   { success: true, message: "..." }
 */

// Simple cookie-based auth check (same pattern as other admin routes)
function isAdminRequest(req: NextRequest): boolean {
  const sessionToken = req.cookies.get('next-auth.session-token')?.value;
  if (sessionToken) return true;
  if (process.env.NODE_ENV === 'development') return true;
  return false;
}

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const countries = await kvGetCountryMap();
    const total = Object.values(countries).reduce((sum, count) => sum + count, 0);

    // Build top countries sorted by count descending
    const topCountries = Object.entries(countries)
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({ countries, total, topCountries });
  } catch (error: any) {
    console.error('[GET /api/admin/viewer-map] Error:', error);
    return NextResponse.json(
      { error: 'Failed to load viewer map stats', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();

    if (body.action !== 'reset') {
      return NextResponse.json(
        { error: 'Invalid action', details: 'Supported actions: "reset"' },
        { status: 400 }
      );
    }

    const success = await kvResetCountryMap();

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to reset viewer map', details: 'KV store not available' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'All country counts have been reset.',
    });
  } catch (error: any) {
    console.error('[POST /api/admin/viewer-map] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error.message },
      { status: 500 }
    );
  }
}
