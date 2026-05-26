import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConnected } from '@/lib/supabase-connection';
import { getEnv } from '@/lib/cf-env';

// IMPORTANT: On Cloudflare Workers, process.env does NOT work at runtime.
// Must use getEnv() which tries CF Workers env bindings first, then process.env fallback.
const SUPABASE_URL = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
const SUPABASE_SERVICE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');
const MATCH_ID = getEnv('NEXT_PUBLIC_MATCH_ID') || 'match_001';

/**
 * GET /api/live
 *
 * Fetch live match data from Supabase with CDN caching.
 * Falls back gracefully if Supabase is unreachable or disconnected.
 *
 * Cache behavior:
 * - Default: s-maxage=10 (CDN caches for 10s) — good for live polling
 * - ?noCache=1: No cache — used by admin toggle checks and offline detection
 *   so the isOffline flag is always fresh
 *
 * Supabase Connection Toggle:
 * - When Supabase is disconnected (admin toggle OFF), returns fallback
 *   immediately — ZERO Supabase API calls. Saves bandwidth.
 */
export async function GET(request: NextRequest) {
  // Check if caller wants fresh data (admin toggle, offline detection)
  const noCache = request.nextUrl.searchParams.get('noCache') === '1';
  const cacheHeaders = noCache
    ? { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
    : { 'Cache-Control': 'public, max-age=0, s-maxage=10, stale-while-revalidate=5' };

  // Read poll config from site data
  let pollConfig = { pollInterval: 10000, jitterMax: 3000 };
  try {
    const { getSiteData } = await import('@/lib/turso');
    const config = await getSiteData('poll_config');
    if (config && typeof config === 'object') {
      if (typeof config.pollInterval === 'number' && config.pollInterval >= 1000 && config.pollInterval <= 60000) {
        pollConfig.pollInterval = config.pollInterval;
      }
      if (typeof config.jitterMax === 'number' && config.jitterMax >= 0 && config.jitterMax <= 10000) {
        pollConfig.jitterMax = config.jitterMax;
      }
    }
  } catch {
    // Keep defaults
  }

  // ⚡ Supabase Connection Toggle: When OFF, return fallback immediately.
  // This saves bandwidth — zero Supabase API calls when disconnected.
  const supabaseConnected = await isSupabaseConnected();
  if (!supabaseConnected) {
    return NextResponse.json(
      { error: 'Supabase disconnected', fallback: true, supabaseDisconnected: true, pollConfig },
      { status: 200, headers: cacheHeaders }
    );
  }

  // Guard: If Supabase is not configured, return fallback
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.json(
      { error: 'Supabase not configured', fallback: true, pollConfig },
      {
        status: 200,
        headers: cacheHeaders,
      }
    );
  }

  try {
    // Fetch directly from Supabase REST API
    const url = `${SUPABASE_URL}/rest/v1/match_live?match_id=eq.${MATCH_ID}&select=*&limit=1`;

    const response = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Supabase REST error: ${response.status} ${response.statusText}`);
      
      // If 406 or relation not found, table might not exist — try with service key
      if ((response.status === 406 || response.status === 404) && SUPABASE_SERVICE_KEY) {
        const retryResponse = await fetch(url, {
          headers: {
            apikey: SUPABASE_SERVICE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (retryResponse.ok) {
          const rows = await retryResponse.json();
          if (!rows || rows.length === 0) {
            return NextResponse.json(
              { error: 'No match data found', fallback: true, pollConfig },
              { status: 200, headers: cacheHeaders }
            );
          }
          const row = rows[0];
          const etag = `"${row.updated_at || Date.now()}"`;
          return NextResponse.json({ ...row, pollConfig }, {
            status: 200,
            headers: {
              ...cacheHeaders,
              ETag: etag,
            },
          });
        }
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch match data', fallback: true, pollConfig },
        {
          status: 200,
          headers: cacheHeaders,
        }
      );
    }

    const rows = await response.json();

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: 'No match data found', fallback: true, pollConfig },
        {
          status: 200,
          headers: cacheHeaders,
        }
      );
    }

    const row = rows[0];

    // Check if the row has valid data (not empty JSON objects)
    // When match_live has {} for live_state, it means no real data has been written yet
    const liveState = row.live_state;
    const hasValidLiveData = liveState && (
      (typeof liveState === 'string' ? JSON.parse(liveState) : liveState)
    )?.score !== undefined;

    if (!hasValidLiveData) {
      // No valid live data — return fallback so frontend shows offline placeholders
      return NextResponse.json(
        { error: 'No valid live data yet', fallback: true, pollConfig },
        {
          status: 200,
          headers: cacheHeaders,
        }
      );
    }

    // Generate ETag from updated_at for 304 Not Modified support
    const etag = `"${row.updated_at || Date.now()}"`;

    // Check If-None-Match for 304 Not Modified
    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: etag,
          ...cacheHeaders,
        },
      });
    }

    return NextResponse.json({ ...row, pollConfig }, {
      status: 200,
      headers: {
        ...cacheHeaders,
        ETag: etag,
        'Vary': 'Accept-Encoding',
      },
    });
  } catch (error) {
    console.error('API /api/live error:', error);
    return NextResponse.json(
      { error: 'Internal server error', fallback: true, pollConfig },
      {
        status: 200,
        headers: cacheHeaders,
      }
    );
  }
}
