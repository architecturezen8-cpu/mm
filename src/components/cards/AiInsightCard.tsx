'use client';

import Card from '@/components/ui/lux-card';
import { LiveState } from '@/lib/types';
import { getAiInsight } from '@/lib/utils';

interface AiInsightCardProps {
  liveState: LiveState;
}

export default function AiInsightCard({ liveState }: AiInsightCardProps) {
  const insight = getAiInsight(liveState);

  return (
    <Card goldBorder delay={0.05}>
      <div className="card-title">
        <span className="icon">◈</span>
        AI Insight
      </div>
      <p className="text-xs sm:text-sm text-text-secondary leading-[1.8] tracking-wide">{insight}</p>
    </Card>
  );
}
