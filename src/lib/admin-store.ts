import { create } from 'zustand';

interface AdminStore {
  // Edit mode
  isEditMode: boolean;
  setEditMode: (v: boolean) => void;

  // Active page being edited
  currentPageId: string | null;
  setCurrentPageId: (id: string | null) => void;

  // Unsaved changes tracker
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (v: boolean) => void;

  // Currently selected element for editing
  selectedElement: { id: string; type: string } | null;
  setSelectedElement: (el: { id: string; type: string } | null) => void;

  // Publish status
  publishStatus: 'published' | 'draft' | 'saving';
  setPublishStatus: (s: 'published' | 'draft' | 'saving') => void;

  // Page content draft (local state before publish)
  draftContent: Record<string, unknown>;
  updateDraftContent: (key: string, value: unknown) => void;
  resetDraft: () => void;

  // Admin sidebar state
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
}

export const useAdminStore = create<AdminStore>((set) => ({
  isEditMode: false,
  setEditMode: (v) => set({ isEditMode: v }),

  currentPageId: null,
  setCurrentPageId: (id) => set({ currentPageId: id }),

  hasUnsavedChanges: false,
  setHasUnsavedChanges: (v) => set({ hasUnsavedChanges: v }),

  selectedElement: null,
  setSelectedElement: (el) => set({ selectedElement: el }),

  publishStatus: 'published',
  setPublishStatus: (s) => set({ publishStatus: s }),

  draftContent: {},
  updateDraftContent: (key, value) =>
    set((state) => ({
      draftContent: { ...state.draftContent, [key]: value },
      hasUnsavedChanges: true,
    })),
  resetDraft: () => set({ draftContent: {}, hasUnsavedChanges: false }),

  sidebarOpen: true,
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
}));
