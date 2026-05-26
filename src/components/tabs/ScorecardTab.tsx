'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '@/components/ui/lux-card';
import ScrollReveal from '@/components/ScrollReveal';
import EditableSection from '@/components/admin/EditableSection';
import { InningsData, MatchInfo } from '@/lib/types';
import { formatSR, formatEcon } from '@/lib/utils';
import type { DataSource } from '@/hooks/useMatchLiveData';

interface ScorecardTabProps {
  matchInfo: MatchInfo;
  innings1: InningsData;
  innings2: InningsData;
  dataSource: DataSource;
}

export default function ScorecardTab({ matchInfo, innings1, innings2, dataSource }: ScorecardTabProps) {
  const [activeInnings, setActiveInnings] = useState<1 | 2>(1);
  const innings = activeInnings === 1 ? innings1 : innings2;

  const isOffline = dataSource === 'offline' || dataSource === 'connecting';

  // Safely determine batting/bowling team from innings data
  const hasBattingTeam = innings.battingTeam && innings.battingTeam.length > 0;
  const battingTeam = hasBattingTeam
    ? (innings.battingTeam?.includes("St.Thomas'") ? matchInfo.team1 : matchInfo.team2)
    : matchInfo.team1;
  const bowlingTeam = hasBattingTeam
    ? (innings.bowlingTeam?.includes("St.Thomas'") ? matchInfo.team1 : matchInfo.team2)
    : matchInfo.team2;

  // Determine if we have actual player data (not placeholders)
  const hasPlayerData = innings.batting.length > 0 && !isPlaceholderData(innings);

  // If offline, show placeholder data
  // If live but no data yet, show empty state
  // If live with data, show actual data

  // Get team display name for toggle
  const getTeamForToggle = (data: InningsData) => {
    if (!data.battingTeam || data.battingTeam.length === 0) {
      return { flagEmoji: '', name: `Innings` };
    }
    const team = data.battingTeam.includes("St.Thomas'") ? matchInfo.team1 : matchInfo.team2;
    return team;
  };

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6">
      {/* Toggle */}
      <div className="flex justify-center gap-2 sm:gap-3">
        {[1, 2].map((inn) => {
          const data = inn === 1 ? innings1 : innings2;
          const team = getTeamForToggle(data);
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
              {team.flagEmoji} {inn}{inn === 1 ? 'st' : 'nd'} Inn — {data.totalRuns}/{data.totalWkts}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeInnings}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Offline mode: show placeholder data */}
          {isOffline && (
            <>
              {/* Batting Card - Offline */}
              <ScrollReveal animation="fade-up" delay={0}>
                <Card className="mb-3 sm:mb-4 lg:mb-6" delay={0}>
                  <div className="card-title">
                    <span className="icon">◇</span>
                    {battingTeam.flagEmoji} <span className="text-gold">{innings.battingTeam || 'Team'}</span> — {innings.totalRuns}/{innings.totalWkts}
                    <span className="ml-2 text-[8px] sm:text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 uppercase tracking-[1px]">Offline</span>
                  </div>
                  <div className="overflow-x-auto -mx-1.5 sm:mx-0">
                    <table className="lux-table">
                      <thead>
                        <tr>
                          <th>Batsman</th>
                          <th>R</th>
                          <th>B</th>
                          <th>4s</th>
                          <th>6s</th>
                          <th>SR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {innings.batting.map((batter, idx) => (
                          <tr key={`${batter.name}-${idx}`} className="opacity-50">
                            <td className="font-medium tracking-wider text-xs sm:text-sm text-text-muted">
                              {batter.name}
                              {!batter.isOut && (
                                <span className="ml-1 sm:ml-2 text-[8px] sm:text-[9px] bg-gold-ghost text-gold border border-gold-dim/20 px-1.5 sm:px-2 py-0.5 tracking-[1px]">not out</span>
                              )}
                            </td>
                            <td className="text-text-muted">—</td>
                            <td className="text-text-muted">—</td>
                            <td className="text-text-muted">—</td>
                            <td className="text-text-muted">—</td>
                            <td className="text-text-muted">—</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex flex-wrap gap-3 sm:gap-5 text-[10px] sm:text-[11px] text-text-muted mt-4 sm:mt-6 px-3 sm:px-5 py-2 sm:py-3 bg-lux-surface/50 border border-lux-border">
                    <span>Wides: <span className="text-text-secondary">—</span></span>
                    <span>NB: <span className="text-text-secondary">—</span></span>
                    <span>Byes: <span className="text-text-secondary">—</span></span>
                    <span>LB: <span className="text-text-secondary">—</span></span>
                    <span>Pen: <span className="text-text-secondary">—</span></span>
                  </div>
                </Card>
              </ScrollReveal>

              {/* Bowling Card - Offline */}
              <ScrollReveal animation="fade-up" delay={100}>
                <Card delay={0.1}>
                  <div className="card-title">
                    <span className="icon">◇</span>
                    {bowlingTeam.flagEmoji} <span className={innings.bowlingTeam?.includes('Science') ? 'text-[#E63946]' : ''}>{innings.bowlingTeam || 'Team'}</span> Bowling
                  </div>
                  <div className="overflow-x-auto -mx-1.5 sm:mx-0">
                    <table className="lux-table">
                      <thead>
                        <tr>
                          <th>Bowler</th>
                          <th>O</th>
                          <th>M</th>
                          <th>R</th>
                          <th>W</th>
                          <th>Econ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {innings.bowling.map((bowler, idx) => (
                          <tr key={`${bowler.name}-${idx}`} className="opacity-50">
                            <td className="font-medium text-text-muted tracking-wider text-xs sm:text-sm">{bowler.name}</td>
                            <td className="text-text-muted">—</td>
                            <td className="text-text-muted">—</td>
                            <td className="text-text-muted">—</td>
                            <td className="text-text-muted">—</td>
                            <td className="text-text-muted">—</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </ScrollReveal>
            </>
          )}

          {/* Live mode ON but no player data yet (match not started) */}
          {!isOffline && !hasPlayerData && (
            <Card delay={0}>
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <p className="text-[#4A4945] text-sm mb-1">
                    No scorecard data available for this innings yet
                  </p>
                  <p className="text-[#4A4945]/60 text-xs">
                    Data will appear once the innings begins
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Live mode ON with actual player data */}
          {!isOffline && hasPlayerData && (
            <>
              {/* Batting */}
              <EditableSection
                sectionId="scorecard-batting"
                pageId="live"
                type="scorecard"
                title="Batting Scorecard"
                content={{
                  heading: `${innings.battingTeam || 'Team'} Batting`,
                  team: innings.battingTeam,
                  total_runs: innings.totalRuns,
                  total_wkts: innings.totalWkts,
                  total_overs: innings.totalOvers,
                }}
              >
                <ScrollReveal animation="fade-up" delay={0}>
                  <Card className="mb-3 sm:mb-4 lg:mb-6" delay={0}>
                    <div className="card-title">
                      <span className="icon">◇</span>
                      {battingTeam.flagEmoji} <span className={innings.battingTeam?.includes("St.Thomas'") ? 'text-gold' : innings.battingTeam?.includes('Science') ? 'text-[#E63946]' : ''}>{innings.battingTeam || 'Team'}</span> — {innings.totalRuns}/{innings.totalWkts} ({innings.totalOvers})
                    </div>
                  {innings.batting.length > 0 ? (
                  <div className="overflow-x-auto -mx-1.5 sm:mx-0">
                    <table className="lux-table">
                      <thead>
                        <tr>
                          <th>Batsman</th>
                          <th>R</th>
                          <th>B</th>
                          <th>4s</th>
                          <th>6s</th>
                          <th>SR</th>
                          <th className="hidden sm:table-cell">Dismissal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {innings.batting.map((batter, idx) => (
                          <tr key={`${batter.name}-${idx}`}>
                            <td className={`font-medium tracking-wider text-xs sm:text-sm ${!batter.isOut ? 'text-gold' : 'text-text-primary'}`}>
                              <span className="block truncate max-w-[120px] sm:max-w-none">{batter.name}</span>
                              {!batter.isOut && (
                                <span className="ml-1 sm:ml-2 text-[8px] sm:text-[9px] bg-gold-ghost text-gold border border-gold-dim/20 px-1.5 sm:px-2 py-0.5 tracking-[1px]">not out</span>
                              )}
                            </td>
                            <td className="font-light text-text-primary text-sm sm:text-base">{batter.runs}</td>
                            <td className="text-text-muted">{batter.balls}</td>
                            <td className="text-text-muted">{batter.fours}</td>
                            <td className="text-text-muted">{batter.sixes}</td>
                            <td className={
                              batter.sr > 150 ? 'text-gold font-medium' :
                              batter.sr < 80 ? 'text-status-negative' : 'text-text-secondary'
                            }>
                              {formatSR(batter.sr)}
                            </td>
                            <td className="text-text-muted text-[10px] sm:text-[11px] hidden sm:table-cell">{batter.dismissal}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  ) : (
                    <div className="py-8 text-center text-[#4A4945] text-xs">
                      Batting data not yet available
                    </div>
                  )}
                  <div className="flex flex-wrap gap-3 sm:gap-5 text-[10px] sm:text-[11px] text-text-muted mt-4 sm:mt-6 px-3 sm:px-5 py-2 sm:py-3 bg-lux-surface/50 border border-lux-border">
                    <span>Wides: <span className="text-text-secondary">{innings.extras.wides}</span></span>
                    <span>NB: <span className="text-text-secondary">{innings.extras.noBalls}</span></span>
                    <span>Byes: <span className="text-text-secondary">{innings.extras.byes}</span></span>
                    <span>LB: <span className="text-text-secondary">{innings.extras.legByes}</span></span>
                    <span>Pen: <span className="text-text-secondary">{innings.extras.penalty}</span></span>
                    <span className="font-medium text-gold tracking-wider">Total: {innings.extras.total}</span>
                  </div>
                </Card>
                </ScrollReveal>
              </EditableSection>

              {/* Bowling */}
              <EditableSection
                sectionId="scorecard-bowling"
                pageId="live"
                type="scorecard"
                title="Bowling Scorecard"
                content={{
                  heading: `${innings.bowlingTeam || 'Team'} Bowling`,
                  team: innings.bowlingTeam,
                }}
              >
                <ScrollReveal animation="fade-up" delay={100}>
                  <Card delay={0.1}>
                    <div className="card-title">
                      <span className="icon">◇</span>
                      {bowlingTeam.flagEmoji} <span className={innings.bowlingTeam?.includes("St.Thomas'") ? 'text-gold' : innings.bowlingTeam?.includes('Science') ? 'text-[#E63946]' : ''}>{innings.bowlingTeam || 'Team'}</span> Bowling
                    </div>
                  {innings.bowling.length > 0 ? (
                  <div className="overflow-x-auto -mx-1.5 sm:mx-0">
                    <table className="lux-table">
                      <thead>
                        <tr>
                          <th>Bowler</th>
                          <th>O</th>
                          <th>M</th>
                          <th>R</th>
                          <th>W</th>
                          <th>Econ</th>
                          <th className="hidden sm:table-cell">Dot %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {innings.bowling.map((bowler, idx) => (
                          <tr key={bowler.name}>
                            <td className="font-medium text-text-primary tracking-wider text-xs sm:text-sm">{bowler.name}</td>
                            <td className="text-text-secondary">{bowler.overs}</td>
                            <td className="text-text-muted">{bowler.maidens}</td>
                            <td className="text-text-secondary">{bowler.runs}</td>
                            <td className="font-light text-gold text-sm sm:text-base">{bowler.wickets}</td>
                            <td className={
                              bowler.econ < 5 ? 'text-gold font-medium' :
                              bowler.econ > 9 ? 'text-status-negative' : 'text-text-secondary'
                            }>
                              {formatEcon(bowler.econ)}
                            </td>
                            <td className="text-text-muted hidden sm:table-cell">{(bowler.dotPercent ?? 0).toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  ) : (
                    <div className="py-8 text-center text-[#4A4945] text-xs">
                      Bowling data not yet available
                    </div>
                  )}
                </Card>
                </ScrollReveal>
              </EditableSection>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/** Check if innings data contains placeholder entries (Batsman 1, Bowler 1, etc.) */
function isPlaceholderData(innings: InningsData): boolean {
  if (!innings.batting || innings.batting.length === 0) return true;
  const firstBatsman = innings.batting[0]?.name || '';
  return firstBatsman === 'Batsman 1' || firstBatsman === 'Batsman 2';
}
