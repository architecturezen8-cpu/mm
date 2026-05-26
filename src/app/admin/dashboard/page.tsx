'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Image as ImageIcon, Settings, ExternalLink, Plus, BarChart3, Activity } from 'lucide-react';
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

export default function DashboardPage() {
  const { data: session } = useSession();
  const { setCurrentPageId, setSidebarOpen, sidebarOpen } = useAdminStore();
  const [adminName, setAdminName] = useState('Admin');

  // Also check custom session endpoint for Next.js 16 compatibility
  useEffect(() => {
    fetch('/api/admin/session')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.user?.name) {
          setAdminName(data.user.name.split(' ')[0]);
        }
      })
      .catch(() => {});
  }, []);
  const [pages, setPages] = useState<Page[]>([]);
  const [addingPage, setAddingPage] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');

  useEffect(() => {
    setCurrentPageId(null);
    fetch('/api/admin/pages')
      .then(r => r.ok ? r.json() : [])
      .then(data => Array.isArray(data) ? setPages(data) : setPages([]))
      .catch(() => setPages([]));
  }, [setCurrentPageId]);

  const publishedCount = pages.filter(p => p.status === 'published').length;
  const draftCount = pages.filter(p => p.status === 'draft').length;

  // Map page IDs to slugs for admin editing
  const getAdminEditSlug = (page: Page) => {
    return page.id; // Use page.id directly as the slug
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
          <div className="mb-6">
            <p className="text-[#4A4945] text-[9px] uppercase tracking-[3px] mb-3">Navigation</p>
            <AdminNav />
          </div>

          <div className="mt-8">
            <p className="text-[#4A4945] text-[9px] uppercase tracking-[3px] mb-3">Quick Stats</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-[#08080c] border border-[#1a1a22] rounded-sm">
                <span className="text-[#8A8780] text-xs">Pages</span>
                <span className="text-[#F0EDE6] text-xs font-medium">{pages.length}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#08080c] border border-[#1a1a22] rounded-sm">
                <span className="text-[#8A8780] text-xs">Published</span>
                <span className="text-green-400 text-xs font-medium">{publishedCount}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#08080c] border border-[#1a1a22] rounded-sm">
                <span className="text-[#8A8780] text-xs">Drafts</span>
                <span className="text-[#FFC300] text-xs font-medium">{draftCount}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 p-6 lg:p-8 min-h-screen">
          <div className="max-w-5xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-[#F0EDE6] mb-1">
                Welcome back, {adminName || session?.user?.name?.split(' ')[0] || 'Admin'}
              </h1>
              <p className="text-[#8A8780] text-sm">Battle of the Golds — Content Manager</p>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Link href="/admin/dashboard/pages" className="bg-[#08080c] border border-[#1a1a22] rounded-sm p-4 hover:border-[#28283a] transition-colors group">
                <FileText className="w-6 h-6 text-[#FFC300] mb-2" />
                <p className="text-[#F0EDE6] font-medium text-sm">Pages</p>
                <p className="text-[#4A4945] text-xs">{pages.length} pages</p>
              </Link>
              <Link href="/admin/dashboard/media" className="bg-[#08080c] border border-[#1a1a22] rounded-sm p-4 hover:border-[#28283a] transition-colors group">
                <ImageIcon className="w-6 h-6 text-purple-400 mb-2" />
                <p className="text-[#F0EDE6] font-medium text-sm">Media Library</p>
                <p className="text-[#4A4945] text-xs">Images & videos</p>
              </Link>
              <Link href="/admin/dashboard/settings" className="bg-[#08080c] border border-[#1a1a22] rounded-sm p-4 hover:border-[#28283a] transition-colors group">
                <Settings className="w-6 h-6 text-blue-400 mb-2" />
                <p className="text-[#F0EDE6] font-medium text-sm">Settings</p>
                <p className="text-[#4A4945] text-xs">Site config</p>
              </Link>
              <div className="bg-[#08080c] border border-[#1a1a22] rounded-sm p-4">
                <BarChart3 className="w-6 h-6 text-green-400 mb-2" />
                <p className="text-[#F0EDE6] font-medium text-sm">Analytics</p>
                <p className="text-[#4A4945] text-xs">Coming soon</p>
              </div>
            </div>

            {/* Pages list */}
            <div className="bg-[#08080c] border border-[#1a1a22] rounded-sm overflow-hidden">
              <div className="p-4 border-b border-[#1a1a22] flex items-center justify-between">
                <h2 className="text-[#F0EDE6] font-semibold text-sm">All Pages</h2>
                <span className="text-[#4A4945] text-xs">{pages.length} total</span>
              </div>
              <div className="divide-y divide-[#12121a]">
                {pages.map(page => (
                  <div key={page.id} className="flex items-center justify-between p-4 hover:bg-[#0e0e14] transition-colors">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-[#4A4945]" />
                      <div>
                        <p className="text-[#F0EDE6] font-medium text-sm">{page.title}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-[#4A4945] text-xs font-mono">{page.slug}</p>
                          {page.sectionCount !== undefined && (
                            <span className="text-[#4A4945] text-[10px]">· {page.sectionCount} sections</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {page.status === 'draft' ? (
                        <Link
                          href={`/admin/dashboard/${getAdminEditSlug(page)}`}
                          className="px-3 py-1.5 bg-[#FFC300] text-[#020204] text-xs rounded-sm hover:bg-[#FFD54F] font-bold transition-colors flex items-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
                          </svg>
                          Publish
                        </Link>
                      ) : (
                        <PublishStatus status={page.status} />
                      )}
                      {page.updated_at && (Date.now() - new Date(page.updated_at).getTime()) < 3600000 && (
                        <span className="px-1.5 py-0.5 bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-[9px] font-bold uppercase tracking-wider rounded-sm">
                          NEW
                        </span>
                      )}
                      <Link
                        href={page.slug}
                        target="_blank"
                        className="text-[#4A4945] hover:text-[#8A8780] transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/admin/dashboard/${getAdminEditSlug(page)}`}
                        className="px-3 py-1.5 bg-[#FFC300] text-[#020204] text-xs rounded-sm hover:bg-[#FFD54F] font-bold transition-colors"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="mt-8 bg-[#08080c] border border-[#1a1a22] rounded-sm overflow-hidden">
              <div className="p-4 border-b border-[#1a1a22]">
                <h2 className="text-[#F0EDE6] font-semibold text-sm">Recent Activity</h2>
              </div>
              <div className="p-6 text-center">
                <Activity className="w-8 h-8 text-[#4A4945] mx-auto mb-2" />
                <p className="text-[#4A4945] text-sm">No recent activity</p>
                <p className="text-[#4A4945] text-xs mt-1">Start editing pages to see activity here</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
