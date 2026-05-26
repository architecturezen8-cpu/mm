import { NextRequest, NextResponse } from 'next/server';
import { kvGetMusicLibrary, kvGetActiveSong } from '@/lib/music-store';

/**
 * GET /api/music — Public Music API
 *
 * Returns the current active song config and the full library list.
 * This is the endpoint the client-side MusicPlayer component calls.
 *
 * Cache strategy:
 *   max-age=0     → browser never caches (always revalidates through CDN)
 *   s-maxage=300  → CDN caches for 5 minutes
 */
export async function GET(_req: NextRequest) {
  const cacheHeaders: Record<string, string> = {
    'Cache-Control': 'public, max-age=0, s-maxage=300',
  };

  try {
    const [active, library] = await Promise.all([
      kvGetActiveSong(),
      kvGetMusicLibrary(),
    ]);

    return NextResponse.json(
      { active, library },
      { status: 200, headers: cacheHeaders }
    );
  } catch (error: unknown) {
    console.error('[GET /api/music] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to load music config', details: message },
      { status: 500, headers: cacheHeaders }
    );
  }
}
