import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

/**
 * GitHub CDN Configuration API (Images only)
 * 
 * Saves and loads GitHub configuration to data/github-config.json
 * This is ONLY for image CDN config now — site data uses Turso.
 * 
 * Supports:
 * - Images CDN (github-*) — for uploading images to GitHub repo
 */

const DATA_DIR = join(process.cwd(), 'data');
const CONFIG_FILE = join(DATA_DIR, 'github-config.json');

interface GithubConfig {
  // Images CDN config
  githubToken: string;
  githubRepoOwner: string;
  githubRepoName: string;
  githubRepoPath: string;
  // Site Data GitHub config (kept for backward compat, but not used for site data anymore)
  siteDataGithubToken: string;
  siteDataGithubRepoOwner: string;
  siteDataGithubRepoName: string;
}

const DEFAULT_CONFIG: GithubConfig = {
  githubToken: '',
  githubRepoOwner: 'architecturezen8-cpu',
  githubRepoName: 'thomians-media-cms',
  githubRepoPath: 'battle-of-the-golds',
  siteDataGithubToken: '',
  siteDataGithubRepoOwner: 'architecturezen8-cpu',
  siteDataGithubRepoName: 'thomians-media-cms',
};

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function loadConfig(): GithubConfig {
  try {
    ensureDataDir();
    if (existsSync(CONFIG_FILE)) {
      const data = readFileSync(CONFIG_FILE, 'utf-8');
      return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error('Failed to load GitHub config:', err);
  }
  return { ...DEFAULT_CONFIG };
}

function saveConfig(config: GithubConfig) {
  try {
    ensureDataDir();
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save GitHub config:', err);
  }
}

/** GET - Load GitHub config (masked tokens) */
export async function GET() {
  const config = loadConfig();
  // Mask tokens for security — only show last 4 chars
  const masked = {
    ...config,
    githubToken: config.githubToken
      ? '••••••••' + config.githubToken.slice(-4)
      : '',
    hasToken: !!config.githubToken,
    siteDataGithubToken: config.siteDataGithubToken
      ? '••••••••' + config.siteDataGithubToken.slice(-4)
      : '',
    hasSiteDataToken: !!config.siteDataGithubToken,
  };
  return NextResponse.json(masked);
}

/** POST - Save GitHub config */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // If the token is masked (unchanged), keep the existing one
    const existingConfig = loadConfig();
    let token = body.githubToken || '';
    if (token.startsWith('••••••••') || token.startsWith('********')) {
      token = existingConfig.githubToken;
    }

    // Handle site-data GitHub token (masked check) — kept for backward compat
    let siteDataToken = body.siteDataGithubToken || '';
    if (siteDataToken.startsWith('••••••••') || siteDataToken.startsWith('********')) {
      siteDataToken = existingConfig.siteDataGithubToken;
    }

    const config: GithubConfig = {
      githubToken: token,
      githubRepoOwner: body.githubRepoOwner || DEFAULT_CONFIG.githubRepoOwner,
      githubRepoName: body.githubRepoName || DEFAULT_CONFIG.githubRepoName,
      githubRepoPath: body.githubRepoPath || DEFAULT_CONFIG.githubRepoPath,
      siteDataGithubToken: siteDataToken,
      siteDataGithubRepoOwner: body.siteDataGithubRepoOwner || DEFAULT_CONFIG.siteDataGithubRepoOwner,
      siteDataGithubRepoName: body.siteDataGithubRepoName || DEFAULT_CONFIG.siteDataGithubRepoName,
    };

    saveConfig(config);

    return NextResponse.json({
      success: true,
      hasToken: !!config.githubToken,
      hasSiteDataToken: !!config.siteDataGithubToken,
      cdnPreview: `https://cdn.jsdelivr.net/gh/${config.githubRepoOwner}/${config.githubRepoName}/${config.githubRepoPath}/filename.jpg`,
    });
  } catch (err) {
    console.error('Save GitHub config error:', err);
    return NextResponse.json(
      { error: 'Failed to save GitHub config' },
      { status: 500 }
    );
  }
}

/** PUT - Test GitHub connection */
export async function PUT() {
  const config = loadConfig();

  if (!config.githubToken) {
    return NextResponse.json({
      connected: false,
      error: 'No GitHub token configured. Add your token in Settings → GitHub CDN Upload.',
    });
  }

  try {
    const res = await fetch(
      `https://api.github.com/repos/${config.githubRepoOwner}/${config.githubRepoName}`,
      {
        headers: {
          Authorization: `token ${config.githubToken}`,
          'User-Agent': 'BOTG-CMS',
        },
      }
    );

    if (!res.ok) {
      const errorData = await res.json();
      return NextResponse.json({
        connected: false,
        error: `GitHub API error: ${errorData.message || res.statusText}`,
      });
    }

    const repoData = await res.json();

    // Check if the uploads path exists
    let pathExists = false;
    try {
      const pathRes = await fetch(
        `https://api.github.com/repos/${config.githubRepoOwner}/${config.githubRepoName}/contents/${config.githubRepoPath}`,
        {
          headers: {
            Authorization: `token ${config.githubToken}`,
            'User-Agent': 'BOTG-CMS',
          },
        }
      );
      pathExists = pathRes.ok;
    } catch {}

    return NextResponse.json({
      connected: true,
      repo: repoData.full_name,
      branch: repoData.default_branch,
      private: repoData.private,
      pathExists,
      pathWarning: !pathExists
        ? `Path "${config.githubRepoPath}" doesn't exist in the repo yet. It will be created automatically on first upload.`
        : undefined,
    });
  } catch (err) {
    return NextResponse.json({
      connected: false,
      error: `Connection failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
    });
  }
}
