import { NextRequest, NextResponse } from 'next/server';
import { getSiteData, setSiteData } from '@/lib/turso';

/**
 * Nav Items API — Simplified to use Turso DB
 * (Previously: Prisma DB + file fallback → now Turso single source of truth)
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

// Simple cookie-based auth check
function isAdminRequest(req: NextRequest): boolean {
  const sessionToken = req.cookies.get('next-auth.session-token')?.value;
  if (sessionToken) return true;
  if (process.env.NODE_ENV === 'development') return true;
  return false;
}

// GET — Return all nav items ordered by position
export async function GET() {
  const navItems: Array<Record<string, unknown>> = (await getSiteData('nav_items', 'turso')) || [];
  const sorted = navItems
    .map(i => formatNavItem(i))
    .sort((a, b) => (a.position as number) - (b.position as number));
  return NextResponse.json(sorted, {
    headers: { 'Cache-Control': 'public, max-age=0, s-maxage=30, stale-while-revalidate=60' },
  });
}

// POST — Auth required, create new nav item
export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  if (!body.label || !body.href) {
    return NextResponse.json({ error: 'label and href required' }, { status: 400 });
  }

  const navItems: Array<Record<string, unknown>> = (await getSiteData('nav_items', 'turso')) || [];
  const newItem: Record<string, unknown> = {
    id: `nav-${Date.now()}`,
    label: body.label,
    href: body.href,
    position: body.position ?? navItems.length,
    // Store visibility in ALL 3 formats for compatibility
    isVisible: body.is_visible !== undefined ? body.is_visible : body.isVisible !== undefined ? body.isVisible : body.visible !== undefined ? body.visible : true,
    is_visible: body.is_visible !== undefined ? body.is_visible : body.isVisible !== undefined ? body.isVisible : body.visible !== undefined ? body.visible : true,
    visible: body.is_visible !== undefined ? body.is_visible : body.isVisible !== undefined ? body.isVisible : body.visible !== undefined ? body.visible : true,
    // Store external link flag in both formats
    isExternal: body.is_external !== undefined ? body.is_external : body.isExternal !== undefined ? body.isExternal : false,
    is_external: body.is_external !== undefined ? body.is_external : body.isExternal !== undefined ? body.isExternal : false,
  };

  navItems.push(newItem);
  await setSiteData('nav_items', navItems);

  return NextResponse.json(formatNavItem(newItem));
}

// PATCH — Auth required, update nav item (or batch reorder)
export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();

  // Batch reorder
  if (body.items && Array.isArray(body.items)) {
    const navItems: Array<Record<string, unknown>> = (await getSiteData('nav_items', 'turso')) || [];
    for (const entry of body.items as Array<{ id: string; position: number }>) {
      const navItem = navItems.find(i => i.id === entry.id);
      if (navItem) navItem.position = entry.position;
    }
    await setSiteData('nav_items', navItems);
    return NextResponse.json({ success: true });
  }

  // Single update
  if (body.id) {
    const navItems: Array<Record<string, unknown>> = (await getSiteData('nav_items', 'turso')) || [];
    const item = navItems.find(i => i.id === body.id);
    if (!item) return NextResponse.json({ error: 'Nav item not found' }, { status: 404 });

    if (body.label !== undefined) item.label = body.label;
    if (body.href !== undefined) item.href = body.href;
    if (body.position !== undefined) item.position = body.position;
    if (body.is_visible !== undefined) item.isVisible = body.is_visible;
    if (body.isVisible !== undefined) item.isVisible = body.isVisible;
    if (body.is_external !== undefined) item.isExternal = body.is_external;
    if (body.isExternal !== undefined) item.isExternal = body.isExternal;

    await setSiteData('nav_items', navItems);
    return NextResponse.json(formatNavItem(item));
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
}

// DELETE — Auth required, delete nav item by id
export async function DELETE(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const navItems: Array<Record<string, unknown>> = (await getSiteData('nav_items', 'turso')) || [];
  const filtered = navItems.filter(i => i.id !== id);

  if (filtered.length < navItems.length) {
    await setSiteData('nav_items', filtered);
  }

  return NextResponse.json({ success: true });
}
