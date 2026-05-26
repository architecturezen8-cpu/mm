'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import PremiumIcon from '@/components/PremiumIcon';
import EditableSection from '@/components/admin/EditableSection';
import { MatchInfo } from '@/lib/types';
import { useSectionContent, getContentString, getContentNumber, getContentArray } from '@/lib/useSectionContent';

interface H2HTabProps {
  matchInfo: MatchInfo;
}

interface H2HStat {
  label: string;
  team1Value: number;
  team2Value: number;
  team1Display: string;
  team2Display: string;
}

interface H2HResult {
  match: string;
  result: string;
  winner: string;
}

const defaultComparisonItems: H2HStat[] = [
  { label: 'Wins', team1Value: 45, team2Value: 38, team1Display: '45', team2Display: '38' },
  { label: 'Losses', team1Value: 38, team2Value: 45, team1Display: '38', team2Display: '45' },
  { label: 'Draws', team1Value: 28, team2Value: 28, team1Display: '28', team2Display: '28' },
  { label: 'Highest Score', team1Value: 345, team2Value: 312, team1Display: '345/6', team2Display: '312/4' },
  { label: 'Lowest Score', team1Value: 112, team2Value: 89, team1Display: '112', team2Display: '89' },
  { label: 'Most Runs', team1Value: 2450, team2Value: 1890, team1Display: '2,450', team2Display: '1,890' },
  { label: 'Most Wickets', team1Value: 78, team2Value: 65, team1Display: '78', team2Display: '65' },
];

