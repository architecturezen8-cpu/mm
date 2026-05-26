'use client';

import Card from '@/components/ui/lux-card';
import AnimatedCounter from '@/components/ui/animated-counter';
import { LiveState } from '@/lib/types';

interface ChaseProgressCardProps {
  liveState: LiveState;
}

export default function ChaseProgressCard({ liveState }: ChaseProgressCardProps) {
  const pct = Math.min((liveState.target > 0 ? ((liveState.target - liveState.need) / liveState.target) * 100 : 0), 100);

  const radius = 70;
  const circumference = Math.PI * radius;
  const dashOffset = circumference - (pct / 100) * circumference;

  return (
    <Card delay={0.25}>
      <div className="card-title">
        <span className="icon">◎</span>
        Chase Progress
      </div>
      <div className="flex flex-col items-center">
        <svg width="160" height="90" viewBox="0 0 180 100" className="mb-4 sm:mb-6">
          <path
            d="M 15 90 A 70 70 0 0 1 165 90"
            fill="none"
            stroke="#0e0e14"
            strokeWidth="5"
          />
          <path
            d="M 15 90 A 70 70 0 0 1 165 90"
            fill="none"
            stroke="#FFC300"
            strokeWidth="5"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="square"
            style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.22, 1, 0.36, 1)' }}
          />
          <text x="90" y="72" textAnchor="middle" fill="#FFC300" fontSize="26" fontWeight="200" letterSpacing="2">
            {pct.toFixed(0)}%
          </text>
        </svg>

        <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full">
          <div className="bg-lux-surface border border-lux-border p-3 sm:p-4 text-center">
            <p className="text-lg sm:text-xl font-extralight text-gold tracking-wider">
              <AnimatedCounter value={liveState.target} />
            </p>
            <p className="text-[8px] sm:text-[9px] uppercase tracking-[2px] text-text-muted mt-1 sm:mt-2">Target</p>
          </div>
          <div className="bg-lux-surface border border-lux-border p-3 sm:p-4 text-center">
            <p className="text-lg sm:text-xl font-extralight text-text-primary tracking-wider">
              <AnimatedCounter value={liveState.need} />
            </p>
            <p className="text-[8px] sm:text-[9px] uppercase tracking-[2px] text-text-muted mt-1 sm:mt-2">Need</p>
          </div>
          <div className="bg-lux-surface border border-lux-border p-3 sm:p-4 text-center">
            <p className="text-lg sm:text-xl font-extralight text-status-neutral tracking-wider">
              <AnimatedCounter value={liveState.ballsLeft} />
            </p>
            <p className="text-[8px] sm:text-[9px] uppercase tracking-[2px] text-text-muted mt-1 sm:mt-2">Balls Left</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
