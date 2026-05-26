'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  LiveState,
  MatchInfo,
  InningsData,
  CommunityData,
  MomentumPoint,
} from '@/lib/types';
import type { MatchLiveRow } from '@/lib/data-transformer';
import {
  EMPTY_MATCH_INFO,
  EMPTY_COMMUNITY,
  EMPTY_MOMENTUM,
} from '@/lib/constants';
import type { BowlerInnings, BatsmanInnings, FallOfWicket, OverData, PartnershipData } from '@/lib/types';

// ---------------------------------------------------------------------------
// Offline placeholder data — shown when live mode is OFF
// ---------------------------------------------------------------------------
const OFFLINE_LIVE_STATE: LiveState = {
  currentOver: 0,
  currentBall: 0,
  overDisplay: '0.0',
  score: '0/0',
  battingTeam: "St.Thomas' College Matale",
  target: 0,
  need: 0,
  ballsLeft: 0,
  currentBatsmen: [
    { name: 'Batsman 1', shortName: 'B. 1', initials: 'B1', runs: 0, balls: 0, fours: 0, sixes: 0, sr: 0, isStriking: true, photoUrl: '' },
    { name: 'Batsman 2', shortName: 'B. 2', initials: 'B2', runs: 0, balls: 0, fours: 0, sixes: 0, sr: 0, isStriking: false, photoUrl: '' },
  ],
  currentBowler: 'Bowler 1',
  currentOverBalls: [],
  partnership: { runs: 0, balls: 0, bat1Runs: 0, bat2Runs: 0, bat1Name: 'Batsman 1', bat2Name: 'Batsman 2' },
  isLive: true,
  isOffline: true,
  crr: 0,
  rrr: 0,
};

const OFFLINE_INNINGS: InningsData = {
  battingTeam: "St.Thomas' College Matale",
  bowlingTeam: 'Govt. Science College Matale',
  totalRuns: 0,
  totalWkts: 0,
  totalOvers: '0.0',
  maxOvers: 0,
  extras: { total: 0, wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0 },
  batting: [
    { name: 'Batsman 1', shortName: 'B. 1', initials: 'B1', runs: 0, balls: 0, fours: 0, sixes: 0, sr: 0, dismissal: 'not out', isOut: false },
    { name: 'Batsman 2', shortName: 'B. 2', initials: 'B2', runs: 0, balls: 0, fours: 0, sixes: 0, sr: 0, dismissal: 'not out', isOut: false },
  ],
  bowling: [
    { name: 'Bowler 1', overs: '0.0', maidens: 0, runs: 0, wickets: 0, econ: 0, dots: 0, dotPercent: 0, fours: 0, sixes: 0 },
    { name: 'Bowler 2', overs: '0.0', maidens: 0, runs: 0, wickets: 0, econ: 0, dots: 0, dotPercent: 0, fours: 0, sixes: 0 },
  ],
  fallOfWickets: [],
  overByOver: [],
  partnerships: [],
};

const OFFLINE_INNINGS2: InningsData = {
  ...OFFLINE_INNINGS,
  battingTeam: 'Govt. Science College Matale',
  bowlingTeam: "St.Thomas' College Matale",
};

// Empty innings for when live mode is ON but no match data yet
const EMPTY_INNINGS: InningsData = {
  battingTeam: "St.Thomas' College Matale",
  bowlingTeam: 'Govt. Science College Matale',
  totalRuns: 0,
  totalWkts: 0,
  totalOvers: '0.0',
  maxOvers: 0,
  extras: { total: 0, wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0 },
  batting: [],
  bowling: [],
  fallOfWickets: [],
  overByOver: [],
  partnerships: [],
};

const EMPTY_INNINGS2: InningsData = {
  ...EMPTY_INNINGS,
  battingTeam: 'Govt. Science College Matale',
  bowlingTeam: "St.Thomas' College Matale",
};

