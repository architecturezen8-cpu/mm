import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { getEnv } from '@/lib/cf-env';

/**
 * GitHub Images API
 *
 * Lists ALL image files from the configured GitHub repository path
 * using the GitHub Contents API / Git Trees API.
 * Reads config from data/github-config.json (no DB dependency).
 */

const GITHUB_API_BASE = 'https://api.github.com';
const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']);

function getGithubConfig() {
  // Read from data/github-config.json (primary source for token)
  let config: Record<string, string> = {};
  try {
    const configFile = join(process.cwd(), 'data', 'github-config.json');
    if (existsSync(configFile)) {
      config = JSON.parse(readFileSync(configFile, 'utf-8'));
    }
  } catch {}

  // Fallback to environment variables
  return {
    token: config.githubToken || getEnv('GITHUB_TOKEN') || '',
    owner: config.githubRepoOwner || config.repoOwner || getEnv('GITHUB_REPO_OWNER') || 'architecturezen8-cpu',
    repo: config.githubRepoName || config.repoName || getEnv('GITHUB_REPO_NAME') || 'thomians-media-cms',
    path: config.githubRepoPath || config.repoPath || getEnv('GITHUB_REPO_PATH') || 'battle-of-the-golds',
  };
}

interface GitHubImageItem {
  name: string;
  path: string;
  url: string;
  cdnUrl: string;
  size: number;
  type: 'image';
}

/**
 * Fetch ALL image files from a GitHub repo using the Git Trees API.
 * Scans the ENTIRE repository to find all images.
 */
async function fetchAllImages(
  owner: string,
  repo: string,
  _dirPath: string,
  token: string
): Promise<GitHubImageItem[]> {
  const repoUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}`;
  const headers: Record<string, string> = {
    'User-Agent': 'BOTG-CMS',
    'Accept': 'application/vnd.github.v3+json',
  };
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  try {
    // Get repo info to find default branch
    const repoRes = await fetch(repoUrl, { headers });
    if (!repoRes.ok) {
      console.error(`GitHub repo API error: ${repoRes.status}`);
      return [];
    }
    const repoData = await repoRes.json();
    const branch = repoData.default_branch || 'main';

    // Use the Git Trees API with recursive=1 to get ALL files at once
    const treeUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
    const treeRes = await fetch(treeUrl, { headers });

    if (!treeRes.ok) {
      console.error(`GitHub tree API error: ${treeRes.status}`);
      return fetchImagesRecursively(owner, repo, _dirPath, token, 0);
    }

    const treeData = await treeRes.json();
    const images: GitHubImageItem[] = [];

    for (const item of treeData.tree || []) {
      if (item.type !== 'blob') continue;
      const ext = item.path.split('.').pop()?.toLowerCase() || '';
      if (IMAGE_EXTENSIONS.has(ext)) {
        const relativePath = item.path;
        const cdnUrl = `https://cdn.jsdelivr.net/gh/${owner}/${repo}/${relativePath}`;
        const name = item.path.split('/').pop() || item.path;
        images.push({
          name,
          path: relativePath,
          url: cdnUrl,
          cdnUrl,
          size: item.size || 0,
          type: 'image',
        });
      }
    }

    return images;
  } catch (err) {
    console.error('Failed to fetch GitHub tree:', err);
    return fetchImagesRecursively(owner, repo, _dirPath, token, 0);
  }
}

/**
 * Recursively fetch image files from a GitHub repo path (fallback method)
 */
async function fetchImagesRecursively(
  owner: string,
  repo: string,
  dirPath: string,
  token: string,
  depth: number = 0
): Promise<GitHubImageItem[]> {
  if (depth > 10) return [];

  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${dirPath}`;
  const reqHeaders: Record<string, string> = {
    'User-Agent': 'BOTG-CMS',
    'Accept': 'application/vnd.github.v3+json',
  };
  if (token) {
    reqHeaders['Authorization'] = `token ${token}`;
  }

  try {
    const res = await fetch(url, { headers: reqHeaders });
    if (!res.ok) {
      console.error(`GitHub API error for ${dirPath}: ${res.status}`);
      return [];
    }

    const contents = await res.json() as Array<{ name: string; path: string; size: number; type: 'file' | 'dir' }>;
    const images: GitHubImageItem[] = [];

    for (const item of contents) {
      if (item.type === 'file') {
        const ext = item.name.split('.').pop()?.toLowerCase() || '';
        if (IMAGE_EXTENSIONS.has(ext)) {
          const relativePath = item.path;
          const cdnUrl = `https://cdn.jsdelivr.net/gh/${owner}/${repo}/${relativePath}`;
          images.push({
            name: item.name,
            path: relativePath,
            url: cdnUrl,
            cdnUrl,
            size: item.size,
            type: 'image',
          });
        }
      } else if (item.type === 'dir') {
        const subImages = await fetchImagesRecursively(owner, repo, item.path, token, depth + 1);
        images.push(...subImages);
      }
    }

    return images;
  } catch (err) {
    console.error(`Failed to fetch GitHub contents for ${dirPath}:`, err);
    return [];
  }
}

/**
 * GET - List ALL images from the GitHub repository
 */
export async function GET(req: NextRequest) {
  const config = getGithubConfig();

  if (!config.token) {
    return NextResponse.json(
      { error: 'GitHub token not configured. Set GITHUB_TOKEN in .env or configure via admin panel (Settings → GitHub CDN).' },
      { status: 400 }
    );
  }

  try {
    const images = await fetchAllImages(
      config.owner,
      config.repo,
      config.path,
      config.token
    );

    images.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({
      images,
      total: images.length,
      config: {
        owner: config.owner,
        repo: config.repo,
        path: config.path,
      },
    });
  } catch (err) {
    console.error('GitHub images fetch error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch GitHub images' },
      { status: 500 }
    );
  }
}
