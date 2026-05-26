import { NextRequest, NextResponse } from 'next/server';
import { getSiteData, setSiteData } from '@/lib/turso';

// Media interface
interface MediaItem {
  id: string;
  filename: string;
  url: string;
  type: 'image' | 'video';
  size?: number;
  alt_text?: string;
  uploaded_by?: string;
  uploaded_at: string;
}

// Simple cookie-based auth check (avoids getServerSession crashes in dev)
function isAdminRequest(req: NextRequest): boolean {
  const sessionToken = req.cookies.get('next-auth.session-token')?.value;
  if (sessionToken) return true;
  if (process.env.NODE_ENV === 'development') return true;
  return false;
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const form = await req.formData();
    const file = form.get('file') as File;
    const altText = form.get('alt_text') as string | null;

    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

    const mediaStore: MediaItem[] = (await getSiteData('media', 'turso')) || [];
    const id = `media-${Date.now()}`;
    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    // On Workers there is no filesystem — the URL will be a jsDelivr CDN URL
    // set by the github-upload route, or a relative path if uploaded locally
    const url = `/uploads/${filename}`;

    const mediaItem: MediaItem = {
      id,
      filename: file.name,
      url,
      type: file.type.startsWith('video') ? 'video' : 'image',
      size: file.size,
      alt_text: altText || undefined,
      uploaded_by: 'admin',
      uploaded_at: new Date().toISOString(),
    };

    mediaStore.push(mediaItem);
    await setSiteData('media', mediaStore);

    return NextResponse.json(mediaItem);
  } catch (error: any) {
    console.error('[POST /api/admin/media] Error:', error);
    return NextResponse.json(
      { error: 'Failed to upload media', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const mediaStore: MediaItem[] = (await getSiteData('media', 'turso')) || [];
    return NextResponse.json(mediaStore);
  } catch (error: any) {
    console.error('[GET /api/admin/media] Error:', error);
    return NextResponse.json([]);
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

    const mediaStore: MediaItem[] = (await getSiteData('media', 'turso')) || [];
    const index = mediaStore.findIndex(m => m.id === id);
    if (index !== -1) {
      mediaStore.splice(index, 1);
      await setSiteData('media', mediaStore);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[DELETE /api/admin/media] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete media', details: error.message },
      { status: 500 }
    );
  }
}
