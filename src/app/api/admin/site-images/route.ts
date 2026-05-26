import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'data');

// Image URL field names to look for in section content
const IMAGE_FIELD_NAMES = [
  'image', 'src', 'bg_image', 'logo', 'icon', 'background_image',
  'stc_logo', 'gsc_logo', 'team_logo', 'logo_image', 'photo',
  'thumbnail', 'overlay_logo',
];

// Image extensions
const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|svg|webp)$/i;

// Settings fields that contain images
const SETTINGS_IMAGE_FIELDS: Record<string, string> = {
  siteLogo: 'Site Logo',
  siteFavicon: 'Site Favicon',
  stThomasEmblem: "S. Thomas' Emblem",
  royalEmblem: 'Royal Emblem',
};

interface SiteImage {
  url: string;
  source: 'section' | 'settings';
  sourceLabel: string;
  storageType: 'github' | 'local' | 'external';
}

function getStorageType(url: string): 'github' | 'local' | 'external' {
  if (url.includes('cdn.jsdelivr.net')) return 'github';
  if (url.startsWith('/uploads/') || url.startsWith('/logos/') || url.startsWith('/players/') || url.startsWith('/news/')) return 'local';
  return 'external';
}

function isImageUrl(value: unknown): boolean {
  if (typeof value !== 'string' || !value.trim()) return false;
  // Check if it's a known image field name pattern
  if (IMAGE_EXTENSIONS.test(value)) return true;
  // Check if it looks like a URL path to an image
  if (value.startsWith('/') && (value.includes('/logos/') || value.includes('/uploads/') || value.includes('/players/') || value.includes('/news/'))) return true;
  if (value.startsWith('http') && IMAGE_EXTENSIONS.test(value)) return true;
  return false;
}

function looksLikeImageField(key: string): boolean {
  const lowerKey = key.toLowerCase();
  return IMAGE_FIELD_NAMES.some(name => lowerKey === name || lowerKey === name.toLowerCase());
}

function scanObjectForImages(
  obj: Record<string, unknown>,
  sourceLabelPrefix: string,
): SiteImage[] {
  const images: SiteImage[] = [];

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && value.trim()) {
      // Check if the field name suggests it's an image
      const isImageField = looksLikeImageField(key);
      const looksLikeImageUrl = isImageUrl(value);

      if (isImageField || looksLikeImageUrl) {
        // Only include if it actually looks like a URL/path (not just text)
        if (value.startsWith('/') || value.startsWith('http') || IMAGE_EXTENSIONS.test(value)) {
          images.push({
            url: value,
            source: 'section',
            sourceLabel: sourceLabelPrefix,
            storageType: getStorageType(value),
          });
        }
      }
    }

    // Recurse into arrays (e.g., news_items, player_items, gallery_items)
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          images.push(...scanObjectForImages(item as Record<string, unknown>, sourceLabelPrefix));
        }
      }
    }

    // Recurse into nested objects
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      images.push(...scanObjectForImages(value as Record<string, unknown>, sourceLabelPrefix));
    }
  }

  return images;
}

export async function GET() {
  const images: SiteImage[] = [];
  const seen = new Set<string>();

  function addImage(img: SiteImage) {
    // Deduplicate by URL
    if (!seen.has(img.url)) {
      seen.add(img.url);
      images.push(img);
    }
  }

  // 1. Scan sections.json
  try {
    const sectionsFile = join(DATA_DIR, 'sections.json');
    if (existsSync(sectionsFile)) {
      const sectionsData = JSON.parse(readFileSync(sectionsFile, 'utf-8')) as Array<{
        id: string;
        page_id: string;
        title: string;
        content: Record<string, unknown>;
      }>;

      for (const section of sectionsData) {
        const pageId = section.page_id || '';
        const sectionTitle = section.title || section.id || '';
        const sourceLabel = pageId
          ? `${pageId.charAt(0).toUpperCase() + pageId.slice(1)} > ${sectionTitle}`
          : sectionTitle;

        if (section.content && typeof section.content === 'object') {
          const sectionImages = scanObjectForImages(section.content, sourceLabel);
          for (const img of sectionImages) {
            addImage(img);
          }
        }
      }
    }
  } catch (err) {
    console.error('Failed to scan sections.json:', err);
  }

  // 2. Scan settings.json
  try {
    const settingsFile = join(DATA_DIR, 'settings.json');
    if (existsSync(settingsFile)) {
      const settingsData = JSON.parse(readFileSync(settingsFile, 'utf-8')) as Record<string, unknown>;

      for (const [fieldKey, fieldLabel] of Object.entries(SETTINGS_IMAGE_FIELDS)) {
        const value = settingsData[fieldKey];
        if (typeof value === 'string' && value.trim()) {
          addImage({
            url: value,
            source: 'settings',
            sourceLabel: `Settings > ${fieldLabel}`,
            storageType: getStorageType(value),
          });
        }
      }

      // Also scan for any other fields that look like image URLs
      for (const [key, value] of Object.entries(settingsData)) {
        if (SETTINGS_IMAGE_FIELDS[key]) continue; // Already handled
        if (typeof value === 'string' && value.trim() && isImageUrl(value)) {
          addImage({
            url: value,
            source: 'settings',
            sourceLabel: `Settings > ${key}`,
            storageType: getStorageType(value),
          });
        }
      }
    }
  } catch (err) {
    console.error('Failed to scan settings.json:', err);
  }

  // 3. Read github-config.json for repo info (included in response for reference)
  let githubConfig: { owner: string; repo: string; path: string } | null = null;
  try {
    const githubFile = join(DATA_DIR, 'github-config.json');
    if (existsSync(githubFile)) {
      const ghData = JSON.parse(readFileSync(githubFile, 'utf-8')) as Record<string, unknown>;
      githubConfig = {
        owner: (ghData.githubRepoOwner as string) || '',
        repo: (ghData.githubRepoName as string) || '',
        path: (ghData.githubRepoPath as string) || '',
      };
    }
  } catch (err) {
    console.error('Failed to read github-config.json:', err);
  }

  // Sort by source, then by sourceLabel
  images.sort((a, b) => {
    if (a.source !== b.source) return a.source === 'settings' ? -1 : 1;
    return a.sourceLabel.localeCompare(b.sourceLabel);
  });

  return NextResponse.json({
    images,
    githubConfig,
    summary: {
      total: images.length,
      github: images.filter(i => i.storageType === 'github').length,
      local: images.filter(i => i.storageType === 'local').length,
      external: images.filter(i => i.storageType === 'external').length,
    },
  });
}
