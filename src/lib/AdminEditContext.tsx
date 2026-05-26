'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// Section data for inline editing
export interface EditableSectionData {
  id: string;
  page_id: string;
  type: string;
  title: string;
  content: Record<string, unknown>;
  position: number;
  is_visible: boolean;
  is_published?: boolean;
}

interface AdminEditContextType {
  isAdmin: boolean;
  isLoading: boolean;
  isInAdminContext: boolean;
  editMode: boolean;
  setEditMode: (v: boolean) => void;
  editingSection: EditableSectionData | null;
  setEditingSection: (section: EditableSectionData | null) => void;
  focusedField: string | null;
  setFocusedField: (field: string | null) => void;
  sectionData: Record<string, EditableSectionData>;
  siteSettings: Record<string, unknown>;
  preloaderSettings: Record<string, unknown>;
  loadSectionData: () => Promise<void>;
  refreshKey: number;
  triggerRefresh: () => void;
  sectionDataLoaded: boolean;
}

const AdminEditContext = createContext<AdminEditContextType>({
  isAdmin: false,
  isLoading: true,
  isInAdminContext: false,
  editMode: false,
  setEditMode: () => {},
  editingSection: null,
  setEditingSection: () => {},
  focusedField: null,
  setFocusedField: () => {},
  sectionData: {},
  siteSettings: {},
  preloaderSettings: {},
  loadSectionData: async () => {},
  refreshKey: 0,
  triggerRefresh: () => {},
  sectionDataLoaded: false,
});

export function AdminEditProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInAdminContext, setIsInAdminContext] = useState(false);
  const [editMode, setEditMode] = useState(true);
  const [editingSection, setEditingSection] = useState<EditableSectionData | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [sectionData, setSectionData] = useState<Record<string, EditableSectionData>>({});
  const [siteSettings, setSiteSettings] = useState<Record<string, unknown>>({});
  const [preloaderSettings, setPreloaderSettings] = useState<Record<string, unknown>>({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [sectionDataLoaded, setSectionDataLoaded] = useState(false);

  // Track whether the user is currently in the admin dashboard context
  useEffect(() => {
    const checkPath = () => {
      setIsInAdminContext(window.location.pathname.includes('/admin/dashboard'));
    };
    checkPath();
    window.addEventListener('popstate', checkPath);
    // Observe DOM changes to catch Next.js SPA navigation
    const observer = new MutationObserver(checkPath);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      window.removeEventListener('popstate', checkPath);
      observer.disconnect();
    };
  }, []);

  // Check admin session on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/admin/session');
        if (res.ok) {
          const session = await res.json();
          if (session?.isAdmin || session?.user) {
            setIsAdmin(true);
          }
        } else {
          try {
            const fallbackRes = await fetch('/api/auth/session');
            if (fallbackRes.ok) {
              const text = await fallbackRes.text();
              try {
                const session = JSON.parse(text);
                if (session?.user) {
                  setIsAdmin(true);
                }
              } catch {
                // NextAuth returned HTML instead of JSON — not logged in
              }
            }
          } catch {
            // Fallback also failed
          }
        }
      } catch {
        // Not logged in
      } finally {
        setIsLoading(false);
      }
    }
    checkSession();
  }, []);

  // Load section data — use preview endpoint for admin edit mode, otherwise normal
  const loadSectionData = useCallback(async () => {
    try {
      // ─── Step 1: Fetch from preview endpoint if admin in edit mode, otherwise normal ───
      let sections: EditableSectionData[] = [];
      let loadedSettings: Record<string, unknown> = {};
      let loadedPreloader: Record<string, unknown> = {};

      try {
        const fetchUrl = isAdmin && editMode
          ? '/api/site-data?source=preview'
          : '/api/site-data';
        const siteDataRes = await fetch(fetchUrl, { cache: 'no-store' });
        if (siteDataRes.ok) {
          const siteData = await siteDataRes.json();

          if (siteData.sections && Array.isArray(siteData.sections) && siteData.sections.length > 0) {
            sections = siteData.sections as EditableSectionData[];
          }

          if (siteData.settings && Object.keys(siteData.settings).length > 0) {
            loadedSettings = siteData.settings;
          }

          if (siteData.preloaderSettings && Object.keys(siteData.preloaderSettings as Record<string, unknown>).length > 0) {
            loadedPreloader = siteData.preloaderSettings as Record<string, unknown>;
            // Ensure preloader settings have both snake_case and camelCase keys
            const preloaderMappings: Array<[string, string]> = [
              ['background_color', 'backgroundColor'],
              ['primary_color', 'primaryColor'],
              ['secondary_color', 'secondaryColor'],
              ['tertiary_color', 'tertiaryColor'],
              ['text_color', 'textColor'],
              ['bar_color', 'barColor'],
            ];
            for (const [snake, camel] of preloaderMappings) {
              const value = loadedPreloader[snake] ?? loadedPreloader[camel];
              if (value !== undefined) {
                loadedPreloader[snake] = value;
                loadedPreloader[camel] = value;
              }
            }
          }
        }
      } catch (err) {
        console.warn('site-data endpoint failed, falling back to sections API:', err);
      }

      // ─── Step 2: If site-data didn't return sections, fall back to sections API ───
      if (sections.length === 0) {
        try {
          const res = await fetch('/api/admin/sections');
          if (res.ok) {
            sections = await res.json();
          }
        } catch (err) {
          console.error('Failed to load sections from API:', err);
        }
      }

      // ─── Step 3: Build section data map from API/CDN data ───
      const dataMap: Record<string, EditableSectionData> = {};
      sections.forEach((s) => {
        dataMap[s.id] = s;
      });

      setSectionData(dataMap);

      // ─── Step 4: Set site settings ───
      if (Object.keys(loadedSettings).length > 0) {
        setSiteSettings(loadedSettings);
        window.dispatchEvent(new CustomEvent('site-settings-updated', { detail: loadedSettings }));
      }

      // ─── Step 5: Set preloader settings ───
      if (Object.keys(loadedPreloader).length > 0) {
        setPreloaderSettings(loadedPreloader);
      }
    } catch (err) {
      console.error('Failed to load section data:', err);
    } finally {
      // Mark section data as loaded — prevents rendering demo data
      setSectionDataLoaded(true);
    }
  }, [isAdmin, editMode]);

  // Load section data on mount and on refresh
  useEffect(() => {
    loadSectionData();
  }, [loadSectionData, refreshKey]);

  const triggerRefresh = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  // Expose sectionData through context
  const contextSectionData = sectionData;

  return (
    <AdminEditContext.Provider
      value={{
        isAdmin,
        isLoading,
        isInAdminContext,
        editMode,
        setEditMode,
        editingSection,
        setEditingSection,
        focusedField,
        setFocusedField,
        sectionData: contextSectionData,
        siteSettings,
        preloaderSettings,
        loadSectionData,
        refreshKey,
        triggerRefresh,
        sectionDataLoaded,
      }}
    >
      {children}
    </AdminEditContext.Provider>
  );
}

export function useAdminEdit() {
  return useContext(AdminEditContext);
}
