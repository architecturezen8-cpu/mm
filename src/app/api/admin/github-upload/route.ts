import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/cf-env';

/**
 * GitHub CDN Upload API (Cloudflare Workers compatible)
 *
 * Uploads files to a GitHub repository via the GitHub Contents API,
 * then returns the jsDelivr CDN URL for the uploaded file.
 *
 * Format: https://cdn.jsdelivr.net/gh/{owner}/{repo}/{path}
 *
 * All metadata persistence uses D1 baked_data (no filesystem).
 * GitHub config is read from D1 baked_data keys:
 *   - 'github-config'  (saved from admin panel)
 *   - 'settings-github' (legacy fallback)
 *
 * Environment variables (fallback):
 * - GITHUB_TOKEN: Personal access token with repo write permissions
 * - GITHUB_REPO_OWNER: GitHub username/org (default: architecturezen8-cpu)
 * - GITHUB_REPO_NAME: Repository name (default: thomians-media-cms)
 * - GITHUB_REPO_PATH: Path within repo (default: uploads)
 */

const GITHUB_API_BASE = 'https://api.github.com';

// ─── GitHub Config (D1-backed) ─────────────────────────────────────

async function getGithubConfig() {
  const { d1GetBakedData } = await import('@/lib/d1');
  let config: Record<string, string> = (await d1GetBakedData('github-config')) || {};
  let savedSettings: Record<string, string> = (await d1GetBakedData('settings-github')) || {};

  return {
    token: config.githubToken || savedSettings.githubToken || getEnv('GITHUB_TOKEN') || '',
    owner: config.githubRepoOwner || savedSettings.githubRepoOwner || getEnv('GITHUB_REPO_OWNER') || 'architecturezen8-cpu',
    repo: config.githubRepoName || savedSettings.githubRepoName || getEnv('GITHUB_REPO_NAME') || 'thomians-media-cms',
    path: config.githubRepoPath || savedSettings.githubRepoPath || getEnv('GITHUB_REPO_PATH') || 'uploads',
  };
}

// ─── Media Metadata (D1-backed) ────────────────────────────────────

interface MediaItem {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  cdnUrl: string;
  type: 'image' | 'video';
  size?: number;
  alt_text?: string;
  uploaded_by?: string;
  uploaded_at: string;
  github_sha?: string;
}

async function loadMedia(): Promise<MediaItem[]> {
  try {
    const { d1GetBakedData } = await import('@/lib/d1');
    const data = await d1GetBakedData<MediaItem[]>('media');
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function saveMedia(media: MediaItem[]): Promise<void> {
  try {
    const { d1SetBakedData } = await import('@/lib/d1');
    await d1SetBakedData('media', media);
  } catch (err) {
    console.error('Failed to save media:', err);
  }
}

// ─── GitHub Upload Logic (Edge-safe fetch) ─────────────────────────

/**
 * Upload a file to GitHub via the Contents API
 */
async function uploadToGithub(
  fileName: string,
  content: Buffer,
  config: Awaited<ReturnType<typeof getGithubConfig>>
): Promise<{ sha: string; cdnUrl: string }> {
  const githubPath = `${config.path}/${fileName}`;
  const url = `${GITHUB_API_BASE}/repos/${config.owner}/${config.repo}/contents/${githubPath}`;

  // Check if file already exists (to get its SHA for update)
  let existingSha: string | null = null;
  try {
    const checkRes = await fetch(url, {
      headers: {
        Authorization: `token ${config.token}`,
        'User-Agent': 'BOTG-CMS',
      },
    });
    if (checkRes.ok) {
      const data = await checkRes.json();
      existingSha = data.sha;
    }
  } catch {
    // File doesn't exist yet, that's fine
  }

  // Upload (create or update)
  const body: Record<string, unknown> = {
    message: `Upload ${fileName} via BOTG CMS`,
    content: content.toString('base64'),
    branch: 'main',
  };
  if (existingSha) {
    body.sha = existingSha;
  }

  const uploadRes = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `token ${config.token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'BOTG-CMS',
    },
    body: JSON.stringify(body),
  });

  if (!uploadRes.ok) {
    const errorText = await uploadRes.text();
    console.error('GitHub upload error:', errorText);
    throw new Error(`GitHub upload failed: ${uploadRes.status} ${errorText}`);
  }

  const uploadData = await uploadRes.json();
  const cdnUrl = `https://cdn.jsdelivr.net/gh/${config.owner}/${config.repo}/${githubPath}`;

  return {
    sha: uploadData.content.sha,
    cdnUrl,
  };
}

// ─── API Handlers ──────────────────────────────────────────────────

/**
 * POST - Upload file to GitHub and return CDN URL
 */
export async function POST(req: NextRequest) {
  const config = await getGithubConfig();

  if (!config.token) {
    return NextResponse.json(
      { error: 'GitHub token not configured. Set GITHUB_TOKEN environment variable.' },
      { status: 500 }
    );
  }

  try {
    const form = await req.formData();
    const file = form.get('file') as File;
    const altText = form.get('alt_text') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Generate a clean filename
    const timestamp = Date.now();
    const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${timestamp}-${sanitized}`;

    // Read file content
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to GitHub
    const { sha, cdnUrl } = await uploadToGithub(fileName, buffer, config);

    // Load current media from D1
    const mediaStore = await loadMedia();
    const mediaCounter = mediaStore.length > 0
      ? Math.max(...mediaStore.map(m => parseInt(m.id.replace('media-', '')) || 0))
      : 0;

    // Create new media item
    const id = `media-${mediaCounter + 1}`;
    const mediaItem: MediaItem = {
      id,
      filename: fileName,
      originalName: file.name,
      url: cdnUrl,
      cdnUrl,
      type: file.type.startsWith('video') ? 'video' : 'image',
      size: file.size,
      alt_text: altText || undefined,
      uploaded_at: new Date().toISOString(),
      github_sha: sha,
    };

    mediaStore.push(mediaItem);
    await saveMedia(mediaStore);

    return NextResponse.json(mediaItem);
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 }
    );
  }
}

/**
 * GET - List all media files with CDN URLs
 * Always reads from D1 to ensure fresh data
 */
export async function GET() {
  const freshMedia = await loadMedia();
  return NextResponse.json(freshMedia);
}

/**
 * DELETE - Remove a media item from the store
 * (Note: This doesn't delete from GitHub - that would require the SHA)
 */
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const mediaStore = await loadMedia();
  const index = mediaStore.findIndex(m => m.id === id);
  if (index !== -1) {
    mediaStore.splice(index, 1);
    await saveMedia(mediaStore);
  }

  return NextResponse.json({ success: true });
}
