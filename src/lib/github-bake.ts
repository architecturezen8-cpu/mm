/**
 * GitHub Bake Push Utility
 *
 * Pushes baked data files (data/baked/*.json) to a GitHub repository.
 * When Vercel is connected to the repo, this triggers an automatic deploy.
 *
 * Uses the GitHub Git Data API for efficient batch commits.
 * All configuration comes from environment variables.
 *
 * On Cloudflare Workers, there is no filesystem, so this module
 * gracefully returns early with an informational error.
 */

import { join } from 'path';
import { BAKED_DATA_DIR } from './turso';
import { getEnv } from '@/lib/cf-env';

// ─── Configuration from .env ────────────────────────────────
const GITHUB_TOKEN = getEnv('GITHUB_CMS_TOKEN') || '';
const GITHUB_OWNER = getEnv('GITHUB_CMS_OWNER') || '';
const GITHUB_REPO = getEnv('GITHUB_CMS_REPO') || '';
const GITHUB_BRANCH = getEnv('GITHUB_CMS_BRANCH') || 'main';
const GITHUB_BAKED_PATH = getEnv('GITHUB_CMS_BAKED_PATH') || 'data/baked';

const GITHUB_API = 'https://api.github.com';

// ─── Types ──────────────────────────────────────────────────
interface GitHubRef {
  object: { sha: string; type: string };
}

interface GitHubCommit {
  sha: string;
  tree: { sha: string };
}

interface GitHubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
}

interface BakePushResult {
  success: boolean;
  commitSha?: string;
  filesPushed: number;
  error?: string;
}

