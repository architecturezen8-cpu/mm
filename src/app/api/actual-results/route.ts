import { NextRequest, NextResponse } from 'next/server';
import { getSiteData } from '@/lib/turso';
import { DEFAULT_ACTUAL_RESULTS } from '@/lib/voting';

/**
 * GET /api/actual-results
 *
 * Public endpoint — returns actual match results.
 * CDN cached for 60s (same strategy as vote-results).
 * Only shows published results (isPublished === true).
 * ?noCache=1 — bypass CDN cache (used by admin after saving)
 *
 * FIX: Uses 'turso' source to always read from the most up-to-date data source
 * (Turso DB or local cache), instead of 'auto' which may return stale baked data.
 */
export async function GET(request: NextRequest) {
  const noCache = request.nextUrl.searchParams.get('noCache') === '1';

  const cacheHeaders: Record<string, string> = noCache
    ? { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
    : {
        'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=10',
      };

  try {
    // FIX: Use 'turso' source to always get the latest data from Turso/local,
    // not 'auto' which may read from stale baked data when Turso Read is OFF.
    // The admin save writes to both Turso AND local, so this always has fresh data.
    let results: any = null;
    try {
      const data = await getSiteData('actual_results', 'turso');
      results = typeof data === 'string' ? JSON.parse(data) : data;
    } catch {
      // If turso source fails, try local/baked fallback
      const data = await getSiteData('actual_results', 'auto');
      results = typeof data === 'string' ? JSON.parse(data) : data;
    }

    if (!results) {
      return NextResponse.json(
        { results: DEFAULT_ACTUAL_RESULTS },
        { status: 200, headers: cacheHeaders }
      );
    }

    // Only show published results to public
    if (!results.isPublished) {
      return NextResponse.json(
        { results: { ...DEFAULT_ACTUAL_RESULTS, isPublished: false } },
        { status: 200, headers: cacheHeaders }
      );
    }

    return NextResponse.json(
      { results },
      { status: 200, headers: cacheHeaders }
    );
  } catch (error) {
    console.error('Actual results API error:', error);
    return NextResponse.json(
      { results: DEFAULT_ACTUAL_RESULTS },
      { status: 200, headers: cacheHeaders }
    );
  }
}
