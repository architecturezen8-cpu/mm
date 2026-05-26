'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MatchInfo, InningsData, CommunityData, CommunitySubTab } from '@/lib/types';
import SubTabNav from '@/components/layout/SubTabNav';
import PredictionsTab from '@/components/tabs/PredictionsTab';
import CommunityTab from '@/components/tabs/CommunityTab';
import LegacyTab from '@/components/tabs/LegacyTab';

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
          transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {renderSubTab()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
