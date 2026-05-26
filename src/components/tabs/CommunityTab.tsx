'use client';

import VotingCard from '@/components/cards/VotingCard';
import ShareCard from '@/components/cards/ShareCard';
import BallDescriptionCard from '@/components/cards/BallDescriptionCard';
import ScrollReveal from '@/components/ScrollReveal';
import EditableSection from '@/components/admin/EditableSection';
import { CommunityData, InningsData, MatchInfo } from '@/lib/types';
import DynamicSections from '@/components/admin/DynamicSections';

interface CommunityTabProps {
  community: CommunityData;
  matchInfo: MatchInfo;
  innings: InningsData;
  innings1?: InningsData;
  innings2?: InningsData;
  onVote: (team: string) => void;
}

export default function CommunityTab({ community, matchInfo, innings, innings1, innings2, onVote }: CommunityTabProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
      <EditableSection sectionId="community-voting" pageId="community" type="stats" title="Voting" content={{ heading: 'Voting' }}>
        <ScrollReveal animation="fade-up" delay={0}>
          <VotingCard community={community} matchInfo={matchInfo} innings1={innings1} innings2={innings2} onVote={onVote} />
        </ScrollReveal>
      </EditableSection>

      <div className="flex flex-col gap-3 sm:gap-4 lg:gap-6">
        <EditableSection sectionId="community-share" pageId="community" type="text" title="Share" content={{ heading: 'Share' }}>
          <ScrollReveal animation="fade-up" delay={100}>
            <ShareCard />
          </ScrollReveal>
      </EditableSection>
      </div>

      <div className="sm:col-span-2">
        <EditableSection sectionId="community-ball" pageId="community" type="stats" title="Ball Description" content={{ heading: 'Ball Description' }}>
          <ScrollReveal animation="fade-up" delay={200}>
            <BallDescriptionCard innings={innings} />
          </ScrollReveal>
        </EditableSection>
      </div>

      <DynamicSections pageId="community" excludePrefix="legacy-" />
    </div>
  );
}
