'use client';

import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, Youtube, Upload, Link2, Play, Trash2 } from 'lucide-react';

interface VideoFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  showUpload?: boolean;
}

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return match ? match[1] : null;
}

function getVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
}

export default function VideoField({
  label,
  value,
  onChange,
  placeholder = 'Paste YouTube, Vimeo or video URL',
  showUpload = true,
}: VideoFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const youtubeId = getYouTubeId(value);
  const vimeoId = getVimeoId(value);

  const handleUrlApply = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput('');
      setShowUrlInput(false);
    }
  };

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    setUploading(true);
    const form = new FormData();
    form.append('file', file);

    try {
      const res = await fetch('/api/admin/media', { method: 'POST', body: form });
      if (res.ok) {
        const data = await res.json();
        onChange(data.url);
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  }, [onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'video/*': [] },
    maxFiles: 1,
  });

  return (
    <div>
      <label className="block text-[#8A8780] text-sm mb-1.5 flex items-center gap-1.5">
        <Youtube className="w-3.5 h-3.5 text-red-500" />
        {label}
      </label>

      {/* Video preview */}
      {value && (
        <div className="mb-2 group relative">
          {youtubeId && (
            <div className="aspect-video rounded-sm overflow-hidden border border-[#1a1a22]">
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}`}
                className="w-full h-full"
                allowFullScreen
              />
            </div>
          )}
          {vimeoId && (
            <div className="aspect-video rounded-sm overflow-hidden border border-[#1a1a22]">
              <iframe
                src={`https://player.vimeo.com/video/${vimeoId}`}
                className="w-full h-full"
                allowFullScreen
              />
            </div>
          )}
          {!youtubeId && !vimeoId && (
            <div className="aspect-video bg-[#0e0e14] border border-[#1a1a22] rounded-sm flex flex-col items-center justify-center gap-2">
              <Play className="w-8 h-8 text-[#4A4945]" />
              <p className="text-[#4A4945] text-xs">Video file</p>
              <p className="text-[#4A4945] text-[10px] font-mono truncate max-w-full px-4">{value}</p>
            </div>
          )}
          {/* Overlay controls */}
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onChange('')}
              className="p-1.5 bg-black/60 text-red-400 rounded-sm hover:bg-black/80 transition-colors"
              title="Remove video"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowUrlInput(true)}
              className="p-1.5 bg-black/60 text-[#8A8780] rounded-sm hover:text-[#F0EDE6] transition-colors"
              title="Change URL"
            >
              <Link2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* URL input or upload */}
      {!value && (
        <div className="space-y-2">
          {/* Direct URL input */}
          <div className="flex gap-1.5">
            <input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUrlApply()}
              placeholder={placeholder}
              className="flex-1 bg-[#0e0e14] border border-[#1a1a22] rounded-sm px-2.5 py-2 text-[#F0EDE6] text-xs placeholder-[#4A4945] focus:outline-none focus:border-[#FFC300]"
            />
            <button
              onClick={handleUrlApply}
              disabled={!urlInput.trim()}
              className="px-3 py-2 bg-[#FFC300] text-[#020204] rounded-sm text-xs font-medium hover:bg-[#FFD54F] disabled:opacity-40 transition-colors"
            >
              Apply
            </button>
          </div>

          {/* Or upload */}
          {showUpload && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-sm p-3 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-[#FFC300] bg-[#FFC300]/5' : 'border-[#1a1a22] hover:border-[#28283a]'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-4 h-4 text-[#4A4945] mx-auto mb-1" />
              <p className="text-[#8A8780] text-xs">
                {uploading ? 'Uploading...' : isDragActive ? 'Drop video here' : 'Or upload video file'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Change URL input (shown when video exists and user clicks change) */}
      {value && showUrlInput && (
        <div className="flex gap-1.5 mt-2">
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUrlApply()}
            placeholder="New video URL..."
            className="flex-1 bg-[#0e0e14] border border-[#1a1a22] rounded-sm px-2.5 py-1.5 text-[#F0EDE6] text-xs placeholder-[#4A4945] focus:outline-none focus:border-[#FFC300]"
            autoFocus
          />
          <button
            onClick={handleUrlApply}
            className="px-3 py-1.5 bg-[#FFC300] text-[#020204] rounded-sm text-xs font-medium hover:bg-[#FFD54F] transition-colors"
          >
            Apply
          </button>
          <button
            onClick={() => { setShowUrlInput(false); setUrlInput(''); }}
            className="px-2 py-1.5 text-[#4A4945] hover:text-[#8A8780] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
