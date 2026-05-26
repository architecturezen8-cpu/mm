'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import PremiumIcon from '@/components/PremiumIcon';
import EditableSection from '@/components/admin/EditableSection';
import VotingComingSoon from '@/components/VotingComingSoon';
import { MatchInfo, InningsData, CommunityData } from '@/lib/types';
import { getFingerprint, getVotedPolls, saveVotedPoll, hasVoted } from '@/lib/voting';
import { useSectionContent, getContentArray, getContentString } from '@/lib/useSectionContent';
// SupabaseOfflineBanner import removed — voting is now Turso-based
import ActualResultsSection from '@/components/cards/ActualResultsSection';

interface PredictionsTabProps {
  matchInfo: MatchInfo;
  innings1: InningsData;
  innings2: InningsData;
}

// ─── Fallback Players ───
const FALLBACK_STC_PLAYERS = [
  'Dilith Perera', 'Kavinda Silva', 'Ranithu Fernando', 'Senal Jayawardena',
  'Thenuka Wickramasinghe', 'Vidunu Dissanayake', 'Mahima Ratnayake',
  'Dulanjana Wijeratne', 'Kisal Alahakoon', 'Nethma Herath', 'Sahan Bandaranayake',
];
const FALLBACK_GSC_PLAYERS = [
  'Yasiru Rodrigo', 'Hiruna Goonewardene', 'Daham Dharmaratne', 'Tharindu Wickramanayake',
  'Lakshitha Weerasinghe', 'Ramitha Silva', 'Seniru Pasqual',
  'Ashen Bandara', 'Chamindu Asal', 'Malith Rathnayake', 'Tharana Walpita',
];

// ─── Playing XI Content Items (same structure as PlayingXITab) ───
interface ContentPlayerItem {
  name: string;
  role: string;
  photo: string;
  school: string;
  jerseyNumber: string;
  isCaptain?: boolean;
}

const DEFAULT_XI_STC_CONTENT = {
  heading: "St.Thomas' College Matale",
  team: 'st_thomas',
  show_count: 11,
  team_logo: '/logos/st-thomas-college-matale.jpg',
  team_subtitle: 'Playing XI',
  player_items: FALLBACK_STC_PLAYERS.map((name, i) => ({
    name,
    role: 'batsman',
    photo: '/players/thomian-batsman.png',
    school: "St.Thomas' College Matale",
    jerseyNumber: String(i + 1),
  })),
};

const DEFAULT_XI_SCIENCE_CONTENT = {
  heading: 'Govt. Science College Matale',
  team: 'govt_science',
  show_count: 11,
  team_logo: '/logos/govt-science-college-matale.jpg',
  team_subtitle: 'Playing XI',
  player_items: FALLBACK_GSC_PLAYERS.map((name, i) => ({
    name,
    role: 'batsman',
    photo: '/players/science-batsman.png',
    school: 'Govt. Science College Matale',
    jerseyNumber: String(i + 1),
  })),
};

// ─── Types ───
interface VoteResults {
  stc: number;
  gsc: number;
  total: number;
}

interface LeaderboardEntry {
  name: string;
  team: 'STC' | 'GSC';
  votes: number;
  percent: number;
}

interface PredictionData {
  whoWillWin: 'STC' | 'GSC' | '';
  topScorer: string;
  topWicketTaker: string;
  playerOfMatch: string;
}

// ─── Animation Variants ───
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const checkVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 20, delay: 0.15 },
  },
};

const circleVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 0.6, ease: 'easeInOut', delay: 0.1 },
  },
};

const tickVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 0.35, ease: 'easeOut', delay: 0.5 },
  },
};

