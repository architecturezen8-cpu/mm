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
  matchTitle: string;
}

export interface TeamData {
  name: string;
  shortName: string;
  flagEmoji: string;
  logoUrl?: string;
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
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  sr: number;
  dismissal: string;
  isOut: boolean;
}

export interface BowlerInnings {
  name: string;
  overs: string;
  maidens: number;
  runs: number;
  wickets: number;
  econ: number;
  dots: number;
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
}

export interface PartnershipData {
  bat1: string;
  bat2: string;
  runs: number;
  balls: number;
}

export type TabName = 'summary' | 'scorecard' | 'analytics' | 'timeline';
