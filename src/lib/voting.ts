// Poll configuration — defines all available polls and their options
export const POLL_CONFIG = {
  whoWillWin: {
    label: 'Who will win?',
    icon: '🏆',
    options: {
      STC: { label: "St.Thomas' College", color: '#FFC300' },
      GSC: { label: 'Govt. Science College', color: '#E63946' },
      Draw: { label: 'Draw', color: '#6B7280' },
    },
  },
  firstInningsScore: {
    label: '1st Innings Score?',
    icon: '📊',
    options: {
      under100: { label: 'Under 100', color: '#6B7280' },
      '100-150': { label: '100 – 150', color: '#FFC300' },
      '150-200': { label: '150 – 200', color: '#FF8C00' },
      '200+': { label: '200+', color: '#E63946' },
    },
  },
  mostSixes: {
    label: 'Most Sixes?',
    icon: 'six',
    options: {
      STC: { label: "St.Thomas' College", color: '#FFC300' },
      GSC: { label: 'Govt. Science College', color: '#E63946' },
      Equal: { label: 'Equal', color: '#6B7280' },
    },
  },
  totalWickets: {
    label: 'Total Wickets 1st Innings?',
    icon: '🎯',
    options: {
      under5: { label: 'Under 5', color: '#6B7280' },
      '5-7': { label: '5 – 7', color: '#FFC300' },
      '8-9': { label: '8 – 9', color: '#FF8C00' },
      '10': { label: 'All Out', color: '#E63946' },
    },
  },
  secondInningsScore: {
    label: '2nd Innings Score?',
    icon: '📊',
    options: {
      under100: { label: 'Under 100', color: '#6B7280' },
      '100-150': { label: '100 – 150', color: '#FFC300' },
      '150-200': { label: '150 – 200', color: '#FF8C00' },
      '200+': { label: '200+', color: '#E63946' },
    },
  },
  totalWickets2ndInnings: {
    label: 'Total Wickets 2nd Innings?',
    icon: '🎯',
    options: {
      under5: { label: 'Under 5', color: '#6B7280' },
      '5-7': { label: '5 – 7', color: '#FFC300' },
      '8-9': { label: '8 – 9', color: '#FF8C00' },
      '10': { label: 'All Out', color: '#E63946' },
    },
  },
} as const;

export type PollKey = keyof typeof POLL_CONFIG;
export type OptionKey = string;

// Prediction polls — freeform (player name as key, not predefined options)
export const PREDICTION_POLL_KEYS = new Set([
  'topScorer',
  'topWicketTaker',
  'playerOfMatch',
]);

export function isPredictionPoll(key: string): boolean {
  return PREDICTION_POLL_KEYS.has(key);
}

// Default empty community data for all polls
export const DEFAULT_COMMUNITY = {
  whoWillWin: { STC: 0, GSC: 0, Draw: 0 },
  firstInningsScore: { under100: 0, '100-150': 0, '150-200': 0, '200+': 0 },
  mostSixes: { STC: 0, GSC: 0, Equal: 0 },
  totalWickets: { under5: 0, '5-7': 0, '8-9': 0, '10': 0 },
  secondInningsScore: { under100: 0, '100-150': 0, '150-200': 0, '200+': 0 },
  totalWickets2ndInnings: { under5: 0, '5-7': 0, '8-9': 0, '10': 0 },
  topScorer: {} as Record<string, number>,
  topWicketTaker: {} as Record<string, number>,
  playerOfMatch: {} as Record<string, number>,
  totalVotes: 0,
};

// Fingerprint generator (client-side only)
// Uses multiple signals for better uniqueness while staying privacy-friendly:
// - Canvas rendering (GPU-specific)
// - Screen dimensions + pixel ratio
// - Timezone + language
// - Available fonts (via font detection)
// - Random component persisted in localStorage (survives refresh)
export function getFingerprint(): string {
  if (typeof window === 'undefined') return '';

  // Check if we already have a persisted random component
  let persistedRandom = '';
  try {
    persistedRandom = localStorage.getItem('botg_fp_salt') || '';
    if (!persistedRandom) {
      // Generate a random salt on first visit — persists across sessions
      persistedRandom = Math.random().toString(36).slice(2, 10);
      localStorage.setItem('botg_fp_salt', persistedRandom);
    }
  } catch {}

  // Canvas fingerprint
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  let canvasHash = '';
  try {
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('fingerprint', 2, 2);
      canvasHash = canvas.toDataURL().slice(-50);
    }
  } catch {}

  // Font detection — check for specific fonts that indicate OS
  let fontSignal = '';
  try {
    const testFonts = ['Georgia', 'Palatino', 'Book Antiqua', 'Times New Roman', 'Courier New'];
    const span = document.createElement('span');
    span.style.position = 'absolute';
    span.style.left = '-9999px';
    span.style.fontSize = '72px';
    span.textContent = 'mmmmmmmmmmlli';
    document.body.appendChild(span);
    const defaultWidth = span.offsetWidth;
    for (const font of testFonts) {
      span.style.fontFamily = `'${font}', monospace`;
      if (span.offsetWidth !== defaultWidth) {
        fontSignal += font[0];
      }
    }
    document.body.removeChild(span);
  } catch {}

  const raw = [
    navigator.userAgent,
    `${screen.width}x${screen.height}`,
    String(window.devicePixelRatio || 1),
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.language,
    canvasHash,
    fontSignal,
    persistedRandom, // Random salt persisted in localStorage
  ].join('|');

  // FNV-1a hash (better distribution than djb2)
  let h = 0x811c9dc5;
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return Math.abs(h).toString(36);
}

// Get which polls the user has already voted on (from localStorage)
export function getVotedPolls(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const data = localStorage.getItem('botg_voted_polls');
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

// Save that user voted on a poll
export function saveVotedPoll(pollKey: string, optionKey: string): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getVotedPolls();
    current[pollKey] = optionKey;
    localStorage.setItem('botg_voted_polls', JSON.stringify(current));
  } catch {}
}

// Check if user has voted on a specific poll
export function hasVoted(pollKey: string): boolean {
  return !!getVotedPolls()[pollKey];
}

// Default actual match results (admin editable)
export const DEFAULT_ACTUAL_RESULTS = {
  topScorer: '',
  topScorerRuns: '',
  topWicketTaker: '',
  topWicketTakerFigures: '',
  playerOfMatch: '',
  playerOfMatchDetail: '',
  matchResult: '',
  isPublished: false,
};
