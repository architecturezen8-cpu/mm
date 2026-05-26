'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '@/components/ui/lux-card';
import AnimatedCounter from '@/components/ui/animated-counter';
// SupabaseOfflineBanner removed — voting no longer depends on Supabase
import ActualResultsSection from '@/components/cards/ActualResultsSection';
import VotingComingSoon from '@/components/VotingComingSoon';
import { CommunityData, MatchInfo, InningsData } from '@/lib/types';
import {
  POLL_CONFIG,
  PollKey,
  getFingerprint,
  getVotedPolls,
  saveVotedPoll,
  DEFAULT_COMMUNITY,
} from '@/lib/voting';

/* ─── Props ─── */
interface VotingCardProps {
  community: CommunityData;
  matchInfo: MatchInfo;
  innings1?: InningsData;
  innings2?: InningsData;
  onVote: (team: string) => void;
}

/* ─── Phase enum ─── */
type Phase = 'voting' | 'closed' | 'disconnected';

/* ─── API response shape ─── */
interface VoteResultsResponse {
  community: CommunityData;
  votingEnabled: boolean;
  d1Disconnected?: boolean;
  d1Unavailable?: boolean;
  tursoDisconnected?: boolean; // legacy compat
  fallback?: boolean;
}

/* ─── Option entry type helper ─── */
interface OptionEntry {
  key: string;
  label: string;
  color: string;
}

/* ─── Stagger children variants ─── */
const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

/* ─── Gold shimmer gradient ─── */
const shimmerGradient =
  'linear-gradient(110deg, transparent 25%, rgba(255,195,0,0.12) 50%, transparent 75%)';

/* ─── Poll keys to render ─── */
const POLL_KEYS: PollKey[] = ['whoWillWin', 'firstInningsScore', 'mostSixes', 'totalWickets', 'secondInningsScore', 'totalWickets2ndInnings'];