// ---------------------------------------------------------------------------
// Merge helper — preserves historical bowling/batting data when admin
// sends updated innings with only current bowler/batsmen
// Only merges when both prev and incoming are LIVE data (not offline)
// ---------------------------------------------------------------------------
function mergeInningsData(prev: InningsData, incoming: InningsData): InningsData {
  // If incoming has more data than prev, just use incoming (first load or full data)
  if (!prev || prev.batting.length === 0) return incoming;

  // If prev is offline/placeholder data, don't merge — just use incoming
  if (isOfflineData(prev)) return incoming;

  // Merge bowling: keep all previous bowlers, add/update with incoming bowlers
  const mergedBowling = mergeBowlerList(prev.bowling, incoming.bowling);

  // Merge batting: keep all previous batsmen, add/update with incoming batsmen
  const mergedBatting = mergeBatsmanList(prev.batting, incoming.batting);

  // Merge fall of wickets: take the longer list
  const mergedFOW = incoming.fallOfWickets.length >= prev.fallOfWickets.length
    ? incoming.fallOfWickets
    : prev.fallOfWickets;

  // Merge overByOver: take the longer list
  const mergedOverByOver = incoming.overByOver.length >= prev.overByOver.length
    ? incoming.overByOver
    : prev.overByOver;

  // Merge partnerships: take the longer list
  const mergedPartnerships = incoming.partnerships.length >= prev.partnerships.length
    ? incoming.partnerships
    : prev.partnerships;

  return {
    ...incoming, // Use incoming for basic fields (totalRuns, totalWkts, etc.)
    batting: mergedBatting,
    bowling: mergedBowling,
    fallOfWickets: mergedFOW,
    overByOver: mergedOverByOver,
    partnerships: mergedPartnerships,
  };
}

/** Check if innings data is offline/placeholder (Batsman 1, Bowler 1, etc.) */
function isOfflineData(innings: InningsData): boolean {
  if (!innings || !innings.batting || innings.batting.length === 0) return true;
  // Check if first batsman is a placeholder
  const firstBatsman = innings.batting[0]?.name || '';
  return firstBatsman === 'Batsman 1' || firstBatsman === 'Batsman 2';
}

function mergeBowlerList(prev: BowlerInnings[], incoming: BowlerInnings[]): BowlerInnings[] {
  const bowlerMap = new Map<string, BowlerInnings>();

  // Add all previous bowlers first
  for (const b of prev) {
    bowlerMap.set(b.name, b);
  }

  // Update/add with incoming bowlers (preserves existing, updates current)
  for (const b of incoming) {
    bowlerMap.set(b.name, b);
  }

  return Array.from(bowlerMap.values());
}

function mergeBatsmanList(prev: BatsmanInnings[], incoming: BatsmanInnings[]): BatsmanInnings[] {
  const batsmanMap = new Map<string, BatsmanInnings>();

  // Add all previous batsmen first
  for (const b of prev) {
    batsmanMap.set(b.name, b);
  }

  // Update/add with incoming batsmen
  for (const b of incoming) {
    batsmanMap.set(b.name, b);
  }

  return Array.from(batsmanMap.values());
}

// ---------------------------------------------------------------------------
// Polling configuration — designed for 1M+ concurrent users
// NOTE: No offline polling — saves Supabase free tier quota.
// When live mode is OFF, polling stops entirely. Users refresh to see changes.
// ---------------------------------------------------------------------------

// Default polling config — updated dynamically from API response
const DEFAULT_POLL_INTERVAL = 10_000; // 10s default
const DEFAULT_JITTER_MAX = 3_000; // 3s default
const OFFLINE_CHECK_INTERVAL = 15_000; // 15s — not configurable (detection interval)

// ---------------------------------------------------------------------------
// Data source tracking
// ---------------------------------------------------------------------------
export type DataSource = 'live' | 'connecting' | 'offline';

// ---------------------------------------------------------------------------
// Hook return type
// ---------------------------------------------------------------------------
export interface UseMatchLiveDataResult {
  liveState: LiveState;
  matchInfo: MatchInfo;
  innings1: InningsData;
  innings2: InningsData;
  community: CommunityData;
  momentum: MomentumPoint[];
  castVote: (teamShortName: string) => void;
  isLoading: boolean;
  dataSource: DataSource;
  lastUpdated: Date | null;
  pollCount: number;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useMatchLiveData(matchId: string): UseMatchLiveDataResult {
  // Start with offline placeholder data
  const [liveState, setLiveState] = useState<LiveState>(OFFLINE_LIVE_STATE);
  const [matchInfo, setMatchInfo] = useState<MatchInfo>(EMPTY_MATCH_INFO);
  const [innings1, setInnings1] = useState<InningsData>(OFFLINE_INNINGS);
  const [innings2, setInnings2] = useState<InningsData>(OFFLINE_INNINGS2);
  const [community, setCommunity] = useState<CommunityData>(EMPTY_COMMUNITY);
  const [momentum, setMomentum] = useState<MomentumPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataSource, setDataSource] = useState<DataSource>('connecting');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [pollCount, setPollCount] = useState(0);

  const mountedRef = useRef(true);
  const etagRef = useRef<string>('');
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dynamic poll config refs — updated when API returns pollConfig
  const pollIntervalRef = useRef(DEFAULT_POLL_INTERVAL);
  const jitterMaxRef = useRef(DEFAULT_JITTER_MAX);

