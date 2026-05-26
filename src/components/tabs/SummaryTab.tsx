'use client';

import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Target, Zap, Award } from 'lucide-react';
import { MatchInfo, InningsData } from '@/lib/types';

interface SummaryTabProps {
  matchInfo: MatchInfo;
  innings1: InningsData;
  innings2: InningsData;
}

function StatBox({ label, value, icon: Icon }: { label: string; value: string; icon: typeof TrendingUp }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-lux-elevated rounded-lg p-4 text-center"
    >
      <Icon className="w-5 h-5 mx-auto text-gold mb-2" />
      <p className="text-xs text-text-muted uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
    </motion.div>
  );
}

function ComparisonBar({
  label,
  team1Value,
  team2Value,
  team1Name,
  team2Name,
}: {
  label: string;
  team1Value: number;
  team2Value: number;
  team1Name: string;
  team2Name: string;
}) {
  const max = Math.max(team1Value, team2Value, 1);
  const team1Pct = (team1Value / max) * 100;
  const team2Pct = (team2Value / max) * 100;

  return (
    <div>
      <div className="flex items-center gap-4">
        <span className="w-16 text-right font-bold text-text-primary text-sm">{team1Value}</span>
        <div className="flex-1 flex gap-1 h-2 rounded-full bg-lux-elevated overflow-hidden">
          <div
            className="bg-gold rounded-l-full transition-all duration-500"
            style={{ width: `${team1Pct}%` }}
          />
          <div
            className="bg-[#E63946] rounded-r-full transition-all duration-500 ml-auto"
            style={{ width: `${team2Pct}%` }}
          />
        </div>
        <span className="w-16 text-left font-bold text-text-primary text-sm">{team2Value}</span>
      </div>
      <p className="text-xs text-text-muted text-center mt-1">{label}</p>
    </div>
  );
}

