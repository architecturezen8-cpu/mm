import { NextResponse } from 'next/server';
import { getSiteData } from '@/lib/turso';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { getEnv } from '@/lib/cf-env';

/**
 * Public Media API — Simplified to use Turso DB
 * Returns all media items including both local uploads and GitHub-hosted images.
 */

const GITHUB_API_BASE = 'https://api.github.com';
const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']);

function getGithubConfig() {
  let config: Record<string, string> = {};
  try {
    const configFile = join(process.cwd(), 'data', 'github-config.json');
    if (existsSync(configFile)) {
      config = JSON.parse(readFileSync(configFile, 'utf-8'));
    }
  } catch {}

  return {
    token: config.githubToken || getEnv('GITHUB_TOKEN') || '',
    owner: config.githubRepoOwner || getEnv('GITHUB_REPO_OWNER') || 'architecturezen8-cpu',
    repo: config.githubRepoName || getEnv('GITHUB_REPO_NAME') || 'thomians-media-cms',
    path: config.githubRepoPath || getEnv('GITHUB_REPO_PATH') || 'battle-of-the-golds',
  };
}

interface GitHubContentItem {
  name: string;
  path: string;
  size: number;
  type: 'file' | 'dir';
}

async function fetchImagesRecursively(
  owner: string,
  repo: string,
  dirPath: string,
  token: string,
  depth: number = 0
): Promise<Array<{ name: string; path: string; cdnUrl: string; size: number }>> {
  if (depth > 10) return [];

  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${dirPath}`;
  const headers: Record<string, string> = { 'User-Agent': 'BOTG-CMS' };
  if (token) headers['Authorization'] = `token ${token}`;

  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return [];

    const contents = (await res.json()) as GitHubContentItem[];
    const images: Array<{ name: string; path: string; cdnUrl: string; size: number }> = [];

    for (const item of contents) {
      if (item.type === 'file') {
        const ext = item.name.split('.').pop()?.toLowerCase() || '';
        if (IMAGE_EXTENSIONS.has(ext)) {
          const cdnUrl = `https://cdn.jsdelivr.net/gh/${owner}/${repo}/${item.path}`;
          images.push({ name: item.name, path: item.path, cdnUrl, size: item.size });
        }
      } else if (item.type === 'dir') {
        const subImages = await fetchImagesRecursively(owner, repo, item.path, token, depth + 1);
        images.push(...subImages);
      }
    }
    return images;
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    // Get local media items from Turso
    const mediaStore: Array<Record<string, unknown>> = (await getSiteData('media')) || [];

    const localResults = mediaStore.map((item) => ({
      id: item.id,
      url: item.url,
      filename: item.filename,
      type: item.type || 'image',
      source: item.source || 'local',
      github_path: item.github_path || null,
      uploaded_at: item.uploaded_at || item.uploaded_at || new Date().toISOString(),
    }));

    // Try to fetch GitHub images
    const config = getGithubConfig();
    let githubResults: Array<{
      id: string;
      url: string;
      filename: string;
      type: string;
      source: string;
      github_path: string | null;
      uploaded_at: string;
    }> = [];

    if (config.token) {
      try {
        const ghImages = await fetchImagesRecursively(config.owner, config.repo, config.path, config.token);
        const trackedUrls = new Set(mediaStore.map(m => m.url as string));

        githubResults = ghImages
          .filter(img => !trackedUrls.has(img.cdnUrl))
          .map(img => ({
            id: `gh-${img.path}`,
            url: img.cdnUrl,
            filename: img.name,
            type: 'image',
            source: 'github',
            github_path: img.path,
            uploaded_at: new Date().toISOString(),
          }));
      } catch (err) {
        console.error('Failed to fetch GitHub images for public API:', err);
      }
    }

    return NextResponse.json([...githubResults, ...localResults], {
      headers: { 'Cache-Control': 'public, max-age=0, s-maxage=30, stale-while-revalidate=60' },
    });
  } catch (err) {
    console.error('Turso media load failed:', err);
    return NextResponse.json([], {
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}
