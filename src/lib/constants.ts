import { MatchInfo, LiveState, CommunityData, MomentumPoint } from './types';

/** Empty match info fallback (no demo data) */
export const EMPTY_MATCH_INFO: MatchInfo = {
  id: '',
  team1: { name: '', shortName: '', flagEmoji: '', color: '' },
  team2: { name: '', shortName: '', flagEmoji: '', color: '' },
  venue: '',
  date: '',
  result: '',
  toss: '',
  playerOfMatch: '',
  umpires: [],
  matchReferee: '',
  matchTitle: '',
  series: '',
};

/** Empty live state fallback (no demo data) */
export const EMPTY_LIVE_STATE: LiveState = {
  currentOver: 0,
  currentBall: 0,
  overDisplay: '0.0',
  score: '0/0',
  battingTeam: '',
  target: 0,
  need: 0,
  ballsLeft: 0,
  currentBatsmen: [],
  currentBowler: '',
  currentOverBalls: [],
  partnership: { runs: 0, balls: 0, bat1Runs: 0, bat2Runs: 0, bat1Name: '', bat2Name: '' },
  isLive: false,
  crr: 0,
  rrr: 0,
};

/** Map player names to GitHub CDN photo URLs (jsDelivr) — this is REAL data, not demo */
export const PLAYER_CDN_PHOTOS: Record<string, string> = {
  // St.Thomas' College
  'Dilith Perera': 'https://cdn.jsdelivr.net/gh/architecturezen8-cpu/cricket-images/players/dilith-perera.png',
  'Kavinda Silva': 'https://cdn.jsdelivr.net/gh/architecturezen8-cpu/cricket-images/players/kavinda-silva.png',
  'Ranithu Fernando': 'https://cdn.jsdelivr.net/gh/architecturezen8-cpu/cricket-images/players/ranithu-fernando.png',
  'Senal Jayawardena': 'https://cdn.jsdelivr.net/gh/architecturezen8-cpu/cricket-images/players/senal-jayawardena.png',
  'Thenuka Wickramasinghe': 'https://cdn.jsdelivr.net/gh/architecturezen8-cpu/cricket-images/players/thenuka-wickramasinghe.png',
  'Vidunu Dissanayake': 'https://cdn.jsdelivr.net/gh/architecturezen8-cpu/cricket-images/players/vidunu-dissanayake.png',
  'Mahima Ratnayake': 'https://cdn.jsdelivr.net/gh/architecturezen8-cpu/cricket-images/players/mahima-ratnayake.png',
  'Dulanjana Wijeratne': 'https://cdn.jsdelivr.net/gh/architecturezen8-cpu/cricket-images/players/dulanjana-wijeratne.png',
  'Kisal Alahakoon': 'https://cdn.jsdelivr.net/gh/architecturezen8-cpu/cricket-images/players/kisal-alahakoon.png',
  'Nethma Herath': 'https://cdn.jsdelivr.net/gh/architecturezen8-cpu/cricket-images/players/nethma-herath.png',
  'Sahan Bandaranayake': 'https://cdn.jsdelivr.net/gh/architecturezen8-cpu/cricket-images/players/sahan-bandaranayake.png',
  // Govt. Science College
  'Yasiru Rodrigo': 'https://cdn.jsdelivr.net/gh/architecturezen8-cpu/cricket-images/players/yasiru-rodrigo.png',
  'Hiruna Goonewardene': 'https://cdn.jsdelivr.net/gh/architecturezen8-cpu/cricket-images/players/hiruna-goonewardene.png',
  'Daham Dharmaratne': 'https://cdn.jsdelivr.net/gh/architecturezen8-cpu/cricket-images/players/daham-dharmaratne.png',
  'Tharindu Wickramanayake': 'https://cdn.jsdelivr.net/gh/architecturezen8-cpu/cricket-images/players/tharindu-wickramanayake.png',
  'Lakshitha Weerasinghe': 'https://cdn.jsdelivr.net/gh/architecturezen8-cpu/cricket-images/players/lakshitha-weerasinghe.png',
  'Ramitha Silva': 'https://cdn.jsdelivr.net/gh/architecturezen8-cpu/cricket-images/players/ramitha-silva.png',
  'Seniru Pasqual': 'https://cdn.jsdelivr.net/gh/architecturezen8-cpu/cricket-images/players/seniru-pasqual.png',
  'Ashen Bandara': 'https://cdn.jsdelivr.net/gh/architecturezen8-cpu/cricket-images/players/ashen-bandara.png',
  'Chamindu Asal': 'https://cdn.jsdelivr.net/gh/architecturezen8-cpu/cricket-images/players/chamindu-asal.png',
  'Malith Rathnayake': 'https://cdn.jsdelivr.net/gh/architecturezen8-cpu/cricket-images/players/malith-rathnayake.png',
  'Tharana Walpita': 'https://cdn.jsdelivr.net/gh/architecturezen8-cpu/cricket-images/players/tharana-walpita.png',
};

/** Empty community data (no demo data) */
export const EMPTY_COMMUNITY: CommunityData = {
  whoWillWin: { STC: 0, GSC: 0, Draw: 0 },
  firstInningsScore: { under100: 0, '100-150': 0, '150-200': 0, '200+': 0 },
  mostSixes: { STC: 0, GSC: 0, Equal: 0 },
  totalWickets: { under5: 0, '5-7': 0, '8-9': 0, '10': 0 },
  secondInningsScore: { under100: 0, '100-150': 0, '150-200': 0, '200+': 0 },
  totalWickets2ndInnings: { under5: 0, '5-7': 0, '8-9': 0, '10': 0 },
  topScorer: {},
  topWicketTaker: {},
  playerOfMatch: {},
  totalVotes: 0,
};

/** Empty momentum data (no demo data) */
export const EMPTY_MOMENTUM: MomentumPoint[] = [];
