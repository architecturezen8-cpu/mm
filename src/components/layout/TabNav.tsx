'use client';

import { motion } from 'framer-motion';
import PremiumIcon from '@/components/PremiumIcon';
import { TabName } from '@/lib/types';

interface TabNavProps {
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
}

const tabs: { id: TabName; label: string; emoji: string; iconName?: string }[] = [
  { id: 'home', label: 'Home', emoji: '⌂' },
  { id: 'live', label: 'Live', emoji: '◉' },
  { id: 'scorecard', label: 'Score', emoji: '◧' },
  { id: 'analytics', label: 'Analytics', emoji: '◎' },
  { id: 'playingxi', label: 'Playing XI', emoji: '🏏', iconName: 'cricket' },
  { id: 'videos', label: 'Videos', emoji: '▶' },
  { id: 'gallery', label: 'Gallery', emoji: '⊛' },
  { id: 'history', label: 'History', emoji: '📜' },
  { id: 'h2h', label: 'H2H', emoji: '⚔' },
  { id: 'predictions', label: 'Predict', emoji: '🎯', iconName: 'target' },
  { id: 'weather', label: 'Weather', emoji: '☁' },
  { id: 'community', label: 'Community', emoji: '◈' },
];

export default function TabNav({ activeTab, onTabChange }: TabNavProps) {
  return (
    <div className="relative bg-lux-card border border-lux-border mb-4 sm:mb-6">
      {/* Scrollable tab bar */}
      <div className="overflow-x-auto scrollbar-none flex">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative shrink-0 py-3 sm:py-4 px-3 sm:px-4 text-[9px] sm:text-[11px] font-semibold uppercase tracking-[1.5px] sm:tracking-[2px] transition-colors min-w-[60px] sm:min-w-[70px]"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabBg"
                  className="absolute inset-0 bg-lux-elevated"
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}
              {isActive && (
                <motion.div
                  layoutId="activeTabLine"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-gold"
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}
              <span className={`relative z-10 flex items-center justify-center gap-1 sm:gap-1.5 ${
                isActive ? 'text-gold' : 'text-text-muted hover:text-text-secondary'
              }`}>
                <span className="text-[9px] sm:text-xs">
                  {tab.iconName ? <PremiumIcon name={tab.iconName} className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : tab.emoji}
                </span>
                <span className="whitespace-nowrap">{tab.label}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Scroll indicators */}
      <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-lux-card to-transparent pointer-events-none" />
      <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-lux-card to-transparent pointer-events-none" />
    </div>
  );
}
