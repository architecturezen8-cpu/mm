/**
 * Data Transformer: Converts Admin Panel Firebase payload shape
 * to Spector's LiveState / MatchInfo shape.
 *
 * The Admin writes a "flat" payload with bat1/bat2/bowler sub-objects.
 * Spector expects a structured LiveState with currentBatsmen[], currentOverBalls[], partnership, etc.
 */

import type {
  LiveState,
  MatchInfo,
  BallData,
  CurrentBatsman,
  CurrentPartnership,
  MomentumPoint,
  CommunityData,
  InningsData,
} from './types';

// ---------------------------------------------------------------------------
// Admin payload shape (what the Score Updater sends to Firebase)
// ---------------------------------------------------------------------------
export interface AdminPayload {
  runs: number;
  wkts: number;
  overs: string;       // e.g. "12.3"
  target: number;
  totOvers: number;
  crr: number;
  batFlag: string;      // batting side flag emoji
  bowlFlag: string;     // bowling side flag emoji
  battingSide: string;  // "STC" or "GSC"
  bat1: AdminBatsman;
  bat2: AdminBatsman;
  striker: '1' | '2';
  bowler: AdminBowler;
  thisOver: string;     // e.g. "1 0 4 W 2 0"
  isFreeHit: boolean;
  partRuns: number;
  partBalls: number;
  winProb?: number;
  overRunsHistory?: AdminOverRun[];
  dismissedPlayers?: AdminDismissal[];
  status: string;       // e.g. "LIVE MATCH", "MATCH ENDED"
}

export interface AdminBatsman {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  photo?: string;
}

export interface AdminBowler {
  name: string;
  figs: string;   // bowling figures e.g. "2-24"
  wickets: number;
  runs: number;
  balls: number;
}

export interface AdminOverRun {
  runs: number;
  isWicket: boolean;
}

export interface AdminDismissal {
  name: string;
  runs: number;
  balls: number;
  dismissal: string;
}

// ---------------------------------------------------------------------------
// Supabase match_live table row shape
// ---------------------------------------------------------------------------
export interface MatchLiveRow {
  id: number;
  match_id: string;
  live_state: LiveState | null;
  match_info: MatchInfo | null;
  innings_1: InningsData | null;
  innings_2: InningsData | null;
  community: CommunityData | null;
  momentum: MomentumPoint[] | null;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse "1 0 4 W 2 0" into BallData[] */
export function parseThisOver(thisOverStr: string, oversStr: string): BallData[] {
  if (!thisOverStr || typeof thisOverStr !== 'string') return [];

  const tokens = thisOverStr.trim().split(/\s+/);
  const [overWhole, ballInOver] = oversStr.split('.').map(Number);
  const baseOver = overWhole - 1; // ball numbering starts from over-1

  return tokens.map((token, idx) => {
    const ballNum = idx + 1;
    const overLabel = `${baseOver}.${ballNum}`;

    // Normalise outcome to BallData outcome type
    let outcome: BallData['outcome'] = '0';
    let description = '';

    const upper = token.toUpperCase();
    if (upper === 'W') {
      outcome = 'W';
      description = 'WICKET!';
    } else if (upper === 'WD') {
      outcome = 'Wd';
      description = 'Wide';
    } else if (upper === 'NB') {
      outcome = 'Nb';
      description = 'No ball';
    } else if (['0', '1', '2', '3', '4', '6'].includes(token)) {
      outcome = token as BallData['outcome'];
      description = outcome === '4' ? 'FOUR!' : outcome === '6' ? 'SIX!' : `${outcome} run${outcome !== '1' ? 's' : ''}`;
    } else {
      // Fallback: treat as 0
      outcome = '0';
      description = token;
    }

    return { over: overLabel, outcome, description };
  });
}

/** Get short name from full name: "Dilith Perera" → "D Perera" */
function shortName(name: string): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name;
  return `${parts[0][0]}. ${parts.slice(1).join(' ')}`;
}

/** Get initials from full name: "Dilith Perera" → "DP" */
function initials(name: string): string {
  if (!name) return '';
  return name.trim().split(/\s+/).map(p => p[0]).join('').toUpperCase();
}

// ---------------------------------------------------------------------------
// Main Transformers
// ---------------------------------------------------------------------------

/**
 * Transform Admin Panel payload → LiveState (what Spector UI expects)
 */
