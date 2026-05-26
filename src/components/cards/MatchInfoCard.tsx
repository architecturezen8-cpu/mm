'use client';

import Card from '@/components/ui/lux-card';
import { MatchInfo } from '@/lib/types';

interface MatchInfoCardProps {
  matchInfo: MatchInfo;
  maxOvers?: number;
}

export default function MatchInfoCard({ matchInfo, maxOvers }: MatchInfoCardProps) {
  // Determine match format display
  const matchFormat = maxOvers
    ? maxOvers === 20
      ? 'T20'
      : maxOvers === 50
        ? 'ODI'
        : `${maxOvers} Overs`
    : null;

  const rows = [
    { label: 'Series', value: matchInfo.series },
    { label: 'Match', value: matchInfo.matchTitle },
    ...(matchFormat ? [{ label: 'Format', value: matchFormat, highlight: true }] : []),
    { label: 'Venue', value: matchInfo.venue },
    { label: 'Date', value: matchInfo.date },
    { label: 'Toss', value: matchInfo.toss, highlight: true },
    { label: 'Umpires', value: matchInfo.umpires.join(', ') },
    { label: 'Referee', value: matchInfo.matchReferee },
    { label: 'Player of Match', value: matchInfo.playerOfMatch, highlight: true },
  ];

  return (
    <Card delay={0.35}>
      <div className="card-title">
        <span className="icon">◈</span>
        Match Information
      </div>
      <div className="space-y-0">
        {rows.map((row, idx) => (
          <div key={idx} className="stat-row">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-[2px] text-text-muted">{row.label}</span>
            <span className={`text-xs sm:text-sm font-medium tracking-wider ${row.highlight ? 'text-gold' : 'text-text-primary'}`}>
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
