'use client';

import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Link2, Image as ImageIcon, Star, Trash2 } from 'lucide-react';

interface ImageFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  showEmblemBadge?: boolean;
  isEmblem?: boolean;
  aspectHint?: string;
}

/**
 * Upload file to GitHub CDN, with fallback to local upload
 */
async function uploadFile(file: File): Promise<{ url: string; source: string } | null> {
  const form = new FormData();
  form.append('file', file);

  try {
    // Try GitHub CDN upload first
    const res = await fetch('/api/admin/github-upload', { method: 'POST', body: form });
    if (res.ok) {
      const data = await res.json();
      return { url: data.cdnUrl || data.url, source: 'github' };
    }
    // Parse error for user feedback
    const errorData = await res.json().catch(() => null);
    console.warn('GitHub upload failed:', errorData?.error || res.statusText);
  } catch (err) {
    console.warn('GitHub upload failed, trying fallback:', err);
  }

  try {
    // Fallback to local upload
    const res = await fetch('/api/admin/media', { method: 'POST', body: form });
    if (res.ok) {
      const data = await res.json();
      return { url: data.url, source: 'local' };
    }
  } catch (err) {
    console.error('All upload methods failed:', err);
  }

  return null;
}

export default function ImageField({
  label,
  value,
  onChange,
  placeholder = 'Upload or paste image URL',
  showEmblemBadge = false,
  isEmblem = false,
  aspectHint,
}: ImageFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadSource, setUploadSource] = useState<string>('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    setUploading(true);
    setUploadSource('');
    try {
      const result = await uploadFile(file);
      if (result) {
        onChange(result.url);
        setUploadSource(result.source);
        setImageError(false);
      }
    } finally {
      setUploading(false);
    }
  }, [onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
  });

  const handleUrlApply = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput('');
      setShowUrlInput(false);
      setImageError(false);
    }
  };

  const handleRemove = () => {
    onChange('');
    setImageError(false);
  };

  const isPreviewable = value && !imageError;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[#8A8780] text-sm flex items-center gap-1.5">
          {isEmblem && <Star className="w-3 h-3 text-[#FFC300]" />}
          {label}
        </label>
        {aspectHint && <span className="text-[#4A4945] text-[10px]">{aspectHint}</span>}
      </div>

      {/* Preview area */}
      {isPreviewable && (
        <div className="relative mb-2 group">
          <div className={`bg-[#0e0e14] border border-[#1a1a22] rounded-sm overflow-hidden ${
            isEmblem ? 'w-24 h-24 mx-auto' : 'w-full h-40'
          }`}>
            <img
              src={value}
              alt={label}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          </div>
          {/* Overlay controls */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-sm">
            <button
              onClick={handleRemove}
              className="p-1.5 bg-red-500/20 text-red-400 rounded-sm hover:bg-red-500/30 transition-colors"
              title="Remove image"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowUrlInput(true)}
              className="p-1.5 bg-[#0e0e14]/80 text-[#8A8780] rounded-sm hover:text-[#F0EDE6] transition-colors"
              title="Change URL"
            >
              <Link2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 bg-[#0e0e14]/80 text-[#8A8780] rounded-sm hover:text-[#F0EDE6] transition-colors"
              title="Upload new"
            >
              <Upload className="w-3.5 h-3.5" />
            </button>
          </div>
          {showEmblemBadge && (
            <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-[#FFC300] text-[#020204] text-[9px] font-bold rounded-sm uppercase tracking-wider">
              Emblem
            </div>
          )}
          {/* URL display */}
          <p className="text-[#4A4945] text-[10px] font-mono truncate mt-1 text-center">{value}</p>
        </div>
      )}

      {/* Upload zone (shown when no image) */}
      {!isPreviewable && (
        <div className="space-y-2">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-sm p-4 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-[#FFC300] bg-[#FFC300]/5' : 'border-[#1a1a22] hover:border-[#28283a]'
            } ${isEmblem ? 'w-32 h-32 mx-auto flex flex-col items-center justify-center' : ''}`}
          >
            <input {...getInputProps()} />
            <Upload className={`text-[#4A4945] mx-auto mb-1 ${isEmblem ? 'w-5 h-5' : 'w-5 h-5'}`} />
            <p className="text-[#8A8780] text-xs">
              {uploading ? 'Uploading to CDN...' : isDragActive ? 'Drop here' : 'Upload'}
            </p>
          </div>
          {uploadSource && (
            <p className={`text-[9px] font-semibold uppercase tracking-wider text-center ${uploadSource === 'github' ? 'text-green-400' : 'text-[#FFC300]'}`}>
              {uploadSource === 'github' ? '✓ Uploaded to GitHub CDN' : '⚠ Saved locally (GitHub not configured)'}
            </p>
          )}

          {/* URL input toggle */}
          {!showUrlInput ? (
            <button
              onClick={() => setShowUrlInput(true)}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[#8A8780] text-xs hover:text-[#F0EDE6] transition-colors"
            >
              <Link2 className="w-3 h-3" />
              Or paste image URL
            </button>
          ) : (
            <div className="flex gap-1.5">
              <input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUrlApply()}
                placeholder="https://cdn.jsdelivr.net/gh/..."
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
      )}

      {/* Hidden file input for re-upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setUploading(true);
          setUploadSource('');
          try {
            const result = await uploadFile(file);
            if (result) {
              onChange(result.url);
              setUploadSource(result.source);
              setImageError(false);
            }
          } finally {
            setUploading(false);
          }
        }}
      />
    </div>
  );
}
