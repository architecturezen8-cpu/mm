import { NextResponse } from 'next/server';
import { getSiteData } from '@/lib/turso';

export const dynamic = 'force-dynamic';

/**
 * Public Preloader Settings API
 * ALWAYS reads from Turso directly — preloader settings must be fresh
 * so admin changes are immediately visible to visitors.
 * Falls back to local/baked data only if Turso is unreachable.
 */

const DEFAULTS: Record<string, unknown> = {
  sentences: [
    { text: 'Visualizing Thomian Excellence' },
    { text: 'Capturing the Peak Performance' },
    { text: 'Amplifying Thomian Voices' },
    { text: 'Broadcasting the Gold Fever' },
  ],
  primaryColor: '#FFC300',
  secondaryColor: '#F0EDE6',
  tertiaryColor: '#E63946',
  backgroundColor: '#020204',
  duration: 16,
  textColor: '#8A8780',
  barColor: '#FFFFFF',
};

function formatPreloaderSettings(data: Record<string, unknown>) {
  const getVal = (snake: string, camel: string) => data[snake] ?? data[camel];
  return {
    ...data,
    // Ensure BOTH snake_case and camelCase keys exist for compatibility
    primary_color: getVal('primary_color', 'primaryColor') || '#FFC300',
    primaryColor: getVal('primary_color', 'primaryColor') || '#FFC300',
    secondary_color: getVal('secondary_color', 'secondaryColor') || '#F0EDE6',
    secondaryColor: getVal('secondary_color', 'secondaryColor') || '#F0EDE6',
    tertiary_color: getVal('tertiary_color', 'tertiaryColor') || '#E63946',
    tertiaryColor: getVal('tertiary_color', 'tertiaryColor') || '#E63946',
    background_color: getVal('background_color', 'backgroundColor') || '#020204',
    backgroundColor: getVal('background_color', 'backgroundColor') || '#020204',
    text_color: getVal('text_color', 'textColor') || '#8A8780',
    textColor: getVal('text_color', 'textColor') || '#8A8780',
    bar_color: getVal('bar_color', 'barColor') || '#FFFFFF',
    barColor: getVal('bar_color', 'barColor') || '#FFFFFF',
    duration: data.duration || 16,
  };
}

// GET — Return preloader settings (respects Turso Read toggle)
export async function GET() {
  try {
    // 'auto' mode: respects turso_read_enabled toggle
    // ON → reads from Turso, OFF → reads from baked data
    const settings = (await getSiteData('preloader')) || {};
    const result = { ...DEFAULTS, ...settings };
    return NextResponse.json(formatPreloaderSettings(result), {
      headers: { 'Cache-Control': 'public, max-age=0, s-maxage=30, stale-while-revalidate=60' },
    });
  } catch (err) {
    console.error('Preloader settings load failed:', err);
    return NextResponse.json(formatPreloaderSettings(DEFAULTS), {
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}
