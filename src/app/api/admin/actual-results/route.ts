import { NextRequest, NextResponse } from 'next/server';
import { getSiteData, setSiteData } from '@/lib/turso';
import { DEFAULT_ACTUAL_RESULTS } from '@/lib/voting';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Admin API for Actual Results — stored in Turso as 'actual_results'
 *
 * GET  — Read current actual results (including unpublished)
 * POST — Save/publish actual results
 */

// Check admin auth cookie (consistent with other admin routes)
function isAdmin(request: NextRequest): boolean {
  const sessionToken = request.cookies.get('next-auth.session-token')?.value;
  if (sessionToken) return true;
  if (process.env.NODE_ENV === 'development') return true;
  return false;
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await getSiteData('actual_results', 'auto');
    const results = typeof data === 'string' ? JSON.parse(data) : data;

    return NextResponse.json({
      results: results || DEFAULT_ACTUAL_RESULTS,
    });
  } catch (error) {
    console.error('Admin actual results GET error:', error);
    return NextResponse.json({
      results: DEFAULT_ACTUAL_RESULTS,
    });
  }
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { results } = body as {
      results: {
        topScorer: string;
        topScorerRuns: string;
        topWicketTaker: string;
        topWicketTakerFigures: string;
        playerOfMatch: string;
        playerOfMatchDetail: string;
        matchResult: string;
        isPublished: boolean;
      };
    };

    if (!results) {
      return NextResponse.json({ error: 'Missing results data' }, { status: 400 });
    }

    // Validate and sanitize
    const sanitized = {
      topScorer: (results.topScorer || '').toString().slice(0, 100),
      topScorerRuns: (results.topScorerRuns || '').toString().slice(0, 50),
      topWicketTaker: (results.topWicketTaker || '').toString().slice(0, 100),
      topWicketTakerFigures: (results.topWicketTakerFigures || '').toString().slice(0, 50),
      playerOfMatch: (results.playerOfMatch || '').toString().slice(0, 100),
      playerOfMatchDetail: (results.playerOfMatchDetail || '').toString().slice(0, 100),
      matchResult: (results.matchResult || '').toString().slice(0, 200),
      isPublished: !!results.isPublished,
    };

    await setSiteData('actual_results', sanitized);

    // FIX: Also update the baked data file so that when Turso Read is OFF,
    // the public API still gets the latest actual results.
    try {
      const bakedDir = join(process.cwd(), 'data', 'baked');
      if (!existsSync(bakedDir)) {
        mkdirSync(bakedDir, { recursive: true });
      }
      writeFileSync(
        join(bakedDir, 'actual_results.json'),
        JSON.stringify(sanitized, null, 2),
        'utf-8'
      );
    } catch (bakeErr) {
      console.warn('[Admin Actual Results] Failed to update baked data:', bakeErr);
      // Non-critical: the Turso/local data was saved successfully
    }

    return NextResponse.json({
      success: true,
      results: sanitized,
    });
  } catch (error) {
    console.error('Admin actual results POST error:', error);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
