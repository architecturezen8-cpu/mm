export interface MatchInfo {
  id: string;
  team1: TeamData;
  team2: TeamData;
  venue: string;
  date: string;
  result: string;
  toss: string;
  playerOfMatch: string;
  umpires: string[];
  matchReferee: string;
  matchTitle: string;
  series: string;
}

export interface TeamData {
  name: string;
  shortName: string;
  flagEmoji: string;
  color: string;
}

export interface InningsData {
  battingTeam: string;
  bowlingTeam: string;
  totalRuns: number;
  totalWkts: number;
  totalOvers: string;
  maxOvers: number;
  extras: {
    total: number;
    wides: number;
    noBalls: number;
    byes: number;
    legByes: number;
    penalty: number;
  };
  batting: BatsmanInnings[];
  bowling: BowlerInnings[];
  fallOfWickets: FallOfWicket[];
  overByOver: OverData[];
  partnerships: PartnershipData[];
}

export interface BatsmanInnings {
  name: string;
  shortName: string;
  initials: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  sr: number;
  dismissal: string;
  isOut: boolean;
  photoUrl?: string;
}

export interface BowlerInnings {
  name: string;
  overs: string;
  maidens: number;
  runs: number;
  wickets: number;
  econ: number;
  dots: number;
  dotPercent: number;
  fours: number;
  sixes: number;
}

export interface FallOfWicket {
  score: number;
  wkt: number;
  overs: string;
  batsman: string;
}

export interface OverData {
  over: number;
  runs: number;
  isWicket: boolean;
  cumulative: number;
  crr: number;
  keyBatter: string;
  balls: BallData[];
}

export interface BallData {
  over: string;
  outcome: '0' | '1' | '2' | '3' | '4' | '6' | 'W' | 'Wd' | 'Nb';
  description: string;
}

export interface PartnershipData {
  bat1: string;
  bat2: string;
  runs: number;
  balls: number;
  bat1Runs: number;
  bat2Runs: number;
}

export interface LiveState {
  currentOver: number;
  currentBall: number;
  overDisplay: string;
  score: string;
  battingTeam: string;
  target: number;
  need: number;
  ballsLeft: number;
  currentBatsmen: CurrentBatsman[];
  currentBowler: string;
  currentOverBalls: BallData[];
  partnership: CurrentPartnership;
  isLive: boolean;
  isOffline?: boolean;
  crr: number;
  rrr: number;
}

export interface CurrentBatsman {
  name: string;
  shortName: string;
  initials: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  sr: number;
  isStriking: boolean;
  photoUrl?: string;
}

export interface CurrentPartnership {
  runs: number;
  balls: number;
  bat1Runs: number;
  bat2Runs: number;
  bat1Name: string;
  bat2Name: string;
}

export interface CommunityData {
  votes: { [teamShortName: string]: number };
  totalVotes: number;
  // Extended poll data (crowd choice)
  whoWillWin?: { [optionKey: string]: number };
  firstInningsScore?: { [optionKey: string]: number };
  mostSixes?: { [optionKey: string]: number };
  totalWickets?: { [optionKey: string]: number };
  secondInningsScore?: { [optionKey: string]: number };
  totalWickets2ndInnings?: { [optionKey: string]: number };
  topScorer?: { [playerName: string]: number };
  topWicketTaker?: { [playerName: string]: number };
  playerOfMatch?: { [playerName: string]: number };
}

export interface MomentumPoint {
  over: number;
  value: number;
}

export type PageName = 'home' | 'live' | 'playingxi' | 'videos' | 'gallery' | 'about' | 'community';

export type LiveSubTab = 'live' | 'scorecard' | 'analytics' | 'community';
export type AboutSubTab = 'about' | 'history' | 'h2h' | 'weather';
export type CommunitySubTab = 'predict' | 'vote' | 'legacy';

// Actual match results — admin editable, shown below Crowd Choice
export interface ActualResults {
  topScorer: string;
  topScorerRuns: string; // e.g. "85 (62)"
  topWicketTaker: string;
  topWicketTakerFigures: string; // e.g. "3/24 (8)"
  playerOfMatch: string;
  playerOfMatchDetail: string; // e.g. "85 runs & 2 wickets"
  matchResult: string; // e.g. "St.Thomas' College won by 5 wickets"
  isPublished: boolean; // Admin controls visibility
}

// Legacy tab name kept for backwards compatibility with existing tab components
export type TabName = 'home' | 'live' | 'scorecard' | 'analytics' | 'playingxi' | 'videos' | 'gallery' | 'history' | 'h2h' | 'predictions' | 'weather' | 'community';
