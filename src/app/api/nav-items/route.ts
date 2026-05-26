import { NextResponse } from 'next/server';
import { getSiteData } from '@/lib/turso';

/**
 * Public Nav Items API — Simplified to use Turso DB
 * Returns only VISIBLE nav items for the public site.
 */

function formatNavItem(item: Record<string, unknown>) {
  // Handle all 3 naming conventions: isVisible (camelCase), is_visible (snake_case), visible (seed data)
  const visible = item.isVisible ?? item.is_visible ?? item.visible ?? true;
  const external = item.isExternal ?? item.is_external ?? false;
  return {
    id: item.id,
    label: item.label,
    href: item.href,
    position: item.position,
    is_visible: visible,
    isVisible: visible,
    visible: visible,
    is_external: external,
    isExternal: external,
  };
}

// GET — Return only VISIBLE nav items for the public site
export async function GET() {
  try {
    const navItems: Array<Record<string, unknown>> = (await getSiteData('nav_items')) || [];
    const visibleItems = navItems
      .filter(i => (i.isVisible ?? i.is_visible ?? i.visible) !== false)
      .map(i => formatNavItem(i))
      .sort((a, b) => (a.position as number) - (b.position as number));

    return NextResponse.json(visibleItems, {
      headers: { 'Cache-Control': 'public, max-age=0, s-maxage=30, stale-while-revalidate=60' },
    });
  } catch (err) {
    console.error('Turso nav items load failed:', err);
    return NextResponse.json([], {
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}
