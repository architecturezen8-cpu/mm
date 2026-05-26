/**
 * Convert overs string (e.g., "42.3") to total balls
 */
export function oversToBalls(overs: string): number {
  const parts = overs.split('.');
  const fullOvers = parseInt(parts[0], 10);
  const partialBalls = parts[1] ? parseInt(parts[1], 10) : 0;
  return fullOvers * 6 + partialBalls;
}

/**
 * Convert total balls to overs string (e.g., 255 -> "42.3")
 */
export function ballsToOvers(balls: number): string {
  const fullOvers = Math.floor(balls / 6);
  const remaining = balls % 6;
  return `${fullOvers}.${remaining}`;
}

/**
 * Calculate run rate from runs and overs
 */
export function calculateRunRate(runs: number, overs: string): number {
  const balls = oversToBalls(overs);
  if (balls === 0) return 0;
  return (runs / balls) * 6;
}

/**
 * Format a number with commas (e.g., 1245 -> "1,245")
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-IN');
}

/**
 * Calculate required run rate
 */
export function calculateRRR(target: number, currentRuns: number, oversBowled: string, maxOvers: number): number {
  const ballsBowled = oversToBalls(oversBowled);
  const totalBalls = maxOvers * 6;
  const remainingBalls = totalBalls - ballsBowled;
  if (remainingBalls <= 0) return 0;
  const runsNeeded = target - currentRuns;
  if (runsNeeded <= 0) return 0;
  return (runsNeeded / remainingBalls) * 6;
}

/**
 * Get strike rate color class based on value
 */
export function getSRColor(sr: number): string {
  if (sr >= 150) return 'text-emerald-600 font-semibold';
  if (sr < 80) return 'text-red-500 font-semibold';
  return '';
}

/**
 * Get economy rate color class based on value
 */
export function getEconColor(econ: number): string {
  if (econ < 5) return 'text-emerald-600 font-semibold';
  if (econ > 9) return 'text-red-500 font-semibold';
  return '';
}