export default function SummaryTab({ matchInfo, innings1, innings2 }: SummaryTabProps) {
  // Calculate key stats
  const totalBoundaries1 = innings1.batting.reduce((sum, b) => sum + b.fours + b.sixes, 0);
  const totalBoundaries2 = innings2.batting.reduce((sum, b) => sum + b.fours + b.sixes, 0);
  const totalFours1 = innings1.batting.reduce((sum, b) => sum + b.fours, 0);
  const totalFours2 = innings2.batting.reduce((sum, b) => sum + b.fours, 0);
  const totalSixes1 = innings1.batting.reduce((sum, b) => sum + b.sixes, 0);
  const totalSixes2 = innings2.batting.reduce((sum, b) => sum + b.sixes, 0);
  const totalBoundaries = totalBoundaries1 + totalBoundaries2;
  const totalExtras = innings1.extras.total + innings2.extras.total;
  const highestPartnership1 = innings1.partnerships.length > 0 ? Math.max(...innings1.partnerships.map((p) => p.runs)) : 0;
  const highestPartnership2 = innings2.partnerships.length > 0 ? Math.max(...innings2.partnerships.map((p) => p.runs)) : 0;
  const highestPartnership = Math.max(highestPartnership1, highestPartnership2);
  const maxCRR1 = innings1.overByOver.length > 0 ? Math.max(...innings1.overByOver.map((o) => o.crr)) : 0;
  const maxCRR2 = innings2.overByOver.length > 0 ? Math.max(...innings2.overByOver.map((o) => o.crr)) : 0;
  const maxRunRate = Math.max(maxCRR1, maxCRR2);

  const totalDots1 = innings1.bowling.reduce((sum, b) => sum + b.dots, 0);
  const totalDots2 = innings2.bowling.reduce((sum, b) => sum + b.dots, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - 2 cols wide */}
      <div className="lg:col-span-2 space-y-6">
        {/* Match Overview Card */}
        <div className="lux-card">
          <h2 className="card-title">
            <span className="icon"><Trophy className="w-3.5 h-3.5 text-gold" /></span>
            Match Highlights
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <StatBox label="Total Boundaries" value={totalBoundaries.toString()} icon={Target} />
            <StatBox label="Total Extras" value={totalExtras.toString()} icon={Zap} />
            <StatBox label="Highest Partnership" value={`${highestPartnership}`} icon={TrendingUp} />
            <StatBox label="Max Run Rate" value={maxRunRate.toFixed(2)} icon={Zap} />
          </div>

          {/* Boundary breakdown */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="bg-lux-elevated rounded-lg p-4">
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1">{matchInfo.team1.shortName} Boundaries</p>
              <p className="text-lg font-bold text-text-primary">{totalFours1} Fours / {totalSixes1} Sixes</p>
            </div>
            <div className="bg-lux-elevated rounded-lg p-4">
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1">{matchInfo.team2.shortName} Boundaries</p>
              <p className="text-lg font-bold text-text-primary">{totalFours2} Fours / {totalSixes2} Sixes</p>
            </div>
          </div>
        </div>

        {/* Key Players Section */}
        <div className="lux-card">
          <h2 className="card-title">
            <span className="icon"><Award className="w-3.5 h-3.5 text-gold" /></span>
            Key Performances
          </h2>
          <div className="space-y-3">
            {/* Player of the Match */}
            <div className="flex items-center gap-4 bg-gold-ghost border border-gold-dim/30 rounded-lg p-4">
              <div className="h-10 w-10 rounded-full bg-gold/10 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="font-bold text-text-primary">{matchInfo.playerOfMatch}</p>
                <p className="text-sm text-text-muted">Player of the Match</p>
              </div>
              <div className="ml-auto text-right">
                {matchInfo.result && !matchInfo.result.toLowerCase().includes('in progress') && (
                  <p className="text-xs text-gold/70">Match Complete</p>
                )}
              </div>
            </div>

            {/* Top scorers from each team */}
            {[
              innings1.batting.length > 0 ? {
                name: innings1.batting.reduce((a, b) => (a.runs > b.runs ? a : b)).name,
                runs: innings1.batting.reduce((a, b) => (a.runs > b.runs ? a : b)).runs,
                team: matchInfo.team1.shortName,
                icon: Award,
              } : null,
              innings2.batting.length > 0 ? {
                name: innings2.batting.reduce((a, b) => (a.runs > b.runs ? a : b)).name,
                runs: innings2.batting.reduce((a, b) => (a.runs > b.runs ? a : b)).runs,
                team: matchInfo.team2.shortName,
                icon: Award,
              } : null,
            ].filter(Boolean).map((player, i) => {
              const Icon = player.icon;
              return (
                <div key={i} className="flex items-center gap-4 bg-lux-elevated rounded-lg p-4">
                  <div className="h-10 w-10 rounded-full bg-lux-surface flex items-center justify-center">
                    <Icon className="w-5 h-5 text-text-secondary" />
                  </div>
                  <div>
                    <p className="font-bold text-text-primary">{player.name}</p>
                    <p className="text-sm text-text-muted">{player.team} Top Scorer</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="font-semibold text-text-primary text-sm">{player.runs} runs</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Column - Stat Compare */}
      <div className="space-y-6">
        <div className="lux-card">
          <h2 className="card-title">
            <span className="icon"><TrendingUp className="w-3.5 h-3.5 text-gold" /></span>
            Team Comparison
          </h2>
          <div className="space-y-5">
            <div className="flex items-center justify-between text-xs font-semibold text-text-muted mb-2">
              <span>{matchInfo.team1.shortName}</span>
              <span>{matchInfo.team2.shortName}</span>
            </div>
            <ComparisonBar
              label="Runs"
              team1Value={innings1.totalRuns}
              team2Value={innings2.totalRuns}
              team1Name={matchInfo.team1.shortName}
              team2Name={matchInfo.team2.shortName}
            />
            <ComparisonBar
              label="Boundaries"
              team1Value={totalBoundaries1}
              team2Value={totalBoundaries2}
              team1Name={matchInfo.team1.shortName}
              team2Name={matchInfo.team2.shortName}
            />
            <ComparisonBar
              label="Dot Balls"
              team1Value={totalDots1}
              team2Value={totalDots2}
              team1Name={matchInfo.team1.shortName}
              team2Name={matchInfo.team2.shortName}
            />
            <ComparisonBar
              label="Extras"
              team1Value={innings1.extras.total}
              team2Value={innings2.extras.total}
              team1Name={matchInfo.team1.shortName}
              team2Name={matchInfo.team2.shortName}
            />
            <ComparisonBar
              label="Partnerships"
              team1Value={innings1.partnerships.length}
              team2Value={innings2.partnerships.length}
              team1Name={matchInfo.team1.shortName}
              team2Name={matchInfo.team2.shortName}
            />
            <ComparisonBar
              label="Wickets Lost"
              team1Value={innings1.totalWkts}
              team2Value={innings2.totalWkts}
              team1Name={matchInfo.team1.shortName}
              team2Name={matchInfo.team2.shortName}
            />
          </div>
        </div>

        {/* Quick Match Info */}
        <div className="lux-card">
          <h2 className="card-title">
            <span className="icon"><Zap className="w-3.5 h-3.5 text-gold" /></span>
            Match Info
          </h2>
          <div className="space-y-3 text-sm">
            <div className="stat-row">
              <span className="text-text-secondary">Venue</span>
              <span className="font-medium text-text-primary">{matchInfo.venue}</span>
            </div>
            <div className="stat-row">
              <span className="text-text-secondary">Date</span>
              <span className="font-medium text-text-primary">{matchInfo.date}</span>
            </div>
            <div className="stat-row">
              <span className="text-text-secondary">Toss</span>
              <span className="font-medium text-text-primary">{matchInfo.toss}</span>
            </div>
            <div className="stat-row">
              <span className="text-text-secondary">Umpires</span>
              <span className="font-medium text-text-primary text-right">{matchInfo.umpires.join(', ')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
