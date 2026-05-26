'use client';

import FanCardGenerator from '@/components/fancard/FanCardGenerator';
import WatchPartyMapCard from '@/components/cards/WatchPartyMapCard';
import ScrollReveal from '@/components/ScrollReveal';
import EditableSection from '@/components/admin/EditableSection';
import DynamicSections from '@/components/admin/DynamicSections';

export default function LegacyTab() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:gap-6">
      {/* Fan Card Generator — above the map */}
      <EditableSection sectionId="legacy-fan-card" pageId="community" type="stats" title="Fan Card Generator" content={{ heading: 'Fan Card Generator' }}>
        <ScrollReveal animation="fade-up" delay={0}>
          <FanCardGenerator />
        </ScrollReveal>
      </EditableSection>

      {/* Watch Party Map */}
      <EditableSection sectionId="legacy-watch-party" pageId="community" type="stats" title="Watch Party" content={{ heading: 'Watch Party' }}>
        <ScrollReveal animation="fade-up" delay={100}>
          <WatchPartyMapCard />
        </ScrollReveal>
      </EditableSection>

      <DynamicSections pageId="community" sectionPrefix="legacy-" />
    </div>
  );
}
