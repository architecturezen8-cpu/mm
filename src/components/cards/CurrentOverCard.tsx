'use client';

import Card from '@/components/ui/lux-card';
import BallIndicator from '@/components/ui/ball-circle';
import { LiveState } from '@/lib/types';

interface CurrentOverCardProps {
  liveState: LiveState;
}

export default function CurrentOverCard({ liveState }: CurrentOverCardProps) {
  // Separate legal deliveries from extras (Wd, Nb)
  const legalDeliveries = liveState.currentOverBalls.filter(b => b.outcome !== 'Wd' && b.outcome !== 'Nb');
  const extraDeliveries = liveState.currentOverBalls.filter(b => b.outcome === 'Wd' || b.outcome === 'Nb');
  const remainingLegal = Math.max(0, 6 - legalDeliveries.length);

  const totalRuns = liveState.currentOverBalls.reduce((sum, b) => {
    const val = parseInt(b.outcome);
    return sum + (isNaN(val) ? (b.outcome === 'Wd' || b.outcome === 'Nb' ? 1 : 0) : val);
  }, 0);
  const wickets = liveState.currentOverBalls.filter(b => b.outcome === 'W').length;
  const extras = extraDeliveries.length;

  return (
    <Card delay={0.15}>
      <div className="card-title">
        <span className="icon">◉</span>
        Current Over — Over {liveState.currentOver}
      </div>
      <div className="flex items-center justify-center gap-6 sm:gap-8 mb-5 sm:mb-8">
        <div className="text-center">
          <p className="text-xl sm:text-2xl font-light text-text-primary tracking-wider">{totalRuns}</p>
          <p className="text-[8px] sm:text-[9px] uppercase tracking-[3px] text-text-muted mt-1">Runs</p>
        </div>
        <div className="w-px h-6 sm:h-8 bg-lux-border" />
        <div className="text-center">
          <p className="text-xl sm:text-2xl font-light text-status-negative tracking-wider">{wickets}</p>
          <p className="text-[8px] sm:text-[9px] uppercase tracking-[3px] text-text-muted mt-1">Wickets</p>
        </div>
        {extras > 0 && (
          <>
            <div className="w-px h-6 sm:h-8 bg-lux-border" />
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-light text-text-secondary tracking-wider">{extras}</p>
              <p className="text-[8px] sm:text-[9px] uppercase tracking-[3px] text-text-muted mt-1">Extras</p>
            </div>
          </>
        )}
      </div>

      {/* Ball-by-ball display — Bug #5 fix: extras shown as inline extra slots with visual indicator */}
      <div className="space-y-2 my-4 sm:my-6">
        {/* Main ball slots: 6 legal delivery positions + extras interleaved */}
        <div className="flex gap-1.5 sm:gap-2 justify-center flex-wrap">
          {liveState.currentOverBalls.map((ball, idx) => {
            const isExtra = ball.outcome === 'Wd' || ball.outcome === 'Nb';
            return (
              <div key={`ball-${idx}`} className="flex flex-col items-center">
                {/* Extra indicator tag above */}
                {isExtra && (
                  <span className="text-[6px] sm:text-[7px] text-gold/60 uppercase tracking-[1px] mb-0.5 font-semibold">extra</span>
                )}
                <div className={isExtra ? 'opacity-80' : ''}>
                  <BallIndicator outcome={ball.outcome} size={isExtra ? 'sm' : 'lg'} delay={0.2} index={idx} />
                </div>
                {/* +1 run indicator below for extras */}
                {isExtra && (
                  <span className="text-[6px] sm:text-[7px] text-gold/50 mt-0.5">+1 run</span>
                )}
              </div>
            );
          })}
          {/* Empty squares for remaining legal deliveries */}
          {Array.from({ length: remainingLegal }).map((_, idx) => (
            <div
              key={`empty-${idx}`}
              className="w-11 h-11 bg-lux-surface border border-lux-border flex items-center justify-center"
            />
          ))}
        </div>

        {/* Extras summary row */}
        {extraDeliveries.length > 0 && (
          <div className="flex items-center justify-center gap-2 mt-1">
            {extraDeliveries.map((ball, idx) => (
              <span key={`extra-${idx}`} className="text-[8px] sm:text-[9px] text-text-muted tracking-[1px]">
                {ball.outcome === 'Wd' ? 'Wide' : 'No Ball'}{idx < extraDeliveries.length - 1 ? ' •' : ''}
              </span>
            ))}
          </div>
        )}
      </div>

      {extras > 0 && (
        <div className="text-center mt-2">
          <p className="text-[8px] sm:text-[9px] uppercase tracking-[2px] text-text-muted">
            {legalDeliveries.length}/6 legal deliveries • {extras} extra{extras > 1 ? 's' : ''} (don&apos;t count as balls)
          </p>
        </div>
      )}
      <div className="text-center mt-4 sm:mt-6">
        <p className="text-[9px] sm:text-[10px] uppercase tracking-[2px] text-text-muted">
          Bowler: <span className="text-text-secondary font-medium">{liveState.currentBowler}</span>
        </p>
      </div>
    </Card>
  );
}
