'use client';

import FanCardGenerator from '@/components/fancard/FanCardGenerator';
import WatchPartyMapCard from '@/components/cards/WatchPartyMapCard';
import ScrollReveal from '@/components/ScrollReveal';
import DynamicSections from '@/components/admin/DynamicSections';

export default function LegacyTab() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:gap-6">
      {/* Fan Card Generator — above the map */}
      <ScrollReveal animation="fade-up" delay={0}>
        <FanCardGenerator />
      </ScrollReveal>

      {/* Watch Party Map */}
      <ScrollReveal animation="fade-up" delay={100}>
        <WatchPartyMapCard />
      </ScrollReveal>

      <DynamicSections pageId="community" sectionPrefix="legacy-" />
    </div>
  );
}
