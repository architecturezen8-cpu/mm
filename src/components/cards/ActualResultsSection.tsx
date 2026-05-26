'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ActualResults, MatchInfo, InningsData, BatsmanInnings, BowlerInnings } from '@/lib/types';
import { DEFAULT_ACTUAL_RESULTS } from '@/lib/voting';

interface ActualResultsSectionProps {
  matchInfo?: MatchInfo;
  innings1?: InningsData;
  innings2?: InningsData;
}

/**
 * ActualResultsSection — Shows real match stats below Crowd Choice
 * Used in both PredictionsTab and VotingCard.
 *
 * Data sources (priority):
 * 1. Admin-published results (from Turso) — shown with "Official" badge
 * 2. Auto-detected from live match data (innings) — shown with "Live" badge
 */
export default function ActualResultsSection({ matchInfo, innings1, innings2 }: ActualResultsSectionProps) {
  const [adminResults, setAdminResults] = useState<ActualResults>(DEFAULT_ACTUAL_RESULTS);
  const [loaded, setLoaded] = useState(false);

  const fetchResults = useCallback(async (forceFresh = false) => {
    try {
      // FIX: Use noCache=1 to bypass CDN cache and always get fresh data from Turso
      const url = forceFresh ? '/api/actual-results?noCache=1' : '/api/actual-results';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.results) {
          setAdminResults(data.results);
        }
      }
    } catch {
      // silent
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchResults();
    // Poll every 30s for admin changes (faster refresh for responsiveness)
    const interval = setInterval(() => fetchResults(), 30_000);
    return () => clearInterval(interval);
  }, [fetchResults]);

  // Listen for admin actual results save events — re-fetch immediately
  useEffect(() => {
    const handleActualResultsSaved = () => {
      fetchResults(true); // Force fresh bypass CDN
    };
    window.addEventListener('actual-results-saved', handleActualResultsSaved);
    return () => {
      window.removeEventListener('actual-results-saved', handleActualResultsSaved);
    };
  }, [fetchResults]);

  // ─── Auto-detect from live match data ───
  const liveResults = useMemo((): ActualResults | null => {
    if (!innings1 && !innings2) return null;

    // Find top scorer across both innings
    let topScorer: { name: string; detail: string } | null = null;
    let topWicketTaker: { name: string; detail: string } | null = null;

    const allBatting: BatsmanInnings[] = [
      ...(innings1?.batting || []),
      ...(innings2?.batting || []),
    ];
    const allBowling: BowlerInnings[] = [
      ...(innings1?.bowling || []),
      ...(innings2?.bowling || []),
    ];

    // Top Scorer: highest runs
    if (allBatting.length > 0) {
      const topBat = allBatting.reduce((best, b) =>
        (b.runs || 0) > (best.runs || 0) ? b : best
      , allBatting[0]);
      if (topBat && topBat.runs > 0) {
        topScorer = {
          name: topBat.name,
          detail: `${topBat.runs}${topBat.isOut ? '' : '*'} (${topBat.balls})${topBat.fours ? ` · ${topBat.fours}×4` : ''}${topBat.sixes ? ` · ${topBat.sixes}×6` : ''}`,
        };
      }
    }

    // Top Wicket-Taker: highest wickets, then best economy
    if (allBowling.length > 0) {
      const topBowl = allBowling.reduce((best, b) => {
        if ((b.wickets || 0) > (best.wickets || 0)) return b;
        if (b.wickets === best.wickets && b.econ < best.econ) return b;
        return best;
      }, allBowling[0]);
      if (topBowl && topBowl.wickets > 0) {
        topWicketTaker = {
          name: topBowl.name,
          detail: `${topBowl.wickets}/${topBowl.runs} (${topBowl.overs})`,
        };
      }
    }

    // Match result from matchInfo
    const matchResult = matchInfo?.result || '';
    const hasResult = matchResult &&
      !matchResult.toLowerCase().includes('in progress') &&
      !matchResult.toLowerCase().includes('tbd');

    // Player of the Match from matchInfo
    const playerOfMatch = matchInfo?.playerOfMatch || '';

    // Only return if there's meaningful data
    if (!topScorer && !topWicketTaker && !hasResult && !playerOfMatch) return null;

    return {
      topScorer: topScorer?.name || '',
      topScorerRuns: topScorer?.detail || '',
      topWicketTaker: topWicketTaker?.name || '',
      topWicketTakerFigures: topWicketTaker?.detail || '',
      playerOfMatch: playerOfMatch,
      playerOfMatchDetail: '',
      matchResult: hasResult ? matchResult : '',
      isPublished: false, // Not admin-published
    };
  }, [innings1, innings2, matchInfo]);

  if (!loaded) return null;

  // Determine which results to show:
  // 1. Admin-published (Official) — takes priority
  // 2. Live auto-detected — fallback when admin hasn't published
  const isAdminPublished = adminResults.isPublished &&
    (adminResults.matchResult || adminResults.topScorer || adminResults.topWicketTaker || adminResults.playerOfMatch);

  const results: ActualResults | null = isAdminPublished ? adminResults : liveResults;
  const isOfficial = isAdminPublished;

  if (!results) return null;

  // Check if any actual result data exists
  const hasAnyData = results.matchResult || results.topScorer || results.topWicketTaker || results.playerOfMatch;
  if (!hasAnyData) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mt-4"
      >
        {/* ── Section Header ── */}
        <div className="flex items-center gap-2 mb-3">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-gold" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
          <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[2px] text-text-secondary">
            Actual Results
          </span>
          <span className={`ml-auto text-[8px] uppercase tracking-wider flex items-center gap-1 ${
            isOfficial ? 'text-emerald-400/70' : 'text-gold/70'
          }`}>
            {isOfficial ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
                Official
              </>
            ) : (
              <>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-gold" />
                </span>
                Live
              </>
            )}
          </span>
        </div>

        {/* ── Match Result Banner ── */}
        {results.matchResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="relative overflow-hidden rounded-lg border border-gold/20 p-3 sm:p-4 mb-3"
            style={{
              background: 'linear-gradient(135deg, rgba(255,195,0,0.06) 0%, rgba(255,195,0,0.02) 100%)',
            }}
          >
            <div
              className="absolute inset-0 opacity-20 animate-shimmer"
              style={{
                background: 'linear-gradient(110deg, transparent 25%, rgba(255,195,0,0.12) 50%, transparent 75%)',
                backgroundSize: '200% 100%',
              }}
            />
            <p className="text-xs sm:text-sm font-semibold text-gold text-center relative z-10">
              {results.matchResult}
            </p>
          </motion.div>
        )}

        {/* ── Stats Grid ── */}
        <div className="space-y-2">
          {/* Top Scorer */}
          {results.topScorer && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="flex items-center gap-3 rounded-lg border border-lux-border bg-lux-surface/50 px-3 py-2.5"
            >
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gold/10 border border-gold/20 shrink-0">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-gold" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 20h16" strokeLinecap="round" />
                  <path d="M8 16v4" />
                  <path d="M12 12v8" />
                  <path d="M16 8v12" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[8px] sm:text-[9px] uppercase tracking-[2px] text-text-muted">Top Scorer</p>
                <p className="text-xs sm:text-sm font-medium text-text-primary truncate">{results.topScorer}</p>
              </div>
              {(results.topScorerRuns || (liveResults?.topScorerRuns && !isOfficial)) && (
                <span className="text-[10px] sm:text-xs font-semibold text-gold tabular-nums shrink-0">
                  {results.topScorerRuns || liveResults?.topScorerRuns}
                </span>
              )}
            </motion.div>
          )}

          {/* Top Wicket-Taker */}
          {results.topWicketTaker && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              className="flex items-center gap-3 rounded-lg border border-lux-border bg-lux-surface/50 px-3 py-2.5"
            >
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gold/10 border border-gold/20 shrink-0">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-gold" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.4" />
                  <path d="M12 2v4M12 18v4M2 12h4M18 12h4" strokeOpacity="0.4" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[8px] sm:text-[9px] uppercase tracking-[2px] text-text-muted">Top Wicket-Taker</p>
                <p className="text-xs sm:text-sm font-medium text-text-primary truncate">{results.topWicketTaker}</p>
              </div>
              {(results.topWicketTakerFigures || (liveResults?.topWicketTakerFigures && !isOfficial)) && (
                <span className="text-[10px] sm:text-xs font-semibold text-gold tabular-nums shrink-0">
                  {results.topWicketTakerFigures || liveResults?.topWicketTakerFigures}
                </span>
              )}
            </motion.div>
          )}

          {/* Player of the Match */}
          {results.playerOfMatch && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
              className="relative flex items-center gap-3 rounded-lg border border-gold/30 px-3 py-2.5"
              style={{
                background: 'linear-gradient(135deg, rgba(255,195,0,0.06) 0%, transparent 60%)',
              }}
            >
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gold/10 border border-gold/20 shrink-0">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-gold" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor" fillOpacity="0.2" />
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[8px] sm:text-[9px] uppercase tracking-[2px] text-gold/70">Player of the Match</p>
                <p className="text-xs sm:text-sm font-semibold text-gold truncate">{results.playerOfMatch}</p>
              </div>
              {results.playerOfMatchDetail && (
                <span className="text-[9px] sm:text-[10px] text-text-secondary shrink-0">
                  {results.playerOfMatchDetail}
                </span>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
