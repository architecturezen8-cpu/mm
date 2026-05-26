'use client';

import ClientLayout from '@/components/ClientLayout';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CommunitySubTab } from '@/lib/types';
import { useMatchData } from '@/lib/MatchDataContext';
import SubTabNav from '@/components/layout/SubTabNav';
import PredictionsTab from '@/components/tabs/PredictionsTab';
import CommunityTab from '@/components/tabs/CommunityTab';
import LegacyTab from '@/components/tabs/LegacyTab';

const communitySubTabs: { id: CommunitySubTab; label: string }[] = [
  { id: 'predict', label: 'Predict' },
  { id: 'vote', label: 'Vote' },
  { id: 'legacy', label: "Thomians' Legacy" },
];

function CommunityContent() {
  const { matchInfo, innings1, innings2, community, castVote } = useMatchData();
  const [activeSubTab, setActiveSubTab] = useState<CommunitySubTab>('predict');

  // Expose active sub-tab to document for AdminToolbar to read
  useEffect(() => {
    document.documentElement.setAttribute('data-community-subtab', activeSubTab);
    return () => document.documentElement.removeAttribute('data-community-subtab');
  }, [activeSubTab]);

  const renderSubTab = () => {
    switch (activeSubTab) {
      case 'predict':
        return <PredictionsTab matchInfo={matchInfo} innings1={innings1} innings2={innings2} />;
      case 'vote':
        return <CommunityTab community={community} matchInfo={matchInfo} innings={innings2} onVote={castVote} />;
      case 'legacy':
        return <LegacyTab />;
      default:
        return <PredictionsTab matchInfo={matchInfo} innings1={innings1} innings2={innings2} />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
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
    </motion.div>
  );
}

export default function CommunityPage() {
  return (
    <ClientLayout>
      <CommunityContent />
    </ClientLayout>
  );
}
