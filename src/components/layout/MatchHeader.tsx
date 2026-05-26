'use client';

import { MatchInfo, InningsData } from '@/lib/types';

interface MatchHeaderProps {
  matchInfo: MatchInfo;
  innings1: InningsData;
  innings2: InningsData;
}

export default function MatchHeader({ matchInfo, innings1, innings2 }: MatchHeaderProps) {
  const team1Score = `${innings1.totalRuns}/${innings1.totalWkts} (${innings1.totalOvers})`;
  const team2Score = `${innings2.totalRuns}/${innings2.totalWkts} (${innings2.totalOvers})`;

  return (
    <div className="lux-card mb-6">
      <div className="text-center mb-2">
        <p className="text-[9px] text-text-muted uppercase tracking-[3px] font-semibold mb-3">
          {matchInfo.matchTitle}
        </p>
      </div>

      {/* Team scores row */}
      <div className="flex items-center justify-center gap-4 sm:gap-8">
        {/* Team 1 */}
        <div className="flex items-center gap-3">
          <span className="text-3xl">{matchInfo.team1.flagEmoji}</span>
          <div className="text-right">
            <p className="font-bold text-text-primary text-sm sm:text-base">{matchInfo.team1.shortName}</p>
            <p className="text-lg sm:text-2xl font-bold text-gold">{team1Score}</p>
          </div>
        </div>

        {/* VS Badge */}
        <div className="h-8 w-8 bg-lux-surface flex items-center justify-center text-xs font-bold text-text-muted shrink-0 border border-lux-border">
          VS
        </div>

        {/* Team 2 */}
        <div className="flex items-center gap-3">
          <div className="text-left">
            <p className="font-bold text-text-primary text-sm sm:text-base">{matchInfo.team2.shortName}</p>
            <p className="text-lg sm:text-2xl font-bold text-[#E63946]">{team2Score}</p>
          </div>
          <span className="text-3xl">{matchInfo.team2.flagEmoji}</span>
        </div>
      </div>

      {/* Bottom info row */}
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm text-text-secondary mt-4">
        <span className="font-semibold text-status-positive">{matchInfo.result}</span>
        <span className="text-lux-border">|</span>
        <span>{matchInfo.toss}</span>
        <span className="text-lux-border">|</span>
        <span>{matchInfo.venue}</span>
        <span className="text-lux-border">|</span>
        <span>{matchInfo.date}</span>
        <span className="text-lux-border">|</span>
        <span>Player of the Match: <span className="font-semibold text-gold">{matchInfo.playerOfMatch}</span></span>
      </div>
    </div>
  );
}
