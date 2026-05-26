'use client';

import { useAdminStore } from '@/lib/admin-store';
import { Pencil, Image, Video, Link2, Type } from 'lucide-react';
import { useState } from 'react';

interface EditableRegionProps {
  id: string;
  type: 'text' | 'image' | 'video' | 'link' | 'section';
  label?: string;
  children: React.ReactNode;
  onEdit?: () => void;
}

const typeIcons = {
  text: Type,
  image: Image,
  video: Video,
  link: Link2,
  section: Pencil,
};

const typeColors: Record<string, string> = {
  text: '#3B82F6',
  image: '#A855F7',
  video: '#EF4444',
  link: '#22C55E',
  section: '#FFC300',
};

export default function EditableRegion({
  id, type, label, children, onEdit
}: EditableRegionProps) {
  const { isEditMode, setSelectedElement } = useAdminStore();
  const [isHovered, setIsHovered] = useState(false);

  if (!isEditMode) return <>{children}</>;

  const Icon = typeIcons[type];
  const color = typeColors[type];

  const handleEdit = () => {
    setSelectedElement({ id, type });
    onEdit?.();
  };

  return (
    <div
      className={`relative group transition-all duration-150 ${
        isHovered ? 'ring-2 rounded-sm' : ''
      }`}
      style={isHovered ? { ringColor: color, outlineColor: color, boxShadow: `0 0 0 2px ${color}40` } : {}}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}

      {/* Edit button - shows on hover */}
      {isHovered && (
        <button
          onClick={handleEdit}
          className="absolute top-1 right-1 z-50 flex items-center gap-1 px-2 py-1 rounded-sm text-xs font-medium shadow-lg backdrop-blur-sm transition-all text-white"
          style={{ backgroundColor: color }}
        >
          <Icon className="w-3 h-3" />
          {label || `Edit ${type}`}
        </button>
      )}

      {/* Type indicator */}
      {isHovered && (
        <div
          className="absolute top-1 left-1 z-50 px-1.5 py-0.5 rounded-sm text-[10px] font-mono bg-[#030303]/90 border"
          style={{ color, borderColor: `${color}40` }}
        >
          {type}:{id}
        </div>
      )}
    </div>
  );
}
