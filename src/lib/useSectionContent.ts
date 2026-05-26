'use client';

import { useMemo } from 'react';
import { useAdminEdit, EditableSectionData } from '@/lib/AdminEditContext';

/**
 * Hook to get merged section content - combines default content with saved edits from AdminEditContext.
 * This ensures that when admin edits and saves, the changes are reflected in the UI.
 *
 * IMPORTANT: While section data is loading from the API (sectionDataLoaded === false),
 * this hook returns an empty object instead of defaultContent. This prevents the
 * "demo data flash" — showing hardcoded defaults before the real data arrives.
 * Once data is loaded, if no saved data exists for a section, defaultContent is used as fallback.
 *
 * On the PUBLIC site (non-admin), defaultContent is NEVER shown — only actual Turso data.
 * This prevents hardcoded demo data from flashing when navigating between tabs.
 *
 * @param sectionId - The section ID (e.g., "home-hero", "about-history")
 * @param defaultContent - The default/fallback content object (used by admin and as structure guide)
 * @returns Merged content object (saved edits override defaults)
 */
export function useSectionContent<T extends Record<string, unknown>>(
  sectionId: string,
  defaultContent: T
): T {
  const { sectionData, sectionDataLoaded, isAdmin } = useAdminEdit();

  return useMemo(() => {
    // ─── While section data is still loading, return empty content ───
    // This prevents showing demo/default data before the real API data arrives.
    if (!sectionDataLoaded) {
      const empty: Record<string, unknown> = {};
      Object.keys(defaultContent).forEach((key) => {
        const val = defaultContent[key];
        if (Array.isArray(val)) {
          empty[key] = [];
        } else if (typeof val === 'number') {
          empty[key] = 0;
        } else if (typeof val === 'boolean') {
          empty[key] = false;
        } else {
          empty[key] = '';
        }
      });
      return empty as T;
    }

    // ─── Data is loaded — merge saved content with defaults ───
    const saved: EditableSectionData | undefined = sectionData[sectionId];
    if (saved?.content && typeof saved.content === 'object') {
      // Deep merge: saved content overrides default content
      const merged = { ...defaultContent };
      Object.keys(saved.content).forEach((key) => {
        const savedValue = saved.content[key];
        // For arrays, use the saved array if it exists and has items, otherwise fall back to default
        if (Array.isArray(savedValue)) {
          if (savedValue.length > 0) {
            (merged as Record<string, unknown>)[key] = savedValue;
          }
          // If saved array is empty, keep the default
        } else if (savedValue !== undefined && savedValue !== null) {
          // Allow empty strings to be saved
          (merged as Record<string, unknown>)[key] = savedValue;
        }
      });
      return merged as T;
    }

    // ─── No saved data for this section ───
    // On the PUBLIC site (non-admin), return EMPTY content instead of defaultContent
    // to prevent demo data flash. Only admin sees defaultContent for editing.
    if (!isAdmin) {
      const empty: Record<string, unknown> = {};
      Object.keys(defaultContent).forEach((key) => {
        const val = defaultContent[key];
        if (Array.isArray(val)) {
          empty[key] = [];
        } else if (typeof val === 'number') {
          empty[key] = 0;
        } else if (typeof val === 'boolean') {
          empty[key] = false;
        } else {
          empty[key] = '';
        }
      });
      return empty as T;
    }

    return defaultContent;
  }, [sectionId, sectionData, sectionDataLoaded, isAdmin, defaultContent]);
}

/**
 * Get a string value from content, with fallback
 */
export function getContentString(
  content: Record<string, unknown>,
  key: string,
  fallback: string = ''
): string {
  const val = content[key];
  if (typeof val === 'string' && val.trim()) return val;
  return fallback;
}

/**
 * Get a number value from content, with fallback
 */
export function getContentNumber(
  content: Record<string, unknown>,
  key: string,
  fallback: number = 0
): number {
  const val = content[key];
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
}

/**
 * Get an array value from content, with fallback
 */
export function getContentArray<T>(
  content: Record<string, unknown>,
  key: string,
  fallback: T[] = []
): T[] {
  const val = content[key];
  if (Array.isArray(val) && val.length > 0) return val as T[];
  return fallback;
}