// ─── GitHub API Helpers ─────────────────────────────────────
async function githubFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const url = endpoint.startsWith('http') ? endpoint : `${GITHUB_API}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'BOTG-CMS',
      ...options.headers,
    },
  });
  return response;
}

/**
 * Check if GitHub CMS integration is configured.
 */
export function isGitHubBakeConfigured(): boolean {
  return !!(GITHUB_TOKEN && GITHUB_OWNER && GITHUB_REPO);
}

/**
 * Get configuration status for admin UI display.
 */
export function getGitHubBakeConfig(): {
  configured: boolean;
  owner: string;
  repo: string;
  branch: string;
  bakedPath: string;
  hasToken: boolean;
} {
  return {
    configured: isGitHubBakeConfigured(),
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    branch: GITHUB_BRANCH,
    bakedPath: GITHUB_BAKED_PATH,
    hasToken: !!GITHUB_TOKEN,
  };
}

/**
 * Test GitHub CMS connection by fetching repo info.
 */
export async function testGitHubBakeConnection(): Promise<{
  success: boolean;
  message: string;
  repo?: string;
  branch?: string;
  defaultBranch?: string;
}> {
  if (!isGitHubBakeConfigured()) {
    return {
      success: false,
      message: 'GitHub CMS not configured. Set GITHUB_CMS_TOKEN, GITHUB_CMS_OWNER, GITHUB_CMS_REPO in .env',
    };
  }

  try {
    // Test repo access
    const repoRes = await githubFetch(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}`);
    if (!repoRes.ok) {
      if (repoRes.status === 404) {
        return { success: false, message: `Repository ${GITHUB_OWNER}/${GITHUB_REPO} not found or no access` };
      }
      return { success: false, message: `GitHub API error: ${repoRes.status}` };
    }

    const repoData = await repoRes.json();
    const defaultBranch = repoData.default_branch as string;

    // Test branch access
    const branchRes = await githubFetch(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/branches/${GITHUB_BRANCH}`);
    if (!branchRes.ok) {
      return {
        success: false,
        message: `Branch "${GITHUB_BRANCH}" not found. Default branch is "${defaultBranch}"`,
        repo: `${GITHUB_OWNER}/${GITHUB_REPO}`,
        defaultBranch,
      };
    }

    return {
      success: true,
      message: `Connected! Repo: ${GITHUB_OWNER}/${GITHUB_REPO}, Branch: ${GITHUB_BRANCH}`,
      repo: `${GITHUB_OWNER}/${GITHUB_REPO}`,
      branch: GITHUB_BRANCH,
      defaultBranch,
    };
  } catch (err: any) {
    return { success: false, message: `Connection failed: ${err.message}` };
  }
}

/**
 * Push all baked data files to GitHub repository.
 * Uses Git Data API for efficient batch commit.
 *
 * Steps:
 * 1. Get the latest commit SHA on the branch
 * 2. Get the tree of that commit
 * 3. Create blobs for each baked file
 * 4. Create a new tree with the blobs
 * 5. Create a new commit
 * 6. Update the branch reference
 */
export async function pushBakedDataToGitHub(): Promise<BakePushResult> {
  if (!isGitHubBakeConfigured()) {
    return { success: false, filesPushed: 0, error: 'GitHub CMS not configured' };
  }

  try {
    // Check if filesystem is available (Workers don't have fs)
    let existsSync: typeof import('fs').existsSync;
    let readdirSync: typeof import('fs').readdirSync;
    let readFileSync: typeof import('fs').readFileSync;

    try {
      const fs = await import('fs');
      existsSync = fs.existsSync;
      readdirSync = fs.readdirSync;
      readFileSync = fs.readFileSync;
    } catch {
      return { success: false, filesPushed: 0, error: 'Filesystem not available (Workers environment — use Cloudflare KV instead)' };
    }

    // Read all baked files from disk
    if (!existsSync(BAKED_DATA_DIR)) {
      return { success: false, filesPushed: 0, error: 'No baked data directory found (Workers environment — use Cloudflare KV instead)' };
    }

    const bakedFiles = readdirSync(BAKED_DATA_DIR).filter(f => f.endsWith('.json'));
    if (bakedFiles.length === 0) {
      return { success: false, filesPushed: 0, error: 'No baked JSON files found' };
    }

    console.log(`[GitHubBake] Pushing ${bakedFiles.length} files to ${GITHUB_OWNER}/${GITHUB_REPO}:${GITHUB_BAKED_PATH}`);

    // Step 1: Get the latest commit on the branch
    const refRes = await githubFetch(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/refs/heads/${GITHUB_BRANCH}`);
    if (!refRes.ok) {
      const errText = await refRes.text().catch(() => '');
      return { success: false, filesPushed: 0, error: `Failed to get branch ref: ${refRes.status} ${errText}` };
    }
    const refData: GitHubRef = await refRes.json();
    const latestCommitSha = refData.object.sha;

    // Step 2: Get the commit to find its tree SHA
    const commitRes = await githubFetch(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/commits/${latestCommitSha}`);
    if (!commitRes.ok) {
      return { success: false, filesPushed: 0, error: `Failed to get commit: ${commitRes.status}` };
    }
    const commitData: GitHubCommit = await commitRes.json();
    const baseTreeSha = commitData.tree.sha;

    // Step 3: Create blobs for each baked file
    const treeItems: GitHubTreeItem[] = [];
    for (const fileName of bakedFiles) {
      const filePath = join(BAKED_DATA_DIR, fileName);
      const content = readFileSync(filePath, 'utf-8');

      const blobRes = await githubFetch(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/blobs`, {
        method: 'POST',
        body: JSON.stringify({
          content,
          encoding: 'utf-8',
        }),
      });

      if (!blobRes.ok) {
        console.warn(`[GitHubBake] Failed to create blob for ${fileName}: ${blobRes.status}`);
        continue;
      }

      const blobData = await blobRes.json();
      treeItems.push({
        path: `${GITHUB_BAKED_PATH}/${fileName}`,
        mode: '100644',
        type: 'blob',
        sha: blobData.sha as string,
      });
    }

    if (treeItems.length === 0) {
      return { success: false, filesPushed: 0, error: 'Failed to create any blobs' };
    }

    // Step 4: Create a new tree
    const treeRes = await githubFetch(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/trees`, {
      method: 'POST',
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: treeItems,
      }),
    });

    if (!treeRes.ok) {
      const errText = await treeRes.text().catch(() => '');
      return { success: false, filesPushed: 0, error: `Failed to create tree: ${treeRes.status} ${errText}` };
    }

    const treeData = await treeRes.json();
    const newTreeSha = treeData.sha as string;

    // Step 5: Create a new commit
    const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
    const newCommitRes = await githubFetch(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/commits`, {
      method: 'POST',
      body: JSON.stringify({
        message: `🔄 Auto-publish: Update baked site data [${timestamp}]`,
        tree: newTreeSha,
        parents: [latestCommitSha],
      }),
    });

    if (!newCommitRes.ok) {
      const errText = await newCommitRes.text().catch(() => '');
      return { success: false, filesPushed: 0, error: `Failed to create commit: ${newCommitRes.status} ${errText}` };
    }

    const newCommitData = await newCommitRes.json();
    const newCommitSha = newCommitData.sha as string;

    // Step 6: Update the branch reference
    const updateRefRes = await githubFetch(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/refs/heads/${GITHUB_BRANCH}`, {
      method: 'PATCH',
      body: JSON.stringify({
        sha: newCommitSha,
        force: false,
      }),
    });

    if (!updateRefRes.ok) {
      const errText = await updateRefRes.text().catch(() => '');
      return { success: false, filesPushed: 0, error: `Failed to update branch ref: ${updateRefRes.status} ${errText}` };
    }

    console.log(`[GitHubBake] Successfully pushed ${treeItems.length} files. Commit: ${newCommitSha.slice(0, 7)}`);

    return {
      success: true,
      commitSha: newCommitSha,
      filesPushed: treeItems.length,
    };
  } catch (err: any) {
    console.error('[GitHubBake] Push failed:', err.message);
    return { success: false, filesPushed: 0, error: err.message };
  }
}
