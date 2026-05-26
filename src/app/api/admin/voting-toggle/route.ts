import { NextRequest, NextResponse } from 'next/server';
import { initD1Database, d1GetVotingSettings, d1SetSetting, isD1Available } from '@/lib/d1';

export const dynamic = 'force-dynamic';

// Simple cookie-based auth check (consistent with other admin routes)
function isAdminRequest(req: NextRequest): boolean {
  const sessionToken = req.cookies.get('next-auth.session-token')?.value;
  if (sessionToken) return true;
  if (process.env.NODE_ENV === 'development') return true;
  return false;
}

// GET: Returns current voting toggle state
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check D1 availability
    if (!isD1Available()) {
      return NextResponse.json(
        { error: 'D1 not available', d1Unavailable: true },
        { status: 503 }
      );
    }

    await initD1Database();
    const settings = await d1GetVotingSettings();

    return NextResponse.json({
      enabled: settings.votingEnabled,
      lastUpdated: settings.votingEnabledLastUpdated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to read voting toggle state', details: error.message },
      { status: 500 }
    );
  }
}

// POST: Toggle the voting setting
export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check D1 availability
    if (!isD1Available()) {
      return NextResponse.json(
        { error: 'D1 not available', d1Unavailable: true },
        { status: 503 }
      );
    }

    const { enabled } = await request.json();
    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'enabled must be boolean' }, { status: 400 });
    }

    await initD1Database();

    // Save to D1 vote_meta
    await d1SetSetting('votingEnabled', String(enabled));
    const now = new Date().toISOString();
    await d1SetSetting('votingEnabledLastUpdated', now);

    return NextResponse.json({
      success: true,
      votingEnabled: enabled,
      lastUpdated: now,
    });
  } catch (error) {
    console.error('Voting toggle error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
