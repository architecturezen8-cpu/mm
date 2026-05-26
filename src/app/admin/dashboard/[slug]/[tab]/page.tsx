'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { AdminEditProvider, useAdminEdit } from '@/lib/AdminEditContext';
import { MatchDataProvider } from '@/lib/MatchDataContext';
import Footer from '@/components/layout/Footer';
import AdminToolbar from '@/components/admin/AdminToolbar';
import InlineEditPanel from '@/components/admin/InlineEditPanel';
import HomeTab from '@/components/tabs/HomeTab';
import LiveTab from '@/components/tabs/LiveTab';
import ScorecardTab from '@/components/tabs/ScorecardTab';
import AnalyticsTab from '@/components/tabs/AnalyticsTab';
import AboutUsTab from '@/components/tabs/AboutUsTab';
import MatchHistoryTab from '@/components/tabs/MatchHistoryTab';
import H2HTab from '@/components/tabs/H2HTab';
import WeatherTab from '@/components/tabs/WeatherTab';
import CommunityTab from '@/components/tabs/CommunityTab';
import PredictionsTab from '@/components/tabs/PredictionsTab';
import LegacyTab from '@/components/tabs/LegacyTab';
import GalleryTab from '@/components/tabs/GalleryTab';
import VideosTab from '@/components/tabs/VideosTab';
import PlayingXITab from '@/components/tabs/PlayingXITab';
import DashboardHeader from '@/components/layout/DashboardHeader';
import { useMatchData } from '@/lib/MatchDataContext';

function PageContent({ pageId, activeTab }: { pageId: string; activeTab: string }) {
  const { matchInfo, innings1, innings2, liveState, momentum, community, castVote } = useMatchData();

  switch (pageId) {
    case 'home':
      return <HomeTab matchInfo={matchInfo} />;
    case 'live':
      if (activeTab === 'scorecard') return <ScorecardTab matchInfo={matchInfo} innings1={innings1} innings2={innings2} dataSource="offline" />;
      if (activeTab === 'analytics') return <AnalyticsTab innings1={innings1} innings2={innings2} liveState={liveState} momentum={momentum} dataSource="offline" />;
      return (
        <>
          <DashboardHeader matchInfo={matchInfo} liveState={liveState} />
          <LiveTab matchInfo={matchInfo} liveState={liveState} />
        </>
      );
    case 'about':
      if (activeTab === 'about') return <AboutUsTab />;
      if (activeTab === 'h2h') return <H2HTab matchInfo={matchInfo} />;
      if (activeTab === 'weather') return <WeatherTab />;
      return <MatchHistoryTab matchInfo={matchInfo} />;
    case 'gallery':
      return <GalleryTab />;
    case 'videos':
      return <VideosTab />;
    case 'community':
      if (activeTab === 'vote') return <CommunityTab community={community} matchInfo={matchInfo} innings={innings2} onVote={castVote} />;
      if (activeTab === 'legacy') return <LegacyTab />;
      return <PredictionsTab matchInfo={matchInfo} innings1={innings1} innings2={innings2} />;
    case 'playing-xi':
      return <PlayingXITab />;
    default:
      return <div className="p-8 text-center text-text-muted">Unknown page: {pageId}</div>;
  }
}

// Page configuration mapping
const pageConfig: Record<string, { tabs: { id: string; label: string }[] }> = {
  home: { tabs: [] },
  live: {
    tabs: [
      { id: 'live', label: 'Score' },
      { id: 'scorecard', label: 'Scorecard' },
      { id: 'analytics', label: 'Analytics' },
    ],
  },
  about: {
    tabs: [
      { id: 'about', label: 'About Us' },
      { id: 'history', label: 'History' },
      { id: 'h2h', label: 'H2H' },
      { id: 'weather', label: 'Weather' },
    ],
  },
  gallery: { tabs: [] },
  videos: { tabs: [] },
  community: {
    tabs: [
      { id: 'predict', label: 'Predict' },
      { id: 'vote', label: 'Vote' },
      { id: 'legacy', label: "Thomians' Legacy" },
    ],
  },
  'playing-xi': { tabs: [] },
};

function AdminTabPageEditorInner() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const tab = params.tab as string;
  const { setEditMode } = useAdminEdit();
  // Map slug to page ID — derived directly from slug, no useEffect needed
  const pageId = useMemo(() => {
    if (slug === 'home') return 'home';
    if (slug === 'live') return 'live';
    if (slug === 'about') return 'about';
    if (slug === 'gallery') return 'gallery';
    if (slug === 'videos') return 'videos';
    if (slug === 'community') return 'community';
    if (slug === 'playing-xi') return 'playing-xi';
    return slug;
  }, [slug]);

  // Force edit mode on
  useEffect(() => {
    setEditMode(true);
    return () => setEditMode(false);
  }, [setEditMode]);

  const config = pageConfig[pageId] || { tabs: [] };
  const tabs = config.tabs;
  const activeTab = tab;

  const pageTitle = pageId.charAt(0).toUpperCase() + pageId.slice(1).replace('-', ' ');

  return (
    <div className="min-h-screen bg-lux-bg">
      {/* Admin top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#020204]/95 backdrop-blur-xl border-b border-[#1a1a22] px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="flex items-center gap-1.5 text-[#8A8780] hover:text-[#F0EDE6] text-xs transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Dashboard
          </button>
          <div className="w-px h-4 bg-[#1a1a22]" />
          <span className="text-[#FFC300] text-[9px] uppercase tracking-[2px] font-bold">Edit Mode</span>
          <div className="w-px h-4 bg-[#1a1a22]" />
          <span className="text-[#F0EDE6] text-sm font-medium">{pageTitle}</span>
          <span className="text-[#8A8780] text-xs">/ {tab}</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={pageId === 'home' ? '/' : `/${pageId}`}
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] uppercase tracking-[1.5px] font-bold text-[#8A8780] hover:text-gold border border-[#1a1a22] hover:border-gold/30 transition-all"
            style={{ borderRadius: 0 }}
          >
            <ExternalLink className="w-3 h-3" />
            View Live
          </Link>
        </div>
      </div>

      {/* Sub-tab navigation */}
      {tabs.length > 0 && (
        <div className="fixed top-[40px] left-0 right-0 z-40 bg-lux-card border-b border-lux-border">
          <div className="max-w-7xl mx-auto overflow-x-auto scrollbar-none flex">
            {tabs.map((t) => (
              <Link
                key={t.id}
                href={`/admin/dashboard/${slug}/${t.id}`}
                className={`shrink-0 py-2.5 px-4 text-[10px] font-semibold uppercase tracking-[2px] transition-colors border-b-2 ${
                  activeTab === t.id
                    ? 'text-gold border-gold'
                    : 'text-text-muted hover:text-text-secondary border-transparent'
                }`}
              >
                {t.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Live page content */}
      <div className="pt-[80px]">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-8 py-4 sm:py-6 lg:py-8">
          <PageContent pageId={pageId} activeTab={activeTab} />
        </div>
        <Footer />
      </div>

      <AdminToolbar />
      <InlineEditPanel />
    </div>
  );
}

export default function AdminTabPage() {
  return (
    <AdminEditProvider>
      <MatchDataProvider>
        <AdminTabPageEditorInner />
      </MatchDataProvider>
    </AdminEditProvider>
  );
}
