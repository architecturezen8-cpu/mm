'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';

interface PageSettings {
  title: string;
  slug: string;
  status: 'published' | 'draft';
  metaDescription?: string;
  metaKeywords?: string;
}

interface PageSettingsPanelProps {
  settings: PageSettings;
  onSave: (settings: PageSettings) => void;
}

export default function PageSettingsPanel({ settings, onSave }: PageSettingsPanelProps) {
  const [form, setForm] = useState<PageSettings>(settings);

  const handleSave = () => {
    onSave(form);
  };

  return (
    <div className="bg-[#08080c] border border-[#1a1a22] rounded-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-[#1a1a22]">
        <h3 className="text-[#F0EDE6] font-semibold text-sm">Page Settings</h3>
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFC300] text-[#020204] rounded-sm text-xs font-semibold hover:bg-[#FFD54F] transition-colors"
        >
          <Save className="w-3 h-3" />
          Save
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <label className="block text-[#8A8780] text-xs mb-1.5">Page Title</label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full bg-[#0e0e14] border border-[#1a1a22] rounded-sm px-3 py-2 text-[#F0EDE6] text-sm placeholder-[#4A4945] focus:outline-none focus:border-[#FFC300]"
          />
        </div>

        <div>
          <label className="block text-[#8A8780] text-xs mb-1.5">Slug</label>
          <input
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className="w-full bg-[#0e0e14] border border-[#1a1a22] rounded-sm px-3 py-2 text-[#F0EDE6] text-sm font-mono placeholder-[#4A4945] focus:outline-none focus:border-[#FFC300]"
          />
        </div>

        <div>
          <label className="block text-[#8A8780] text-xs mb-1.5">Status</label>
          <div className="flex gap-2">
            <button
              onClick={() => setForm({ ...form, status: 'published' })}
              className={`flex-1 py-2 rounded-sm text-xs font-medium border transition-colors ${
                form.status === 'published'
                  ? 'bg-green-500/10 text-green-400 border-green-500/30'
                  : 'bg-[#0e0e14] text-[#8A8780] border-[#1a1a22] hover:text-[#F0EDE6]'
              }`}
            >
              Published
            </button>
            <button
              onClick={() => setForm({ ...form, status: 'draft' })}
              className={`flex-1 py-2 rounded-sm text-xs font-medium border transition-colors ${
                form.status === 'draft'
                  ? 'bg-[#FFC300]/10 text-[#FFC300] border-[#FFC300]/30'
                  : 'bg-[#0e0e14] text-[#8A8780] border-[#1a1a22] hover:text-[#F0EDE6]'
              }`}
            >
              Draft
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[#8A8780] text-xs mb-1.5">Meta Description</label>
          <textarea
            value={form.metaDescription || ''}
            onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
            placeholder="SEO description..."
            rows={3}
            className="w-full bg-[#0e0e14] border border-[#1a1a22] rounded-sm px-3 py-2 text-[#F0EDE6] text-sm placeholder-[#4A4945] focus:outline-none focus:border-[#FFC300] resize-y"
          />
        </div>

        <div>
          <label className="block text-[#8A8780] text-xs mb-1.5">Meta Keywords</label>
          <input
            value={form.metaKeywords || ''}
            onChange={(e) => setForm({ ...form, metaKeywords: e.target.value })}
            placeholder="cricket, battle of the golds..."
            className="w-full bg-[#0e0e14] border border-[#1a1a22] rounded-sm px-3 py-2 text-[#F0EDE6] text-sm placeholder-[#4A4945] focus:outline-none focus:border-[#FFC300]"
          />
        </div>
      </div>
    </div>
  );
}