// ─── Leaderboard Config ───
const LEADERBOARD_CONFIG = [
  {
    key: 'topScorer',
    title: 'Top Scorer',
    icon: (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-gold" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 20h16" strokeLinecap="round" />
        <path d="M8 16v4" />
        <path d="M12 12v8" />
        <path d="M16 8v12" />
      </svg>
    ),
  },
  {
    key: 'topWicketTaker',
    title: 'Top Wicket-Taker',
    icon: (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-gold" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.4" />
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4" strokeOpacity="0.4" />
      </svg>
    ),
  },
  {
    key: 'playerOfMatch',
    title: 'Player of the Match',
    icon: (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-gold" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor" fillOpacity="0.2" />
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  },
];

// ─── Premium Dropdown ───
function PremiumDropdown({
  label,
  icon,
  value,
  onChange,
  options,
  teamColor,
  placeholder,
  disabled,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (val: string) => void;
  options: { group: string; players: string[] }[];
  teamColor: string;
  placeholder: string;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <label className="text-[9px] sm:text-[10px] text-text-secondary uppercase tracking-[2px] mb-2 flex items-center gap-2">
        {icon}
        {label}
      </label>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between py-3 px-4 border bg-lux-card text-left transition-all duration-300 group ${
          disabled
            ? 'border-lux-border/50 cursor-not-allowed opacity-60'
            : 'border-lux-border hover:border-lux-border/80'
        }`}
        style={{
          borderColor: value && !disabled ? `${teamColor}40` : undefined,
          boxShadow: value && !disabled ? `0 0 12px ${teamColor}10` : undefined,
        }}
      >
        <span className={`text-xs sm:text-sm font-medium truncate ${value ? 'text-text-primary' : 'text-text-muted'}`}>
          {value || placeholder}
        </span>
        <svg
          viewBox="0 0 24 24"
          className={`w-4 h-4 text-text-muted transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && !disabled && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="absolute top-full left-0 right-0 mt-1 z-50 bg-lux-card border border-lux-border max-h-56 overflow-y-auto"
              style={{
                boxShadow: '0 20px 60px -15px rgba(0,0,0,0.8)',
              }}
            >
              {options.map((group) => (
                <div key={group.group}>
                  {/* Group header */}
                  <div
                    className="px-4 py-2 text-[8px] uppercase tracking-[3px] font-bold sticky top-0 bg-lux-card/95 backdrop-blur-sm"
                    style={{ color: group.group.includes('Thomas') ? '#FFC300' : '#E63946', background: group.group.includes('Thomas') ? 'rgba(255,195,0,0.05)' : 'rgba(230,57,70,0.05)' }}
                  >
                    {group.group}
                  </div>
                  {group.players.map((player, idx) => (
                    <motion.button
                      key={player}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      onClick={() => {
                        onChange(player);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm transition-all duration-200 flex items-center gap-3 ${
                        value === player
                          ? 'bg-gold-ghost text-gold font-medium'
                          : 'text-text-secondary hover:bg-lux-surface hover:text-text-primary'
                      }`}
                    >
                      {/* Radio indicator */}
                      <div className={`w-3 h-3 rounded-full border flex-shrink-0 flex items-center justify-center transition-colors duration-200 ${
                        value === player ? 'border-gold' : 'border-lux-border'
                      }`}>
                        {value === player && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                            className="w-1.5 h-1.5 rounded-full bg-gold"
                          />
                        )}
                      </div>
                      {player}
                    </motion.button>
                  ))}
                </div>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Success Checkmark Animation ───
function SuccessCheckmark() {
  return (
    <motion.div
      variants={checkVariants}
      initial="hidden"
      animate="visible"
      className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-gold/20 bg-gold-ghost"
    >
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none">
        <motion.circle
          cx="12"
          cy="12"
          r="10"
          stroke="#FFC300"
          strokeWidth="1.5"
          variants={circleVariants}
          initial="hidden"
          animate="visible"
        />
        <motion.path
          d="M8 12l3 3 5-5"
          stroke="#FFC300"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={tickVariants}
          initial="hidden"
          animate="visible"
        />
      </svg>
    </motion.div>
  );
}

// ─── Main Component ───
export default function PredictionsTab({ matchInfo, innings1, innings2 }: PredictionsTabProps) {
  const [prediction, setPrediction] = useState<PredictionData>({
    whoWillWin: '',
    topScorer: '',
    topWicketTaker: '',
    playerOfMatch: '',
  });
  const [results, setResults] = useState<VoteResults>({ stc: 0, gsc: 0, total: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [votingEnabled, setVotingEnabled] = useState(false);
  const [dbDisconnected, setDbDisconnected] = useState(false);
  const [resultsLoaded, setResultsLoaded] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // D1 is the only database for voting (no Turso/Supabase)
  const [leaderboards, setLeaderboards] = useState<Record<string, LeaderboardEntry[]>>({
    topScorer: [],
    topWicketTaker: [],
    playerOfMatch: [],
  });

  // ─── Fetch Playing XI data from admin system (same source as PlayingXITab) ───
  const stcXiContent = useSectionContent('xi-sthomas', DEFAULT_XI_STC_CONTENT);
  const scienceXiContent = useSectionContent('xi-science', DEFAULT_XI_SCIENCE_CONTENT);

  // Extract player names from Playing XI content (primary source — always shows all 11 players)
  const stcPlayersFromXI = useMemo(() => {
    const items = getContentArray<ContentPlayerItem>(stcXiContent, 'player_items', DEFAULT_XI_STC_CONTENT.player_items as ContentPlayerItem[]);
    return items.map(p => p.name).filter(Boolean);
  }, [stcXiContent]);

  const gscPlayersFromXI = useMemo(() => {
    const items = getContentArray<ContentPlayerItem>(scienceXiContent, 'player_items', DEFAULT_XI_SCIENCE_CONTENT.player_items as ContentPlayerItem[]);
    return items.map(p => p.name).filter(Boolean);
  }, [scienceXiContent]);

  // Fallback: innings data (only has players who batted/bowled so far)
  const getPlayersFromInnings = (innings: InningsData): string[] => {
    const batsmen = innings?.batting?.map(b => b.name).filter(Boolean) || [];
    const bowlers = innings?.bowling?.map(b => b.name).filter(Boolean) || [];
    return [...new Set([...batsmen, ...bowlers])];
  };

  const stcPlayersLive = getPlayersFromInnings(innings1);
  const gscPlayersLive = getPlayersFromInnings(innings2);
  const hasLiveData = stcPlayersLive.length > 0 || gscPlayersLive.length > 0;

  // Priority: Playing XI > Live innings > Hardcoded fallback
  const stcPlayers = stcPlayersFromXI.length > 0 ? stcPlayersFromXI : (stcPlayersLive.length > 0 ? stcPlayersLive : FALLBACK_STC_PLAYERS);
  const gscPlayers = gscPlayersFromXI.length > 0 ? gscPlayersFromXI : (gscPlayersLive.length > 0 ? gscPlayersLive : FALLBACK_GSC_PLAYERS);

  // Get team heading from Playing XI content
  const stcHeading = useMemo(() => {
    const h = getContentString(stcXiContent, 'heading', "St.Thomas' College Matale");
    return h;
  }, [stcXiContent]);
  const gscHeading = useMemo(() => {
    const h = getContentString(scienceXiContent, 'heading', 'Govt. Science College Matale');
    return h;
  }, [scienceXiContent]);

  const playerOptions = useMemo(() => [
    { group: stcHeading, players: stcPlayers },
    { group: gscHeading, players: gscPlayers },
  ], [stcHeading, gscHeading, stcPlayers, gscPlayers]);

  // Determine team color for a selected player
  const getTeamColor = (playerName: string): string => {
    if (stcPlayers.includes(playerName)) return '#FFC300';
    if (gscPlayers.includes(playerName)) return '#E63946';
    return '#FFC300';
  };

  // ─── Fetch results from /api/vote-results ───
  const fetchResults = useCallback(async (forceFresh = false) => {
    // If D1 is disconnected, don't make API calls at all
    if (dbDisconnected) return;

    try {
      const url = forceFresh ? '/api/vote-results?noCache=1' : '/api/vote-results';
      // cache: 'no-store' → browser NEVER uses its HTTP cache (defense-in-depth)
      // Prevents stale cached results from showing in PredictionsTab
      const response = await fetch(url, { cache: 'no-store' });
      const data = await response.json();

      if (data) {
        // Check if D1 voting connection is disconnected
        if (data.d1Disconnected || data.tursoDisconnected || data.d1Unavailable) {
          setDbDisconnected(true);
          setVotingEnabled(false);
          return;
        }

        // Update voting enabled state
        setVotingEnabled(data.votingEnabled !== false);

        const community: CommunityData = data.community || {};

        // Parse whoWillWin results
        const www = community.whoWillWin || {};
        const stc = www.STC || 0;
        const gsc = www.GSC || 0;
        const draw = www.Draw || 0;
        const total = stc + gsc + draw;
        setResults({ stc, gsc, total: total > 0 ? total : 0 });

        // Parse leaderboards from freeform player polls
        const buildLeaderboard = (pollData: Record<string, number> | undefined): LeaderboardEntry[] => {
          if (!pollData || Object.keys(pollData).length === 0) return [];
          const totalVotes = Object.values(pollData).reduce((sum, v) => sum + v, 0) || 1;
          return Object.entries(pollData)
            .map(([name, votes]) => ({
              name,
              team: (stcPlayers.includes(name) ? 'STC' : 'GSC') as 'STC' | 'GSC',
              votes,
              percent: Math.round((votes / totalVotes) * 100),
            }))
            .sort((a, b) => b.votes - a.votes)
            .slice(0, 5);
        };

        setLeaderboards({
          topScorer: buildLeaderboard(community.topScorer),
          topWicketTaker: buildLeaderboard(community.topWicketTaker),
          playerOfMatch: buildLeaderboard(community.playerOfMatch),
        });
      }
    } catch {
      setResults({ stc: 0, gsc: 0, total: 0 });
      setLeaderboards({ topScorer: [], topWicketTaker: [], playerOfMatch: [] });
    } finally {
      setResultsLoaded(true);
    }
  }, [stcPlayers, dbDisconnected]);

  useEffect(() => {
    fetchResults();
    // When D1 disconnected: NO polling — zero API calls
    if (dbDisconnected) return;

    // Keep polling even when voting is closed — results should stay visible
    // 30s interval — matches CDN s-maxage=30 for fresh results
    const intervalMs = 30_000; // 30 seconds
    const interval = setInterval(fetchResults, intervalMs);
    return () => clearInterval(interval);
  }, [fetchResults, votingEnabled, dbDisconnected]);

  // Listen for voting toggle — re-fetch immediately
  useEffect(() => {
    const handleVotingToggled = () => {
      setDbDisconnected(false);
      fetchResults();
    };
    const handleVotingD1Toggled = () => {
      setDbDisconnected(false);
      fetchResults();
    };
    window.addEventListener('voting-toggled', handleVotingToggled);
    window.addEventListener('voting-d1-toggled', handleVotingD1Toggled);
    window.addEventListener('voting-turso-toggled', handleVotingD1Toggled); // legacy
    return () => {
      window.removeEventListener('voting-toggled', handleVotingToggled);
      window.removeEventListener('voting-d1-toggled', handleVotingD1Toggled);
      window.removeEventListener('voting-turso-toggled', handleVotingD1Toggled);
    };
  }, [fetchResults]);

  // ─── Check if user already submitted predictions ───
  useEffect(() => {
    const voted = hasVoted('whoWillWin') && hasVoted('topScorer') && hasVoted('topWicketTaker') && hasVoted('playerOfMatch');
    if (voted) {
      setHasSubmitted(true);
      // Restore previous selections for display
      const votedPolls = getVotedPolls();
      if (votedPolls.whoWillWin) {
        setPrediction(p => ({ ...p, whoWillWin: votedPolls.whoWillWin as 'STC' | 'GSC' }));
      }
      if (votedPolls.topScorer) {
        setPrediction(p => ({ ...p, topScorer: votedPolls.topScorer }));
      }
      if (votedPolls.topWicketTaker) {
        setPrediction(p => ({ ...p, topWicketTaker: votedPolls.topWicketTaker }));
      }
      if (votedPolls.playerOfMatch) {
        setPrediction(p => ({ ...p, playerOfMatch: votedPolls.playerOfMatch }));
      }
    }
  }, []);

  // ─── Submit prediction (BATCH: all 4 votes in 1 API call) ───
  const handleSubmit = async () => {
    if (!prediction.whoWillWin || !prediction.topScorer || !prediction.topWicketTaker || !prediction.playerOfMatch || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const fingerprint = getFingerprint();

      // 🚀 Batch: Send all 4 prediction votes in a SINGLE request
      // Instead of 4 sequential POST requests (4 × 2 = 8 API calls),
      // we send 1 batch request = 8x less API calls
      const votes = [
        { pollKey: 'whoWillWin', optionKey: prediction.whoWillWin },
        { pollKey: 'topScorer', optionKey: prediction.topScorer },
        { pollKey: 'topWicketTaker', optionKey: prediction.topWicketTaker },
        { pollKey: 'playerOfMatch', optionKey: prediction.playerOfMatch },
      ];

      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ votes, fingerprint }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.d1Disconnected || errorData.tursoDisconnected || errorData.d1Unavailable) {
          setDbDisconnected(true);
          setVotingEnabled(false);
          setSubmitError('Voting database is currently unavailable.');
        } else if (errorData.votingEnabled === false) {
          setVotingEnabled(false);
          setSubmitError('Voting is currently closed.');
        } else if (response.status === 429) {
          setSubmitError(errorData.error || 'Too many votes. Please wait a minute and try again.');
        } else if (errorData.alreadyVoted) {
          // ALL polls already voted — mark as submitted since they've voted
          for (const pollKey of errorData.alreadyVoted) {
            if (!hasVoted(pollKey)) saveVotedPoll(pollKey, 'previous');
          }
          setHasSubmitted(true);
        } else {
          setSubmitError(errorData.error || 'Failed to submit predictions. Please try again.');
        }
        // Don't mark as submitted on failure — let user retry
      } else {
        setSubmitError(null);
        const data = await response.json();
        // Mark only the polls that were actually submitted (skip already-voted ones)
        const submittedPolls: string[] = data.submittedPolls || votes.map(v => v.pollKey);
        for (const pollKey of submittedPolls) {
          const vote = votes.find(v => v.pollKey === pollKey);
          if (vote) saveVotedPoll(vote.pollKey, vote.optionKey);
        }
        // Also mark any skipped polls as voted (they were already voted before)
        if (data.skippedPolls) {
          for (const pollKey of data.skippedPolls) {
            if (!hasVoted(pollKey)) saveVotedPoll(pollKey, 'previous');
          }
        }
        setHasSubmitted(true);
      }
      // Refresh results after short delay — force fresh to see own vote
      setTimeout(() => fetchResults(true), 1500);
    } catch (err) {
      console.error('Prediction submission failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormComplete = prediction.whoWillWin && prediction.topScorer && prediction.topWicketTaker && prediction.playerOfMatch;

  const stcPercent = results.total > 0 ? Math.round((results.stc / results.total) * 100) : 0;
  const gscPercent = results.total > 0 ? Math.round((results.gsc / results.total) * 100) : 0;

  const hasAnyVotes = results.total > 0 || Object.values(leaderboards).some(lb => lb.length > 0);

  // ─── Render ───
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* ═══ Prediction Form ═══ */}
      <EditableSection
        sectionId="predictions-form"
        pageId="community"
        type="stats"
        title="Match Predictions"
        content={{
          heading: 'Match Predictions',
          stc_logo: '/logos/st-thomas-college-matale.jpg',
          gsc_logo: '/logos/govt-science-college-matale.jpg',
        }}
      >
        <motion.div variants={item} className="lux-card-gold">
          <h2 className="card-title">
            <span className="icon"><PremiumIcon name="target" className="w-3.5 h-3.5 text-gold" /></span> Match Predictions
          </h2>

          {!resultsLoaded && (
            <div className="text-center py-8 border border-lux-border bg-lux-surface/30">
              <span className="text-[10px] uppercase tracking-[3px] text-text-muted">Loading prediction status…</span>
            </div>
          )}

          {/* ── D1 Disconnected: Premium Coming Soon display ── */}
          {resultsLoaded && dbDisconnected && (
            <VotingComingSoon variant="predictions" />
          )}

          {/* ── Voting OFF + No Votes ── */}
          {resultsLoaded && !dbDisconnected && !votingEnabled && !hasSubmitted && !hasAnyVotes && (
            <VotingComingSoon variant="predictions" />
          )}

          {/* ── Voting OFF + Has Votes (Read-Only with full results) ── */}
          {resultsLoaded && !dbDisconnected && !votingEnabled && !hasSubmitted && hasAnyVotes && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {/* Voting Closed Banner */}
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[#E63946]/20 bg-[#E63946]/5">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-[#E63946]/60" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                <span className="text-[9px] sm:text-[10px] text-[#E63946]/80 uppercase tracking-[2px] font-semibold">Voting Closed — Showing Final Results</span>
              </div>

              {/* Who Will Win Results */}
              {results.total > 0 && (
                <div className="space-y-3">
                  <p className="text-[9px] sm:text-[10px] text-text-secondary uppercase tracking-[2px]">Who will win?</p>
                  <div className="space-y-2">
                    {/* STC */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] sm:text-xs text-text-secondary">St.Thomas&apos; College Matale</span>
                        <span className="text-[10px] sm:text-xs text-gold font-bold">{stcPercent}%</span>
                      </div>
                      <div className="h-2 sm:h-2.5 bg-lux-surface overflow-hidden rounded-full">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${stcPercent}%` }}
                          transition={{ duration: 1 }}
                          className="h-full bg-gradient-to-r from-[#997500] to-[#FFC300] rounded-full"
                        />
                      </div>
                    </div>
                    {/* GSC */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] sm:text-xs text-text-secondary">Govt. Science College Matale</span>
                        <span className="text-[10px] sm:text-xs text-[#E63946] font-bold">{gscPercent}%</span>
                      </div>
                      <div className="h-2 sm:h-2.5 bg-lux-surface overflow-hidden rounded-full">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${gscPercent}%` }}
                          transition={{ duration: 1 }}
                          className="h-full bg-gradient-to-r from-[#992020] to-[#E63946] rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-[9px] text-text-muted">{results.total.toLocaleString()} total predictions</p>
                </div>
              )}

              {/* Player Leaderboards */}
              {Object.values(leaderboards).some(lb => lb.length > 0) && (
                <div className="space-y-3">
                  {LEADERBOARD_CONFIG.map((config) => {
                    const entries = leaderboards[config.key];
                    if (!entries || entries.length === 0) return null;
                    return (
                      <div key={config.key}>
                        <div className="flex items-center gap-2 mb-2">
                          {config.icon}
                          <span className="text-[9px] sm:text-[10px] text-text-secondary uppercase tracking-[2px]">{config.title}</span>
                        </div>
                        <div className="space-y-1.5">
                          {entries.slice(0, 3).map((entry, idx) => (
                            <div key={entry.name} className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-lux-surface/50">
                              <div className="flex items-center gap-2">
                                <span className={`text-[8px] font-bold ${idx === 0 ? 'text-gold' : 'text-text-muted'}`}>#{idx + 1}</span>
                                <span className="text-[10px] sm:text-xs font-medium" style={{ color: entry.team === 'STC' ? '#FFC300' : '#E63946' }}>{entry.name}</span>
                              </div>
                              <span className="text-[9px] sm:text-[10px] font-semibold text-text-muted tabular-nums">{entry.percent}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ── Voting OFF + Already Submitted (Show closed banner + results) ── */}
          {resultsLoaded && !dbDisconnected && !votingEnabled && hasSubmitted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {/* Voting Closed Banner */}
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[#E63946]/20 bg-[#E63946]/5">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-[#E63946]/60" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                <span className="text-[9px] sm:text-[10px] text-[#E63946]/80 uppercase tracking-[2px] font-semibold">Voting Closed — Showing Final Results</span>
              </div>

              {/* Submitted confirmation mini */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gold/20 bg-gold/5">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-gold" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <span className="text-[9px] sm:text-[10px] text-gold/80 uppercase tracking-[2px] font-semibold">Your prediction was submitted</span>
              </div>

              {/* Who Will Win Results */}
              {results.total > 0 && (
                <div className="space-y-3">
                  <p className="text-[9px] sm:text-[10px] text-text-secondary uppercase tracking-[2px]">Who will win?</p>
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] sm:text-xs text-text-secondary">St.Thomas&apos; College Matale</span>
                        <span className="text-[10px] sm:text-xs text-gold font-bold">{stcPercent}%</span>
                      </div>
                      <div className="h-2 sm:h-2.5 bg-lux-surface overflow-hidden rounded-full">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${stcPercent}%` }}
                          transition={{ duration: 1 }}
                          className="h-full bg-gradient-to-r from-[#997500] to-[#FFC300] rounded-full"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] sm:text-xs text-text-secondary">Govt. Science College Matale</span>
                        <span className="text-[10px] sm:text-xs text-[#E63946] font-bold">{gscPercent}%</span>
                      </div>
                      <div className="h-2 sm:h-2.5 bg-lux-surface overflow-hidden rounded-full">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${gscPercent}%` }}
                          transition={{ duration: 1 }}
                          className="h-full bg-gradient-to-r from-[#992020] to-[#E63946] rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-[9px] text-text-muted">{results.total.toLocaleString()} total predictions</p>
                </div>
              )}

              {/* Player Leaderboards */}
              {Object.values(leaderboards).some(lb => lb.length > 0) && (
                <div className="space-y-3">
                  {LEADERBOARD_CONFIG.map((config) => {
                    const entries = leaderboards[config.key];
                    if (!entries || entries.length === 0) return null;
                    return (
                      <div key={config.key}>
                        <div className="flex items-center gap-2 mb-2">
                          {config.icon}
                          <span className="text-[9px] sm:text-[10px] text-text-secondary uppercase tracking-[2px]">{config.title}</span>
                        </div>
                        <div className="space-y-1.5">
                          {entries.slice(0, 3).map((entry, idx) => (
                            <div key={entry.name} className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-lux-surface/50">
                              <div className="flex items-center gap-2">
                                <span className={`text-[8px] font-bold ${idx === 0 ? 'text-gold' : 'text-text-muted'}`}>#{idx + 1}</span>
                                <span className="text-[10px] sm:text-xs font-medium" style={{ color: entry.team === 'STC' ? '#FFC300' : '#E63946' }}>{entry.name}</span>
                              </div>
                              <span className="text-[9px] sm:text-[10px] font-semibold text-text-muted tabular-nums">{entry.percent}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ── Interactive Prediction Form ── */}
          {resultsLoaded && !dbDisconnected && votingEnabled && !hasSubmitted && (
            <div className="space-y-6">
              {/* ── Who Will Win? ── */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <p className="text-[9px] sm:text-[10px] text-text-secondary uppercase tracking-[2px] mb-3">
                  Who will win?
                </p>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {/* STC button */}
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setPrediction(p => ({ ...p, whoWillWin: 'STC' }))}
                    className={`relative py-4 sm:py-5 px-3 border text-center group overflow-hidden transition-all duration-300 ${
                      prediction.whoWillWin === 'STC'
                        ? 'border-[#FFC300] bg-[#FFC300]/5'
                        : 'border-lux-border hover:border-[#FFC300]/40'
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-[#FFC300]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative z-10">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 relative">
                        <Image src="/logos/st-thomas-college-matale.jpg" alt="STC" fill sizes="(max-width: 640px) 32px, 40px" className="object-contain" />
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[2px] text-gold">
                        St.Thomas&apos; College Matale
                      </span>
                    </div>
                    {/* Selection indicator */}
                    <AnimatePresence>
                      {prediction.whoWillWin === 'STC' && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute top-2 right-2"
                        >
                          <div className="w-4 h-4 rounded-full bg-gold flex items-center justify-center">
                            <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 text-lux-bg" fill="none" stroke="currentColor" strokeWidth="3">
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>

                  {/* GSC button */}
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setPrediction(p => ({ ...p, whoWillWin: 'GSC' }))}
                    className={`relative py-4 sm:py-5 px-3 border text-center group overflow-hidden transition-all duration-300 ${
                      prediction.whoWillWin === 'GSC'
                        ? 'border-[#E63946] bg-[#E63946]/5'
                        : 'border-lux-border hover:border-[#E63946]/40'
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-[#E63946]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative z-10">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 relative">
                        <Image src="/logos/govt-science-college-matale.jpg" alt="GSC" fill sizes="(max-width: 640px) 32px, 40px" className="object-contain" />
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[2px] text-[#E63946]">
                        Govt. Science College Matale
                      </span>
                    </div>
                    {/* Selection indicator */}
                    <AnimatePresence>
                      {prediction.whoWillWin === 'GSC' && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute top-2 right-2"
                        >
                          <div className="w-4 h-4 rounded-full bg-[#E63946] flex items-center justify-center">
                            <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="3">
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>
              </motion.div>

              {/* ── Divider ── */}
              <div className="h-px bg-gradient-to-r from-transparent via-lux-border to-transparent" />

              {/* ── Top Scorer ── */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <PremiumDropdown
                  label="Top Scorer"
                  icon={
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-gold" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M4 20h16" strokeLinecap="round" />
                      <path d="M8 16v4" />
                      <path d="M12 12v8" />
                      <path d="M16 8v12" />
                    </svg>
                  }
                  value={prediction.topScorer}
                  onChange={(val) => setPrediction(p => ({ ...p, topScorer: val }))}
                  options={playerOptions}
                  teamColor={getTeamColor(prediction.topScorer)}
                  placeholder="Select Top Scorer"
                />
              </motion.div>

              {/* ── Top Wicket-Taker ── */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <PremiumDropdown
                  label="Top Wicket-Taker"
                  icon={
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-gold" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.4" />
                      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" strokeOpacity="0.4" />
                    </svg>
                  }
                  value={prediction.topWicketTaker}
                  onChange={(val) => setPrediction(p => ({ ...p, topWicketTaker: val }))}
                  options={playerOptions}
                  teamColor={getTeamColor(prediction.topWicketTaker)}
                  placeholder="Select Top Wicket-Taker"
                />
              </motion.div>

              {/* ── Player of the Match ── */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <PremiumDropdown
                  label="Player of the Match"
                  icon={
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-gold" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor" fillOpacity="0.2" />
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  }
                  value={prediction.playerOfMatch}
                  onChange={(val) => setPrediction(p => ({ ...p, playerOfMatch: val }))}
                  options={playerOptions}
                  teamColor={getTeamColor(prediction.playerOfMatch)}
                  placeholder="Select Player of the Match"
                />
              </motion.div>

              {/* ── Live Data Notice ── */}
              {hasLiveData && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-[9px] text-text-muted uppercase tracking-[1px]"
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                  </span>
                  Player names from live data
                </motion.div>
              )}

              {/* ── Submit Button ── */}
              <motion.button
                whileHover={isFormComplete && !isSubmitting ? { scale: 1.01 } : {}}
                whileTap={isFormComplete && !isSubmitting ? { scale: 0.98 } : {}}
                onClick={handleSubmit}
                disabled={!isFormComplete || isSubmitting}
                className={`w-full py-3.5 text-[10px] sm:text-xs uppercase tracking-[3px] font-semibold transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden ${
                  isFormComplete && !isSubmitting
                    ? 'bg-gold text-lux-bg hover:bg-gold-bright'
                    : 'bg-lux-elevated text-text-muted cursor-not-allowed'
                }`}
              >
                {isFormComplete && !isSubmitting && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                  />
                )}
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 2L11 13" strokeLinecap="round" />
                      <path d="M22 2l-7 20-4-9-9-4 20-7z" strokeLinejoin="round" />
                    </svg>
                    Submit Prediction
                  </>
                )}
              </motion.button>

              {/* ── Error Message ── */}
              <AnimatePresence>
                {submitError && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mt-3 px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs sm:text-sm text-center"
                  >
                    {submitError}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* ── Submitted Confirmation ── */}
          {resultsLoaded && hasSubmitted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="py-6"
            >
              <div className="text-center mb-6">
                <SuccessCheckmark />
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="text-text-primary font-semibold mt-4 mb-1"
                >
                  Prediction Submitted!
                </motion.p>
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.75 }}
                  className="text-xs text-text-secondary"
                >
                  You predicted{' '}
                  <span className={prediction.whoWillWin === 'STC' ? 'text-gold font-medium' : 'text-[#E63946] font-medium'}>
                    {prediction.whoWillWin === 'STC' ? "St.Thomas' College Matale" : 'Govt. Science College Matale'}
                  </span>{' '}
                  to win
                </motion.p>
              </div>

              {/* Prediction summary */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="space-y-2 pt-4 border-t border-lux-divider"
              >
                {prediction.topScorer && (
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-[9px] text-text-muted uppercase tracking-[1.5px]">Top Scorer</span>
                    <span className="text-xs font-medium" style={{ color: getTeamColor(prediction.topScorer) }}>
                      {prediction.topScorer}
                    </span>
                  </div>
                )}
                {prediction.topWicketTaker && (
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-[9px] text-text-muted uppercase tracking-[1.5px]">Top Wicket-Taker</span>
                    <span className="text-xs font-medium" style={{ color: getTeamColor(prediction.topWicketTaker) }}>
                      {prediction.topWicketTaker}
                    </span>
                  </div>
                )}
                {prediction.playerOfMatch && (
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-[9px] text-text-muted uppercase tracking-[1.5px]">Player of the Match</span>
                    <span className="text-xs font-medium" style={{ color: getTeamColor(prediction.playerOfMatch) }}>
                      {prediction.playerOfMatch}
                    </span>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </EditableSection>

      {/* ═══ Live Results ═══ */}
      <EditableSection
        sectionId="predictions-results"
        pageId="community"
        type="stats"
        title="Live Predictions"
        content={{
          heading: 'Live Predictions',
          stc_percent: stcPercent,
          gsc_percent: gscPercent,
          total_predictions: results.total,
        }}
      >
        <motion.div variants={item} className="lux-card">
          <h2 className="card-title">
            <span className="icon"><PremiumIcon name="bar" className="w-3.5 h-3.5 text-gold" /></span> Live Predictions
          </h2>

          {results.total > 0 ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-text-muted">
                  {results.total.toLocaleString()} total predictions
                </p>
                <PredictionRefreshTimer />
              </div>
              <div className="space-y-4">
                {/* STC bar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-text-secondary flex items-center gap-2">
                      <svg viewBox="0 0 16 16" className="w-3 h-3" fill="#FFC300">
                        <rect x="7" y="2" width="2" height="10" rx="0.5" />
                        <rect x="4" y="5" width="8" height="2" rx="0.5" />
                      </svg>
                      St.Thomas&apos; College Matale
                    </span>
                    <span className="text-xs text-gold font-bold">{stcPercent}%</span>
                  </div>
                  <div className="h-3 bg-lux-surface overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stcPercent}%` }}
                      transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="h-full bg-gradient-to-r from-[#997500] to-[#FFC300]"
                    />
                  </div>
                </div>

                {/* GSC bar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-text-secondary flex items-center gap-2">
                      <svg viewBox="0 0 16 16" className="w-3 h-3" fill="#E63946">
                        <circle cx="8" cy="8" r="5" />
                      </svg>
                      Govt. Science College Matale
                    </span>
                    <span className="text-xs text-[#E63946] font-bold">{gscPercent}%</span>
                  </div>
                  <div className="h-3 bg-lux-surface overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${gscPercent}%` }}
                      transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="h-full bg-gradient-to-r from-[#7B1A2A] to-[#E63946]"
                    />
                  </div>
                </div>
              </div>

              {/* VS divider */}
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-lux-divider">
                <div className="flex-1 text-center">
                  <span className="text-sm sm:text-base font-bold text-gold">{results.stc.toLocaleString()}</span>
                  <p className="text-[8px] text-text-muted uppercase tracking-[1px]">Thomians</p>
                </div>
                <span className="text-[9px] font-bold text-text-muted tracking-[2px]">VS</span>
                <div className="flex-1 text-center">
                  <span className="text-sm sm:text-base font-bold text-[#E63946]">{results.gsc.toLocaleString()}</span>
                  <p className="text-[8px] text-text-muted uppercase tracking-[1px]">Science</p>
                </div>
              </div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-6"
            >
              <p className="text-xs text-text-muted">No predictions yet. Be the first to vote!</p>
            </motion.div>
          )}
        </motion.div>
      </EditableSection>

      {/* ═══ Leaderboard Tables ═══ */}
      {LEADERBOARD_CONFIG.map((lb, lbIdx) => {
        const entries = leaderboards[lb.key] || [];
        if (entries.length === 0) return null;

        return (
          <EditableSection
            key={lb.key}
            sectionId={`predictions-${lb.key}`}
            pageId="community"
            type="stats"
            title={lb.title}
            content={{
              heading: lb.title,
              leaderboard_items: entries.map(e => ({ name: e.name, team: e.team, votes: e.votes, percent: e.percent })),
            }}
          >
            <motion.div
              variants={item}
              className="lux-card"
              custom={lbIdx}
            >
              <h2 className="card-title">
                <span className="icon">{lb.icon}</span> {lb.title}
              </h2>
              <div className="space-y-3">
                {entries.map((entry, idx) => {
                  const isSTC = entry.team === 'STC';
                  const barColor = isSTC ? '#FFC300' : '#E63946';
                  const barGradient = isSTC
                    ? 'from-[#997500] to-[#FFC300]'
                    : 'from-[#7B1A2A] to-[#E63946]';
                  const textColor = isSTC ? 'text-gold' : 'text-[#E63946]';

                  return (
                    <motion.div
                      key={entry.name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.08, duration: 0.4 }}
                      className="group"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2.5">
                          {/* Rank */}
                          <span className={`text-[9px] font-bold w-4 text-center ${
                            idx === 0 ? 'text-gold' : idx === 1 ? 'text-text-secondary' : 'text-text-muted'
                          }`}>
                            {idx === 0 ? '👑' : idx + 1}
                          </span>
                          {/* Team indicator dot */}
                          <div
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ background: barColor }}
                          />
                          {/* Player name */}
                          <span className={`text-xs font-medium ${idx === 0 ? 'text-text-primary' : 'text-text-secondary'} group-hover:text-text-primary transition-colors`}>
                            {entry.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-text-muted">{entry.votes}</span>
                          <span className={`text-xs font-bold ${textColor}`}>{entry.percent}%</span>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="h-1.5 bg-lux-surface overflow-hidden ml-6">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${entry.percent}%` }}
                          transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94], delay: idx * 0.1 + 0.3 }}
                          className={`h-full bg-gradient-to-r ${barGradient}`}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </EditableSection>
        );
      })}

      {/* ═══ Actual Match Results ═══ */}
      <motion.div variants={item}>
        <ActualResultsSection matchInfo={matchInfo} innings1={innings1} innings2={innings2} />
      </motion.div>
    </motion.div>
  );
}

/* ── Refresh Timer Component ── */
function PredictionRefreshTimer() {
  const [countdown, setCountdown] = useState(30);
  const lastRefreshRef = useRef(Date.now());

  useEffect(() => {
    // Sync with 30s refresh cycle
    const tick = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastRefreshRef.current) / 1000);
      const remaining = Math.max(0, 30 - elapsed);
      setCountdown(remaining);
      if (remaining === 0) {
        // Reset for next cycle
        lastRefreshRef.current = Date.now();
      }
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  return (
    <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-text-muted/60">
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
      {countdown > 0 ? (
        <span>Refresh in {countdown}s</span>
      ) : (
        <span className="text-gold/60">Refreshing...</span>
      )}
    </div>
  );
}
