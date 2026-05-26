'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Link2 } from 'lucide-react';
import { useAdminStore } from '@/lib/admin-store';

interface ImageEditorProps {
  fieldKey: string;
  currentUrl?: string;
  onClose: () => void;
}

export default function ImageEditor({ fieldKey, currentUrl, onClose }: ImageEditorProps) {
  const { updateDraftContent } = useAdminStore();
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState(currentUrl || '');
  const [preview, setPreview] = useState(currentUrl || '');

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    form.append('fieldKey', fieldKey);

    try {
      const res = await fetch('/api/admin/media', { method: 'POST', body: form });
      const { url } = await res.json();
      setPreview(url);
      updateDraftContent(fieldKey, url);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  }, [fieldKey, updateDraftContent]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
  });

  const handleUrlSave = () => {
    updateDraftContent(fieldKey, urlInput);
    setPreview(urlInput);
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#08080c] border border-[#1a1a22] rounded-sm w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-[#1a1a22]">
          <h3 className="text-[#F0EDE6] font-semibold">Edit Image</h3>
          <button onClick={onClose} className="text-[#8A8780] hover:text-[#F0EDE6]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Preview */}
          {preview && (
            <img src={preview} alt="" className="w-full h-40 object-cover rounded-sm border border-[#1a1a22]" />
          )}

          {/* Upload zone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-sm p-6 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-[#FFC300] bg-[#FFC300]/5' : 'border-[#1a1a22] hover:border-[#28283a]'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-6 h-6 text-[#8A8780] mx-auto mb-2" />
            <p className="text-[#8A8780] text-sm">
              {uploading ? 'Uploading...' : isDragActive ? 'Drop here...' : 'Drag image or click to upload'}
            </p>
          </div>

          {/* Or URL */}
          <div className="flex gap-2">
            <input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Or paste image URL..."
              className="flex-1 bg-[#0e0e14] border border-[#1a1a22] rounded-sm px-3 py-2 text-[#F0EDE6] text-sm placeholder-[#4A4945] focus:outline-none focus:border-[#FFC300]"
            />
            <button
              onClick={handleUrlSave}
              className="px-4 py-2 bg-[#FFC300] text-[#020204] rounded-sm text-sm font-medium hover:bg-[#FFD54F] transition-colors"
            >
              Use URL
            </button>
          </div>
        </div>

        <div className="flex gap-2 p-4 border-t border-[#1a1a22]">
          <button onClick={onClose} className="flex-1 py-2 rounded-sm bg-[#0e0e14] text-[#F0EDE6] text-sm hover:bg-[#141418] border border-[#1a1a22] transition-colors">
            Cancel
          </button>
          <button
            onClick={() => { updateDraftContent(fieldKey, preview); onClose(); }}
            className="flex-1 py-2 rounded-sm bg-[#FFC300] text-[#020204] text-sm font-semibold hover:bg-[#FFD54F] transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
