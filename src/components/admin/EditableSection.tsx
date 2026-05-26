'use client';

import { ReactNode, useState } from 'react';
import { useAdminEdit, EditableSectionData } from '@/lib/AdminEditContext';

interface EditableSectionProps {
  sectionId: string;
  pageId: string;
  type: string;
  title: string;
  content: Record<string, unknown>;
  children: ReactNode;
  className?: string;
}

export default function EditableSection({
  sectionId,
  pageId,
  type,
  title,
  content,
  children,
  className = '',
}: EditableSectionProps) {
  const { isAdmin, isInAdminContext, editMode, setEditingSection, sectionData } = useAdminEdit();
  const [isHovered, setIsHovered] = useState(false);

  // Only allow editing when admin is in the /admin/dashboard context
  // This prevents editing tools from showing on direct URL access outside admin dashboard
  const canEdit = isAdmin && isInAdminContext && editMode;

  // Check if section is visible
  const savedSection = sectionData[sectionId];
  const isPublished = savedSection?.is_published !== false;
  const isVisible = savedSection?.is_visible !== false;

  // For non-admin users or when not in edit mode, hide invisible sections
  if (!isVisible && !canEdit) {
    return null;
  }

  // For admin in edit mode (inside admin dashboard), show hidden sections with indicator
  if (!isVisible && canEdit) {
    return (
      <div
        className={`relative ${className}`}
        onClick={(e) => {
          e.stopPropagation();
          const safeSavedContent = savedSection?.content && typeof savedSection.content === 'object' && !Array.isArray(savedSection.content)
            ? savedSection.content : undefined;
          const safePropContent = content && typeof content === 'object' && !Array.isArray(content) ? content : {};
          const sectionDataToEdit: EditableSectionData = savedSection
            ? {
                id: sectionId,
                page_id: savedSection.page_id || pageId,
                type: savedSection.type || type,
                title: savedSection.title || title,
                content: safeSavedContent || safePropContent,
                position: savedSection.position || 0,
                is_visible: false,
                is_published: savedSection.is_published !== false,
              }
            : {
                id: sectionId,
                page_id: pageId,
                type,
                title,
                content: safePropContent,
                position: 0,
                is_visible: true,
              };
          setEditingSection(sectionDataToEdit);
        }}
        style={{ cursor: 'pointer' }}
      >
        <div className="absolute inset-0 z-30 bg-red-500/5 border-2 border-dashed border-red-500/30 flex items-center justify-center">
          <div className="px-4 py-2 bg-red-500/20 text-red-400 text-[10px] uppercase tracking-[2px] font-bold border border-red-500/30">
            Hidden Section — Click to Restore
          </div>
        </div>
        <div className="opacity-20 pointer-events-none">{children}</div>
      </div>
    );
  }

  // If not in edit mode (not admin, not in dashboard, or edit mode off), just render children
  if (!canEdit) {
    return <>{children}</>;
  }

  // Below this point: canEdit is true (admin + in admin dashboard + edit mode)

  const handleClick = (e: React.MouseEvent) => {
    // Don't open edit panel if clicking on an interactive child element
    const target = e.target as HTMLElement;
    const interactiveEl = target.closest('a, button, [data-clickable], [role="button"], input, textarea, select, iframe, [data-edit-exclude]');
    if (interactiveEl && interactiveEl !== e.currentTarget) {
      return; // Let the interactive element handle the click
    }
    e.stopPropagation();
    // Use saved section data from API if available, otherwise fall back to props
    // Safely handle content that might not be an object
    const safeSavedContent = savedSection?.content && typeof savedSection.content === 'object' && !Array.isArray(savedSection.content)
      ? savedSection.content : undefined;
    const safePropContent = content && typeof content === 'object' && !Array.isArray(content) ? content : {};
    const sectionDataToEdit: EditableSectionData = savedSection
      ? {
          id: sectionId,
          page_id: savedSection.page_id || pageId,
          type: savedSection.type || type,
          title: savedSection.title || title,
          content: safeSavedContent || safePropContent,
          position: savedSection.position || 0,
          is_visible: savedSection.is_visible !== false,
          is_published: savedSection.is_published !== false,
        }
      : {
          id: sectionId,
          page_id: pageId,
          type,
          title,
          content: safePropContent,
          position: 0,
          is_visible: true,
        };
    setEditingSection(sectionDataToEdit);
  };

  return (
    <div
      className={`relative group/editable ${!isPublished ? 'opacity-70' : ''} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
    >
      {/* Edit overlay border */}
      {isHovered && (
        <div
          className="absolute inset-0 z-30 pointer-events-none"
          style={{
            outline: !isPublished ? '2px solid rgba(234, 179, 8, 0.4)' : '2px solid rgba(255, 195, 0, 0.6)',
            outlineOffset: '-2px',
            backgroundColor: !isPublished ? 'rgba(234, 179, 8, 0.05)' : 'rgba(255, 195, 0, 0.03)',
          }}
        />
      )}

      {/* Draft badge */}
      {!isPublished && (
        <div
          className="absolute top-2 left-2 z-40 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
          style={{ borderRadius: 0, fontSize: '8px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' }}
        >
          Draft
        </div>
      )}

      {/* Edit button badge */}
      {isHovered && (
        <div
          className="absolute top-2 right-2 z-40 flex items-center gap-1.5 px-2.5 py-1 bg-gold text-lux-bg"
          style={{ borderRadius: 0, fontSize: '9px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase' }}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit
        </div>
      )}

      {/* Section type label */}
      {isHovered && (
        <div
          className="absolute bottom-2 left-2 z-40 px-2 py-0.5 bg-lux-bg border border-gold/30 text-gold"
          style={{ borderRadius: 0, fontSize: '8px', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase' }}
        >
          {type} — {title}
        </div>
      )}

      {children}
    </div>
  );
}
