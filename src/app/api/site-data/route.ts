import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { getAllSiteData, getSiteDataVersion, isTursoReadEnabled, readBakedDataAsync } from '@/lib/turso';

export const dynamic = 'force-dynamic';

// Cache settings for different modes
const CACHE_STATIC = 'public, max-age=0, s-maxage=60, stale-while-revalidate=120';
const CACHE_PREVIEW = 'no-store, no-cache, must-revalidate';

/**
 * Normalize preloader data: ensure both snake_case and camelCase keys exist.
 * Data may be stored in either format depending on which code path saved it.
 */
function normalizePreloader(raw: Record<string, unknown>): Record<string, unknown> {
  const get = (snakeKey: string, camelKey: string) => raw[snakeKey] ?? raw[camelKey] ?? undefined;

  const result: Record<string, unknown> = { ...raw };

  const mappings: Array<[string, string]> = [
    ['background_color', 'backgroundColor'],
    ['primary_color', 'primaryColor'],
    ['secondary_color', 'secondaryColor'],
    ['tertiary_color', 'tertiaryColor'],
    ['text_color', 'textColor'],
    ['bar_color', 'barColor'],
  ];

  for (const [snake, camel] of mappings) {
    const value = get(snake, camel);
    if (value !== undefined) {
      result[snake] = value;
      result[camel] = value;
    }
  }

  if (result.duration === undefined) result.duration = 16;

  // Normalize sentences
  if (result.sentences && Array.isArray(result.sentences)) {
    result.sentences = result.sentences.map((s: unknown) =>
      typeof s === 'string' ? { text: s } : s
    );
  }

  return result;
}

/**
 * Normalize nav items: handle visible / isVisible / is_visible variants.
 */
function normalizeNavItems(items: unknown[]): unknown[] {
  if (!Array.isArray(items)) return [];
  return items.map((item: any) => {
    const visible = item.isVisible ?? item.is_visible ?? item.visible ?? true;
    const external = item.isExternal ?? item.is_external ?? false;
    return {
      ...item,
      is_visible: visible,
      isVisible: visible,
      visible: visible,
      is_external: external,
      isExternal: external,
    };
  });
}

/**
 * Build the normalized API response from raw Turso/local data.
 */
function buildNormalizedResponse(data: Record<string, any>, source: string) {
  const version = data._meta?.version;
  const preloader = normalizePreloader(data.preloader || data.preloaderSettings || {});
  const navItems = normalizeNavItems(data.nav_items || data.navItems || []);

  return {
    _meta: { source, timestamp: new Date().toISOString(), version },
    sections: data.sections || [],
    settings: data.settings || {},
    preloaderSettings: preloader,
    pages: data.pages || {},
    navItems: navItems,
    media: data.media || [],
    pollConfig: data.poll_config || data.pollConfig || { pollInterval: 10000, jitterMax: 3000 },
  };
}

/**
 * Empty response when all data sources fail.
 */
function emptyResponse() {
  return {
    _meta: { source: 'empty', timestamp: new Date().toISOString(), version: 'none' },
    sections: [],
    settings: {},
    preloaderSettings: {},
    pages: {},
    navItems: [],
    media: [],
    pollConfig: { pollInterval: 10000, jitterMax: 3000 },
  };
}

export async function GET(request: NextRequest) {
  const source = request.nextUrl.searchParams.get('source');
  const isPreview = source === 'preview';
  
  // Preview mode: always from Turso (for admin preview)
  if (isPreview) {
    try {
      const [data, version] = await Promise.all([
        getAllSiteData('turso'),
        getSiteDataVersion()
      ]);
      
      const response = buildNormalizedResponse(data, 'turso');
      response._meta.version = version;

      return NextResponse.json(response, {
        headers: {
          'Cache-Control': CACHE_PREVIEW,
          'X-Data-Source': 'turso',
          'X-Data-Version': version
        }
      });
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Failed to load from Turso', details: error.message },
        { status: 500, headers: { 'Cache-Control': CACHE_PREVIEW } }
      );
    }
  }
  
  // Default mode: check Turso Read toggle
  const tursoReadOn = await isTursoReadEnabled();

  if (tursoReadOn) {
    // Turso Read enabled: try static file first, fallback to Turso
    try {
      const staticPath = join(process.cwd(), 'public', 'data', 'site-data.json');
      const fileContent = await readFile(staticPath, 'utf-8');
      const data = JSON.parse(fileContent);
      
      return NextResponse.json(data, {
        headers: {
          'Cache-Control': CACHE_STATIC,
          'X-Data-Source': 'static-file',
          'X-Data-Version': data._meta?.version || 'unknown'
        }
      });
    } catch {
      // Static file not available, fallback to Turso
      try {
        const [data, version] = await Promise.all([
          getAllSiteData('turso'),
          getSiteDataVersion()
        ]);
        
        const response = buildNormalizedResponse(data, 'turso-fallback');
        response._meta.version = version;

        return NextResponse.json(response, {
          headers: {
            'Cache-Control': CACHE_STATIC,
            'X-Data-Source': 'turso-fallback',
            'X-Data-Version': version
          }
        });
      } catch (error: any) {
        return NextResponse.json(emptyResponse(), {
          headers: { 'Cache-Control': 'no-store' }
        });
      }
    }
  } else {
    // Turso Read disabled: read from baked data files
    try {
      const bakedData = await readBakedDataAsync();
      const response = buildNormalizedResponse(bakedData, 'baked');
      return NextResponse.json(response, {
        headers: {
          'Cache-Control': CACHE_STATIC,
          'X-Data-Source': 'baked',
        }
      });
    } catch {
      // Baked data read failed, try static file as fallback
      try {
        const staticPath = join(process.cwd(), 'public', 'data', 'site-data.json');
        const fileContent = await readFile(staticPath, 'utf-8');
        const data = JSON.parse(fileContent);
        
        return NextResponse.json(data, {
          headers: {
            'Cache-Control': CACHE_STATIC,
            'X-Data-Source': 'static-file-fallback',
            'X-Data-Version': data._meta?.version || 'unknown'
          }
        });
      } catch {
        // Everything failed — return empty response
        return NextResponse.json(emptyResponse(), {
          headers: { 'Cache-Control': 'no-store' }
        });
      }
    }
  }
}