const defaultResults: H2HResult[] = [
  { match: '110th Battle, 2025', result: 'STC won by 10 wkts', winner: 'STC' },
  { match: '109th Battle, 2024', result: 'Draw', winner: 'Draw' },
  { match: '108th Battle, 2023', result: 'GSC won by 8 wkts', winner: 'GSC' },
  { match: '107th Battle, 2022', result: 'STC won by 5 wkts', winner: 'STC' },
  { match: '106th Battle, 2021', result: 'Draw', winner: 'Draw' },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

function ComparisonBar({ stat, team1Name, team2Name }: { stat: H2HStat; team1Name: string; team2Name: string }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const maxVal = Math.max(stat.team1Value, stat.team2Value, 1);
  const team1Percent = animated ? (stat.team1Value / maxVal) * 100 : 0;
  const team2Percent = animated ? (stat.team2Value / maxVal) * 100 : 0;

  const team1Leading = stat.team1Value > stat.team2Value;
  const team2Leading = stat.team2Value > stat.team1Value;

  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-semibold ${team1Leading ? 'text-gold' : 'text-text-secondary'}`}>
          {stat.team1Display}
        </span>
        <span className="text-[9px] uppercase tracking-[3px] text-text-muted">{stat.label}</span>
        <span className={`text-sm font-semibold ${team2Leading ? 'text-[#E63946]' : 'text-text-secondary'}`}>
          {stat.team2Display}
        </span>
      </div>
      <div className="flex gap-1 h-2">
        <div className="flex-1 flex justify-end">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${team1Percent}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
            className={`h-full ${team1Leading ? 'bg-gold' : 'bg-lux-elevated'}`}
          />
        </div>
        <div className="w-px bg-lux-border" />
        <div className="flex-1">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${team2Percent}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
            className={`h-full ${team2Leading ? 'bg-[#E63946]' : 'bg-lux-elevated'}`}
          />
        </div>
      </div>
      <div className="flex items-center justify-between mt-1">
        <span className="text-[8px] uppercase tracking-[1px] text-gold">{team1Name}</span>
        <span className="text-[8px] uppercase tracking-[1px] text-[#E63946]">{team2Name}</span>
      </div>
    </div>
  );
}

export default function H2HTab({ matchInfo }: H2HTabProps) {
  // Merge admin edits with defaults for each section
  const recordContent = useSectionContent('h2h-record', {
    stc_wins: 45,
    gsc_wins: 38,
    draws: 28,
    stc_logo: '/logos/st-thomas-college-matale.jpg',
    gsc_logo: '/logos/govt-science-college-matale.jpg',
  });

  const comparisonContent = useSectionContent('h2h-comparison', {
    heading: 'Detailed Comparison',
    show_batting: true,
    show_bowling: true,
    show_fielding: true,
    comparison_items: defaultComparisonItems,
  });

  const resultsContent = useSectionContent('h2h-results', {
    heading: 'Recent Results',
    results_items: defaultResults,
  });

  // Read record values from merged content
  const stcWins = getContentNumber(recordContent, 'stc_wins', 45);
  const gscWins = getContentNumber(recordContent, 'gsc_wins', 38);
  const draws = getContentNumber(recordContent, 'draws', 28);
  const stcLogo = getContentString(recordContent, 'stc_logo', '/logos/st-thomas-college-matale.jpg');
  const gscLogo = getContentString(recordContent, 'gsc_logo', '/logos/govt-science-college-matale.jpg');

  // Read comparison items from merged content
  const h2hStats = getContentArray<H2HStat>(comparisonContent, 'comparison_items', defaultComparisonItems);

  // Read results from merged content
  const recentResults = getContentArray<H2HResult>(resultsContent, 'results_items', defaultResults);

  const totalMatches = stcWins + gscWins + draws;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Overall Summary */}
      <EditableSection
        sectionId="h2h-record"
        pageId="about"
        type="h2h"
        title="Head-to-Head Record"
        content={{
          stc_wins: stcWins,
          gsc_wins: gscWins,
          draws: draws,
          stc_logo: stcLogo,
          gsc_logo: gscLogo,
        }}
      >
        <motion.div variants={item} className="lux-card-gold">
          <h2 className="card-title">
            <span className="icon">⚔</span> Head-to-Head Record
          </h2>

          <div className="flex items-center justify-center gap-4 sm:gap-8 mb-6">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 relative">
                <Image src={stcLogo} alt="St.Thomas' College Matale" fill sizes="(max-width: 640px) 48px, 64px" className="object-contain" />
              </div>
              <span className="text-lg sm:text-2xl font-bold text-gold">{stcWins}</span>
              <p className="text-[9px] uppercase tracking-[2px] text-text-muted mt-1">
                STC Wins
              </p>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-bold text-text-primary">{totalMatches}</span>
              <span className="text-[9px] uppercase tracking-[3px] text-text-muted mt-1">Total</span>
              <div className="w-16 h-px bg-lux-border my-2" />
              <span className="text-sm text-text-secondary">{draws} Draws</span>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 relative">
                <Image src={gscLogo} alt="Govt.Science College Matale" fill sizes="(max-width: 640px) 48px, 64px" className="object-contain" />
              </div>
              <span className="text-lg sm:text-2xl font-bold text-[#E63946]">{gscWins}</span>
              <p className="text-[9px] uppercase tracking-[2px] text-text-muted mt-1">
                GSC Wins
              </p>
            </div>
          </div>

          {/* Win ratio bar */}
          {totalMatches > 0 ? (
          <>
          <div className="h-3 flex overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(stcWins / totalMatches) * 100}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className="bg-gold"
            />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(draws / totalMatches) * 100}%` }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.1 }}
              className="bg-lux-elevated"
            />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(gscWins / totalMatches) * 100}%` }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
              className="bg-[#E63946]"
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[8px] uppercase tracking-[1px] text-gold">
              STC {((stcWins / totalMatches) * 100).toFixed(0)}%
            </span>
            <span className="text-[8px] uppercase tracking-[1px] text-text-muted">
              Draw {((draws / totalMatches) * 100).toFixed(0)}%
            </span>
            <span className="text-[8px] uppercase tracking-[1px] text-[#E63946]">
              GSC {((gscWins / totalMatches) * 100).toFixed(0)}%
            </span>
          </div>
          </>
          ) : (
            <p className="text-xs text-text-muted text-center py-2">No match data yet</p>
          )}
        </motion.div>
      </EditableSection>

      {/* Detailed Comparison */}
      <EditableSection
        sectionId="h2h-comparison"
        pageId="about"
        type="stats"
        title="Detailed Comparison"
        content={{
          heading: 'Detailed Comparison',
          show_batting: true,
          show_bowling: true,
          show_fielding: true,
          comparison_items: h2hStats,
        }}
      >
        <motion.div variants={item} className="lux-card">
          <h2 className="card-title">
            <span className="icon"><PremiumIcon name="bar" className="w-3.5 h-3.5 text-gold" /></span> Detailed Comparison
          </h2>
          <div className="divide-y divide-lux-divider">
            {h2hStats.map((stat) => (
              <ComparisonBar
                key={stat.label}
                stat={stat}
                team1Name={matchInfo.team1.shortName}
                team2Name={matchInfo.team2.shortName}
              />
            ))}
          </div>
        </motion.div>
      </EditableSection>

      {/* Recent Results */}
      <EditableSection
        sectionId="h2h-results"
        pageId="about"
        type="stats"
        title="Recent Results"
        content={{
          heading: 'Recent Results',
          results_items: recentResults,
        }}
      >
        <motion.div variants={item} className="lux-card">
          <h2 className="card-title">
            <span className="icon">📅</span> Recent Results
          </h2>
          <div className="space-y-2">
            {recentResults.map((r, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-lux-divider last:border-0">
                <span className="text-xs text-text-secondary">{r.match}</span>
                <span className={`text-xs font-medium ${r.winner === 'STC' ? 'text-gold' : r.winner === 'GSC' ? 'text-[#E63946]' : 'text-text-muted'}`}>
                  {r.result}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </EditableSection>
    </motion.div>
  );
}
