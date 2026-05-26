'use client';

import { ReactNode, useEffect, useState } from 'react';
import { MatchDataProvider } from '@/lib/MatchDataContext';
import { AdminEditProvider, useAdminEdit } from '@/lib/AdminEditContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Preloader from '@/components/Preloader';
import AdminToolbar from '@/components/admin/AdminToolbar';
import InlineEditPanel from '@/components/admin/InlineEditPanel';
import MaintenancePage from '@/components/MaintenancePage';
import { MusicProvider } from '@/components/MusicPlayer';

/* ── Inner layout that has access to AdminEditContext ── */
function ClientLayoutInner({ children }: { children: ReactNode }) {
  const { isAdmin, isLoading, sectionDataLoaded } = useAdminEdit();
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Check maintenance mode from APIs on mount
  // ⚠️ BUG FIX (2026-05-21):
  //   Previously we only called /api/admin/site-settings — which reads from
  //   baked data when Turso Read toggle is OFF. So toggling maintenance mode
  //   had NO effect on visitors until "Publish & Rebuild" was clicked.
  //   Now we ALSO poll /api/maintenance-status which always reads from D1
  //   (fresh source-of-truth in Cloudflare Workers).
  useEffect(() => {
    let cancelled = false;

    // Combined check: D1 (fresh) wins over baked settings (stale)
    const checkMaintenance = async () => {
      try {
        // 1. Fast D1-backed check (always fresh, never stale)
        const maintRes = await fetch('/api/maintenance-status', { cache: 'no-store' });
        if (maintRes.ok) {
          const m = await maintRes.json();
          if (!cancelled && typeof m?.maintenanceMode === 'boolean') {
            setMaintenanceMode(m.maintenanceMode === true);
            return; // D1 is authoritative — done.
          }
        }
      } catch {
        // Fall through to legacy endpoint
      }

      // 2. Fallback: legacy site-settings endpoint
      try {
        const res = await fetch('/api/admin/site-settings', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            setMaintenanceMode(data?.maintenanceMode === true);
          }
        }
      } catch {
        // API unreachable — keep current state
      }
    };

    checkMaintenance();

    // Re-check every 30 seconds so visitors notice toggle changes
    // without needing to refresh. Lightweight: hits cached D1 endpoint only.
    const pollId = window.setInterval(checkMaintenance, 30_000);

    // Listen for real-time updates from DynamicHead
    const handleMaintenanceUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ maintenanceMode: boolean }>;
      if (customEvent.detail) {
        setMaintenanceMode(customEvent.detail.maintenanceMode === true);
      }
    };

    // Also listen for site-settings-updated events (from admin toggle)
    const handleSettingsUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<Record<string, unknown>>;
      if (customEvent.detail && 'maintenanceMode' in customEvent.detail) {
        setMaintenanceMode(customEvent.detail.maintenanceMode === true);
      }
    };

    window.addEventListener('site-maintenance-mode', handleMaintenanceUpdate);
    window.addEventListener('site-settings-updated', handleSettingsUpdate);

    // Re-check when the tab becomes visible (user returns to the site)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkMaintenance();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(pollId);
      window.removeEventListener('site-maintenance-mode', handleMaintenanceUpdate);
      window.removeEventListener('site-settings-updated', handleSettingsUpdate);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Show maintenance page for non-admin users when maintenance mode is on
  // This is a CLIENT-SIDE fallback — the server-side check in layout.tsx
  // handles the first paint, but this handles real-time toggle changes
  // IMPORTANT: Admin routes (/admin/*) are NEVER blocked — admins must be able
  // to access the login page and dashboard even during maintenance
  const isAdminRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
  if (maintenanceMode && !isLoading && !isAdmin && !isAdminRoute) {
    return <MaintenancePage />;
  }

  // Show a minimal loading state while section data is being fetched from API
  // This prevents the "demo data flash" — showing hardcoded defaults before real data arrives
  if (!sectionDataLoaded) {
    return (
      <div className="min-h-screen bg-lux-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          {/* Gold spinner */}
          <div className="relative w-10 h-10">
            <div
              className="absolute inset-0 rounded-full border-2 border-transparent"
              style={{ borderTopColor: '#FFC300', borderRightColor: 'rgba(255,195,0,0.3)', animation: 'data-spin 0.8s linear infinite' }}
            />
          </div>
          <span className="text-[#8A8780] text-[10px] uppercase tracking-[3px] font-medium">Loading</span>
          <style jsx global>{`
            @keyframes data-spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-lux-bg flex flex-col relative">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-5 lg:px-8 py-4 sm:py-6 lg:py-8">
        {children}
      </main>
      <Footer />
      <AdminToolbar />
      <InlineEditPanel />
    </div>
  );
}

export default function ClientLayout({ children }: { children: ReactNode }) {
  // Global scroll reveal observer - adds 'revealed' class to elements with scroll-reveal when they enter viewport
  useEffect(() => {
    const cardObservers = new Set<IntersectionObserver>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    );

    // Observe all scroll-reveal elements
    const revealElements = document.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-scale');
    revealElements.forEach((el) => observer.observe(el));

    // Re-observe on DOM changes (for SPA navigation)
    const mutationObserver = new MutationObserver(() => {
      const newElements = document.querySelectorAll('.scroll-reveal:not(.revealed), .scroll-reveal-left:not(.revealed), .scroll-reveal-right:not(.revealed), .scroll-reveal-scale:not(.revealed)');
      newElements.forEach((el) => observer.observe(el));

      // Also apply scroll-triggered entrance animation to all card elements
      const cardElements = document.querySelectorAll('.lux-card:not(.scroll-card-observed), .lux-card-gold:not(.scroll-card-observed), .player-card-portrait:not(.scroll-card-observed)');
      cardElements.forEach((el) => {
        el.classList.add('scroll-card-observed');
        // Apply initial hidden state and reveal on scroll
        const htmlEl = el as HTMLElement;
        htmlEl.style.opacity = '0';
        htmlEl.style.transform = 'translateY(20px)';
        htmlEl.style.transition = 'opacity 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';

        const cardObserver = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              htmlEl.style.opacity = '1';
              htmlEl.style.transform = 'translateY(0)';
              cardObserver.unobserve(entry.target);
              cardObservers.delete(cardObserver);
            }
          },
          { threshold: 0.05, rootMargin: '0px 0px -20px 0px' }
        );
        cardObservers.add(cardObserver);
        cardObserver.observe(el);
      });
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
      cardObservers.forEach((co) => co.disconnect());
      cardObservers.clear();
    };
  }, []);

  return (
    <Preloader>
      <MatchDataProvider>
        <MusicProvider>
          <AdminEditProvider>
            <ClientLayoutInner>{children}</ClientLayoutInner>
          </AdminEditProvider>
        </MusicProvider>
      </MatchDataProvider>
    </Preloader>
  );
}
