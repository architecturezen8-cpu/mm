'use client';

import ClientLayout from '@/components/ClientLayout';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AboutSubTab } from '@/lib/types';
import { useMatchData } from '@/lib/MatchDataContext';
import SubTabNav from '@/components/layout/SubTabNav';
import AboutUsTab from '@/components/tabs/AboutUsTab';
import MatchHistoryTab from '@/components/tabs/MatchHistoryTab';
import H2HTab from '@/components/tabs/H2HTab';
import WeatherTab from '@/components/tabs/WeatherTab';

const aboutSubTabs: { id: AboutSubTab; label: string }[] = [
  { id: 'about', label: 'About Us' },
  { id: 'history', label: 'History' },
  { id: 'h2h', label: 'H2H' },
  { id: 'weather', label: 'Weather' },
];

function AboutContent() {
  const { matchInfo } = useMatchData();
  const [activeSubTab, setActiveSubTab] = useState<AboutSubTab>('about');

  const renderSubTab = () => {
    switch (activeSubTab) {
      case 'about':
        return <AboutUsTab />;
      case 'history':
        return <MatchHistoryTab matchInfo={matchInfo} />;
      case 'h2h':
        return <H2HTab matchInfo={matchInfo} />;
      case 'weather':
        return <WeatherTab />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <SubTabNav
        tabs={aboutSubTabs}
        activeTab={activeSubTab}
        onTabChange={(tab) => setActiveSubTab(tab as AboutSubTab)}
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

export default function AboutPage() {
  return (
    <ClientLayout>
      <AboutContent />
    </ClientLayout>
  );
}
