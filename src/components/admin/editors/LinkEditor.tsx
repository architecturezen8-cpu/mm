'use client';

import { useState } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { useAdminStore } from '@/lib/admin-store';

interface LinkEditorProps {
  fieldKey: string;
  currentUrl?: string;
  currentLabel?: string;
  onClose: () => void;
}

export default function LinkEditor({ fieldKey, currentUrl, currentLabel, onClose }: LinkEditorProps) {
  const { updateDraftContent } = useAdminStore();
  const [url, setUrl] = useState(currentUrl || '');
  const [label, setLabel] = useState(currentLabel || '');

  const handleSave = () => {
    updateDraftContent(fieldKey, { url, label });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#08080c] border border-[#1a1a22] rounded-sm w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-[#1a1a22]">
          <h3 className="text-[#F0EDE6] font-semibold flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-green-400" /> Edit Link
          </h3>
          <button onClick={onClose} className="text-[#8A8780] hover:text-[#F0EDE6]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-[#8A8780] text-sm mb-1.5">Link Label</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Button text..."
              className="w-full bg-[#0e0e14] border border-[#1a1a22] rounded-sm px-3 py-2.5 text-[#F0EDE6] text-sm placeholder-[#4A4945] focus:outline-none focus:border-[#FFC300]"
            />
          </div>
          <div>
            <label className="block text-[#8A8780] text-sm mb-1.5">URL</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-[#0e0e14] border border-[#1a1a22] rounded-sm px-3 py-2.5 text-[#F0EDE6] text-sm placeholder-[#4A4945] focus:outline-none focus:border-[#FFC300]"
            />
          </div>
        </div>

        <div className="flex gap-2 p-4 border-t border-[#1a1a22]">
          <button onClick={onClose} className="flex-1 py-2 rounded-sm bg-[#0e0e14] text-[#F0EDE6] text-sm hover:bg-[#141418] border border-[#1a1a22] transition-colors">Cancel</button>
          <button onClick={handleSave} className="flex-1 py-2 rounded-sm bg-[#FFC300] text-[#020204] text-sm font-semibold hover:bg-[#FFD54F] transition-colors">Apply</button>
        </div>
      </div>
    </div>
  );
}
