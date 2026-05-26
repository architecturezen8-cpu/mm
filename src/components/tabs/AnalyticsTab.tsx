'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import OverHistoryCard from '@/components/cards/OverHistoryCard';
import ScrollReveal from '@/components/ScrollReveal';
import EditableSection from '@/components/admin/EditableSection';
import { InningsData, LiveState, MomentumPoint } from '@/lib/types';
import type { DataSource } from '@/hooks/useMatchLiveData';

// Chart.js components loaded client-only (Canvas API not available on server)
const ManhattanCard = dynamic(() => import('@/components/cards/ManhattanCard'), { ssr: false });
const RunRateChart = dynamic(() => import('@/components/cards/RunRateChart'), { ssr: false });
const EstimatedScoreCard = dynamic(() => import('@/components/cards/EstimatedScoreCard'), { ssr: false });
const PartnershipProgressCard = dynamic(() => import('@/components/cards/PartnershipProgressCard'), { ssr: false });
const MomentumCard = dynamic(() => import('@/components/cards/MomentumCard'), { ssr: false });

interface AnalyticsTabProps {
  innings1: InningsData;
  innings2: InningsData;
  liveState: LiveState;
  momentum: MomentumPoint[];
  dataSource: DataSource;
}

export default function AnalyticsTab({ innings1, innings2, liveState, momentum, dataSource }: AnalyticsTabProps) {
  const [activeInnings, setActiveInnings] = useState<1 | 2>(1);
  const activeInningsData = activeInnings === 1 ? innings1 : innings2;

  const isOffline = dataSource === 'offline' || dataSource === 'connecting';

  // Determine which innings is currently live
  const isBattingTeam1stInnings = liveState.battingTeam?.includes("St.Thomas'")
    ? innings1.battingTeam?.includes("St.Thomas'")
    : !innings1.battingTeam?.includes("St.Thomas'");

  // Check if innings has real data (overByOver with content)
  const hasInnings1Data = innings1?.overByOver && innings1.overByOver.length > 0;
  const hasInnings2Data = innings2?.overByOver && innings2.overByOver.length > 0;

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6">
      {/* Innings Toggle for detailed stats */}
      <div className="flex justify-center gap-2 sm:gap-3">
        {[1, 2].map((inn) => {
          const data = inn === 1 ? innings1 : innings2;
          const hasData = inn === 1 ? hasInnings1Data : hasInnings2Data;
          const isLiveInnings = inn === 1 ? isBattingTeam1stInnings : !isBattingTeam1stInnings;
          return (
            <button
              key={inn}
              onClick={() => setActiveInnings(inn as 1 | 2)}
              className={`relative px-4 sm:px-8 py-2.5 sm:py-3 border text-[9px] sm:text-[10px] font-semibold uppercase tracking-[2px] sm:tracking-[3px] transition-all duration-300 ${
                activeInnings === inn
                  ? 'border-gold bg-gold-ghost text-gold'
                  : 'border-lux-border text-text-muted hover:border-lux-border-hover'
              }`}
            >
              {inn}{inn === 1 ? 'st' : 'nd'} Inn — {data.battingTeam?.split(' ').slice(-2).join(' ') || `Innings ${inn}`} ({data.totalRuns}/{data.totalWkts})
              {isLiveInnings && liveState.isLive && !isOffline && (
                <span className="ml-2 relative flex h-1.5 w-1.5 inline-flex">
                  <span className="animate-ping absolute inline-flex h-full w-full bg-gold opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 bg-gold rounded-full" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Offline message — shown when data source is offline */}
      {isOffline && (
        <div className="text-center py-4">
          <p className="text-[#4A4945] text-xs uppercase tracking-[2px]">Analytics will be available when live data is enabled</p>
        </div>
      )}

      {/* Charts — show real data when available, empty only when truly offline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
        <EditableSection
          sectionId="analytics-momentum"
          pageId="live"
          type="stats"
          title="Momentum"
          content={{ heading: 'Momentum' }}
        >
          <ScrollReveal animation="fade-up" delay={0}>
            <MomentumCard momentum={isOffline ? [] : momentum} />
          </ScrollReveal>
        </EditableSection>

        <EditableSection
          sectionId="analytics-manhattan"
          pageId="live"
          type="stats"
          title="Manhattan Chart"
          content={{ heading: 'Manhattan Chart' }}
        >
          <ScrollReveal animation="fade-up" delay={100}>
            <ManhattanCard innings1={isOffline ? { ...innings1, overByOver: [], batting: [], bowling: [], partnerships: [], fallOfWickets: [] } : innings1} innings2={isOffline ? { ...innings2, overByOver: [], batting: [], bowling: [], partnerships: [], fallOfWickets: [] } : innings2} selectedInnings={activeInnings} />
          </ScrollReveal>
        </EditableSection>

        <EditableSection
          sectionId="analytics-runrate"
          pageId="live"
          type="stats"
          title="Run Rate"
          content={{ heading: 'Run Rate Chart' }}
        >
          <ScrollReveal animation="fade-up" delay={0}>
            <RunRateChart innings1={isOffline ? { ...innings1, overByOver: [] } : innings1} innings2={isOffline ? { ...innings2, overByOver: [] } : innings2} selectedInnings={activeInnings} />
          </ScrollReveal>
        </EditableSection>

        <EditableSection
          sectionId="analytics-estimated"
          pageId="live"
          type="stats"
          title="Estimated Score"
          content={{ heading: 'Estimated Score' }}
        >
          <ScrollReveal animation="fade-up" delay={100}>
            <EstimatedScoreCard innings={isOffline ? { ...activeInningsData, overByOver: [] } : activeInningsData} />
          </ScrollReveal>
        </EditableSection>

        <EditableSection
          sectionId="analytics-partnership"
          pageId="live"
          type="stats"
          title="Partnership Progress"
          content={{ heading: 'Partnership Progress' }}
        >
          <ScrollReveal animation="fade-up" delay={0}>
            <PartnershipProgressCard liveState={liveState} />
          </ScrollReveal>
        </EditableSection>

        <EditableSection
          sectionId="analytics-overhistory"
          pageId="live"
          type="stats"
          title="Over History"
          content={{ heading: 'Over History' }}
        >
          <ScrollReveal animation="fade-up" delay={100}>
            <OverHistoryCard innings={isOffline ? { ...activeInningsData, overByOver: [] } : activeInningsData} />
          </ScrollReveal>
        </EditableSection>
      </div>
    </div>
  );
}
