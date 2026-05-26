'use client';

import { motion } from 'framer-motion';

interface SubTab {
  id: string;
  label: string;
}

interface SubTabNavProps {
  tabs: SubTab[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function SubTabNav({ tabs, activeTab, onTabChange }: SubTabNavProps) {
  return (
    <div className="relative bg-lux-card border border-lux-border mb-4 sm:mb-6 overflow-hidden">
      {/* Mobile: all tabs fit the available width. Desktop: keeps the premium tab-bar look. */}
      <div
        className="grid sm:flex sm:overflow-x-auto scrollbar-none"
        style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative min-w-0 sm:shrink-0 py-2.5 sm:py-4 px-1.5 sm:px-6 text-[8px] sm:text-[11px] font-semibold uppercase tracking-[0.6px] sm:tracking-[3px] transition-colors sm:min-w-[90px]"
            >
              {isActive && (
                <motion.div
                  layoutId="activeSubTabBg"
                  className="absolute inset-0 bg-lux-elevated"
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}
              {isActive && (
                <motion.div
                  layoutId="activeSubTabLine"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-gold"
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}
              <span
                className={`relative z-10 block text-center leading-tight break-words ${
                  isActive ? 'text-gold' : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Scroll indicators — desktop only */}
      <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-lux-card to-transparent pointer-events-none hidden sm:block" />
      <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-lux-card to-transparent pointer-events-none hidden sm:block" />
    </div>
  );
}
