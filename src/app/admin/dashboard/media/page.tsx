'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload, Search, Trash2, Image as ImageIcon, Film, Grid, List,
  Copy, Check, ExternalLink, Github, HardDrive, Globe, BarChart3
} from 'lucide-react';
import AdminBar from '@/components/admin/AdminBar';
import AdminNav from '@/components/admin/ui/AdminNav';
import { useAdminStore } from '@/lib/admin-store';

// ── Types ──────────────────────────────────────────────────────────

interface MediaItem {
  id: string;
  filename: string;
  originalName?: string;
  url: string;
  cdnUrl?: string;
  type: 'image' | 'video';
  size?: number;
  alt_text?: string;
  uploaded_at: string;
}

interface SiteImage {
  url: string;
  source: 'section' | 'settings';
  sourceLabel: string;
  storageType?: 'github' | 'local' | 'external';
}

type TabKey = 'github' | 'local' | 'site';

// ── Helpers ────────────────────────────────────────────────────────

const isGithubCdn = (item: MediaItem) => {
  const url = item.cdnUrl || item.url;
  return url.includes('cdn.jsdelivr.net') || url.includes('github');
};

const isLocalUpload = (item: MediaItem) => {
  const url = item.cdnUrl || item.url;
  return url.startsWith('/uploads/');
};

const formatFileSize = (bytes?: number) => {
  if (!bytes) return '-';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  } catch {
    return iso;
  }
};

// ── Component ──────────────────────────────────────────────────────

