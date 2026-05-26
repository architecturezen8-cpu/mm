'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { MatchInfo, LiveState, InningsData } from '@/lib/types';
import { DataSource } from '@/hooks/useMatchLiveData';
import EditableSection from '@/components/admin/EditableSection';

interface DashboardHeaderProps {
  matchInfo: MatchInfo;
  liveState: LiveState;
  dataSource?: DataSource;
  lastUpdated?: Date | null;
  maxOvers?: number;
  innings1?: InningsData;
  innings2?: InningsData;
}

export default function DashboardHeader({ matchInfo, liveState, dataSource, lastUpdated, maxOvers, innings1, innings2 }: DashboardHeaderProps) {
  const isOffline = liveState.isOffline === true;

  // Determine match format display
  const matchFormat = maxOvers
    ? maxOvers === 20
      ? 'T20'
      : maxOvers === 50
        ? 'ODI'
        : `${maxOvers} Overs`
    : null;

  // Determine which team is batting based on liveState
  const isSTCBatting = liveState.battingTeam?.includes("St.Thomas'") || liveState.battingTeam?.toUpperCase()?.includes('STC') || false;

  // Use innings data to determine which team's score to show on each side
  const stcInnings = innings1?.battingTeam?.includes("St.Thomas'") ? innings1
    : innings2?.battingTeam?.includes("St.Thomas'") ? innings2 : null;
  const gscInnings = innings1?.battingTeam?.includes('Science') ? innings1
    : innings2?.battingTeam?.includes('Science') ? innings2 : null;

  // Format score display
  const stcScoreDisplay = isOffline
    ? '0/0'
    : stcInnings
      ? `${stcInnings.totalRuns}/${stcInnings.totalWkts}`
      : (isSTCBatting ? liveState.score : '—');
  const stcOversDisplay = isOffline ? '0.0' : stcInnings ? stcInnings.totalOvers : '';

  const gscScoreDisplay = isOffline
    ? '0/0'
    : gscInnings
      ? `${gscInnings.totalRuns}/${gscInnings.totalWkts}`
      : (!isSTCBatting ? liveState.score : '—');
  const gscOversDisplay = isOffline ? '0.0' : gscInnings ? gscInnings.totalOvers : '';

  const isSTCBattingNow = isSTCBatting;
  const isGSCBattingNow = !isSTCBatting;

  // Is match completed?
  const isCompleted = !isOffline && !liveState.isLive && matchInfo.result && !matchInfo.result.toLowerCase().includes('in progress') && !matchInfo.result.toLowerCase().includes('tbd');

  // Over display
  const overDisplay = isOffline ? '0.0' : liveState.overDisplay;

  // Last updated time string
  const updatedTimeStr = lastUpdated && dataSource === 'live'
    ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  return (
    <EditableSection
      sectionId="dashboard-header"
      pageId="live"
      type="stats"
      title="Dashboard Header"
      content={{
        heading: 'Live Match Header',
        series: matchInfo.series,
        venue: matchInfo.venue,
        result: matchInfo.result,
        stc_logo: 'https://cdn.jsdelivr.net/gh/architecturezen8-cpu/web-assets/battle-of-the-golds/1778142922724-St.Thomas__College_Matale.png',
        gsc_logo: 'https://cdn.jsdelivr.net/gh/architecturezen8-cpu/web-assets/battle-of-the-golds/1778142905872-Govt.Science_college_matale.png',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="lux-card mb-4 sm:mb-6"
      >
        {/* ══════════════════════════════════════
            DESKTOP LAYOUT (sm and above)
            ══════════════════════════════════════ */}
        <div className="hidden sm:block">
          {/* Desktop: Series name at TOP CENTER */}
          <div className="flex items-center justify-center mb-4">
            <p className="text-[10px] font-semibold uppercase tracking-[5px] text-text-muted">
              {matchInfo.series}
            </p>
          </div>

          {/* Desktop: Match format LEFT + data source RIGHT */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {matchFormat && (
                <span className="text-[9px] font-bold uppercase tracking-[2px] px-2 py-0.5 border border-gold/30 text-gold bg-gold-ghost/50">
                  {matchFormat}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {dataSource && !isOffline && (
                <div className="flex items-center gap-2">
                  <span className="relative flex h-1.5 w-1.5">
                    {dataSource === 'connecting' && (
                      <span className="animate-ping absolute inline-flex h-full w-full bg-yellow-400 opacity-60" />
                    )}
                    <span className={`relative inline-flex h-1.5 w-1.5 ${
                      dataSource === 'live' ? 'bg-emerald-400' :
                      dataSource === 'connecting' ? 'bg-yellow-400' :
                      'bg-orange-400'
                    } rounded-full`} />
                  </span>
                  <span className={`text-[9px] font-medium uppercase tracking-[2px] ${
                    dataSource === 'live' ? 'text-emerald-400' :
                    dataSource === 'connecting' ? 'text-yellow-400' :
                    'text-orange-400'
                  }`}>
                    {dataSource === 'live' ? 'Live Data' : dataSource === 'connecting' ? 'Connecting...' : 'Preview'}
                  </span>
                  {updatedTimeStr && (
                    <span className="text-[8px] text-text-muted ml-1">Updated {updatedTimeStr}</span>
                  )}
                </div>
              )}
              {isOffline && (
                <div className="flex items-center gap-2">
                  <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21m-3.636-3.636L14.535 14.535M5.636 18.364a9 9 0 010-12.728m0 0L2.808 2.808m2.828 2.828L8.464 8.464M12 12h.01" />
                  </svg>
                  <span className="text-[10px] font-bold uppercase tracking-[3px] text-red-500">Offline</span>
                </div>
              )}
              {!isOffline && liveState.isLive && (
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full bg-gold opacity-60" />
                    <span className="relative inline-flex h-2 w-2 bg-gold" />
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-[3px] text-gold">Live</span>
                </div>
              )}
            </div>
          </div>

          {/* Desktop: Teams row */}
          <div className="flex items-center justify-center gap-8 lg:gap-16 mb-4">
            {/* Team 1 - STC */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-5"
            >
              <div className="w-14 h-14 relative">
                <Image
                  src="https://cdn.jsdelivr.net/gh/architecturezen8-cpu/web-assets/battle-of-the-golds/1778142922724-St.Thomas__College_Matale.png"
                  alt="St.Thomas' College Matale"
                  fill sizes="56px"
                  className="object-contain" unoptimized
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[3px] text-gold mb-1">STC</p>
                  {isSTCBattingNow && <span className="text-[7px] uppercase tracking-[1px] text-gold/60 bg-gold-ghost/30 px-1 py-0.5">batting</span>}
                </div>
                <p className="text-3xl lg:text-4xl font-extralight text-text-primary tracking-wide">{stcScoreDisplay}</p>
                {stcOversDisplay && <p className="text-[9px] text-text-muted">({stcOversDisplay} ov)</p>}
              </div>
            </motion.div>

            {/* VS divider */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col items-center gap-1"
            >
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-[4px]">vs</span>
              <div className="w-px h-4 bg-lux-border" />
            </motion.div>

            {/* Team 2 - GSC */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-5"
            >
              <div className="text-right">
                <div className="flex items-center justify-end gap-2">
                  {isGSCBattingNow && <span className="text-[7px] uppercase tracking-[1px] text-[#E63946]/60 bg-[rgba(230,57,70,0.05)] px-1 py-0.5">batting</span>}
                  <p className="text-[10px] font-semibold uppercase tracking-[3px] text-[#E63946] mb-1">GSC</p>
                </div>
                <p className="text-3xl lg:text-4xl font-extralight text-[#E63946] tracking-wide">{gscScoreDisplay}</p>
                {gscOversDisplay && <p className="text-[9px] text-text-muted">({gscOversDisplay} ov)</p>}
              </div>
              <div className="w-14 h-14 relative">
                <Image
                  src="https://cdn.jsdelivr.net/gh/architecturezen8-cpu/web-assets/battle-of-the-golds/1778142905872-Govt.Science_college_matale.png"
                  alt="Govt. Science College Matale"
                  fill sizes="56px"
                  className="object-contain" unoptimized
                />
              </div>
            </motion.div>
          </div>

          {/* Desktop: Overs count BELOW the VS — like the previous style */}
          <div className="flex items-center justify-center gap-1.5 mb-4">
            <span className="text-xs font-semibold text-text-primary tracking-wider">{overDisplay}</span>
            <span className="text-[9px] text-text-muted">ov</span>
            {maxOvers && <span className="text-[9px] text-text-muted">/ {maxOvers}</span>}
          </div>

          {/* Chase info */}
          {!isOffline && liveState.need > 0 && (
            <div className="text-center mb-3">
              <span className="text-[10px] text-text-secondary tracking-[1px]">
                Target: {liveState.target} • Need: <span className="text-gold font-medium">{liveState.need}</span> from {liveState.ballsLeft} balls • RRR: <span className="text-[#E63946]">{liveState.rrr}</span>
              </span>
            </div>
          )}

          {/* Result row */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-[11px] tracking-[1px]">
            <span className="font-medium text-gold">{matchInfo.result}</span>
            <span className="text-lux-border">—</span>
            <span className="text-text-secondary">{matchInfo.venue}</span>
            <span className="text-lux-border">—</span>
            <span className="text-text-secondary">{matchInfo.toss}</span>
          </div>
        </div>

        {/* ══════════════════════════════════════
            MOBILE LAYOUT (below sm)
            ══════════════════════════════════════ */}
        <div className="sm:hidden">
          {/* Row 1: Series name centered — ABOVE the Live Data line */}
          <div className="text-center mb-2">
            <p className="text-[8px] font-semibold uppercase tracking-[3px] text-text-muted">
              {matchInfo.series}
            </p>
          </div>

          {/* Row 2: Live Data left | Match Format centered | Updated time right */}
          <div className="relative flex items-center justify-between mb-2">
            {/* Left: Live Data / Status indicator */}
            <div className="flex items-center gap-1">
              {isOffline ? (
                <>
                  <svg className="w-2.5 h-2.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21m-3.636-3.636L14.535 14.535M5.636 18.364a9 9 0 010-12.728m0 0L2.808 2.808m2.828 2.828L8.464 8.464M12 12h.01" />
                  </svg>
                  <span className="text-[7px] font-bold uppercase tracking-[1.5px] text-red-500">Offline</span>
                </>
              ) : liveState.isLive ? (
                <>
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full bg-gold opacity-60" />
                    <span className="relative inline-flex h-1.5 w-1.5 bg-gold" />
                  </span>
                  <span className="text-[7px] font-bold uppercase tracking-[1.5px] text-gold">Live Data</span>
                </>
              ) : dataSource === 'live' ? (
                <>
                  <span className="relative inline-flex h-1.5 w-1.5 bg-emerald-400 rounded-full" />
                  <span className="text-[7px] font-bold uppercase tracking-[1.5px] text-emerald-400">Live Data</span>
                </>
              ) : dataSource === 'offline' ? (
                <>
                  <span className="relative inline-flex h-1.5 w-1.5 bg-orange-400 rounded-full" />
                  <span className="text-[7px] font-bold uppercase tracking-[1.5px] text-orange-400">Preview</span>
                </>
              ) : (
                <>
                  <span className="relative inline-flex h-1.5 w-1.5 bg-yellow-400 rounded-full" />
                  <span className="text-[7px] font-bold uppercase tracking-[1.5px] text-yellow-400">Connecting</span>
                </>
              )}
            </div>

            {/* Center: Match Format badge (e.g. "2 Overs") */}
            {matchFormat && (
              <div className="absolute left-1/2 -translate-x-1/2">
                <span className="text-[8px] font-bold uppercase tracking-[2px] px-2 py-0.5 border border-gold/40 text-gold bg-gold-ghost/30">
                  {matchFormat}
                </span>
              </div>
            )}

            {/* Right: Updated time */}
            <div>
              {updatedTimeStr && (
                <span className="text-[7px] text-text-muted">Updated {updatedTimeStr}</span>
              )}
            </div>
          </div>

          {/* Teams row */}
          <div className="flex items-center justify-center gap-2 mb-2">
            {/* STC */}
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 relative">
                <Image src="https://cdn.jsdelivr.net/gh/architecturezen8-cpu/web-assets/battle-of-the-golds/1778142922724-St.Thomas__College_Matale.png" alt="STC" fill sizes="28px" className="object-contain" unoptimized />
              </div>
              <div>
                <div className="flex items-center gap-0.5">
                  <p className="text-[6px] font-semibold uppercase tracking-[1px] text-gold">STC</p>
                  {isSTCBattingNow && <span className="text-[5px] uppercase tracking-[0.5px] text-gold/60 bg-gold-ghost/30 px-0.5">bat</span>}
                </div>
                <p className="text-lg font-extralight text-text-primary tracking-wide leading-tight">{stcScoreDisplay}</p>
              </div>
            </div>

            {/* VS */}
            <span className="text-[7px] font-bold text-text-muted uppercase tracking-[2px] mx-1">vs</span>

            {/* GSC */}
            <div className="flex items-center gap-1.5">
              <div className="text-right">
                <div className="flex items-center justify-end gap-0.5">
                  {isGSCBattingNow && <span className="text-[5px] uppercase tracking-[0.5px] text-[#E63946]/60 bg-[rgba(230,57,70,0.05)] px-0.5">bat</span>}
                  <p className="text-[6px] font-semibold uppercase tracking-[1px] text-[#E63946]">GSC</p>
                </div>
                <p className="text-lg font-extralight text-[#E63946] tracking-wide leading-tight">{gscScoreDisplay}</p>
              </div>
              <div className="w-7 h-7 relative">
                <Image src="https://cdn.jsdelivr.net/gh/architecturezen8-cpu/web-assets/battle-of-the-golds/1778142905872-Govt.Science_college_matale.png" alt="GSC" fill sizes="28px" className="object-contain" unoptimized />
              </div>
            </div>
          </div>

          {/* Overs count BELOW the VS — like the previous style */}
          <div className="flex items-center justify-center gap-1 mb-1.5">
            <span className="text-[9px] font-semibold text-text-primary tracking-wider">{overDisplay}</span>
            <span className="text-[7px] text-text-muted">ov</span>
            {maxOvers && <span className="text-[7px] text-text-muted">/ {maxOvers}</span>}
          </div>

          {/* Completed label — centered below overs line when match is done */}
          {isCompleted && (
            <div className="text-center mb-1.5">
              <span className="text-[7px] font-bold uppercase tracking-[2px] text-gold">Completed</span>
            </div>
          )}

          {/* Chase info */}
          {!isOffline && liveState.need > 0 && (
            <div className="text-center mb-1.5">
              <span className="text-[7px] text-text-secondary tracking-[1px]">
                Target: {liveState.target} • Need: <span className="text-gold font-medium">{liveState.need}</span> from {liveState.ballsLeft} balls • RRR: <span className="text-[#E63946]">{liveState.rrr}</span>
              </span>
            </div>
          )}

          {/* Result row */}
          <div className="flex flex-wrap justify-center gap-x-2 gap-y-0.5 text-[7px] tracking-[1px]">
            <span className="font-medium text-gold">{matchInfo.result}</span>
            <span className="text-text-secondary">{matchInfo.venue}</span>
            <span className="text-text-secondary">{matchInfo.toss}</span>
          </div>
        </div>
      </motion.div>
    </EditableSection>
  );
}
