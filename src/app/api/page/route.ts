import { NextRequest, NextResponse } from 'next/server';
import { getSiteData } from '@/lib/turso';

// GET — Public, no auth required. Returns basic page info for dynamic routing.
// Used by the [slug] page to check if a custom page exists.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  const id = searchParams.get('id');

  const identifier = id || slug;

  if (!identifier) {
    return NextResponse.json({ error: 'slug or id parameter required' }, { status: 400 });
  }

  try {
    const pagesStore: Record<string, Record<string, unknown>> = (await getSiteData('pages')) || {};

    // Try to find by ID first, then by slug
    let page = pagesStore[identifier];
    if (!page) {
      // Clean the slug (remove leading slash)
      const cleanSlug = identifier.startsWith('/') ? identifier : `/${identifier}`;
      page = Object.values(pagesStore).find((p) => p.slug === cleanSlug);
    }

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Only return published pages to non-authenticated users
    if (page.status === 'draft') {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: page.id,
      title: page.title,
      slug: page.slug,
      status: page.status,
    }, {
      headers: { 'Cache-Control': 'public, max-age=0, s-maxage=30, stale-while-revalidate=60' },
    });
  } catch (err) {
    console.error('Turso page lookup failed:', err);
    return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  }
}
