import { NextRequest, NextResponse } from 'next/server';
import { getSiteData, setSiteData } from '@/lib/turso';

export const dynamic = 'force-dynamic';

/**
 * Normalize preloader settings to include BOTH snake_case and camelCase keys.
 * This ensures compatibility regardless of how the data was originally stored.
 * - Frontend Preloader component uses snake_case (background_color, primary_color, etc.)
 * - Admin settings page interface uses snake_case
 * - But data in Turso might be in camelCase (from earlier versions or different code paths)
 */
function normalizePreloaderSettings(raw: Record<string, unknown>): Record<string, unknown> {
  const get = (snakeKey: string, camelKey: string) => {
    return raw[snakeKey] ?? raw[camelKey] ?? undefined;
  };

  const result: Record<string, unknown> = { ...raw };

  // Ensure BOTH formats exist for every color/duration key
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

  // Normalize duration (no naming conflict, but ensure it exists)
  if (result.duration === undefined) {
    result.duration = 16;
  }

  // Normalize sentences
  if (result.sentences && Array.isArray(result.sentences)) {
    result.sentences = result.sentences.map((s: unknown) =>
      typeof s === 'string' ? { text: s } : s
    );
  }

  return result;
}

// GET - Load preloader settings (normalized to include both formats)
export async function GET() {
  try {
    const settings = (await getSiteData('preloader', 'turso')) || {};
    const normalized = normalizePreloaderSettings(settings);
    return NextResponse.json(normalized, {
      headers: { 'Cache-Control': 'public, max-age=0, s-maxage=30, stale-while-revalidate=60' },
    });
  } catch (error: any) {
    console.error('[GET /api/admin/preloader-settings] Error:', error);
    return NextResponse.json({}, {
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}

// POST - Save preloader settings (normalized to include both formats before saving)
export async function POST(req: NextRequest) {
  try {
    const settings = await req.json();
    // Normalize: ensure BOTH snake_case and camelCase keys are saved to Turso
    const normalized = normalizePreloaderSettings(settings);
    await setSiteData('preloader', normalized);
    return NextResponse.json({ success: true, data: normalized });
  } catch (error: any) {
    console.error('[POST /api/admin/preloader-settings] Error:', error);
    return NextResponse.json(
      { error: 'Failed to save preloader settings', details: error.message },
      { status: 500 }
    );
  }
}
