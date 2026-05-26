'use client';

import { useState } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, Eye, EyeOff } from 'lucide-react';

interface Section {
  id: string;
  type: string;
  title?: string;
  content: Record<string, unknown>;
  position: number;
  is_visible: boolean;
}

interface SectionPanelProps {
  sections: Section[];
  onAdd: (type: string) => void;
  onDelete: (id: string) => void;
  onReorder: (id: string, direction: 'up' | 'down') => void;
  onToggleVisibility: (id: string) => void;
  onEdit: (section: Section) => void;
}

const sectionTypeLabels: Record<string, string> = {
  hero: 'Hero Banner',
  news: 'News & Updates',
  gallery: 'Photo Gallery',
  video: 'Video Section',
  text: 'Text Content',
  players: 'Players Section',
  stats: 'Statistics',
};

export default function SectionPanel({ sections, onAdd, onDelete, onReorder, onToggleVisibility, onEdit }: SectionPanelProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);

  const sortedSections = [...sections].sort((a, b) => a.position - b.position);

  return (
    <div className="bg-[#08080c] border border-[#1a1a22] rounded-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-[#1a1a22]">
        <h3 className="text-[#F0EDE6] font-semibold text-sm">Sections</h3>
        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFC300] text-[#020204] rounded-sm text-xs font-semibold hover:bg-[#FFD54F] transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add
          </button>

          {showAddMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-[#0e0e14] border border-[#1a1a22] rounded-sm shadow-xl z-50 py-1">
              {Object.entries(sectionTypeLabels).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => { onAdd(value); setShowAddMenu(false); }}
                  className="w-full text-left px-3 py-2 text-sm text-[#8A8780] hover:text-[#F0EDE6] hover:bg-[#141418] transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="divide-y divide-[#12121a] max-h-96 overflow-y-auto">
        {sortedSections.length === 0 && (
          <div className="p-6 text-center text-[#4A4945] text-sm">
            No sections yet. Click &quot;Add&quot; to create one.
          </div>
        )}

        {sortedSections.map((section, index) => (
          <div
            key={section.id}
            className={`flex items-center gap-2 p-3 hover:bg-[#0e0e14] transition-colors cursor-pointer ${
              !section.is_visible ? 'opacity-50' : ''
            }`}
            onClick={() => onEdit(section)}
          >
            <div className="flex flex-col gap-0.5">
              <button
                onClick={(e) => { e.stopPropagation(); onReorder(section.id, 'up'); }}
                disabled={index === 0}
                className="text-[#4A4945] hover:text-[#8A8780] disabled:opacity-20 transition-colors"
              >
                <ChevronUp className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onReorder(section.id, 'down'); }}
                disabled={index === sortedSections.length - 1}
                className="text-[#4A4945] hover:text-[#8A8780] disabled:opacity-20 transition-colors"
              >
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[#F0EDE6] text-sm truncate">{section.title || sectionTypeLabels[section.type] || section.type}</p>
              <p className="text-[#4A4945] text-xs">{sectionTypeLabels[section.type] || section.type}</p>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); onToggleVisibility(section.id); }}
                className="p-1.5 text-[#4A4945] hover:text-[#8A8780] transition-colors"
              >
                {section.is_visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(section.id); }}
                className="p-1.5 text-[#4A4945] hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
