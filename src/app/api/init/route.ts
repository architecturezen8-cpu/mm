import { NextResponse } from 'next/server';
import { ensureDatabaseReady } from '@/lib/db-init';

/**
 * GET /api/init
 *
 * Initializes the database if needed. Called on app startup.
 * Safe to call multiple times — uses a singleton flag.
 */
export async function GET() {
  try {
    await ensureDatabaseReady();
    return NextResponse.json({ status: 'ok' });
  } catch (err) {
    console.error('[/api/init] Error:', err);
    // Still return ok — file fallbacks should keep the app working
    return NextResponse.json({ status: 'degraded', error: 'Database unavailable, using file fallback' });
  }
}
