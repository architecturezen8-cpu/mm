'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Search, ExternalLink, Eye, Plus } from 'lucide-react';
import AdminBar from '@/components/admin/AdminBar';
import AdminNav from '@/components/admin/ui/AdminNav';
import PublishStatus from '@/components/admin/ui/PublishStatus';
import { useAdminStore } from '@/lib/admin-store';

interface Page {
  id: string;
  title: string;
  slug: string;
  status: 'published' | 'draft';
  updated_at: string;
  sectionCount?: number;
  tabs?: { id: string; label: string }[];
}

// Default tabs for pages that have sub-navigation
const defaultTabs: Record<string, { id: string; label: string }[]> = {
  live: [
    { id: 'live', label: 'Score' },
    { id: 'scorecard', label: 'Scorecard' },
    { id: 'analytics', label: 'Analytics' },
  ],
  about: [
    { id: 'about', label: 'About Us' },
    { id: 'history', label: 'History' },
    { id: 'h2h', label: 'H2H' },
    { id: 'weather', label: 'Weather' },
  ],
  community: [
    { id: 'predict', label: 'Predict' },
    { id: 'vote', label: 'Vote' },
  ],
};

export default function PagesListPage() {
  const { setCurrentPageId, setSidebarOpen, sidebarOpen } = useAdminStore();
  const [pages, setPages] = useState<Page[]>([]);
  const [search, setSearch] = useState('');
  const [editingPage, setEditingPage] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editTabs, setEditTabs] = useState<{ id: string; label: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [showAddPage, setShowAddPage] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [addingPage, setAddingPage] = useState(false);

  useEffect(() => {
    setCurrentPageId(null);
    fetch('/api/admin/pages')
      .then(r => r.ok ? r.json() : [])
      .then(data => Array.isArray(data) ? setPages(data) : setPages([]))
      .catch(() => setPages([]));
  }, [setCurrentPageId]);

  // Merge pages with default tab info
  const pagesWithTabs = pages.map(p => ({
    ...p,
    tabs: p.tabs || defaultTabs[p.id] || [],
  }));

  const filteredPages = pagesWithTabs.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.slug.toLowerCase().includes(search.toLowerCase())
  );

  const startEditing = (page: Page) => {
    setEditingPage(page.id);
    setEditTitle(page.title);
    setEditSlug(page.slug);
    setEditTabs(page.tabs || defaultTabs[page.id] || []);
  };

  const addTab = () => {
    const newId = `tab-${Date.now()}`;
    setEditTabs([...editTabs, { id: newId, label: 'New Tab' }]);
  };

  const updateTab = (index: number, field: 'id' | 'label', value: string) => {
    const updated = [...editTabs];
    updated[index] = { ...updated[index], [field]: value };
    setEditTabs(updated);
  };

  const removeTab = (index: number) => {
    setEditTabs(editTabs.filter((_, i) => i !== index));
  };

  const savePage = async (pageId: string) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/pages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId,
          title: editTitle,
          slug: editSlug,
          tabs: editTabs,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPages(prev => prev.map(p => p.id === pageId ? { ...p, title: updated.title, slug: updated.slug, tabs: editTabs } : p));
        setEditingPage(null);
      }
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddPage = async () => {
    if (!newPageTitle.trim()) return;
    setAddingPage(true);
    try {
      const slug = newPageTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const res = await fetch('/api/admin/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newPageTitle, slug: `/${slug}`, id: slug }),
      });
      if (res.ok) {
        const newPage = await res.json();
        setPages(prev => [...prev, newPage]);
        setNewPageTitle('');
        setShowAddPage(false);
      }
    } catch (err) {
      console.error('Add page failed:', err);
    } finally {
      setAddingPage(false);
    }
  };

  return (
    <>
      <AdminBar />
      <div className="pt-12 min-h-screen bg-[#020204] flex">
        {/* Sidebar */}
        <aside className={`fixed lg:static top-12 left-0 bottom-0 w-64 bg-[#030303] border-r border-[#1a1a22] p-4 transition-transform duration-300 z-40 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
          <AdminNav />
        </aside>

        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Main content */}
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-xl font-bold text-[#F0EDE6]">Pages & Tabs</h1>
                <p className="text-[#8A8780] text-sm">Manage page names, slugs, tabs, and navigation</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddPage(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#08080c] text-[#F0EDE6] text-[10px] uppercase tracking-[2px] font-bold border border-[#1a1a22] hover:border-[#FFC300]/30 hover:text-[#FFC300] transition-all"
                  style={{ borderRadius: 0 }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Page
                </button>
                <Link
                  href="/"
                  className="flex items-center gap-2 px-4 py-2 bg-[#FFC300] text-[#020204] text-[10px] uppercase tracking-[2px] font-bold hover:bg-[#FFD54F] transition-colors"
                  style={{ borderRadius: 0 }}
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Live
                </Link>
              </div>
            </div>

            {/* Add Page Dialog */}
            {showAddPage && (
              <div className="bg-[#08080c] border border-[#FFC300]/20 border-l-2 border-l-[#FFC300] p-4 mb-6" style={{ borderRadius: 0 }}>
                <h3 className="text-[#F0EDE6] font-semibold text-sm mb-3">Add New Page</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPageTitle}
                    onChange={(e) => setNewPageTitle(e.target.value)}
                    placeholder="Page title..."
                    className="flex-1 bg-[#0e0e14] border border-[#1a1a22] px-3 py-2 text-sm text-[#F0EDE6] focus:border-[#FFC300]/50 focus:outline-none"
                    style={{ borderRadius: 0 }}
                  />
                  <button
                    onClick={handleAddPage}
                    disabled={addingPage}
                    className="px-4 py-2 bg-[#FFC300] text-[#020204] text-[9px] uppercase tracking-[1.5px] font-bold hover:bg-[#FFD54F] disabled:opacity-50 transition-colors"
                    style={{ borderRadius: 0 }}
                  >
                    {addingPage ? '...' : 'Create'}
                  </button>
                  <button
                    onClick={() => { setShowAddPage(false); setNewPageTitle(''); }}
                    className="px-4 py-2 border border-[#1a1a22] text-[#4A4945] text-[9px] uppercase tracking-[1.5px] font-bold hover:border-[#28283a] transition-colors"
                    style={{ borderRadius: 0 }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Info banner */}
            <div className="bg-[#08080c] border border-[#1a1a22] border-l-2 border-l-[#FFC300] p-4 mb-6" style={{ borderRadius: 0 }}>
              <p className="text-[#F0EDE6] text-sm leading-relaxed">
                <span className="text-[#FFC300] font-bold">Tip:</span> To edit content on pages, click <strong>Edit</strong> on any page card below, or go to the <Link href="/" className="text-[#FFC300] underline hover:no-underline">live site</Link> and click on any section while in Edit Mode. Here you can manage page names, slugs, and sub-tabs.
              </p>
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A4945]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search pages..."
                className="w-full bg-[#08080c] border border-[#1a1a22] pl-9 pr-4 py-3 text-[#F0EDE6] text-sm placeholder-[#4A4945] focus:outline-none focus:border-[#FFC300] transition-colors"
                style={{ borderRadius: 0 }}
              />
            </div>

            {/* Pages grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPages.map(page => (
                <div
                  key={page.id}
                  className="bg-[#08080c] border border-[#1a1a22] p-5 hover:border-[#28283a] transition-all group"
                  style={{ borderRadius: 0 }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <FileText className="w-5 h-5 text-[#4A4945] group-hover:text-[#FFC300] transition-colors" />
                    <PublishStatus status={page.status} />
                  </div>

                  {editingPage === page.id ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[8px] uppercase tracking-[1.5px] text-[#4A4945] mb-1">Title</label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full bg-[#0e0e14] border border-[#1a1a22] px-2.5 py-1.5 text-xs text-[#F0EDE6] focus:border-[#FFC300]/50 focus:outline-none"
                          style={{ borderRadius: 0 }}
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] uppercase tracking-[1.5px] text-[#4A4945] mb-1">Slug</label>
                        <input
                          type="text"
                          value={editSlug}
                          onChange={(e) => setEditSlug(e.target.value)}
                          className="w-full bg-[#0e0e14] border border-[#1a1a22] px-2.5 py-1.5 text-xs text-[#F0EDE6] focus:border-[#FFC300]/50 focus:outline-none font-mono"
                          style={{ borderRadius: 0 }}
                        />
                      </div>

                      {/* Tab editor */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[8px] uppercase tracking-[1.5px] text-[#4A4945]">Sub-Tabs</label>
                          <button
                            onClick={addTab}
                            className="text-[#FFC300] text-[9px] font-bold uppercase tracking-[1px] hover:text-[#FFD54F]"
                          >
                            + Add Tab
                          </button>
                        </div>
                        <div className="space-y-1.5">
                          {editTabs.map((tab, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={tab.id}
                                onChange={(e) => updateTab(i, 'id', e.target.value)}
                                placeholder="id"
                                className="w-20 bg-[#0e0e14] border border-[#1a1a22] px-2 py-1 text-[10px] text-[#F0EDE6] focus:border-[#FFC300]/50 focus:outline-none font-mono"
                                style={{ borderRadius: 0 }}
                              />
                              <input
                                type="text"
                                value={tab.label}
                                onChange={(e) => updateTab(i, 'label', e.target.value)}
                                placeholder="Label"
                                className="flex-1 bg-[#0e0e14] border border-[#1a1a22] px-2 py-1 text-[10px] text-[#F0EDE6] focus:border-[#FFC300]/50 focus:outline-none"
                                style={{ borderRadius: 0 }}
                              />
                              <button
                                onClick={() => removeTab(i)}
                                className="text-[#4A4945] hover:text-red-400 transition-colors p-0.5"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                          {editTabs.length === 0 && (
                            <p className="text-[#4A4945] text-[10px] italic">No sub-tabs</p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => savePage(page.id)}
                          disabled={saving}
                          className="flex-1 px-3 py-1.5 bg-[#FFC300] text-[#020204] text-[9px] uppercase tracking-[1.5px] font-bold hover:bg-[#FFD54F] transition-colors disabled:opacity-50"
                          style={{ borderRadius: 0 }}
                        >
                          {saving ? '...' : 'Save'}
                        </button>
                        <button
                          onClick={() => setEditingPage(null)}
                          className="px-3 py-1.5 border border-[#1a1a22] text-[#4A4945] text-[9px] uppercase tracking-[1.5px] font-bold hover:border-[#28283a] transition-colors"
                          style={{ borderRadius: 0 }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-[#F0EDE6] font-semibold text-sm mb-1">{page.title}</h3>
                      <p className="text-[#4A4945] text-xs font-mono">{page.slug}</p>
                      {page.sectionCount !== undefined && (
                        <p className="text-[#4A4945] text-[10px] mt-1">{page.sectionCount} sections</p>
                      )}
                      {/* Show tabs */}
                      {page.tabs && page.tabs.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {page.tabs.map(tab => (
                            <span key={tab.id} className="px-1.5 py-0.5 bg-[#0e0e14] border border-[#1a1a22] text-[#8A8780] text-[9px] uppercase tracking-[1px]">
                              {tab.label}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="mt-3 pt-3 border-t border-[#12121a] flex items-center justify-between">
                        <span className="text-[#4A4945] text-[10px]">
                          Updated {new Date(page.updated_at).toLocaleDateString()}
                        </span>
                        <div className="flex items-center gap-2">
                          <Link
                            href={page.slug}
                            className="text-[#4A4945] hover:text-[#FFC300] transition-colors"
                            title="View on site"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            href={`/admin/dashboard/${page.id}`}
                            className="px-2.5 py-1 bg-[#FFC300] text-[#020204] text-[9px] uppercase tracking-[1px] font-bold hover:bg-[#FFD54F] transition-colors"
                            style={{ borderRadius: 0 }}
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => startEditing(page)}
                            className="text-[#FFC300] text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Settings →
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