/* ─── Helper: extract option entries from a poll config ─── */
function getOptionEntries(pollKey: PollKey): OptionEntry[] {
  const config = POLL_CONFIG[pollKey];
  return Object.entries(config.options).map(([key, opt]) => ({
    key,
    label: opt.label,
    color: opt.color,
  }));
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */
export default function VotingCard({ community, matchInfo, innings1, innings2, onVote }: VotingCardProps) {
  /* ─── State ─── */
  const [liveCommunity, setLiveCommunity] = useState<CommunityData>(community);
  const [votingEnabled, setVotingEnabled] = useState<boolean>(true);
  const [dbDisconnected, setDbDisconnected] = useState<boolean>(false);
  // D1 is the only database for voting (no Turso/Supabase)
  const [votedPolls, setVotedPolls] = useState<Record<string, string>>({});
  const [submittingPoll, setSubmittingPoll] = useState<PollKey | null>(null);
  const [refreshCountdown, setRefreshCountdown] = useState(60);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ─── Normalize community data: ensure ALL 4 poll keys always have data ─── */
  const normalizedCommunity = useMemo(() => {
    const nc = { ...liveCommunity };
    // Ensure all poll keys exist with proper structure
    for (const key of POLL_KEYS) {
      const existing = nc[key];
      if (!existing || typeof existing !== 'object') {
        // Use default structure from POLL_CONFIG
        (nc as Record<string, unknown>)[key] = Object.keys(POLL_CONFIG[key].options).reduce(
          (acc, k) => ({ ...acc, [k]: 0 }),
          {} as Record<string, number>,
        );
      }
    }
    // Ensure totalVotes exists
    if (typeof nc.totalVotes !== 'number') {
      nc.totalVotes = 0;
    }
    return nc;
  }, [liveCommunity]);

  /* ─── Determine phase ─── */
  const phase: Phase = useMemo(() => {
    // D1 disconnected → special "disconnected" phase (zero DB calls)
    if (dbDisconnected) return 'disconnected';
    // Voting OFF → closed (shows results if any, otherwise locked)
    if (!votingEnabled) return 'closed';
    // Voting ON → interactive
    return 'voting';
  }, [dbDisconnected, votingEnabled]);

  /* ─── Has any votes been cast? ─── */
  const hasVotes = (normalizedCommunity.totalVotes ?? 0) > 0;

  /* ─── Fetch results ─── */
  const fetchResults = useCallback(async (forceFresh = false) => {
    // If D1 is disconnected, don't make API calls at all
    if (dbDisconnected) return;

    try {
      // CDN Cache Strategy: normal poll = cached 30s at CDN, forceFresh = bypass CDN
      // cache: 'no-store' → browser NEVER uses its HTTP cache (defense-in-depth)
      // With max-age=0 on server response, browser shouldn't cache anyway,
      // but this prevents any edge-case browser caching bugs
      const url = forceFresh ? '/api/vote-results?noCache=1' : '/api/vote-results';
      const fetchOptions: RequestInit = forceFresh
        ? { cache: 'no-store' }
        : { cache: 'no-store' }; // Always skip browser cache — CDN handles caching
      const res = await fetch(url, fetchOptions);
      if (!res.ok) throw new Error('Failed');
      const data: VoteResultsResponse = await res.json();

      // Check if D1 voting connection is disconnected
      if (data.d1Disconnected || data.tursoDisconnected || data.d1Unavailable) {
        setDbDisconnected(true);
        setVotingEnabled(false);
        return;
      }

      // Update voting enabled state
      setVotingEnabled(data.votingEnabled !== false);

      // Always update community data if available
      if (data.community) {
        setLiveCommunity(data.community);
      }

      setError(null);
    } catch {
      setError('Could not load results');
    } finally {
      setIsLoaded(true);
      setRefreshCountdown(30);
    }
  }, [dbDisconnected]);

  /* ─── Initial fetch + load voted polls ─── */
  useEffect(() => {
    fetchResults();
    setVotedPolls(getVotedPolls());

    // Listen for voting toggle — re-fetch immediately
    const handleVotingToggled = () => {
      // If previously disconnected, reset the flag to try reconnecting
      setDbDisconnected(false);
      fetchResults();
    };
    window.addEventListener('voting-toggled', handleVotingToggled);

    // Listen for voting D1 connection toggle
    const handleVotingD1Toggled = () => {
      // Reset disconnected state and re-fetch
      setDbDisconnected(false);
      fetchResults();
    };
    window.addEventListener('voting-d1-toggled', handleVotingD1Toggled);
    // Also listen for legacy event name
    window.addEventListener('voting-turso-toggled', handleVotingD1Toggled);

    return () => {
      window.removeEventListener('voting-toggled', handleVotingToggled);
      window.removeEventListener('voting-d1-toggled', handleVotingD1Toggled);
      window.removeEventListener('voting-turso-toggled', handleVotingD1Toggled);
    };
  }, [fetchResults]);

  /* ─── Auto-refresh (CDN cached — cheap even for 100K users) ─── */
  useEffect(() => {
    // When disconnected: NO polling — zero API calls (saves free tier limits)
    if (dbDisconnected) return;

    // 30s interval — matches CDN s-maxage=30
    // User sees immediate result after voting via setTimeout + optimistic merge
    const intervalMs = 30_000; // 30 seconds
    const interval = setInterval(() => {
      fetchResults();
      setRefreshCountdown(30); // Reset countdown after refresh
    }, intervalMs);
    return () => clearInterval(interval);
  }, [fetchResults, votingEnabled, dbDisconnected]);

  /* ─── Countdown timer ─── */
  useEffect(() => {
    // When disconnected: no countdown
    if (dbDisconnected) {
      setRefreshCountdown(0);
      return;
    }

    // Match CDN cache TTL (30 seconds)
    const maxSeconds = 30;
    setRefreshCountdown(maxSeconds);
    const tick = setInterval(() => {
      setRefreshCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1_000);
    return () => clearInterval(tick);
  }, [votingEnabled]);

  /* ─── Handle vote ─── */
  const handleVote = useCallback(
    async (pollKey: PollKey, optionKey: string) => {
      if (votedPolls[pollKey] || submittingPoll) return;

      setSubmittingPoll(pollKey);
      setError(null);

      try {
        const fingerprint = getFingerprint();
        const res = await fetch('/api/vote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pollKey, optionKey, fingerprint }),
        });

        const data = await res.json();

        if (!res.ok) {
          if (res.status === 429) {
            // Rate limited — show friendly message
            setError(data.error || 'Too many votes. Please wait a minute and try again.');
          } else if (data.d1Disconnected || data.tursoDisconnected || data.d1Unavailable) {
            setDbDisconnected(true);
            setVotingEnabled(false);
            setError(data.d1Unavailable ? 'Voting database not available' : 'Voting connection disconnected');
          } else if (data.votingEnabled === false) {
            setError('Voting is closed');
            setVotingEnabled(false);
          } else {
            setError(data.error || 'Vote failed');
          }
          return;
        }

        /* Optimistic local update */
        saveVotedPoll(pollKey, optionKey);
        setVotedPolls(getVotedPolls());

        /* Update community from response if available */
        if (data.community) {
          setLiveCommunity(data.community);
        } else {
          /* Manual optimistic increment */
          setLiveCommunity((prev) => {
            const updated = { ...prev };
            const pollData = { ...((updated[pollKey] as Record<string, number>) || {}) };
            pollData[optionKey] = (pollData[optionKey] || 0) + 1;
            (updated as Record<string, unknown>)[pollKey] = pollData;
            updated.totalVotes = (updated.totalVotes || 0) + 1;
            return { ...updated };
          });
        }

        onVote(optionKey);

        /* Reset countdown — user just voted, will refresh soon */
        setRefreshCountdown(30);

        /* Refresh after short delay — force fresh to see own vote */
        setTimeout(() => fetchResults(true), 2000);
      } catch {
        setError('Network error');
      } finally {
        setSubmittingPoll(null);
      }
    },
    [votedPolls, submittingPoll, onVote, fetchResults],
  );

  /* ─── Helper: get poll data ─── */
  const getPollData = (key: PollKey): Record<string, number> => {
    const data = normalizedCommunity[key];
    if (data && typeof data === 'object') return data as Record<string, number>;
    const config = POLL_CONFIG[key];
    if (config.options) {
      return Object.keys(config.options).reduce(
        (acc, k) => ({ ...acc, [k]: 0 }),
        {} as Record<string, number>,
      );
    }
    return {};
  };

  /* ─── Helper: get total for a poll ─── */
  const getPollTotal = (key: PollKey): number => {
    const data = getPollData(key);
    return Object.values(data).reduce((a, b) => a + b, 0);
  };

  /* ─── Helper: get winner for a poll ─── */
  const getPollWinner = (key: PollKey): string | null => {
    const data = getPollData(key);
    const entries = Object.entries(data);
    if (entries.length === 0) return null;
    const max = Math.max(...entries.map(([, v]) => v));
    if (max === 0) return null;
    return entries.find(([, v]) => v === max)?.[0] ?? null;
  };

  /* ─── Format match date ─── */
  const matchDateFormatted = useMemo(() => {
    try {
      const d = new Date(matchInfo.date);
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return matchInfo.date;
    }
  }, [matchInfo.date]);

  /* ═══════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════ */
  return (
    <Card delay={0.1}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        {/* ─── HEADER ─── */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div className="card-title mb-0">
            <span className="icon">
              <svg
                viewBox="0 0 24 24"
                className="w-3.5 h-3.5 text-gold"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
            </span>
            Crowd Choice
          </div>

          {/* Phase badge */}
          <PhaseBadge phase={phase} />
        </motion.div>

        {/* ─── PHASE BANNER ─── */}
        <AnimatePresence mode="wait">
          {/* D1 Disconnected: Stunning Coming Soon display */}
          {phase === 'disconnected' && (
            <motion.div
              key="disconnected-banner"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.35 }}
            >
              <VotingComingSoon variant="voting" />
            </motion.div>
          )}

          {phase === 'voting' && (
            <motion.div
              key="voting-banner"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.35 }}
              className="relative overflow-hidden rounded-lg border border-gold/20 bg-gold/5 p-3 text-center"
            >
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="flex items-center justify-center gap-2"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-gold" />
                </span>
                <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[3px] text-gold">
                  Voting is LIVE — Tap to vote!
                </span>
              </motion.div>
            </motion.div>
          )}

          {phase === 'closed' && (
            <motion.div
              key="closed-banner"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.35 }}
              className="relative overflow-hidden rounded-lg border border-[#E63946]/20 bg-[#E63946]/5 p-4 text-center"
            >
              <div className="flex items-center justify-center gap-2">
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4 text-[#E63946]/70"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[3px] text-[#E63946]/80">
                  Voting is Closed
                </span>
              </div>
              {hasVotes && (
                <p className="text-[9px] sm:text-[10px] text-text-muted mt-1.5">
                  Showing final results below
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── ERROR ─── */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-[10px] text-[#E63946] text-center uppercase tracking-wider"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* ─── POLLS (hidden when D1 disconnected — zero DB calls) ─── */}
        {phase !== 'disconnected' && (
        <div className="space-y-3">
          {POLL_KEYS.map((pollKey, idx) => {
            const pollData = getPollData(pollKey);
            const pollTotal = getPollTotal(pollKey);
            const userVoted = votedPolls[pollKey];
            const winner = getPollWinner(pollKey);
            const options = getOptionEntries(pollKey);

            return (
              <motion.div
                key={pollKey}
                variants={itemVariants}
                className={`relative rounded-lg border overflow-hidden transition-colors duration-300 ${
                  phase === 'results'
                    ? 'border-gold/20'
                    : 'border-lux-border'
                }`}
              >
                {/* Gold shimmer for closed phase with votes */}
                {phase === 'closed' && pollTotal > 0 && (
                  <div
                    className="absolute inset-0 pointer-events-none z-0 animate-shimmer"
                    style={{
                      background: shimmerGradient,
                      backgroundSize: '200% 100%',
                      animationDuration: `${3 + idx * 0.5}s`,
                    }}
                  />
                )}

                <div className="relative z-10 p-3 sm:p-4">
                  {/* Poll label */}
                  <div className="flex items-center gap-2 mb-3">
                    <PollIcon pollKey={pollKey} />
                    <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[2px] text-text-secondary">
                      {POLL_CONFIG[pollKey].label}
                    </span>
                    {userVoted && phase !== 'before' && (
                      <span className="ml-auto text-[8px] sm:text-[9px] uppercase tracking-wider text-gold/70 flex items-center gap-1">
                        <svg
                          viewBox="0 0 24 24"
                          className="w-2.5 h-2.5 text-gold"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                        Voted
                      </span>
                    )}
                  </div>

                  {/* Closed: no votes for this poll → show "No votes" message */}
                  {phase === 'closed' && pollTotal === 0 && (
                    <div className="flex items-center justify-center py-3 text-text-muted/50 gap-2">
                      <svg
                        viewBox="0 0 24 24"
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0110 0v4" />
                      </svg>
                      <span className="text-[9px] uppercase tracking-wider">No votes</span>
                    </div>
                  )}

                  {/* Voting open: interactive buttons */}
                  {phase === 'voting' && !userVoted && (
                    <div className="grid grid-cols-2 gap-2">
                      {options.map((option) => {
                        const isSubmitting = submittingPoll === pollKey;
                        return (
                          <motion.button
                            key={option.key}
                            whileHover={{ scale: 1.02, borderColor: option.color }}
                            whileTap={{ scale: 0.97 }}
                            disabled={isSubmitting}
                            onClick={() => handleVote(pollKey, option.key)}
                            className="relative overflow-hidden rounded-md border border-lux-border bg-lux-surface/50 px-3 py-2.5 sm:py-3 text-left transition-all duration-200 disabled:opacity-50 group"
                          >
                            {/* Hover fill effect */}
                            <div
                              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                              style={{
                                background: `linear-gradient(135deg, ${option.color}10 0%, transparent 60%)`,
                              }}
                            />
                            <span className="relative z-10 text-[10px] sm:text-[11px] font-medium text-text-primary tracking-wide">
                              {option.label}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}

                  {/* Results: voted, or closed with existing votes for this poll */}
                  {(phase === 'voting' && userVoted) || (phase === 'closed' && pollTotal > 0) ? (
                    <div className="space-y-2">
                      {options.map((option) => {
                        const count = pollData[option.key] || 0;
                        const pct = pollTotal > 0 ? Math.round((count / pollTotal) * 100) : 0;
                        const isUserChoice = userVoted === option.key;
                        const isWinner = phase === 'closed' && winner === option.key;

                        return (
                          <div key={option.key}>
                            <div className="flex items-center justify-between mb-1">
                              <span
                                className={`text-[10px] sm:text-[11px] font-medium tracking-wide flex items-center gap-1.5 ${
                                  isUserChoice
                                    ? 'text-gold'
                                    : isWinner
                                    ? 'text-gold'
                                    : 'text-text-secondary'
                                }`}
                              >
                                {isUserChoice && (
                                  <svg
                                    viewBox="0 0 24 24"
                                    className="w-2.5 h-2.5 text-gold flex-shrink-0"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                  >
                                    <path d="M20 6L9 17l-5-5" />
                                  </svg>
                                )}
                                {isWinner && !isUserChoice && phase === 'closed' && (
                                  <span className="text-gold text-[8px]">👑</span>
                                )}
                                {option.label}
                              </span>
                              <span
                                className={`text-[10px] sm:text-[11px] font-semibold tabular-nums ${
                                  isUserChoice || isWinner ? 'text-gold' : 'text-text-muted'
                                }`}
                              >
                                {pct}%
                              </span>
                            </div>
                            <div className="h-[3px] sm:h-[4px] rounded-full bg-lux-surface overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{
                                  duration: 0.8,
                                  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
                                  delay: idx * 0.1,
                                }}
                                className="h-full rounded-full"
                                style={{
                                  background:
                                    isUserChoice || isWinner
                                      ? `linear-gradient(90deg, ${option.color}90, ${option.color})`
                                      : `linear-gradient(90deg, ${option.color}50, ${option.color}70)`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </motion.div>
            );
          })}
        </div>
        )}

        {/* ─── FOOTER: Total votes + refresh timer ─── */}
        {hasVotes && (
          <motion.div
            variants={itemVariants}
            className="flex items-center justify-between pt-2 border-t border-lux-border/50"
          >
            <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] uppercase tracking-wider text-text-muted">
              <svg
                viewBox="0 0 24 24"
                className="w-3 h-3 text-text-muted/60"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87" />
                <path d="M16 3.13a4 4 0 010 7.75" />
              </svg>
              <AnimatedCounter value={normalizedCommunity.totalVotes ?? 0} /> votes
            </div>

            {isLoaded && phase !== 'closed' && (
              <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] uppercase tracking-wider text-text-muted/60">
                <svg
                  viewBox="0 0 24 24"
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M1 4v6h6" />
                  <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
                </svg>
                {refreshCountdown > 0 ? (
                  <span>Refresh in {refreshCountdown}s</span>
                ) : (
                  <span className="text-gold/60">Refreshing...</span>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* ─── ACTUAL RESULTS (shown below Crowd Choice when published or live data available) ─── */}
        <ActualResultsSection matchInfo={matchInfo} innings1={innings1} innings2={innings2} />
      </motion.div>
    </Card>
  );
}

/* ═══════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════ */

/* ─── Phase Badge ─── */
function PhaseBadge({ phase }: { phase: Phase }) {
  if (phase === 'disconnected') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full border border-[#FFC300]/20 bg-[#FFC300]/5 text-[8px] sm:text-[9px] uppercase tracking-wider text-[#FFC300]/80">
        <svg viewBox="0 0 24 24" className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M18 2H6v7a6 6 0 0012 0V2z" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        </svg>
        Coming Soon
      </span>
    );
  }

  if (phase === 'closed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full border border-[#E63946]/20 bg-[#E63946]/5 text-[8px] sm:text-[9px] uppercase tracking-wider text-[#E63946]/70">
        <svg viewBox="0 0 24 24" className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
        Closed
      </span>
    );
  }

  // phase === 'voting'
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full border border-gold/30 bg-gold/10 text-[8px] sm:text-[9px] uppercase tracking-wider text-gold">
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-gold" />
      </span>
      Live
    </span>
  );
}

/* ─── Poll Icon ─── */
function PollIcon({ pollKey }: { pollKey: PollKey }) {
  const iconClass = 'w-3 h-3 flex-shrink-0';

  switch (pollKey) {
    case 'whoWillWin':
      return (
        <svg viewBox="0 0 24 24" className={`${iconClass} text-gold`} fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M6 9H4.5a2.5 2.5 0 010-5C7 4 7 7 7 7" />
          <path d="M18 9h1.5a2.5 2.5 0 000-5C17 4 17 7 17 7" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
          <path d="M18 2H6v7a6 6 0 0012 0V2z" />
        </svg>
      );
    case 'firstInningsScore':
      return (
        <svg viewBox="0 0 24 24" className={`${iconClass} text-gold`} fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M18 20V10" />
          <path d="M12 20V4" />
          <path d="M6 20v-6" />
        </svg>
      );
    case 'mostSixes':
      return (
        <svg viewBox="0 0 24 24" className={`${iconClass} text-gold`} fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      );
    case 'totalWickets':
      return (
        <svg viewBox="0 0 24 24" className={`${iconClass} text-gold`} fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      );
    case 'secondInningsScore':
      return (
        <svg viewBox="0 0 24 24" className={`${iconClass} text-gold`} fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M18 20V10" />
          <path d="M12 20V4" />
          <path d="M6 20v-6" />
          <path d="M2 20h20" strokeOpacity="0.4" />
        </svg>
      );
    case 'totalWickets2ndInnings':
      return (
        <svg viewBox="0 0 24 24" className={`${iconClass} text-gold`} fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
          <path d="M4 4l16 16" strokeOpacity="0.3" />
        </svg>
      );
    default:
      return null;
  }
}
