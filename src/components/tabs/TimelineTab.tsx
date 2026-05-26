'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { InningsData, MatchInfo, FallOfWicket, OverData } from '@/lib/types';
import InningsToggle from '@/components/ui/innings-toggle';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface TimelineTabProps {
  matchInfo: MatchInfo;
  innings1: InningsData;
  innings2: InningsData;
}

function CRRIndicator({ overData, prevOverData }: { overData: OverData; prevOverData?: OverData }) {
  if (!prevOverData) return null;
  const diff = overData.crr - prevOverData.crr;
  if (Math.abs(diff) < 0.3) return null;

  const isSpike = diff > 0;
  return (
    <div className="ml-8 my-2 flex items-center gap-2">
      <div className={`w-2 h-2 ${isSpike ? 'bg-status-positive' : 'bg-status-negative'}`} />
      <span className="text-xs text-text-muted">
        CRR {isSpike ? 'spiked' : 'dropped'} to {overData.crr.toFixed(2)} (Over {overData.over})
      </span>
    </div>
  );
}

export default function TimelineTab({ matchInfo, innings1, innings2 }: TimelineTabProps) {
  const [activeInnings, setActiveInnings] = useState<1 | 2>(1);
  const innings = activeInnings === 1 ? innings1 : innings2;
  const battingTeam = activeInnings === 1 ? matchInfo.team1 : matchInfo.team2;

  const innLabel1 = innings1.battingTeam || `${matchInfo.team1.shortName} 1st Innings`;
  const innLabel2 = innings2.battingTeam || `${matchInfo.team2.shortName} 2nd Innings`;

  // Build a combined timeline of fall of wickets with CRR indicators
  const timelineEvents: Array<{
    type: 'wicket' | 'crr-spike' | 'crr-drop';
    fow?: FallOfWicket;
    overData?: OverData;
    prevOverData?: OverData;
  }> = [];

  // Add fall of wickets
  for (const fow of innings.fallOfWickets) {
    const overNum = parseInt(fow.overs.split('.')[0], 10);
    const overData = innings.overByOver.find((o) => o.over === overNum);
    const prevOverData = innings.overByOver.find((o) => o.over === overNum - 1);

    timelineEvents.push({
      type: 'wicket',
      fow,
      overData,
      prevOverData,
    });
  }

  return (
    <div className="lux-card">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-gold" />
          <h2 className="text-sm font-semibold uppercase tracking-[2px] text-text-secondary">Fall of Wickets & Key Moments</h2>
        </div>
        <InningsToggle
          activeInnings={activeInnings}
          onChange={setActiveInnings}
          label1={innLabel1}
          label2={innLabel2}
        />
      </div>

      <motion.div
        key={activeInnings}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Team info */}
        <div className="flex items-center gap-2 mb-6 text-sm text-text-muted">
          <span>{battingTeam.flagEmoji}</span>
          <span className="font-medium text-text-secondary">{innings.battingTeam} - {innings.totalRuns}/{innings.totalWkts} ({innings.totalOvers} ov)</span>
        </div>

        {/* Visual Timeline */}
        <div className="relative pl-8 border-l-2 border-lux-border space-y-8">
          {timelineEvents.map((event, idx) => {
            if (event.type === 'wicket' && event.fow) {
              const fow = event.fow;
              const overNum = parseInt(fow.overs.split('.')[0], 10);
              const overData = innings.overByOver.find((o) => o.over === overNum);
              const prevOverData = innings.overByOver.find((o) => o.over === overNum - 1);

              // Find the partnership that was broken
              const prevFow = idx > 0 && timelineEvents[idx - 1]?.fow;
              const partnershipRuns = prevFow ? fow.score - prevFow.score : fow.score;
              const partnershipOvers = prevFow
                ? (parseFloat(fow.overs) - parseFloat(prevFow.overs)).toFixed(1)
                : fow.overs;
              const partnershipBalls = Math.round(parseFloat(partnershipOvers) * 6);

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                >
                  {/* Node Dot */}
                  <div className="absolute left-[-13px] top-1 w-6 h-6 bg-status-negative/20 border-4 border-lux-card flex items-center justify-center text-status-negative font-bold text-xs">
                    {fow.wkt}
                  </div>

                  {/* Content Box */}
                  <div className="bg-lux-elevated p-4 border border-lux-border">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xl font-bold text-text-primary">
                          {fow.score}/{fow.wkt}
                        </p>
                        <p className="text-sm text-status-negative font-medium mt-1">
                          {fow.batsman}
                        </p>
                        <p className="text-sm text-text-muted">
                          Over {fow.overs}
                        </p>
                      </div>
                      <div className="text-right">
                        {partnershipRuns > 0 && (
                          <p className="text-xs text-text-muted">
                            Partnership: {partnershipRuns} off {partnershipBalls} balls
                          </p>
                        )}
                        {overData && (
                          <p className="text-xs text-text-muted mt-1">
                            CRR: {overData.crr.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* CRR spike/drop indicator between wickets */}
                  {overData && prevOverData && Math.abs(overData.crr - prevOverData.crr) >= 0.3 && (
                    <div className="ml-4 mt-2 flex items-center gap-2">
                      <div className={`w-2 h-2 ${
                        overData.crr > prevOverData.crr ? 'bg-status-positive' : 'bg-status-negative'
                      }`} />
                      <span className="text-xs text-text-muted">
                        CRR {overData.crr > prevOverData.crr ? 'spiked' : 'dropped'} to {overData.crr.toFixed(2)}
                      </span>
                    </div>
                  )}
                </motion.div>
              );
            }
            return null;
          })}

          {/* End of innings indicator */}
          {innings.fallOfWickets.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: timelineEvents.length * 0.1 }}
              className="relative"
            >
              <div className="absolute left-[-9px] top-1 w-4 h-4 bg-status-positive/20 border-4 border-lux-card" />
              <div className="bg-status-positive/10 p-3 border border-status-positive/20">
                <p className="text-sm font-medium text-status-positive">
                  End of {innings.battingTeam} innings: {innings.totalRuns}/{innings.totalWkts} ({innings.totalOvers} ov)
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
