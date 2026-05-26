import { NextRequest, NextResponse } from 'next/server';
import { getAllSiteData, getSiteDataVersion } from '@/lib/turso';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const [data, version] = await Promise.all([
      getAllSiteData('turso'),
      getSiteDataVersion()
    ]);

    const response = {
      _meta: {
        source: 'turso-preview',
        timestamp: new Date().toISOString(),
        version
      },
      sections: data.sections || [],
      settings: data.settings || {},
      preloaderSettings: data.preloader || data.preloaderSettings || {},
      pages: data.pages || {},
      navItems: data.nav_items || data.navItems || []
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Data-Source': 'turso-preview',
        'X-Data-Version': version
      }
    });
  } catch (error: any) {
    console.error('[Preview Data] Error:', error);
    // Return empty structure instead of 500 so admin UI doesn't break
    return NextResponse.json({
      _meta: {
        source: 'fallback',
        timestamp: new Date().toISOString(),
        version: 'local',
        error: error.message
      },
      sections: [],
      settings: {},
      preloaderSettings: {},
      pages: {},
      navItems: []
    }, {
      headers: {
        'Cache-Control': 'no-store',
        'X-Data-Source': 'fallback'
      }
    });
  }
}
