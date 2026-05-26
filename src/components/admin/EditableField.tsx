'use client';

import { ReactNode, useState } from 'react';
import { useAdminEdit, EditableSectionData } from '@/lib/AdminEditContext';

interface EditableFieldProps {
  sectionId: string;
  pageId: string;
  type: string;
  title: string;
  sectionContent: Record<string, unknown>;
  fieldKey: string;
  fieldType?: 'text' | 'image' | 'video';
  children: ReactNode;
  className?: string;
}

export default function EditableField({
  sectionId,
  pageId,
  type,
  title,
  sectionContent,
  fieldKey,
  fieldType = 'text',
  children,
  className = '',
}: EditableFieldProps) {
  const { isAdmin, isInAdminContext, editMode, setEditingSection, setFocusedField, sectionData } = useAdminEdit();
  const [isHovered, setIsHovered] = useState(false);

  // Only allow editing when admin is in the /admin/dashboard context
  const canEdit = isAdmin && isInAdminContext && editMode;

  if (!canEdit) {
    return <>{children}</>;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Use saved section data from API if available
    const savedSection = sectionData[sectionId];
    const sectionDataToEdit: EditableSectionData = savedSection
      ? {
          id: sectionId,
          page_id: savedSection.page_id || pageId,
          type: savedSection.type || type,
          title: savedSection.title || title,
          content: savedSection.content || sectionContent,
          position: savedSection.position || 0,
          is_visible: savedSection.is_visible !== false,
          is_published: savedSection.is_published !== false,
        }
      : {
          id: sectionId,
          page_id: pageId,
          type,
          title,
          content: sectionContent,
          position: 0,
          is_visible: true,
        };
    setEditingSection(sectionDataToEdit);
    setFocusedField(fieldKey);
  };

  return (
    <div
      className={`relative group/field ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
    >
      {/* Hover highlight for individual field */}
      {isHovered && (
        <div
          className="absolute inset-0 z-20 pointer-events-none"
          style={{
            outline: '1px dashed rgba(255, 195, 0, 0.5)',
            outlineOffset: '2px',
          }}
        />
      )}

      {/* Small edit indicator */}
      {isHovered && (
        <div
          className="absolute -top-1 -right-1 z-30 w-4 h-4 bg-gold flex items-center justify-center"
          style={{ borderRadius: 0 }}
        >
          <svg className="w-2.5 h-2.5 text-lux-bg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
      )}

      {children}
    </div>
  );
}
