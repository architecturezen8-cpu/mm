'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Search, Trash2, Image as ImageIcon, Film, Github, HardDrive } from 'lucide-react';

interface MediaItem {
  id: string;
  filename: string;
  url: string;
  type: 'image' | 'video';
  size?: number;
  alt_text?: string;
  uploaded_at: string;
}

interface GitHubMediaItem {
  name: string;
  path: string;
  url: string;
  cdnUrl: string;
  size: number;
  type: 'image';
}

interface MediaPanelProps {
  onSelect?: (url: string) => void;
}

type MediaSource = 'local' | 'github';

export default function MediaPanel({ onSelect }: MediaPanelProps) {
  const [localMedia, setLocalMedia] = useState<MediaItem[]>([]);
  const [githubMedia, setGithubMedia] = useState<GitHubMediaItem[]>([]);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeSource, setActiveSource] = useState<MediaSource>('local');
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubError, setGithubError] = useState<string | null>(null);

  // Load local media on mount
  const loadLocalMedia = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/media');
      if (res.ok) {
        const data = await res.json();
        setLocalMedia(data);
      }
    } catch (err) {
      console.error('Load media failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load GitHub CDN images
  const loadGithubMedia = async () => {
    setGithubLoading(true);
    setGithubError(null);
    try {
      const res = await fetch('/api/admin/github-images');
      if (res.ok) {
        const data = await res.json();
        setGithubMedia(data.images || []);
      } else {
        const data = await res.json();
        setGithubError(data.error || 'Failed to load GitHub images');
      }
    } catch (err) {
      console.error('Load GitHub media failed:', err);
      setGithubError('Failed to connect to GitHub API');
    } finally {
      setGithubLoading(false);
    }
  };

  // Load local media on mount
  useEffect(() => {
    loadLocalMedia();
  }, []);

  // Load GitHub media when tab is switched to GitHub
  useEffect(() => {
    if (activeSource === 'github' && githubMedia.length === 0 && !githubLoading) {
      loadGithubMedia();
    }
  }, [activeSource, githubMedia.length, githubLoading]);

  const onDrop = useCallback(async (files: File[]) => {
    setUploading(true);
    for (const file of files) {
      const form = new FormData();
      form.append('file', file);
      try {
        const res = await fetch('/api/admin/media', { method: 'POST', body: form });
        if (res.ok) {
          const data = await res.json();
          setLocalMedia(prev => [data, ...prev]);
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

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/admin/media?id=${id}`, { method: 'DELETE' });
      setLocalMedia(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  // Filtered lists
  const filteredLocalMedia = localMedia.filter(m =>
    m.filename.toLowerCase().includes(search.toLowerCase())
  );

  const filteredGithubMedia = githubMedia.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.path.toLowerCase().includes(search.toLowerCase())
  );

  // Format file size
  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div className="bg-[#08080c] border border-[#1a1a22] rounded-sm overflow-hidden">
      <div className="p-4 border-b border-[#1a1a22]">
        <h3 className="text-[#F0EDE6] font-semibold text-sm mb-3">Media Library</h3>

        {/* Source toggle */}
        <div className="flex gap-1 mb-3 bg-[#0e0e14] border border-[#1a1a22] rounded-sm p-0.5">
          <button
            onClick={() => setActiveSource('local')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium transition-colors ${
              activeSource === 'local'
                ? 'bg-[#FFC300] text-[#08080c]'
                : 'text-[#8A8780] hover:text-[#F0EDE6]'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            Local Uploads
          </button>
          <button
            onClick={() => setActiveSource('github')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium transition-colors ${
              activeSource === 'github'
                ? 'bg-[#FFC300] text-[#08080c]'
                : 'text-[#8A8780] hover:text-[#F0EDE6]'
            }`}
          >
            <Github className="w-3.5 h-3.5" />
            GitHub CDN
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A4945]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search media..."
            className="w-full bg-[#0e0e14] border border-[#1a1a22] rounded-sm pl-9 pr-3 py-2 text-[#F0EDE6] text-sm placeholder-[#4A4945] focus:outline-none focus:border-[#FFC300]"
          />
        </div>

        {/* Upload zone - only shown for local uploads */}
        {activeSource === 'local' && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-sm p-4 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-[#FFC300] bg-[#FFC300]/5' : 'border-[#1a1a22] hover:border-[#28283a]'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-5 h-5 text-[#8A8780] mx-auto mb-1" />
            <p className="text-[#8A8780] text-xs">
              {uploading ? 'Uploading...' : isDragActive ? 'Drop here...' : 'Drop files or click to upload'}
            </p>
          </div>
        )}
      </div>

      {/* Media grid */}
      <div className="p-3">
        {activeSource === 'local' ? (
          <>
            {loading && localMedia.length === 0 ? (
              <div className="py-6 text-center text-[#4A4945] text-xs">Loading media...</div>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                {filteredLocalMedia.length === 0 && (
                  <div className="col-span-3 py-6 text-center text-[#4A4945] text-xs">
                    No media files yet
                  </div>
                )}
                {filteredLocalMedia.map((item) => (
                  <div
                    key={item.id}
                    className="relative group aspect-square bg-[#0e0e14] border border-[#1a1a22] rounded-sm overflow-hidden cursor-pointer hover:border-[#28283a] transition-colors"
                    onClick={() => onSelect?.(item.url)}
                  >
                    {item.type === 'image' ? (
                      <img src={item.url} alt={item.alt_text || item.filename} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Film className="w-6 h-6 text-[#4A4945]" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                        className="p-1.5 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {githubLoading ? (
              <div className="py-6 text-center text-[#4A4945] text-xs flex items-center justify-center gap-2">
                <Github className="w-4 h-4 animate-spin" />
                Loading GitHub images...
              </div>
            ) : githubError ? (
              <div className="py-6 text-center">
                <p className="text-red-400/70 text-xs mb-2">{githubError}</p>
                <button
                  onClick={loadGithubMedia}
                  className="text-[#FFC300] text-xs hover:underline"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                {filteredGithubMedia.length === 0 && (
                  <div className="col-span-3 py-6 text-center text-[#4A4945] text-xs">
                    No GitHub images found
                  </div>
                )}
                {filteredGithubMedia.map((item) => (
                  <div
                    key={item.path}
                    className="relative group aspect-square bg-[#0e0e14] border border-[#1a1a22] rounded-sm overflow-hidden cursor-pointer hover:border-[#FFC300]/40 transition-colors"
                    onClick={() => onSelect?.(item.cdnUrl)}
                    title={`${item.name}\n${item.cdnUrl}\n${formatSize(item.size)}`}
                  >
                    <img
                      src={item.cdnUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
                      <ImageIcon className="w-4 h-4 text-[#FFC300]" />
                      <span className="text-[#F0EDE6] text-[8px] leading-tight text-center truncate w-full">{item.name}</span>
                      <span className="text-[#8A8780] text-[7px]">{formatSize(item.size)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Source info footer */}
        <div className="mt-2 pt-2 border-t border-[#1a1a22] text-[#4A4945] text-[10px] flex items-center justify-between">
          <span>
            {activeSource === 'local'
              ? `${localMedia.length} local file${localMedia.length !== 1 ? 's' : ''}`
              : `${githubMedia.length} GitHub image${githubMedia.length !== 1 ? 's' : ''}`
            }
          </span>
          {activeSource === 'github' && (
            <button
              onClick={loadGithubMedia}
              className="text-[#8A8780] hover:text-[#FFC300] transition-colors"
              disabled={githubLoading}
            >
              Refresh
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
