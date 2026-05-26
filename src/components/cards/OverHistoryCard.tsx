'use client';

import Card from '@/components/ui/lux-card';
import { InningsData } from '@/lib/types';

interface OverHistoryCardProps {
  innings: InningsData;
}

export default function OverHistoryCard({ innings }: OverHistoryCardProps) {
  // Check if over-by-over data exists
  const hasOverData = innings?.overByOver && innings.overByOver.length > 0;

  if (!hasOverData) {
    return (
      <Card className="col-span-full" delay={0.2}>
        <div className="card-title">
          <span className="icon">◈</span>
          Over History
        </div>
        <div className="flex items-center justify-center py-12">
          <p className="text-[#4A4945] text-sm">
            Over-by-over data not available for this innings
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="col-span-full" delay={0.2}>
      <div className="card-title">
        <span className="icon">◈</span>
        Over History
      </div>
      <div className="overflow-x-auto max-h-72 sm:max-h-96 overflow-y-auto">
        <table className="lux-table">
          <thead>
            <tr>
              <th>Over</th>
              <th>Runs</th>
              <th>Wkt</th>
              <th>Total</th>
              <th>Batter</th>
            </tr>
          </thead>
          <tbody>
            {innings.overByOver.map((over) => (
              <tr key={over.over} className={`border-l-2 ${
                over.runs > 8 ? 'border-l-gold' :
                over.runs < 5 ? 'border-l-status-negative' :
                'border-l-lux-border'
              }`}>
                <td className="font-medium text-text-primary tracking-wider">{over.over}</td>
                <td className={
                  over.runs > 8 ? 'text-gold font-medium' :
                  over.runs < 5 ? 'text-status-negative' :
                  'text-text-secondary'
                }>{over.runs}</td>
                <td className={over.isWicket ? 'text-status-negative font-medium' : 'text-text-muted'}>{over.isWicket ? 'W' : '—'}</td>
                <td className="text-text-primary font-light">{over.cumulative}</td>
                <td className="text-text-muted text-[11px]">{over.keyBatter}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
