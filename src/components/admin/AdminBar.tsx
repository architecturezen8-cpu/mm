'use client';

import { useAdminStore } from '@/lib/admin-store';
import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Save, Eye, Pencil, LogOut, FileText, LayoutDashboard, Menu, X, CheckCircle, XCircle, Loader2, Rocket } from 'lucide-react';

interface NDJSONProgress {
  step: number | string;
  total?: number;
  message: string;
  status: 'processing' | 'done' | 'error' | 'complete' | 'partial';
  key?: string;
  version?: string;
}

// NDJSON progress reader
async function readPublishProgress(
  response: Response, 
  onProgress: (msg: NDJSONProgress) => void
): Promise<NDJSONProgress | null> {
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finalMsg: NDJSONProgress | null = null;
  
  if (!reader) return null;
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    
    for (const line of lines) {
      if (line.trim()) {
        try {
          const progress = JSON.parse(line) as NDJSONProgress;
          onProgress(progress);
          if (progress.step === 'final') {
            finalMsg = progress;
          }
        } catch {}
      }
    }
  }
  
  return finalMsg;
}

export default function AdminBar() {
  const {
    isEditMode, setEditMode,
    publishStatus, setPublishStatus,
    hasUnsavedChanges, setHasUnsavedChanges,
    currentPageId, draftContent, resetDraft,
    sidebarOpen, setSidebarOpen,
  } = useAdminStore();

  const [isSaving, setIsSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [publishProgress, setPublishProgress] = useState<NDJSONProgress[]>([]);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<{ name?: string; email?: string; image?: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/session', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!cancelled) setAdminUser(data?.user || null);
      })
      .catch(() => {
        if (!cancelled) setAdminUser(null);
      });
    return () => { cancelled = true; };
  }, []);

  const handleLogout = useCallback(async () => {
    try { await fetch('/api/admin/logout', { method: 'POST' }); } catch {}
    window.location.href = '/admin/login';
  }, []);

  // Save & Preview handler (saves to Turso only)
  const handleSavePreview = useCallback(async () => {
    setPublishing(true);
    setPublishStatus('saving');
    setPublishProgress([]);
    setPublishSuccess(false);
    setPublishError(null);

    try {
      const response = await fetch('/api/admin/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      // Read NDJSON progress
      const finalMsg = await readPublishProgress(response, (progress) => {
        setPublishProgress(prev => [...prev, progress]);
      });

      if (finalMsg?.status === 'complete') {
        setPublishSuccess(true);
        setPublishStatus('published');
        setHasUnsavedChanges(false);
        resetDraft();

        // Auto-close progress after 5 seconds on success
        setTimeout(() => {
          setPublishing(false);
          setPublishSuccess(false);
          setPublishProgress([]);
          window.location.reload();
        }, 5000);
      } else if (finalMsg?.status === 'partial') {
        // Partial success
        setPublishError(`Published with errors: ${finalMsg.message}`);
        setPublishSuccess(false);
      } else {
        // Failed
        setPublishError(finalMsg?.message || 'Publish failed');
      }
    } catch (err) {
      console.error('Save & Preview failed:', err);
      setPublishError('Network error — please try again');
    } finally {
      setPublishing(false);
    }
  }, [resetDraft, setHasUnsavedChanges, setPublishStatus]);

  // Go Live handler (triggers deploy)
  const handleGoLive = useCallback(async () => {
    setDeploying(true);
    try {
      const response = await fetch('/api/admin/publish?action=go-live', { method: 'POST' });
      const result = await response.json();
      
      if (result.success) {
        setPublishProgress([{ step: 'final', message: result.message, status: 'complete' }]);
        setPublishSuccess(true);
        setTimeout(() => {
          setDeploying(false);
          setPublishSuccess(false);
          setPublishProgress([]);
        }, 5000);
      } else {
        setPublishError(result.error || 'Deploy failed');
        setDeploying(false);
      }
    } catch {
      setPublishError('Deploy failed — network error');
      setDeploying(false);
    }
  }, []);

  // Save Draft handler
  const handleSaveDraft = useCallback(async () => {
    setIsSaving(true);
    setPublishStatus('saving');
    try {
      await fetch('/api/admin/pages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId: currentPageId,
          content: draftContent,
          status: 'draft',
        }),
      });
      setPublishStatus('draft');
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error('Save draft failed:', err);
    } finally {
      setIsSaving(false);
    }
  }, [currentPageId, draftContent, setHasUnsavedChanges, setPublishStatus]);

  if (!adminUser) return null;

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-[9999] h-12 bg-[#030303]/95 backdrop-blur-xl border-b border-[#1a1a22] flex items-center px-4 gap-3 shadow-xl">
        {/* Left: Hamburger + Dashboard link */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-[#8A8780] hover:text-[#FFC300] transition-colors lg:hidden"
        >
          {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>

        <Link href="/admin/dashboard" className="flex items-center gap-2 text-[#FFC300] hover:text-[#FFD54F] transition-colors mr-2">
          <LayoutDashboard className="w-4 h-4" />
          <span className="text-xs font-semibold hidden sm:block">Admin</span>
        </Link>

        <div className="w-px h-6 bg-[#1a1a22]" />

        {/* Center: Edit mode toggle */}
        {currentPageId && (
          <>
            <button
              onClick={() => setEditMode(!isEditMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium transition-all ${
                isEditMode
                  ? 'bg-[#FFC300]/20 text-[#FFC300] border border-[#FFC300]/30'
                  : 'bg-[#0e0e14] text-[#8A8780] hover:text-[#F0EDE6] border border-[#1a1a22]'
              }`}
            >
              {isEditMode ? <Pencil className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {isEditMode ? 'Edit Mode ON' : 'Preview Mode'}
            </button>

            {/* Status badge */}
            <span className={`text-xs px-2 py-0.5 rounded-sm border ${
              publishStatus === 'published'
                ? 'bg-green-500/10 text-green-400 border-green-500/30'
                : publishStatus === 'draft'
                ? 'bg-[#FFC300]/10 text-[#FFC300] border-[#FFC300]/30'
                : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
            }`}>
              {publishStatus === 'saving' ? 'Saving...' : publishStatus === 'published' ? 'Published' : 'Draft'}
            </span>

            {hasUnsavedChanges && (
              <span className="text-xs text-orange-400">Unsaved changes</span>
            )}
          </>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {currentPageId && (
            <>
              <button
                onClick={handleSaveDraft}
                disabled={isSaving || !hasUnsavedChanges}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium bg-[#0e0e14] text-[#8A8780] hover:text-[#F0EDE6] border border-[#1a1a22] disabled:opacity-40 transition-all"
              >
                <FileText className="w-3 h-3" />
                <span className="hidden sm:inline">Save Draft</span>
              </button>

              {/* GAP FIX: Two buttons instead of one */}
              <button
                onClick={handleSavePreview}
                disabled={publishing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-semibold bg-[#0e0e14] text-[#FFC300] border border-[#FFC300]/30 hover:bg-[#FFC300]/10 disabled:opacity-50 transition-all"
              >
                <Save className="w-3 h-3" />
                <span className="hidden sm:inline">{publishing ? 'Saving...' : 'Save & Preview'}</span>
              </button>

              <button
                onClick={handleGoLive}
                disabled={deploying}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-semibold bg-[#FFC300] text-[#020204] hover:bg-[#FFD54F] disabled:opacity-50 transition-all"
              >
                <Rocket className="w-3 h-3" />
                <span className="hidden sm:inline">{deploying ? 'Deploying...' : 'Go Live'}</span>
              </button>
            </>
          )}

          <div className="w-px h-6 bg-[#1a1a22]" />

          {/* Profile */}
          <div className="flex items-center gap-2">
            {adminUser.image && (
              <img src={adminUser.image} className="w-6 h-6 rounded-full" alt="" />
            )}
            <span className="text-[#8A8780] text-xs hidden sm:block max-w-[120px] truncate">{adminUser.name || adminUser.email || 'Admin'}</span>
            <button
              onClick={handleLogout}
              className="text-[#4A4945] hover:text-red-400 transition-colors ml-1"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ═══ Publish Progress Overlay ═══ */}
      {(publishing || publishSuccess || publishError) && (
        <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#08080c] border border-[#1a1a22] rounded-sm max-w-md w-full shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-[#1a1a22] flex items-center gap-3">
              {publishSuccess ? (
                <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
              ) : publishError ? (
                <XCircle className="w-5 h-5 text-red-400 shrink-0" />
              ) : (
                <Loader2 className="w-5 h-5 text-[#FFC300] animate-spin shrink-0" />
              )}
              <div className="flex-1">
                <h3 className="text-[#F0EDE6] font-semibold text-sm">
                  {publishSuccess ? 'Saved Successfully!' : publishError ? 'Save Failed' : 'Saving to Turso...'}
                </h3>
                <p className="text-[#8A8780] text-[10px] mt-0.5">
                  {publishSuccess ? 'Changes saved to preview database' : 'Saving site data to Turso DB'}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            {!publishSuccess && !publishError && publishProgress.length > 0 && (
              <div className="px-4 pt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[#8A8780]">
                    {publishProgress[publishProgress.length - 1]?.message || 'Working...'}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#1a1a22] rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                      publishError ? 'bg-red-500' : publishSuccess ? 'bg-green-500' : 'bg-[#FFC300] animate-pulse'
                    }`}
                    style={{ width: `${Math.min((publishProgress.filter(p => p.status === 'done').length / Math.max(publishProgress.filter(p => p.total).reduce((max, p) => Math.max(max, p.total || 0), 0), 1)) * 100, 95)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Steps */}
            <div className="p-4 space-y-2 max-h-60 overflow-y-auto">
              {publishProgress.map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  {step.status === 'done' || step.status === 'complete' ? (
                    <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" />
                  ) : step.status === 'error' ? (
                    <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  ) : step.status === 'processing' ? (
                    <Loader2 className="w-3.5 h-3.5 text-[#FFC300] animate-spin shrink-0" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-[#4A4945] shrink-0" />
                  )}
                  <span className={`text-xs flex-1 ${
                    step.status === 'done' || step.status === 'complete' ? 'text-[#F0EDE6]' :
                    step.status === 'error' ? 'text-red-400' :
                    'text-[#FFC300]'
                  }`}>
                    {step.message}
                  </span>
                </div>
              ))}
            </div>

            {/* Error details */}
            {publishError && (
              <div className="px-4 pb-3">
                <div className="p-2 bg-red-500/5 border border-red-500/20 rounded-sm">
                  <p className="text-red-400 text-xs">{publishError}</p>
                  <p className="text-[#8A8780] text-[10px] mt-1">Your changes are preserved on the server</p>
                </div>
              </div>
            )}

            {/* Close button */}
            {(publishSuccess || publishError) && (
              <div className="p-4 border-t border-[#1a1a22]">
                <button
                  onClick={() => {
                    setPublishing(false);
                    setPublishSuccess(false);
                    setPublishError(null);
                    setPublishProgress([]);
                    if (publishSuccess) window.location.reload();
                  }}
                  className="w-full py-2 bg-[#0e0e14] border border-[#1a1a22] text-[#F0EDE6] rounded-sm text-xs font-semibold hover:border-[#FFC300] transition-colors"
                >
                  {publishSuccess ? 'Close & Refresh' : 'Close'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
