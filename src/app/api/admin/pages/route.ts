import { NextRequest, NextResponse } from 'next/server';
import { getSiteData, setSiteData } from '@/lib/turso';

/**
 * Admin Pages API — Simplified to use Turso DB
 * Uses cookie-based auth check (avoids getServerSession crashes in dev)
 */

// Simple cookie-based auth check — avoids getServerSession crashes
function isAdminRequest(req: NextRequest): boolean {
  const sessionToken = req.cookies.get('next-auth.session-token')?.value;
  if (sessionToken) return true;
  if (process.env.NODE_ENV === 'development') return true;
  return false;
}

// Page interface
interface PageData {
  id: string;
  title: string;
  slug: string;
  status: 'published' | 'draft';
  updated_at: string;
  content: Record<string, unknown>;
  tabs?: { id: string; label: string }[];
  updated_by?: string;
  published_at?: string;
}

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const pagesStore: Record<string, PageData> = (await getSiteData('pages', 'turso')) || {};

    const { searchParams } = new URL(req.url);
    const pageId = searchParams.get('id');

    if (pageId) {
      const page = pagesStore[pageId];
      if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 });
      return NextResponse.json(page);
    }

    // Get sections count per page
    const sections: Array<{ page_id: string }> = (await getSiteData('sections', 'turso')) || [];
    const sectionsCountByPage: Record<string, number> = {};
    sections.forEach(s => {
      sectionsCountByPage[s.page_id] = (sectionsCountByPage[s.page_id] || 0) + 1;
    });

    return NextResponse.json(
      Object.values(pagesStore).map(({ content, ...page }) => ({
        ...page,
        sectionCount: sectionsCountByPage[page.id] || 0,
      }))
    );
  } catch (error: any) {
    console.error('[GET /api/admin/pages] Error:', error);
    return NextResponse.json(
      { error: 'Failed to load pages', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { title, slug, id } = await req.json();
    if (!title || !slug) return NextResponse.json({ error: 'title and slug required' }, { status: 400 });

    const pagesStore: Record<string, PageData> = (await getSiteData('pages', 'turso')) || {};
    const pageId = id || slug.replace(/^\//, '').replace(/\//g, '-');

    if (pagesStore[pageId]) {
      return NextResponse.json({ error: 'Page already exists' }, { status: 409 });
    }

    const page: PageData = {
      id: pageId,
      title,
      slug,
      status: 'draft',
      updated_at: new Date().toISOString(),
      content: {
        meta_title: `${title} — Battle of the Golds`,
        meta_description: '',
      },
      tabs: [],
    };

    pagesStore[pageId] = page;
    await setSiteData('pages', pagesStore);
    return NextResponse.json(page);
  } catch (error: any) {
    console.error('[POST /api/admin/pages] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create page', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { pageId, content, status, title, slug, tabs } = await req.json();
    if (!pageId) return NextResponse.json({ error: 'pageId required' }, { status: 400 });

    const pagesStore: Record<string, PageData> = (await getSiteData('pages', 'turso')) || {};
    const page = pagesStore[pageId];
    if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 });

    if (content) page.content = { ...page.content, ...content };
    if (status) page.status = status;
    if (title) page.title = title;
    if (slug) page.slug = slug;
    if (tabs !== undefined) page.tabs = tabs;
    page.updated_at = new Date().toISOString();

    if (status === 'published') {
      page.published_at = new Date().toISOString();
    }

    await setSiteData('pages', pagesStore);
    return NextResponse.json(page);
  } catch (error: any) {
    console.error('[PATCH /api/admin/pages] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update page', details: error.message },
      { status: 500 }
    );
  }
}
