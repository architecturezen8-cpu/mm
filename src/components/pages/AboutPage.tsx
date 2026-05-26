'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MatchInfo, AboutSubTab } from '@/lib/types';
import SubTabNav from '@/components/layout/SubTabNav';
import AboutUsTab from '@/components/tabs/AboutUsTab';
import MatchHistoryTab from '@/components/tabs/MatchHistoryTab';
import H2HTab from '@/components/tabs/H2HTab';
import WeatherTab from '@/components/tabs/WeatherTab';

interface AboutPageProps {
  matchInfo: MatchInfo;
}

const aboutSubTabs: { id: AboutSubTab; label: string }[] = [
  { id: 'about', label: 'About Us' },
  { id: 'history', label: 'History' },
  { id: 'h2h', label: 'H2H' },
  { id: 'weather', label: 'Weather' },
];

export default function AboutPage({ matchInfo }: AboutPageProps) {
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
    <div>
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
    </div>
  );
}
