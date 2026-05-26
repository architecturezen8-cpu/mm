'use client';

// Theme-matching SVG icons for cricket — replaces emojis
// Uses the gold/amber color scheme to match the dark luxury theme

interface IconProps {
  className?: string;
  size?: number;
}

/* ── Coin/Toss Icon ── */
export function CoinIcon({ className = '', size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="0.75" strokeDasharray="2 1.5" />
      <text x="12" y="16" textAnchor="middle" fill="currentColor" fontSize="10" fontWeight="bold">₵</text>
    </svg>
  );
}

/* ── Stadium/Venue Icon ── */
export function StadiumIcon({ className = '', size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M4 18h16M4 18V10c0-1 4-5 8-5s8 4 8 5v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 18h20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 18v-4a4 4 0 018 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 9v2M9 10v1M15 10v1" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

/* ── Cricket/Bat Icon ── */
export function CricketIcon({ className = '', size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M14.5 3.5L4 14l2 4 4 2 10.5-10.5-6-6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 14l-2 2 2 2 2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="19" cy="5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

/* ── Live/Broadcast Icon ── */
export function LiveIcon({ className = '', size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="3" fill="currentColor" />
      <path d="M6.5 6.5a7.5 7.5 0 010 11M17.5 6.5a7.5 7.5 0 000 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M3.5 3.5a12 12 0 000 17M20.5 3.5a12 12 0 010 17" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

/* ── Trophy Icon ── */
export function TrophyIcon({ className = '', size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 4h10v6a5 5 0 01-10 0V4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M7 4H4v2a3 3 0 003 3M17 4h3v2a3 3 0 01-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Star/Player of Match Icon ── */
export function StarIcon({ className = '', size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.15" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Swords/Versus Icon ── */
export function SwordsIcon({ className = '', size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M14.5 3.5L5 13l2 4 4 2 9.5-9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 3.5L19 13l-2 4-4 2L3.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
