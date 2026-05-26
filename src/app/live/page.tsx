'use client';

import ClientLayout from '@/components/ClientLayout';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LiveSubTab } from '@/lib/types';
import { useMatchData } from '@/lib/MatchDataContext';
import SubTabNav from '@/components/layout/SubTabNav';
import DashboardHeader from '@/components/layout/DashboardHeader';
import LiveTab from '@/components/tabs/LiveTab';
import ScorecardTab from '@/components/tabs/ScorecardTab';
import AnalyticsTab from '@/components/tabs/AnalyticsTab';
import CommunityTab from '@/components/tabs/CommunityTab';
import ComingSoonBanner from '@/components/ComingSoonBanner';

const liveSubTabs: { id: LiveSubTab; label: string }[] = [
  { id: 'live', label: 'Score' },
  { id: 'scorecard', label: 'Scorecard' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'community', label: 'Community' },
];

function LiveContent() {
  const { matchInfo, innings1, innings2, liveState, community, momentum, castVote, dataSource, lastUpdated } = useMatchData();
  const [activeSubTab, setActiveSubTab] = useState<LiveSubTab>('live');

  // Coming Soon control — fetch from API so ALL visitors see admin's settings (not just admin browser)
  const [comingSoonData, setComingSoonData] = useState<{ enabled: boolean; title: string; details: string; countdownDate: string }>({
    enabled: false,
    title: 'Coming Soon',
    details: 'Score will be updated on 15th May 2026',
    countdownDate: '2026-05-15T09:00',
  });

  useEffect(() => {
    // Fetch Coming Soon settings from public API
    const fetchComingSoon = () => {
      fetch('/api/admin/site-settings?t=' + Date.now())
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.coming_soon) {
            const cs = data.coming_soon;
            setComingSoonData({
              enabled: !!cs.enabled,
              title: cs.title || 'Coming Soon',
              details: cs.details || 'Score will be updated on 15th May 2026',
              countdownDate: cs.countdownDate || '2026-05-15T09:00',
            });
          }
        })
        .catch(() => {});
    };
    fetchComingSoon();

    // Listen for real-time updates from admin panel
    const handleUpdate = () => fetchComingSoon();
    window.addEventListener('coming-soon-updated', handleUpdate);
    return () => window.removeEventListener('coming-soon-updated', handleUpdate);
  }, []);

  // Get maxOvers from innings data for match format display
  const maxOvers = innings1?.maxOvers || innings2?.maxOvers;

  const renderSubTab = () => {
    switch (activeSubTab) {
      case 'live':
        return <LiveTab matchInfo={matchInfo} liveState={liveState} maxOvers={maxOvers} />;
      case 'scorecard':
        return <ScorecardTab matchInfo={matchInfo} innings1={innings1} innings2={innings2} dataSource={dataSource} />;
      case 'analytics':
        return <AnalyticsTab innings1={innings1} innings2={innings2} liveState={liveState} momentum={momentum} dataSource={dataSource} />;
      case 'community':
        return <CommunityTab community={community} matchInfo={matchInfo} innings={innings2} onVote={castVote} />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Coming Soon Banner - above DashboardHeader with animated golden border */}
      {comingSoonData.enabled && (
        <ComingSoonBanner
          title={comingSoonData.title}
          details={comingSoonData.details}
          countdownDate={comingSoonData.countdownDate}
        />
      )}

      <DashboardHeader matchInfo={matchInfo} liveState={liveState} dataSource={dataSource} lastUpdated={lastUpdated} maxOvers={maxOvers} innings1={innings1} innings2={innings2} />

      <SubTabNav
        tabs={liveSubTabs}
        activeTab={activeSubTab}
        onTabChange={(tab) => setActiveSubTab(tab as LiveSubTab)}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {renderSubTab()}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

export default function LivePage() {
  return (
    <ClientLayout>
      <LiveContent />
    </ClientLayout>
  );
}
