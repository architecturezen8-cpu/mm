'use client';

import Card from '@/components/ui/lux-card';
import BallIndicator from '@/components/ui/ball-circle';
import { InningsData } from '@/lib/types';

interface BallDescriptionCardProps {
  innings: InningsData;
}

export default function BallDescriptionCard({ innings }: BallDescriptionCardProps) {
  const allBalls = innings.overByOver.flatMap((over) => over.balls);

  return (
    <Card delay={0.2}>
      <div className="card-title">
        <span className="icon">◈</span>
        Ball Descriptions
      </div>
      <div className="max-h-72 sm:max-h-80 overflow-y-auto space-y-0">
        {allBalls.map((ball, idx) => (
          <div key={idx} className="flex items-center gap-3 sm:gap-4 py-2.5 sm:py-3 border-b border-lux-divider last:border-0">
            <span className="bg-lux-surface border border-lux-border px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] font-semibold text-gold tracking-wider whitespace-nowrap">
              {ball.over}
            </span>
            <p className="text-[11px] sm:text-xs text-text-secondary flex-1 leading-relaxed line-clamp-2">{ball.description}</p>
            <BallIndicator outcome={ball.outcome} size="sm" delay={0} index={0} />
          </div>
        ))}
      </div>
    </Card>
  );
}