  // Track whether we're in offline mode (from Supabase data)
  const isOfflineRef = useRef(true); // Start assuming offline until first fetch
  // Track whether we've ever received real live data (not offline)
  const hasReceivedLiveDataRef = useRef(false);

  // Refs to preserve previous innings data for merging
  const prevInnings1Ref = useRef<InningsData>(OFFLINE_INNINGS);
  const prevInnings2Ref = useRef<InningsData>(OFFLINE_INNINGS2);

  // -----------------------------------------------------------------------
  // Fetch helper — noCache=true bypasses CDN cache for fresh isOffline checks
  // -----------------------------------------------------------------------
  const fetchData = useCallback(async (noCache = false) => {
    try {
      const headers: Record<string, string> = {
        Accept: 'application/json',
      };

      // Send ETag for 304 Not Modified support (saves bandwidth)
      if (etagRef.current) {
        headers['If-None-Match'] = etagRef.current;
      }

      const res = await fetch('/api/live' + (noCache ? '?noCache=1' : ''), { headers });

      // 304 Not Modified — data unchanged
      if (res.status === 304) {
        if (mountedRef.current) {
          setPollCount(prev => prev + 1);
        }
        return;
      }

      if (!res.ok) {
        // Keep existing data on error
        if (mountedRef.current && dataSource !== 'offline') {
          setDataSource('offline');
        }
        return;
      }

      // Store new ETag
      const newEtag = res.headers.get('etag');
      if (newEtag) {
        etagRef.current = newEtag;
      }

      const data = await res.json();

      // Update dynamic poll config if provided by API
      if (data.pollConfig) {
        if (typeof data.pollConfig.pollInterval === 'number') {
          pollIntervalRef.current = data.pollConfig.pollInterval;
        }
        if (typeof data.pollConfig.jitterMax === 'number') {
          jitterMaxRef.current = data.pollConfig.jitterMax;
        }
      }

      // API signaled fallback (no Supabase data yet)
      if (data.fallback) {
        if (mountedRef.current) {
          // No Supabase connection — show offline data
          setDataSource('offline');
          setPollCount(prev => prev + 1);
        }
        return;
      }

      const row = data as MatchLiveRow;

      // Process live_state to check isOffline flag
      let parsedLiveState: LiveState | null = null;
      if (row.live_state) {
        parsedLiveState = typeof row.live_state === 'string'
          ? JSON.parse(row.live_state)
          : row.live_state;
      }

      // Check if the data is in offline mode
      // Also treat empty/invalid live_state as offline (e.g., when Supabase has {} fields)
      const isEmptyData = !parsedLiveState || Object.keys(parsedLiveState).length === 0 || parsedLiveState.score === undefined;
      const isOffline = parsedLiveState?.isOffline === true || isEmptyData;

      if (isOffline) {
        // Supabase says offline — show offline placeholders, stop active polling
        isOfflineRef.current = true;
        if (mountedRef.current) {
          setDataSource('offline');
          setLiveState(OFFLINE_LIVE_STATE);
          setInnings1(OFFLINE_INNINGS);
          setInnings2(OFFLINE_INNINGS2);
          setMomentum([]);
          setPollCount(prev => prev + 1);
        }
        return;
      }

      // We got LIVE data from Supabase!
      isOfflineRef.current = false;
      hasReceivedLiveDataRef.current = true;

      if (mountedRef.current) {
        setDataSource('live');
        setLastUpdated(new Date());
        setPollCount(prev => prev + 1);
      }

      // Process live_state
      if (parsedLiveState) {
        setLiveState(parsedLiveState);
      }

      // Process match_info
      if (row.match_info) {
        const mi = typeof row.match_info === 'string'
          ? JSON.parse(row.match_info)
          : row.match_info;
        setMatchInfo(mi);
      }

      // Process innings data — merge with previous LIVE data only
      if (row.innings_1) {
        const i1 = typeof row.innings_1 === 'string'
          ? JSON.parse(row.innings_1)
          : row.innings_1;
        // Only merge if we have previous live data; otherwise use incoming directly
        if (hasReceivedLiveDataRef.current && prevInnings1Ref.current.batting.length > 0 && !isOfflineData(prevInnings1Ref.current)) {
          const merged1 = mergeInningsData(prevInnings1Ref.current, i1);
          setInnings1(merged1);
          prevInnings1Ref.current = merged1;
        } else {
          setInnings1(i1);
          prevInnings1Ref.current = i1;
        }
      }
      if (row.innings_2) {
        const i2 = typeof row.innings_2 === 'string'
          ? JSON.parse(row.innings_2)
          : row.innings_2;
        if (hasReceivedLiveDataRef.current && prevInnings2Ref.current.batting.length > 0 && !isOfflineData(prevInnings2Ref.current)) {
          const merged2 = mergeInningsData(prevInnings2Ref.current, i2);
          setInnings2(merged2);
          prevInnings2Ref.current = merged2;
        } else {
          setInnings2(i2);
          prevInnings2Ref.current = i2;
        }
      }

      // Process community
      if (row.community) {
        const c = typeof row.community === 'string'
          ? JSON.parse(row.community)
          : row.community;
        setCommunity(c);
      }

      // Process momentum
      if (row.momentum) {
        const m = typeof row.momentum === 'string'
          ? JSON.parse(row.momentum)
          : row.momentum;
        setMomentum(m);
      }
    } catch {
      // Network error — silently keep existing data
      if (mountedRef.current && dataSource !== 'offline') {
        setDataSource('offline');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [dataSource]);

  // -----------------------------------------------------------------------
  // Polling loop — slow check when offline (detects admin turning live ON),
  //                5s + jitter when live mode is ON
  // -----------------------------------------------------------------------
  useEffect(() => {
    mountedRef.current = true;

    // Initial fetch immediately — use noCache to get fresh isOffline state
    // so we correctly detect if admin has set the match to offline mode
    fetchData(true);

    // Listen for admin toggle events — re-fetch immediately when admin
    // toggles live data ON/OFF so the public site reacts instantly
    // Use noCache=true to bypass CDN cache and get fresh isOffline state
    const handleLiveDataToggled = () => {
      if (mountedRef.current) {
        fetchData(true);
      }
    };
    window.addEventListener('live-data-toggled', handleLiveDataToggled);

    // Listen for Supabase connection toggle — re-fetch immediately
    const handleSupabaseToggled = () => {
      if (mountedRef.current) {
        fetchData(true);
      }
    };
    window.addEventListener('supabase-toggled', handleSupabaseToggled);

    return () => {
      mountedRef.current = false;
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
      }
      window.removeEventListener('live-data-toggled', handleLiveDataToggled);
      window.removeEventListener('supabase-toggled', handleSupabaseToggled);
    };
  // Only run on mount / matchId change
  }, [matchId]);

  // Separate effect: start/stop polling based on dataSource
  useEffect(() => {
    // Clear any existing timer
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    // OFFLINE or CONNECTING: slow background check every 15s
    // This detects when admin turns live mode back ON — without it,
    // the hook would never re-fetch and stay stuck in offline mode.
    if (dataSource === 'offline' || dataSource === 'connecting') {
      const scheduleOfflineCheck = () => {
        if (!mountedRef.current) return;
        pollTimerRef.current = setTimeout(async () => {
          if (!mountedRef.current) return;
          // Use noCache=true for offline checks so we always get fresh isOffline state
          // from Supabase, not a stale CDN-cached response
          await fetchData(true);
          // If admin turned live ON, fetchData will set dataSource='live'
          // and this effect will re-run with the new dataSource,
          // switching to the fast 5s polling loop.
          // If still offline, keep checking slowly.
          if (mountedRef.current && isOfflineRef.current === true) {
            scheduleOfflineCheck();
          }
        }, OFFLINE_CHECK_INTERVAL);
      };
      scheduleOfflineCheck();

      return () => {
        if (pollTimerRef.current) {
          clearTimeout(pollTimerRef.current);
          pollTimerRef.current = null;
        }
      };
    }

    // LIVE mode: poll every pollInterval + jitter
    const scheduleNext = () => {
      if (!mountedRef.current) return;

      const delay = pollIntervalRef.current + Math.floor(Math.random() * jitterMaxRef.current);
      pollTimerRef.current = setTimeout(async () => {
        if (!mountedRef.current) return;
        await fetchData();
        // Only schedule next if still live
        if (mountedRef.current && isOfflineRef.current === false) {
          scheduleNext();
        }
      }, delay);
    };

    // Start polling
    scheduleNext();

    return () => {
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [dataSource, fetchData]);

  // -----------------------------------------------------------------------
  // castVote — optimistic local update (server-side voting is separate)
  // -----------------------------------------------------------------------
  const castVote = useCallback(async (teamShortName: string) => {
    setCommunity(prev => {
      const currentVotes = { ...prev.votes };
      currentVotes[teamShortName] = (currentVotes[teamShortName] || 0) + 1;
      return {
        votes: currentVotes,
        totalVotes: prev.totalVotes + 1,
      };
    });
  }, []);

  return {
    liveState,
    matchInfo,
    innings1,
    innings2,
    community,
    momentum,
    castVote,
    isLoading,
    dataSource,
    lastUpdated,
    pollCount,
  };
}
