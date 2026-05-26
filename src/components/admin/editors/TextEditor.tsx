'use client';

import { useState } from 'react';
import { useAdminStore } from '@/lib/admin-store';
import { X, Bold, Italic, Underline, List, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

interface TextEditorProps {
  fieldKey: string;
  currentText?: string;
  onClose: () => void;
}

export default function TextEditor({ fieldKey, currentText, onClose }: TextEditorProps) {
  const { updateDraftContent } = useAdminStore();
  const [text, setText] = useState(currentText || '');

  const handleSave = () => {
    updateDraftContent(fieldKey, text);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#08080c] border border-[#1a1a22] rounded-sm w-full max-w-2xl shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-[#1a1a22]">
          <h3 className="text-[#F0EDE6] font-semibold">Edit Text</h3>
          <button onClick={onClose} className="text-[#8A8780] hover:text-[#F0EDE6]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {/* Simple toolbar */}
          <div className="flex items-center gap-1 mb-3 pb-3 border-b border-[#1a1a22]">
            <button className="p-2 text-[#8A8780] hover:text-[#F0EDE6] hover:bg-[#0e0e14] rounded-sm transition-colors">
              <Bold className="w-4 h-4" />
            </button>
            <button className="p-2 text-[#8A8780] hover:text-[#F0EDE6] hover:bg-[#0e0e14] rounded-sm transition-colors">
              <Italic className="w-4 h-4" />
            </button>
            <button className="p-2 text-[#8A8780] hover:text-[#F0EDE6] hover:bg-[#0e0e14] rounded-sm transition-colors">
              <Underline className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-[#1a1a22] mx-1" />
            <button className="p-2 text-[#8A8780] hover:text-[#F0EDE6] hover:bg-[#0e0e14] rounded-sm transition-colors">
              <List className="w-4 h-4" />
            </button>
            <button className="p-2 text-[#8A8780] hover:text-[#F0EDE6] hover:bg-[#0e0e14] rounded-sm transition-colors">
              <AlignLeft className="w-4 h-4" />
            </button>
            <button className="p-2 text-[#8A8780] hover:text-[#F0EDE6] hover:bg-[#0e0e14] rounded-sm transition-colors">
              <AlignCenter className="w-4 h-4" />
            </button>
            <button className="p-2 text-[#8A8780] hover:text-[#F0EDE6] hover:bg-[#0e0e14] rounded-sm transition-colors">
              <AlignRight className="w-4 h-4" />
            </button>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-64 bg-[#0e0e14] border border-[#1a1a22] rounded-sm px-4 py-3 text-[#F0EDE6] text-sm placeholder-[#4A4945] focus:outline-none focus:border-[#FFC300] transition-colors resize-y"
            placeholder="Enter text content..."
          />
        </div>

        <div className="flex gap-2 p-4 border-t border-[#1a1a22]">
          <button onClick={onClose} className="flex-1 py-2 rounded-sm bg-[#0e0e14] text-[#F0EDE6] text-sm hover:bg-[#141418] border border-[#1a1a22] transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2 rounded-sm bg-[#FFC300] text-[#020204] text-sm font-semibold hover:bg-[#FFD54F] transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