export default function MediaLibraryPage() {
  const { setCurrentPageId, setSidebarOpen, sidebarOpen } = useAdminStore();

  // Data
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [siteImages, setSiteImages] = useState<SiteImage[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [activeTab, setActiveTab] = useState<TabKey>('github');
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [copiedId, setCopedId] = useState<string | null>(null);

  // ── Data loading ──────────────────────────────────────────────────

  useEffect(() => { setCurrentPageId(null); }, [setCurrentPageId]);

  const loadMedia = useCallback(async () => {
    setLoading(true);
    try {
      // Load from BOTH endpoints independently and combine
      const [ghRes, fbRes] = await Promise.allSettled([
        fetch('/api/admin/github-upload'),
        fetch('/api/admin/media'),
      ]);

      const allMedia: MediaItem[] = [];
      const seenIds = new Set<string>();

      // Process GitHub CDN endpoint results
      if (ghRes.status === 'fulfilled' && ghRes.value.ok) {
        try {
          const ghData: MediaItem[] = await ghRes.value.json();
          for (const item of ghData) {
            if (!seenIds.has(item.id)) {
              seenIds.add(item.id);
              allMedia.push(item);
            }
          }
        } catch {}
      }

      // Process local media endpoint results
      if (fbRes.status === 'fulfilled' && fbRes.value.ok) {
        try {
          const fbData: MediaItem[] = await fbRes.value.json();
          for (const item of fbData) {
            if (!seenIds.has(item.id)) {
              seenIds.add(item.id);
              allMedia.push(item);
            }
          }
        } catch {}
      }

      setMedia(allMedia);

      // Load site images
      try {
        const siRes = await fetch('/api/admin/site-images');
        if (siRes.ok) {
          const siData = await siRes.json();
          setSiteImages(siData.images || []);
        }
      } catch {}
    } catch (err) {
      console.error('Load media failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMedia(); }, [loadMedia]);

  // ── Categorise media ──────────────────────────────────────────────

  const githubMedia = media.filter(isGithubCdn);
  const localMedia = media.filter(isLocalUpload);

  const filteredGithub = githubMedia.filter(m =>
    (m.originalName || m.filename).toLowerCase().includes(search.toLowerCase())
  );
  const filteredLocal = localMedia.filter(m =>
    (m.originalName || m.filename).toLowerCase().includes(search.toLowerCase())
  );
  const filteredSite = siteImages.filter(si =>
    si.url.toLowerCase().includes(search.toLowerCase()) ||
    si.sourceLabel.toLowerCase().includes(search.toLowerCase())
  );

  // ── Stats ─────────────────────────────────────────────────────────

  const totalCount = githubMedia.length + localMedia.length + siteImages.length;

  // ── Upload ────────────────────────────────────────────────────────

  const onDrop = useCallback(async (files: File[]) => {
    setUploading(true);
    for (const file of files) {
      const form = new FormData();
      form.append('file', file);
      try {
        const res = await fetch('/api/admin/github-upload', { method: 'POST', body: form });
        if (res.ok) {
          const data = await res.json();
          setMedia(prev => [data, ...prev]);
        } else {
          const fallbackRes = await fetch('/api/admin/media', { method: 'POST', body: form });
          if (fallbackRes.ok) {
            const data = await fallbackRes.json();
            setMedia(prev => [data, ...prev]);
          }
        }
      } catch (err) {
        console.error('Upload failed:', err);
      }
    }
    setUploading(false);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'video/*': [] },
    multiple: true,
  });

  // ── Actions ───────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/admin/github-upload?id=${id}`, { method: 'DELETE' });
      setMedia(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopedId(id);
      setTimeout(() => setCopedId(null), 2000);
    });
  };

  const getCdnUrl = (item: MediaItem) => item.cdnUrl || item.url;

  // ── Tab config ────────────────────────────────────────────────────

  const tabs: { key: TabKey; label: string; count: number; icon: React.ReactNode }[] = [
    { key: 'github', label: 'GitHub CDN', count: githubMedia.length, icon: <Github className="w-3.5 h-3.5" /> },
    { key: 'local', label: 'Local Uploads', count: localMedia.length, icon: <HardDrive className="w-3.5 h-3.5" /> },
    { key: 'site', label: 'Site Images', count: siteImages.length, icon: <Globe className="w-3.5 h-3.5" /> },
  ];

  // ── Active data ───────────────────────────────────────────────────

  const activeData = activeTab === 'github'
    ? filteredGithub
    : activeTab === 'local'
    ? filteredLocal
    : filteredSite;

  // ── Render ────────────────────────────────────────────────────────

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
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">

            {/* ── Header ──────────────────────────────────────────── */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-bold text-[#F0EDE6] uppercase tracking-[2px]">Media Library</h1>
                <p className="text-[#8A8780] text-sm mt-1">Upload and manage images via GitHub CDN</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-sm transition-colors ${viewMode === 'grid' ? 'bg-[#FFC300]/10 text-[#FFC300]' : 'text-[#8A8780] hover:text-[#F0EDE6]'}`}
                  aria-label="Grid view"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-sm transition-colors ${viewMode === 'list' ? 'bg-[#FFC300]/10 text-[#FFC300]' : 'text-[#8A8780] hover:text-[#F0EDE6]'}`}
                  aria-label="List view"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ── Stats Bar ───────────────────────────────────────── */}
            <div className="bg-[#08080c] border border-[#1a1a22] rounded-sm p-3 mb-6 flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-[#FFC300]" />
                <span className="text-[#F0EDE6] text-xs font-semibold uppercase tracking-[1px]">Total: {totalCount} images</span>
              </div>
              <span className="text-[#1a1a22]">·</span>
              <span className="text-[#8A8780] text-xs">GitHub CDN: {githubMedia.length}</span>
              <span className="text-[#1a1a22]">·</span>
              <span className="text-[#8A8780] text-xs">Local: {localMedia.length}</span>
              <span className="text-[#1a1a22]">·</span>
              <span className="text-[#8A8780] text-xs">In Use: {siteImages.length}</span>
            </div>

            {/* ── Tabs ────────────────────────────────────────────── */}
            <div className="flex items-center gap-2 mb-6 flex-wrap">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => { setActiveTab(tab.key); setSearch(''); }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-sm text-xs font-semibold uppercase tracking-[1px] transition-colors border ${
                    activeTab === tab.key
                      ? 'bg-[#FFC300]/10 border-[#FFC300]/40 text-[#FFC300]'
                      : 'bg-[#08080c] border-[#1a1a22] text-[#8A8780] hover:text-[#F0EDE6] hover:border-[#28283a]'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  <span className={`ml-1 px-1.5 py-0.5 rounded-sm text-[9px] font-bold ${
                    activeTab === tab.key
                      ? 'bg-[#FFC300]/20 text-[#FFC300]'
                      : 'bg-[#1a1a22] text-[#4A4945]'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* ── Upload Zone (only for github / local tabs) ─────── */}
            {activeTab !== 'site' && (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-sm p-8 text-center cursor-pointer mb-6 transition-colors ${
                  isDragActive ? 'border-[#FFC300] bg-[#FFC300]/5' : 'border-[#1a1a22] hover:border-[#28283a]'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-8 h-8 text-[#8A8780] mx-auto mb-3" />
                <p className="text-[#F0EDE6] font-medium mb-1">
                  {uploading ? 'Uploading to GitHub CDN...' : isDragActive ? 'Drop files here...' : 'Drop files here or click to upload'}
                </p>
                <p className="text-[#4A4945] text-sm">Files will be uploaded to GitHub and served via jsDelivr CDN</p>
              </div>
            )}

            {/* ── Search ──────────────────────────────────────────── */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A4945]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search media files..."
                className="w-full bg-[#08080c] border border-[#1a1a22] rounded-sm pl-9 pr-4 py-3 text-[#F0EDE6] text-sm placeholder-[#4A4945] focus:outline-none focus:border-[#FFC300] transition-colors"
              />
            </div>

            {/* ── Content ─────────────────────────────────────────── */}
            {loading ? (
              <div className="bg-[#08080c] border border-[#1a1a22] rounded-sm p-12 text-center">
                <div className="w-8 h-8 border-2 border-[#FFC300]/30 border-t-[#FFC300] rounded-full animate-spin mx-auto mb-3" />
                <p className="text-[#8A8780] text-sm">Loading media...</p>
              </div>
            ) : activeData.length === 0 ? (
              <div className="bg-[#08080c] border border-[#1a1a22] rounded-sm p-12 text-center">
                <ImageIcon className="w-12 h-12 text-[#4A4945] mx-auto mb-3" />
                <p className="text-[#F0EDE6] font-medium mb-1">
                  {activeTab === 'site' ? 'No site images found' : 'No media files'}
                </p>
                <p className="text-[#4A4945] text-sm">
                  {activeTab === 'site'
                    ? 'Images used in your site sections and settings will appear here'
                    : 'Upload your first image or video'}
                </p>
              </div>
            ) : activeTab === 'site' ? (
              /* ── Site Images View ─────────────────────────────── */
              viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {filteredSite.map((si, idx) => (
                    <SiteImageCard key={`${si.url}-${idx}`} siteImage={si} copiedId={copiedId} onCopy={copyToClipboard} />
                  ))}
                </div>
              ) : (
                <div className="bg-[#08080c] border border-[#1a1a22] rounded-sm overflow-hidden">
                  <div className="divide-y divide-[#12121a]">
                    {filteredSite.map((si, idx) => (
                      <SiteImageListItem key={`${si.url}-${idx}`} siteImage={si} copiedId={copiedId} onCopy={copyToClipboard} />
                    ))}
                  </div>
                </div>
              )
            ) : viewMode === 'grid' ? (
              /* ── Grid View (GitHub / Local) ─────────────────────── */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {activeData.map((item) => {
                  const cdnUrl = getCdnUrl(item);
                  return (
                    <div
                      key={item.id}
                      className="relative group aspect-square bg-[#08080c] border border-[#1a1a22] rounded-sm overflow-hidden hover:border-[#28283a] transition-colors"
                    >
                      {item.type === 'image' ? (
                        <img src={cdnUrl} alt={item.alt_text || item.originalName || item.filename} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                          <Film className="w-8 h-8 text-[#4A4945]" />
                          <span className="text-[#4A4945] text-xs truncate max-w-full px-2">{item.originalName || item.filename}</span>
                        </div>
                      )}

                      {/* Source badge */}
                      <div className="absolute top-2 left-2">
                        <span className={`px-1.5 py-0.5 rounded-sm text-[8px] font-bold uppercase tracking-wider ${
                          isGithubCdn(item)
                            ? 'bg-[#FFC300]/20 text-[#FFC300] border border-[#FFC300]/30'
                            : 'bg-[#8A8780]/20 text-[#8A8780] border border-[#8A8780]/30'
                        }`}>
                          {isGithubCdn(item) ? 'CDN' : 'LOCAL'}
                        </span>
                      </div>

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                        <p className="text-[#F0EDE6] text-xs truncate max-w-full">{item.originalName || item.filename}</p>
                        <p className="text-[#8A8780] text-[10px]">{formatFileSize(item.size)}</p>
                        {item.uploaded_at && (
                          <p className="text-[#4A4945] text-[9px]">{formatDate(item.uploaded_at)}</p>
                        )}

                        {/* URL row with copy */}
                        <div className="w-full bg-[#0e0e14] border border-[#1a1a22] rounded-sm px-2 py-1 flex items-center gap-1">
                          <span className="text-[#FFC300] text-[8px] font-mono truncate flex-1">{cdnUrl}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(cdnUrl, item.id); }}
                            className="text-[#8A8780] hover:text-[#FFC300] transition-colors flex-shrink-0"
                            title="Copy URL"
                          >
                            {copiedId === item.id ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                          <a
                            href={cdnUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 text-[#8A8780] hover:text-[#FFC300] bg-[#0e0e14] border border-[#1a1a22] rounded-sm transition-colors"
                            title="Open URL"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                            className="p-1.5 text-red-400 hover:text-red-300 bg-red-500/10 rounded-sm"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* ── List View (GitHub / Local) ─────────────────────── */
              <div className="bg-[#08080c] border border-[#1a1a22] rounded-sm overflow-hidden">
                <div className="divide-y divide-[#12121a]">
                  {activeData.map((item) => {
                    const cdnUrl = getCdnUrl(item);
                    return (
                      <div key={item.id} className="flex items-center gap-4 p-3 hover:bg-[#0e0e14] transition-colors">
                        <div className="w-12 h-12 bg-[#0e0e14] border border-[#1a1a22] rounded-sm flex items-center justify-center overflow-hidden flex-shrink-0">
                          {item.type === 'image' ? (
                            <img src={cdnUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Film className="w-5 h-5 text-[#4A4945]" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-[#F0EDE6] text-sm truncate">{item.originalName || item.filename}</p>
                            <span className={`px-1.5 py-0.5 rounded-sm text-[8px] font-bold uppercase tracking-wider flex-shrink-0 ${
                              isGithubCdn(item)
                                ? 'bg-[#FFC300]/20 text-[#FFC300] border border-[#FFC300]/30'
                                : 'bg-[#8A8780]/20 text-[#8A8780] border border-[#8A8780]/30'
                            }`}>
                              {isGithubCdn(item) ? 'CDN' : 'LOCAL'}
                            </span>
                          </div>
                          <p className="text-[#4A4945] text-xs">{item.type} · {formatFileSize(item.size)}{item.uploaded_at ? ` · ${formatDate(item.uploaded_at)}` : ''}</p>
                          {/* URL row */}
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-[#FFC300] text-[9px] font-mono truncate max-w-[280px]">{cdnUrl}</span>
                            <button
                              onClick={() => copyToClipboard(cdnUrl, item.id)}
                              className="text-[#8A8780] hover:text-[#FFC300] transition-colors flex-shrink-0"
                              title="Copy URL"
                            >
                              {copiedId === item.id ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <a
                            href={cdnUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-[#4A4945] hover:text-[#FFC300] transition-colors"
                            title="Open URL"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-[#4A4945] hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

// ── Sub-components ──────────────────────────────────────────────────

function SiteImageCard({ siteImage, copiedId, onCopy }: {
  siteImage: SiteImage;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
}) {
  const copyId = `site-${siteImage.url}`;
  return (
    <div className="relative group aspect-square bg-[#08080c] border border-[#1a1a22] rounded-sm overflow-hidden hover:border-[#28283a] transition-colors">
      {/* Preview */}
      <div className="w-full h-full flex items-center justify-center overflow-hidden bg-[#0e0e14]">
        <img
          src={siteImage.url}
          alt={siteImage.sourceLabel}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
            (e.target as HTMLImageElement).parentElement!.innerHTML =
              '<div class="flex flex-col items-center justify-center w-full h-full"><svg class="w-8 h-8 text-[#4A4945]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>';
          }}
        />
      </div>

      {/* Source badge */}
      <div className="absolute top-2 left-2 flex flex-col gap-1">
        <span className={`px-1.5 py-0.5 rounded-sm text-[8px] font-bold uppercase tracking-wider ${
          siteImage.source === 'settings'
            ? 'bg-[#FFC300]/20 text-[#FFC300] border border-[#FFC300]/30'
            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
        }`}>
          {siteImage.source === 'settings' ? 'SETTINGS' : 'SECTION'}
        </span>
        {siteImage.storageType && (
          <span className={`px-1.5 py-0.5 rounded-sm text-[7px] font-bold uppercase tracking-wider ${
            siteImage.storageType === 'github'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              : siteImage.storageType === 'local'
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
          }`}>
            {siteImage.storageType === 'github' ? 'GITHUB' : siteImage.storageType === 'local' ? 'LOCAL' : 'EXT'}
          </span>
        )}
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
        <p className="text-[#F0EDE6] text-xs text-center leading-tight line-clamp-2">{siteImage.sourceLabel}</p>

        {/* URL row with copy */}
        <div className="w-full bg-[#0e0e14] border border-[#1a1a22] rounded-sm px-2 py-1 flex items-center gap-1">
          <span className="text-[#FFC300] text-[8px] font-mono truncate flex-1">{siteImage.url}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onCopy(siteImage.url, copyId); }}
            className="text-[#8A8780] hover:text-[#FFC300] transition-colors flex-shrink-0"
            title="Copy URL"
          >
            {copiedId === copyId ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>

        <a
          href={siteImage.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="p-1.5 text-[#8A8780] hover:text-[#FFC300] bg-[#0e0e14] border border-[#1a1a22] rounded-sm transition-colors"
          title="Open URL"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}

function SiteImageListItem({ siteImage, copiedId, onCopy }: {
  siteImage: SiteImage;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
}) {
  const copyId = `site-${siteImage.url}`;
  return (
    <div className="flex items-center gap-4 p-3 hover:bg-[#0e0e14] transition-colors">
      <div className="w-12 h-12 bg-[#0e0e14] border border-[#1a1a22] rounded-sm flex items-center justify-center overflow-hidden flex-shrink-0">
        <img
          src={siteImage.url}
          alt={siteImage.sourceLabel}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[#F0EDE6] text-sm truncate">{siteImage.sourceLabel}</p>
          <span className={`px-1.5 py-0.5 rounded-sm text-[8px] font-bold uppercase tracking-wider flex-shrink-0 ${
            siteImage.source === 'settings'
              ? 'bg-[#FFC300]/20 text-[#FFC300] border border-[#FFC300]/30'
              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          }`}>
            {siteImage.source === 'settings' ? 'SETTINGS' : 'SECTION'}
          </span>
          {siteImage.storageType && (
            <span className={`px-1.5 py-0.5 rounded-sm text-[7px] font-bold uppercase tracking-wider flex-shrink-0 ${
              siteImage.storageType === 'github'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : siteImage.storageType === 'local'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
            }`}>
              {siteImage.storageType === 'github' ? 'GITHUB' : siteImage.storageType === 'local' ? 'LOCAL' : 'EXTERNAL'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 mt-1">
          <span className="text-[#FFC300] text-[9px] font-mono truncate max-w-[280px]">{siteImage.url}</span>
          <button
            onClick={() => onCopy(siteImage.url, copyId)}
            className="text-[#8A8780] hover:text-[#FFC300] transition-colors flex-shrink-0"
            title="Copy URL"
          >
            {copiedId === copyId ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <a
          href={siteImage.url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 text-[#4A4945] hover:text-[#FFC300] transition-colors"
          title="Open URL"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
