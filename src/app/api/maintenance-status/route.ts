import { NextResponse } from 'next/server';
import { isMaintenanceModeEnabled } from '@/lib/maintenance';

export const dynamic = 'force-dynamic';

/**
 * Maintenance Status API — Used by Next.js middleware
 * Returns the current maintenance mode state from Turso.
 * Lightweight endpoint with short cache TTL for quick response.
 */
export async function GET() {
  try {
    const maintenanceMode = await isMaintenanceModeEnabled();
    return NextResponse.json(
      { maintenanceMode },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch {
    return NextResponse.json(
      { maintenanceMode: false },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  }
}
