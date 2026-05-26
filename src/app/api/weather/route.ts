import { NextResponse } from 'next/server';

/**
 * Weather API — Server-side proxy with CDN caching
 *
 * Strategy: Cloudflare CDN caches for 10 min at the edge.
 * 1M users / ~200 PoPs / 600s = ~12 requests/min to OpenMeteo = ~11,520/day (under 10K free limit)
 * 99,999 users served from CDN, only 1-3 per PoP hit upstream.
 *
 * Cache layers:
 * 1. CDN (Cloudflare edge) — 10min TTL (s-maxage=600)
 * 2. In-memory (per Worker) — 10min TTL
 * 3. OpenMeteo API — upstream, ~10K free limit
 *
 * 100K requests → only 1-3 hit OpenMeteo, 99,997 served from cache
 */

import { getEnv } from '@/lib/cf-env';

const OPEN_METEO_URL = getEnv('NEXT_PUBLIC_OPEN_METEO_URL')
  || 'https://api.open-meteo.com/v1/forecast?latitude=7.67&longitude=80.63&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,relative_humidity_2m_max,wind_speed_10m_max&timezone=Asia/Colombo&forecast_days=16';

// In-memory cache as backup (for when CDN cache misses)
let cachedWeather: { data: unknown; timestamp: number } | null = null;
const MEMORY_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function GET() {
  try {
    // Check in-memory cache first
    if (cachedWeather && Date.now() - cachedWeather.timestamp < MEMORY_CACHE_TTL) {
      return NextResponse.json(cachedWeather.data, {
        headers: {
          'Cache-Control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=120',
          'CDN-Cache-Control': 'public, max-age=0, s-maxage=600',
          'Vary': 'Accept-Encoding',
        },
      });
    }

    // Fetch from OpenMeteo
    const response = await fetch(OPEN_METEO_URL, {
      headers: { 'User-Agent': 'BOTG-Weather/1.0' },
    });

    if (!response.ok) {
      // Return cached data if available (stale), otherwise error
      if (cachedWeather) {
        return NextResponse.json(cachedWeather.data, {
          headers: {
            'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=60',
            'X-Weather-Stale': 'true',
          },
        });
      }
      return NextResponse.json(
        { error: 'Weather data unavailable', offline: true },
        { status: 503, headers: { 'Cache-Control': 'public, max-age=0, s-maxage=60' } }
      );
    }

    const data = await response.json();

    // Update in-memory cache
    cachedWeather = { data, timestamp: Date.now() };

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=120',
        'CDN-Cache-Control': 'public, max-age=0, s-maxage=600',
        'Vary': 'Accept-Encoding',
      },
    });
  } catch (error) {
    console.error('[Weather API] Error:', error);
    // Return stale cache if available
    if (cachedWeather) {
      return NextResponse.json(cachedWeather.data, {
        headers: {
          'Cache-Control': 'public, max-age=0, s-maxage=120',
          'X-Weather-Stale': 'true',
        },
      });
    }
    return NextResponse.json(
      { error: 'Weather data unavailable', offline: true },
      { status: 503, headers: { 'Cache-Control': 'public, max-age=0, s-maxage=60' } }
    );
  }
}
