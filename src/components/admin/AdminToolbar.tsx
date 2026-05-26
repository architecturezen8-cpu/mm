'use client';

import { useAdminEdit } from '@/lib/AdminEditContext';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';

export default function AdminToolbar() {
  const { isAdmin, isLoading, editMode, setEditMode, triggerRefresh } = useAdminEdit();
  const [collapsed, setCollapsed] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);
  const [addingSection, setAddingSection] = useState(false);
  const [isInAdminDashboard, setIsInAdminDashboard] = useState(false);

  // Track whether the user is viewing the site through the admin dashboard
  useEffect(() => {
    const checkPath = () => {
      setIsInAdminDashboard(window.location.pathname.includes('/admin/dashboard'));
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

  if (isLoading || !isAdmin || !isInAdminDashboard) return null;

  const handleClearLocalData = () => {
    if (confirm('Reset to API data? This will reload the page.')) {
      triggerRefresh();
      // Force full page reload to reset all React state
      window.location.reload();
    }
  };

  const handleAddSection = async (type: string) => {
    setAddingSection(true);
    try {
      // Determine current page from URL (supports both frontend and admin dashboard URLs)
      const path = window.location.pathname;
      let pageId = 'home';

      // Extract page slug from either /admin/dashboard/[slug] or /[slug] format
      const adminMatch = path.match(/\/admin\/dashboard\/([^/]+)/);
      const slug = adminMatch ? adminMatch[1] : path.split('/').filter(Boolean)[0] || '';

      // Map URL slugs to correct pageIds
      if (slug === 'home' || slug === '' || path === '/') pageId = 'home';
      else if (slug === 'live') pageId = 'live';
      else if (slug === 'about' || slug === 'match-history') pageId = 'about';
      else if (slug === 'gallery') pageId = 'gallery';
      else if (slug === 'videos') pageId = 'videos';
      else if (slug === 'community') pageId = 'community';
      else if (slug === 'playing-xi') pageId = 'playing-xi';
      else if (slug === 'pages') pageId = 'home'; // admin pages management defaults to home
      else pageId = slug;

      // Generate unique ID with timestamp to avoid collisions
      // If on community page's legacy sub-tab, prefix with 'legacy-' so section appears in that tab
      const communitySubTab = document.documentElement.getAttribute('data-community-subtab');
      const idPrefix = (slug === 'community' && communitySubTab === 'legacy') ? 'legacy-' : '';
      const uniqueId = `${idPrefix}dyn-${type}-${Date.now()}`;

      const res = await fetch('/api/admin/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: uniqueId, pageId, type, title: `New ${type} section` }),
      });
      if (res.ok) {
        triggerRefresh();
      } else {
        console.error('Add section failed:', res.status, await res.text());
      }
    } catch (err) {
      console.error('Add section failed:', err);
    } finally {
      setAddingSection(false);
      setShowAddSection(false);
    }
  };

  const sectionTypes = [
    { type: 'hero', label: 'Hero Banner' },
    { type: 'text', label: 'Text Content' },
    { type: 'news', label: 'News Section' },
    { type: 'stats', label: 'Statistics' },
    { type: 'gallery', label: 'Gallery' },
    { type: 'video', label: 'Video' },
    { type: 'players', label: 'Players' },
  ];

  return (
    <div className="fixed bottom-4 left-4 z-[9998] flex flex-col gap-2" style={{ borderRadius: 0 }}>
      {/* Add section dropdown */}
      {showAddSection && (
        <div className="bg-lux-bg/95 backdrop-blur-xl border border-gold/30 p-2 space-y-1 max-h-64 overflow-y-auto" style={{ borderRadius: 0, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
          <p className="text-[8px] uppercase tracking-[2px] font-bold text-gold px-2 py-1">Add Section</p>
          {sectionTypes.map((st) => (
            <button
              key={st.type}
              onClick={() => handleAddSection(st.type)}
              disabled={addingSection}
              className="w-full text-left px-3 py-1.5 text-[9px] uppercase tracking-[1.5px] font-semibold text-text-muted hover:text-gold hover:bg-gold/5 transition-all disabled:opacity-50"
            >
              {st.label}
            </button>
          ))}
        </div>
      )}

      {/* Main toolbar */}
      {!collapsed && (
        <div
          className="flex items-center gap-2 px-3 py-2 border border-gold/30 bg-lux-bg/95 backdrop-blur-xl flex-wrap"
          style={{ borderRadius: 0, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
        >
          {/* Edit mode toggle */}
          <button
            onClick={() => setEditMode(!editMode)}
            className={`flex items-center gap-2 px-3 py-1.5 text-[9px] uppercase tracking-[2px] font-bold transition-all ${
              editMode
                ? 'bg-gold text-lux-bg'
                : 'border border-lux-border text-text-muted hover:border-gold/30 hover:text-gold'
            }`}
            style={{ borderRadius: 0 }}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {editMode ? 'Edit ON' : 'Edit'}
          </button>

          {/* Add Section button */}
          {editMode && (
            <button
              onClick={() => setShowAddSection(!showAddSection)}
              className="flex items-center gap-2 px-3 py-1.5 text-[9px] uppercase tracking-[2px] font-bold border border-gold/30 text-gold hover:bg-gold/10 transition-all"
              style={{ borderRadius: 0 }}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Section
            </button>
          )}

          {/* Manage Pages link */}
          <Link
            href="/admin/dashboard/pages"
            className="flex items-center gap-2 px-3 py-1.5 text-[9px] uppercase tracking-[2px] font-bold border border-lux-border text-text-muted hover:border-gold/30 hover:text-gold transition-all"
            style={{ borderRadius: 0 }}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            Pages
          </Link>

          {/* Clear Local Data */}
          <button
            onClick={handleClearLocalData}
            className="flex items-center gap-2 px-3 py-1.5 text-[9px] uppercase tracking-[2px] font-bold border border-lux-border text-text-muted hover:border-red-500/30 hover:text-red-400 transition-all"
            style={{ borderRadius: 0 }}
            title="Clear local edits"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Reset
          </button>

          {/* Logout */}
          <button
            onClick={() => signOut({ callbackUrl: '/admin' })}
            className="flex items-center gap-2 px-3 py-1.5 text-[9px] uppercase tracking-[2px] font-bold border border-lux-border text-text-muted hover:border-red-500/30 hover:text-red-400 transition-all"
            style={{ borderRadius: 0 }}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>

          {/* Collapse button */}
          <button
            onClick={() => setCollapsed(true)}
            className="flex items-center justify-center w-7 h-7 text-text-muted hover:text-gold transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      )}

      {/* Collapsed: just a small button */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="flex items-center justify-center w-10 h-10 border border-gold/30 bg-lux-bg/95 backdrop-blur-xl text-gold hover:bg-gold/10 transition-all"
          style={{ borderRadius: 0, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      )}

      {/* Edit mode indicator banner at very top */}
      {editMode && (
        <div className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-gold via-gold-bright to-gold z-[9998] animate-pulse" />
      )}
    </div>
  );
}
