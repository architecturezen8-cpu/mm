import { NextRequest, NextResponse } from 'next/server';
import { kvGetSongData } from '@/lib/music-store';

/**
 * GET /api/music/stream?songId=abc&v=3 — Audio Streaming API
 *
 * Streams the actual MP3 audio data from KV storage.
 * The `v` parameter is the version number for cache busting.
 *
 * Cache strategy:
 *   max-age=0      → browser never caches (always revalidates through CDN)
 *   s-maxage=86400 → CDN caches for 24 hours
 *
 * No auth required.
 */
export async function GET(req: NextRequest) {
  const songId = req.nextUrl.searchParams.get('songId');

  if (!songId) {
    return NextResponse.json(
      { error: 'Missing "songId" query parameter' },
      { status: 400 }
    );
  }

  try {
    const songData = await kvGetSongData(songId);

    if (!songData) {
      return NextResponse.json(
        { error: 'Song not found' },
        { status: 404 }
      );
    }

    // Return audio data with proper headers
    return new Response(songData, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=0, s-maxage=86400',
        'Content-Disposition': 'inline',
        'Content-Length': String(songData.byteLength),
        'Accept-Ranges': 'bytes',
      },
    });
  } catch (error: unknown) {
    console.error('[GET /api/music/stream] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to stream song', details: message },
      { status: 500 }
    );
  }
}
