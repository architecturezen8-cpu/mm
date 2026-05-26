'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MatchInfo, InningsData, LiveState, MomentumPoint, LiveSubTab } from '@/lib/types';
import SubTabNav from '@/components/layout/SubTabNav';
import LiveTab from '@/components/tabs/LiveTab';
import ScorecardTab from '@/components/tabs/ScorecardTab';
import AnalyticsTab from '@/components/tabs/AnalyticsTab';
import SupabaseOfflineBanner from '@/components/SupabaseOfflineBanner';
import type { DataSource } from '@/hooks/useMatchLiveData';

interface LivePageProps {
  matchInfo: MatchInfo;
  innings1: InningsData;
  innings2: InningsData;
  liveState: LiveState;
  momentum: MomentumPoint[];
  dataSource: DataSource;
}

const liveSubTabs: { id: LiveSubTab; label: string }[] = [
  { id: 'live', label: 'Score' },
  { id: 'scorecard', label: 'Scorecard' },
  { id: 'analytics', label: 'Analytics' },
];

export default function LivePage({ matchInfo, innings1, innings2, liveState, momentum, dataSource }: LivePageProps) {
  const [activeSubTab, setActiveSubTab] = useState<LiveSubTab>('live');
  const isOffline = dataSource === 'offline';

  const renderSubTab = () => {
    switch (activeSubTab) {
      case 'live':
        return <LiveTab matchInfo={matchInfo} liveState={liveState} />;
      case 'scorecard':
        return <ScorecardTab matchInfo={matchInfo} innings1={innings1} innings2={innings2} dataSource={dataSource} />;
      case 'analytics':
        return <AnalyticsTab innings1={innings1} innings2={innings2} liveState={liveState} momentum={momentum} dataSource={dataSource} />;
    }
  };

  return (
    <div>
      <SubTabNav
        tabs={liveSubTabs}
        activeTab={activeSubTab}
        onTabChange={(tab) => setActiveSubTab(tab as LiveSubTab)}
      />

      {/* ── Supabase Offline Banner ── */}
      <AnimatePresence>
        {isOffline && <SupabaseOfflineBanner className="mt-3" />}
      </AnimatePresence>

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
    </div>
  );
}
