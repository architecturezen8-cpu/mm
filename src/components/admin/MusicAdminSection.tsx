'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Music, Upload, Play, Pause, Volume2, VolumeX, Trash2, Repeat, Repeat1, Loader2, CheckCircle, XCircle } from 'lucide-react';

interface SongMeta {
  id: string;
  name: string;
  fileName: string;
  size: number;
  duration: number;
  uploadedAt: number;
}

interface ActiveSong {
  songId: string;
  version: number;
  volume: number;
  loop: boolean;
}

export default function MusicAdminSection() {
  const [library, setLibrary] = useState<SongMeta[]>([]);
  const [active, setActive] = useState<ActiveSong | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch library + active config
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/music');
      if (!res.ok) return;
      const data = await res.json();
      setLibrary(data.library || []);
      setActive(data.active || null);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-dismiss messages
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // ─── Upload ───
  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setMessage({ type: 'error', text: 'Select a file first' });
      return;
    }
    if (!uploadName.trim()) {
      setMessage({ type: 'error', text: 'Enter a song name' });
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', uploadName.trim());
      const res = await fetch('/api/admin/music', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: `Song "${data.song.name}" uploaded!` });
        setUploadName('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchData();
      } else {
        setMessage({ type: 'error', text: data.error || 'Upload failed' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setUploading(false);
    }
  };

  // ─── Set Active ───
  const handleSetActive = async (songId: string) => {
    setActionLoading(songId);
    try {
      const res = await fetch('/api/admin/music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setActive', songId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: data.message });
        fetchData();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to set active' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Set Volume ───
  const handleSetVolume = async (volume: number) => {
    try {
      const res = await fetch('/api/admin/music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setVolume', volume }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActive(data.active);
      }
    } catch {
      // silent
    }
  };

  // ─── Set Loop ───
  const handleSetLoop = async (loop: boolean) => {
    try {
      const res = await fetch('/api/admin/music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setLoop', loop }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActive(data.active);
      }
    } catch {
      // silent
    }
  };

  // ─── Delete ───
  const handleDelete = async (songId: string, songName: string) => {
    if (!confirm(`Delete "${songName}"? This cannot be undone.`)) return;
    setActionLoading(`del-${songId}`);
    try {
      const res = await fetch('/api/admin/music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', songId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: `Song deleted` });
        fetchData();
      } else {
        setMessage({ type: 'error', text: data.error || 'Delete failed' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Format helpers ───
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="bg-[#08080c] border border-[#1a1a22] rounded-sm mb-6">
      <div className="p-4 border-b border-[#1a1a22] flex items-center gap-2">
        <Music className="w-4 h-4 text-[#FFC300]" />
        <h2 className="text-[#F0EDE6] font-semibold text-sm uppercase tracking-[2px]">Music Manager</h2>
        {active && (
          <span className="ml-auto px-2 py-0.5 bg-[#8FB06A]/10 border border-[#8FB06A]/20 text-[#8FB06A] text-[8px] font-bold uppercase tracking-wider rounded-sm">
            Active
          </span>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Message */}
        {message && (
          <div className={`flex items-center gap-2 p-2 rounded-sm text-xs ${
            message.type === 'success' ? 'bg-green-500/5 border border-green-500/20 text-green-400' : 'bg-red-500/5 border border-red-500/20 text-red-400'
          }`}>
            {message.type === 'success' ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
            {message.text}
          </div>
        )}

        {/* Upload section */}
        <div className="bg-[#0e0e14] border border-[#1a1a22] rounded-sm p-3">
          <p className="text-[#8A8780] text-[10px] uppercase tracking-wider mb-3">Upload New Song</p>
          <div className="space-y-2">
            <input
              type="text"
              value={uploadName}
              onChange={(e) => setUploadName(e.target.value)}
              placeholder="Song name (e.g. Theme Song)"
              className="w-full bg-[#08080c] border border-[#1a1a22] rounded-sm px-3 py-2 text-[#F0EDE6] text-xs placeholder-[#4A4945] focus:outline-none focus:border-[#FFC300]"
            />
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                className="flex-1 text-[#8A8780] text-[10px] file:mr-2 file:py-1.5 file:px-3 file:border file:border-[#1a1a22] file:rounded-sm file:text-[9px] file:uppercase file:tracking-wider file:text-[#8A8780] file:bg-[#08080c] file:cursor-pointer hover:file:border-[#FFC300] hover:file:text-[#FFC300] transition-colors"
              />
              <button
                onClick={handleUpload}
                disabled={uploading || !uploadName.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#FFC300] text-[#020204] text-[9px] font-bold uppercase tracking-wider rounded-sm hover:bg-[#FFD54F] transition-colors disabled:opacity-50 disabled:cursor-wait"
              >
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
            <p className="text-[#4A4945] text-[9px]">Max 10MB • Audio files only (MP3, WAV, OGG, etc.)</p>
          </div>
        </div>

        {/* Active song controls */}
        {active && (
          <div className="bg-[#0e0e14] border border-[#8FB06A]/20 rounded-sm p-3">
            <p className="text-[#8A8780] text-[10px] uppercase tracking-wider mb-3">Now Playing</p>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 flex items-center justify-center bg-[#8FB06A]/10 rounded-full">
                <Play className="w-4 h-4 text-[#8FB06A]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#F0EDE6] text-sm font-medium truncate">
                  {library.find(s => s.id === active.songId)?.name || active.songId}
                </p>
                <p className="text-[#4A4945] text-[9px]">v{active.version} • {active.loop ? 'Loop ON' : 'Loop OFF'}</p>
              </div>
            </div>

            {/* Volume slider */}
            <div className="flex items-center gap-3 mb-2">
              {active.volume === 0 ? (
                <VolumeX className="w-3.5 h-3.5 text-[#4A4945]" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-[#8A8780]" />
              )}
              <input
                type="range"
                min={0}
                max={100}
                value={active.volume}
                onChange={(e) => handleSetVolume(parseInt(e.target.value))}
                className="flex-1 h-1 bg-[#1a1a22] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#FFC300]"
              />
              <span className="text-[#8A8780] text-[10px] font-mono w-8 text-right">{active.volume}%</span>
            </div>

            {/* Loop toggle */}
            <button
              onClick={() => handleSetLoop(!active.loop)}
              className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
              style={{ color: active.loop ? '#8FB06A' : '#4A4945' }}
            >
              {active.loop ? <Repeat1 className="w-3.5 h-3.5" /> : <Repeat className="w-3.5 h-3.5" />}
              {active.loop ? 'Loop ON' : 'Loop OFF'}
            </button>
          </div>
        )}

        {/* Library */}
        <div>
          <p className="text-[#8A8780] text-[10px] uppercase tracking-wider mb-2">
            Library {library.length > 0 && `(${library.length})`}
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-[#4A4945] animate-spin" />
            </div>
          ) : library.length === 0 ? (
            <div className="bg-[#0e0e14] border border-[#1a1a22] rounded-sm p-4 text-center">
              <Music className="w-6 h-6 text-[#4A4945] mx-auto mb-2" />
              <p className="text-[#4A4945] text-xs">No songs uploaded yet</p>
              <p className="text-[#3A3835] text-[9px] mt-1">Upload an audio file above to get started</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {library.map((song) => {
                const isActive = active?.songId === song.id;
                return (
                  <div
                    key={song.id}
                    className={`flex items-center gap-2 p-2.5 rounded-sm border transition-colors ${
                      isActive
                        ? 'bg-[#8FB06A]/5 border-[#8FB06A]/20'
                        : 'bg-[#0e0e14] border-[#1a1a22] hover:border-[#28283a]'
                    }`}
                  >
                    {/* Play/Active indicator */}
                    <div className={`w-7 h-7 flex items-center justify-center rounded-full shrink-0 ${
                      isActive ? 'bg-[#8FB06A]/10' : 'bg-[#1a1a22]'
                    }`}>
                      {isActive ? (
                        <Pause className="w-3 h-3 text-[#8FB06A]" />
                      ) : (
                        <Play className="w-3 h-3 text-[#4A4945]" />
                      )}
                    </div>

                    {/* Song info */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate ${isActive ? 'text-[#8FB06A]' : 'text-[#F0EDE6]'}`}>
                        {song.name}
                      </p>
                      <p className="text-[9px] text-[#4A4945]">
                        {formatSize(song.size)} • {formatDate(song.uploadedAt)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {!isActive && (
                        <button
                          onClick={() => handleSetActive(song.id)}
                          disabled={actionLoading === song.id}
                          className="px-2 py-1 bg-[#FFC300] text-[#020204] text-[8px] font-bold uppercase tracking-wider rounded-sm hover:bg-[#FFD54F] transition-colors disabled:opacity-50"
                          title="Set as active"
                        >
                          {actionLoading === song.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Play'}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(song.id, song.name)}
                        disabled={actionLoading === `del-${song.id}`}
                        className="p-1 text-[#4A4945] hover:text-[#C07060] transition-colors disabled:opacity-50"
                        title="Delete song"
                      >
                        {actionLoading === `del-${song.id}` ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="bg-[#0e0e14] border border-[#1a1a22] rounded-sm p-3">
          <p className="text-[#4A4945] text-[9px]">
            💡 Music is stored in Cloudflare KV. Songs auto-play on the site when set as active.
            Users can mute/unmute via the speaker icon in the navbar.
            Volume and loop settings apply to all visitors in real-time.
          </p>
        </div>
      </div>
    </div>
  );
}
