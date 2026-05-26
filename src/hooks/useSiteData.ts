'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Unified site data interface matching the Turso-published site data
 */
export interface SiteData {
  _meta?: {
    version: number;
    generatedAt: string;
    source: string;
  };
  sections: Array<{
    id: string;
    page_id: string;
    type: string;
    title: string;
    content: Record<string, unknown>;
    position: number;
    is_visible: boolean;
    is_published?: boolean;
    created_at?: string;
  }>;
  settings: Record<string, unknown>;
  preloaderSettings: Record<string, unknown>;
  pages: Record<string, Record<string, unknown>>;
  navItems: Array<Record<string, unknown>>;
}

/**
 * Hook to load site data from Turso DB (via /api/site-data endpoint).
 * This is the primary data source for the site — works on Cloudflare Pages
 * without persistent server storage.
 *
 * Flow: Turso DB → static site-data.json → defaults
 *
 * @param source - 'preview' to fetch from Turso directly (for admin preview),
 *                 'static' or undefined for static file with Turso fallback
 */
export function useSiteData(source?: 'preview' | 'static') {
  const [data, setData] = useState<SiteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<string>('unknown');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Primary: fetch from our API endpoint which handles Turso → static file → defaults
      const fetchSource = source === 'preview' ? 'preview' : undefined;
      // ⚠️ FIX 2026-05-21:
      //   Use 'no-cache' (not 'default') so the browser still revalidates with
      //   the CDN (which is still allowed to serve cached responses via
      //   s-maxage). This means visitors with a stale browser cache will pick
      //   up admin changes within the CDN's 60s window, NOT after a full SWR.
      const res = await fetch(
        `/api/site-data${fetchSource ? '?source=preview' : ''}`,
        { cache: fetchSource ? 'no-store' : 'no-cache' }
      );
      if (res.ok) {
        const siteData: SiteData = await res.json();
        setData(siteData);
        setDataSource(siteData._meta?.source || 'api');
      } else {
        throw new Error(`API returned ${res.status}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load site data');
      setData({
        _meta: { version: 1, generatedAt: new Date().toISOString(), source: 'fallback' },
        sections: [],
        settings: {},
        preloaderSettings: {},
        pages: {},
        navItems: [],
      });
      setDataSource('fallback');
    } finally {
      setLoading(false);
    }
  }, [source]);

  useEffect(() => {
    fetchData();

    // ⚠️ FIX 2026-05-21:
    //   When the user returns to the tab OR the window regains focus, refetch
    //   so they immediately pick up any admin updates. Without this, the
    //   browser shows stale data from its HTTP cache until refresh.
    const handleVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchData();
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', fetchData);
      document.addEventListener('visibilitychange', handleVisibility);
      return () => {
        window.removeEventListener('focus', fetchData);
        document.removeEventListener('visibilitychange', handleVisibility);
      };
    }
  }, [fetchData]);

  return { data, loading, error, source: dataSource, refetch: fetchData };
}

/**
 * Get a section by ID from site data
 */
export function getSectionFromData(
  data: SiteData | null,
  sectionId: string
): Record<string, unknown> | null {
  if (!data?.sections) return null;
  const section = data.sections.find(s => s.id === sectionId);
  return section?.content || null;
}

/**
 * Get sections by page ID from site data
 */
export function getSectionsByPage(
  data: SiteData | null,
  pageId: string
): SiteData['sections'] {
  if (!data?.sections) return [];
  return data.sections.filter(s => s.page_id === pageId);
}
