'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { MatchInfo, InningsData, CommunityData, CommunitySubTab } from '@/lib/types';
import SubTabNav from '@/components/layout/SubTabNav';

function CommunityTabLoading() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
      {[0, 1, 2].map((i) => (
        <div key={i} className="lux-card min-h-36 animate-pulse">
          <div className="h-3 w-28 bg-white/10 rounded mb-5" />
          <div className="space-y-3">
            <div className="h-3 w-full bg-white/5 rounded" />
            <div className="h-3 w-4/5 bg-white/5 rounded" />
            <div className="h-3 w-2/3 bg-white/5 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

const PredictionsTab = dynamic(() => import('@/components/tabs/PredictionsTab'), {
  loading: () => <CommunityTabLoading />,
});
const CommunityTab = dynamic(() => import('@/components/tabs/CommunityTab'), {
  loading: () => <CommunityTabLoading />,
});
const LegacyTab = dynamic(() => import('@/components/tabs/LegacyTab'), {
  loading: () => <CommunityTabLoading />,
});

interface CommunityPageProps {
  matchInfo: MatchInfo;
  innings: InningsData;
  innings1: InningsData;
  innings2: InningsData;
  community: CommunityData;
  onVote: (team: string) => void;
}

const communitySubTabs: { id: CommunitySubTab; label: string }[] = [
  { id: 'predict', label: 'Predict' },
  { id: 'vote', label: 'Vote' },
  { id: 'legacy', label: "Thomians' Legacy" },
];

export default function CommunityPage({ matchInfo, innings, innings1, innings2, community, onVote }: CommunityPageProps) {
  const [activeSubTab, setActiveSubTab] = useState<CommunitySubTab>('predict');

  const renderSubTab = () => {
    switch (activeSubTab) {
      case 'predict':
        return <PredictionsTab matchInfo={matchInfo} innings1={innings1} innings2={innings2} />;
      case 'vote':
        return <CommunityTab community={community} matchInfo={matchInfo} innings={innings} innings1={innings1} innings2={innings2} onVote={onVote} />;
      case 'legacy':
        return <LegacyTab />;
    }
  };

  return (
    <div>
      <SubTabNav
        tabs={communitySubTabs}
        activeTab={activeSubTab}
        onTabChange={(tab) => setActiveSubTab(tab as CommunitySubTab)}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {renderSubTab()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
