import { NextRequest, NextResponse } from 'next/server';
import { getSiteData, setSiteData } from '@/lib/turso';
import { clearSupabaseConnectionCache } from '@/lib/supabase-connection';

export const dynamic = 'force-dynamic';

// Simple cookie-based auth check (consistent with other admin routes)
function isAdminRequest(req: NextRequest): boolean {
  const sessionToken = req.cookies.get('next-auth.session-token')?.value;
  if (sessionToken) return true;
  if (process.env.NODE_ENV === 'development') return true;
  return false;
}

// GET: Returns current Supabase connection toggle state
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const currentData = await getSiteData('settings', 'turso');
    const current = typeof currentData === 'string' ? JSON.parse(currentData) : (currentData || {});

    const connected = current.supabaseConnected !== false; // Default true
    const lastUpdated = current.supabaseConnectedLastUpdated || null;

    return NextResponse.json({ connected, lastUpdated });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to read Supabase connection state', details: error.message },
      { status: 500 }
    );
  }
}

// POST: Toggle the Supabase connection setting
export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { connected } = await request.json();
    if (typeof connected !== 'boolean') {
      return NextResponse.json({ error: 'connected must be boolean' }, { status: 400 });
    }

    // Read current settings, merge supabaseConnected, write back
    const currentData = await getSiteData('settings', 'turso');
    const current = typeof currentData === 'string' ? JSON.parse(currentData) : (currentData || {});
    current.supabaseConnected = connected;
    current.supabaseConnectedLastUpdated = new Date().toISOString();

    await setSiteData('settings', current);

    // Clear the in-memory cache so API routes pick up the change immediately
    clearSupabaseConnectionCache();

    return NextResponse.json({
      success: true,
      supabaseConnected: connected,
      lastUpdated: current.supabaseConnectedLastUpdated,
    });
  } catch (error) {
    console.error('Supabase toggle error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
