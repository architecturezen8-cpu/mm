import { NextRequest, NextResponse } from 'next/server';
import { kvIncrementCountry, kvGetCountryMap } from '@/lib/viewer-map-store';

/**
 * Viewer Map Public API
 *
 * GET /api/viewer-map — Get country viewer counts for the map visualization
 *
 * Also increments the current user's country count using the cf-ipcountry
 * header automatically set by Cloudflare (2-letter country code).
 * Falls back to "XX" when the header is not available (local dev).
 *
 * Response:
 *   { countries: { "LK": 4520, ... }, total: 21000, yourCountry: "LK" }
 *
 * Cache: public, max-age=0, s-maxage=30 (30s CDN cache, no browser cache)
 */

export async function GET(req: NextRequest) {
  try {
    // 1. Read country from Cloudflare header
    const countryCode = (req.headers.get('cf-ipcountry') || 'XX').toUpperCase();

    // 2. Fire-and-forget increment (don't await)
    kvIncrementCountry(countryCode).catch(() => {
      // Swallow errors — increment failure must not block the response
    });

    // 3. Get current country counts
    const countries = await kvGetCountryMap();
    const total = Object.values(countries).reduce((sum, count) => sum + count, 0);

    // 4. Return response with CDN cache headers
    return NextResponse.json(
      { countries, total, yourCountry: countryCode },
      {
        headers: {
          'Cache-Control': 'public, max-age=0, s-maxage=30',
        },
      }
    );
  } catch (error: any) {
    console.error('[GET /api/viewer-map] Error:', error);
    return NextResponse.json(
      { error: 'Failed to load viewer map', details: error.message },
      { status: 500 }
    );
  }
}
