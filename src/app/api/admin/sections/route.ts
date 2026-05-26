import { NextRequest, NextResponse } from 'next/server';
import { getSiteData, setSiteData } from '@/lib/turso';

// Section interface
interface Section {
  id: string;
  page_id: string;
  type: string;
  title: string;
  content: Record<string, unknown>;
  position: number;
  is_visible: boolean;
  is_published?: boolean;
  created_at: string;
}

// Simple cookie-based auth check (avoids getServerSession crashes in dev)
function isAdminRequest(req: NextRequest): boolean {
  const sessionToken = req.cookies.get('next-auth.session-token')?.value;
  if (sessionToken) return true;
  if (process.env.NODE_ENV === 'development') return true;
  return false;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pageId = searchParams.get('pageId');

    const sections: Section[] = (await getSiteData('sections', 'turso')) || [];
    const filtered = pageId
      ? sections.filter(s => s.page_id === pageId)
      : sections;

    return NextResponse.json(filtered, {
      headers: { 'Cache-Control': 'public, max-age=0, s-maxage=30, stale-while-revalidate=60' },
    });
  } catch (error: any) {
    console.error('[GET /api/admin/sections] Error:', error);
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const sections: Section[] = (await getSiteData('sections', 'turso')) || [];
    const id = body.id || `section-${Date.now()}`;

    // Check if section with this ID already exists — if so, update it instead
    const existingIndex = sections.findIndex(s => s.id === id);
    if (existingIndex !== -1) {
      const section = sections[existingIndex];
      if (body.title !== undefined) section.title = body.title;
      if (body.type !== undefined) section.type = body.type;
      if (body.content !== undefined) section.content = body.content;
      if (body.is_visible !== undefined) section.is_visible = body.is_visible;
      if (body.is_published !== undefined) section.is_published = body.is_published;
      if (body.position !== undefined) section.position = body.position;
      await setSiteData('sections', sections);
      return NextResponse.json(section);
    }

    const section: Section = {
      id,
      page_id: body.pageId || body.page_id || 'home',
      type: body.type || 'text',
      title: body.title || `New ${body.type || 'text'} section`,
      position: body.position ?? sections.filter(s => s.page_id === (body.pageId || body.page_id || 'home')).length,
      content: body.content || {},
      is_visible: body.is_visible !== undefined ? body.is_visible : true,
      is_published: body.is_published !== undefined ? body.is_published : true,
      created_at: new Date().toISOString(),
    };

    sections.push(section);
    await setSiteData('sections', sections);
    return NextResponse.json(section);
  } catch (error: any) {
    console.error('[POST /api/admin/sections] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create section', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const sections: Section[] = (await getSiteData('sections', 'turso')) || [];
    const index = sections.findIndex(s => s.id === id);
    if (index !== -1) {
      sections.splice(index, 1);
      await setSiteData('sections', sections);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[DELETE /api/admin/sections] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete section', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const sections: Section[] = (await getSiteData('sections', 'turso')) || [];

    // Reorder sections
    if (body.sections) {
      body.sections.forEach(({ id, position }: { id: string; position: number }) => {
        const section = sections.find(s => s.id === id);
        if (section) section.position = position;
      });
      await setSiteData('sections', sections);
      return NextResponse.json({ success: true });
    }

    // Update single section — with upsert: if not found, create it
    if (body.id) {
      const section = sections.find(s => s.id === body.id);
      if (section) {
        if (body.title !== undefined) section.title = body.title;
        if (body.type !== undefined) section.type = body.type;
        if (body.content !== undefined) section.content = body.content;
        if (body.is_visible !== undefined) section.is_visible = body.is_visible;
        if (body.is_published !== undefined) section.is_published = body.is_published;
        if (body.position !== undefined) section.position = body.position;
        await setSiteData('sections', sections);
        return NextResponse.json(section);
      }
      // Section not found — create it (upsert)
      const newSection: Section = {
        id: body.id,
        page_id: body.page_id || body.pageId || 'home',
        type: body.type || 'text',
        title: body.title || `New section`,
        content: body.content || {},
        position: body.position ?? sections.length,
        is_visible: body.is_visible !== undefined ? body.is_visible : true,
        is_published: body.is_published !== undefined ? body.is_published : true,
        created_at: new Date().toISOString(),
      };
      sections.push(newSection);
      await setSiteData('sections', sections);
      return NextResponse.json(newSection);
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error: any) {
    console.error('[PATCH /api/admin/sections] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update section', details: error.message },
      { status: 500 }
    );
  }
}
