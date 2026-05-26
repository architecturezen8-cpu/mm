'use client';

import { useState } from 'react';
import { X, Youtube } from 'lucide-react';
import { useAdminStore } from '@/lib/admin-store';

interface VideoEditorProps {
  fieldKey: string;
  currentUrl?: string;
  onClose: () => void;
}

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return match ? match[1] : null;
}

export default function VideoEditor({ fieldKey, currentUrl, onClose }: VideoEditorProps) {
  const { updateDraftContent } = useAdminStore();
  const [url, setUrl] = useState(currentUrl || '');

  const youtubeId = getYouTubeId(url);

  const handleSave = () => {
    updateDraftContent(fieldKey, url);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#08080c] border border-[#1a1a22] rounded-sm w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-[#1a1a22]">
          <h3 className="text-[#F0EDE6] font-semibold flex items-center gap-2">
            <Youtube className="w-4 h-4 text-red-500" /> Edit Video
          </h3>
          <button onClick={onClose} className="text-[#8A8780] hover:text-[#F0EDE6]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {youtubeId && (
            <div className="aspect-video rounded-sm overflow-hidden border border-[#1a1a22]">
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}`}
                className="w-full h-full"
                allowFullScreen
              />
            </div>
          )}
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste YouTube or video URL..."
            className="w-full bg-[#0e0e14] border border-[#1a1a22] rounded-sm px-3 py-3 text-[#F0EDE6] text-sm placeholder-[#4A4945] focus:outline-none focus:border-[#FFC300]"
          />
        </div>

        <div className="flex gap-2 p-4 border-t border-[#1a1a22]">
          <button onClick={onClose} className="flex-1 py-2 rounded-sm bg-[#0e0e14] text-[#F0EDE6] text-sm hover:bg-[#141418] border border-[#1a1a22] transition-colors">Cancel</button>
          <button onClick={handleSave} className="flex-1 py-2 rounded-sm bg-[#FFC300] text-[#020204] text-sm font-semibold hover:bg-[#FFD54F] transition-colors">Apply</button>
        </div>
      </div>
    </div>
  );
}