export function transformAdminToLiveState(payload: AdminPayload): LiveState {
  const { runs, wkts, overs, target, totOvers, crr, battingSide } = payload;

  // Parse overs: "12.3" → over 12, ball 3
  const [overWhole = 0, ballDecimal = 0] = String(overs).split('.').map(Number);
  const currentOver = overWhole;
  const currentBall = ballDecimal;

  // Build batsmen array
  const currentBatsmen: CurrentBatsman[] = [
    {
      name: payload.bat1.name,
      shortName: shortName(payload.bat1.name),
      initials: initials(payload.bat1.name),
      runs: payload.bat1.runs,
      balls: payload.bat1.balls,
      fours: payload.bat1.fours,
      sixes: payload.bat1.sixes,
      sr: payload.bat1.balls > 0 ? parseFloat(((payload.bat1.runs / payload.bat1.balls) * 100).toFixed(2)) : 0,
      isStriking: payload.striker === '1',
      photoUrl: payload.bat1.photo,
    },
    {
      name: payload.bat2.name,
      shortName: shortName(payload.bat2.name),
      initials: initials(payload.bat2.name),
      runs: payload.bat2.runs,
      balls: payload.bat2.balls,
      fours: payload.bat2.fours,
      sixes: payload.bat2.sixes,
      sr: payload.bat2.balls > 0 ? parseFloat(((payload.bat2.runs / payload.bat2.balls) * 100).toFixed(2)) : 0,
      isStriking: payload.striker === '2',
      photoUrl: payload.bat2.photo,
    },
  ];

  // Current over balls
  const currentOverBalls = parseThisOver(payload.thisOver, String(overs));

  // Partnership
  const partnership: CurrentPartnership = {
    runs: payload.partRuns,
    balls: payload.partBalls,
    bat1Runs: payload.bat1.runs,
    bat2Runs: payload.bat2.runs,
    bat1Name: payload.bat1.name,
    bat2Name: payload.bat2.name,
  };

  // Calculate balls left & required run rate
  const totalBallsBowled = overWhole * 6 + ballDecimal;
  const maxBalls = totOvers * 6;
  const ballsLeft = Math.max(maxBalls - totalBallsBowled, 0);

  let need = 0;
  let rrr = 0;
  if (target > 0) {
    need = Math.max(target - runs, 0);
    rrr = ballsLeft > 0 ? parseFloat(((need / ballsLeft) * 6).toFixed(2)) : 0;
  }

  // Determine if match is live
  const isLive = payload.status !== 'MATCH ENDED' && payload.status !== 'MATCH NOT STARTED';

  // Normalize battingTeam to full team name (admin sends 'STC' or 'GSC')
  const battingTeamFull = battingSide === 'STC'
    ? "St.Thomas' College Matale"
    : battingSide === 'GSC'
      ? 'Govt. Science College Matale'
      : battingSide; // fallback: use as-is

  return {
    currentOver,
    currentBall,
    overDisplay: String(overs),
    score: `${runs}/${wkts}`,
    battingTeam: battingTeamFull,
    target,
    need,
    ballsLeft,
    currentBatsmen,
    currentBowler: payload.bowler.name,
    currentOverBalls,
    partnership,
    isLive,
    crr,
    rrr,
  };
}

/**
 * Transform Admin Panel payload → MatchInfo
 *
 * This creates a basic MatchInfo from what the admin payload provides.
 * Full MatchInfo (toss, umpires, etc.) typically comes from a separate
 * admin setup, but this gives a reasonable default.
 */
export function transformAdminToMatchInfo(payload: AdminPayload): Partial<MatchInfo> {
  const teamMap: Record<string, { name: string; shortName: string; flagEmoji: string; color: string }> = {
    STC: { name: "St.Thomas' College Matale", shortName: 'STC', flagEmoji: '🦁', color: '#FFC300' },
    GSC: { name: 'Govt. Science College Matale', shortName: 'GSC', flagEmoji: '🔬', color: '#E63946' },
  };

  const batting = teamMap[payload.battingSide] || teamMap.STC;
  const bowling = payload.battingSide === 'STC' ? teamMap.GSC : teamMap.STC;

  return {
    id: process.env.NEXT_PUBLIC_MATCH_ID || 'match_001',
    team1: { name: batting.name, shortName: batting.shortName, flagEmoji: batting.flagEmoji, color: batting.color },
    team2: { name: bowling.name, shortName: bowling.shortName, flagEmoji: bowling.flagEmoji, color: bowling.color },
    venue: 'Bernard Aluwihare Ground Matale',
    date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    result: '',
    toss: '',
    playerOfMatch: '',
    umpires: [],
    matchReferee: '',
    matchTitle: 'Battle of the Golds',
    series: '24th Big Match',
  };
}

/**
 * Build momentum data from overRunsHistory
 */
export function transformOverRunsToMomentum(overRunsHistory?: AdminOverRun[]): MomentumPoint[] {
  if (!overRunsHistory || !Array.isArray(overRunsHistory)) return [];

  return overRunsHistory.map((entry, idx) => {
    // Momentum value: positive for runs, negative for wickets, scaled
    let value = entry.runs - 4; // baseline ~4 runs per over is neutral
    if (entry.isWicket) value -= 3;
    return { over: idx + 1, value: parseFloat(value.toFixed(1)) };
  });
}
