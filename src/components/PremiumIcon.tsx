// Premium animated SVG icons to replace emojis
// Usage: <PremiumIcon name="cricket" className="w-4 h-4" />

interface PremiumIconProps {
  name: string;
  className?: string;
  color?: string;
}

export default function PremiumIcon({ name, className = 'w-4 h-4', color }: PremiumIconProps) {
  const c = color || 'currentColor';

  const icons: Record<string, React.ReactNode> = {
    cricket: (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke={c} strokeWidth="1.5">
        {/* Cricket stumps */}
        <line x1="6" y1="4" x2="6" y2="20" strokeWidth="2" strokeLinecap="round" />
        <line x1="12" y1="4" x2="12" y2="20" strokeWidth="2" strokeLinecap="round" />
        <line x1="18" y1="4" x2="18" y2="20" strokeWidth="2" strokeLinecap="round" />
        {/* Bails */}
        <line x1="5" y1="4" x2="7" y2="4" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="11" y1="4" x2="13" y2="4" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="17" y1="4" x2="19" y2="4" strokeWidth="1.5" strokeLinecap="round" />
        {/* Cricket ball hitting stumps */}
        <circle cx="20" cy="16" r="3" fill={c} fillOpacity="0.3" className="icon-pulse" />
        <path d="M18.5 14.5Q20 16.5 21.5 17.5" strokeWidth="0.8" strokeOpacity="0.5" fill="none" />
      </svg>
    ),
    trophy: (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke={c} strokeWidth="1.5">
        <path d="M8 2h8v8a4 4 0 11-8 0V2z" fill={c} fillOpacity="0.15" />
        <path d="M8 2h8v8a4 4 0 11-8 0V2z" />
        <path d="M16 4h2a2 2 0 010 4h-2" />
        <path d="M8 4H6a2 2 0 000 4h2" />
        <path d="M12 14v3" />
        <path d="M8 20h8" strokeWidth="2" strokeLinecap="round" />
        <path d="M9 17h6" />
      </svg>
    ),
    chart: (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke={c} strokeWidth="1.5">
        <path d="M3 20h18" strokeLinecap="round" />
        <path d="M6 16v4" className="icon-bar-animate" />
        <path d="M10 12v8" className="icon-bar-animate" style={{ animationDelay: '0.15s' }} />
        <path d="M14 8v12" className="icon-bar-animate" style={{ animationDelay: '0.3s' }} />
        <path d="M18 4v16" className="icon-bar-animate" style={{ animationDelay: '0.45s' }} />
      </svg>
    ),
    timer: (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke={c} strokeWidth="1.5">
        <circle cx="12" cy="13" r="8" strokeOpacity="0.4" />
        <path d="M12 9v4l2.5 2.5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-tick-animate" />
        <path d="M10 2h4" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 2v2" />
      </svg>
    ),
    clipboard: (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke={c} strokeWidth="1.5">
        <rect x="5" y="4" width="14" height="17" rx="1" fill={c} fillOpacity="0.08" />
        <rect x="5" y="4" width="14" height="17" rx="1" />
        <path d="M9 2h6v3H9z" fill={c} fillOpacity="0.2" />
        <path d="M8 10h8" strokeOpacity="0.4" />
        <path d="M8 14h5" strokeOpacity="0.4" />
      </svg>
    ),
    target: (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke={c} strokeWidth="1.5">
        <circle cx="12" cy="12" r="9" strokeOpacity="0.3" />
        <circle cx="12" cy="12" r="5" strokeOpacity="0.5" />
        <circle cx="12" cy="12" r="1.5" fill={c} fillOpacity="0.6" className="icon-pulse" />
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4" strokeOpacity="0.3" />
      </svg>
    ),
    broadcast: (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke={c} strokeWidth="1.5">
        <circle cx="12" cy="12" r="2" fill={c} fillOpacity="0.6" className="icon-pulse" />
        <path d="M8.5 8.5a5 5 0 000 7" strokeOpacity="0.4" className="icon-wave-animate" />
        <path d="M5.5 5.5a10 10 0 000 13" strokeOpacity="0.25" className="icon-wave-animate" style={{ animationDelay: '0.3s' }} />
        <path d="M15.5 8.5a5 5 0 010 7" strokeOpacity="0.4" className="icon-wave-animate" />
        <path d="M18.5 5.5a10 10 0 010 13" strokeOpacity="0.25" className="icon-wave-animate" style={{ animationDelay: '0.3s' }} />
      </svg>
    ),
    film: (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke={c} strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="1" fill={c} fillOpacity="0.08" />
        <rect x="3" y="3" width="18" height="18" rx="1" />
        <path d="M3 8h18M3 16h18M8 3v18M16 3v18" strokeOpacity="0.3" />
      </svg>
    ),
    bar: (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke={c} strokeWidth="1.5">
        <path d="M4 20h16" strokeLinecap="round" />
        <rect x="5" y="12" width="3" height="8" fill={c} fillOpacity="0.3" rx="0.5" />
        <rect x="10.5" y="6" width="3" height="14" fill={c} fillOpacity="0.5" rx="0.5" />
        <rect x="16" y="9" width="3" height="11" fill={c} fillOpacity="0.4" rx="0.5" />
      </svg>
    ),
    lightning: (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke={c} strokeWidth="1.5">
        <path d="M13 2L4 14h7l-2 8 9-12h-7l2-8z" fill={c} fillOpacity="0.2" />
        <path d="M13 2L4 14h7l-2 8 9-12h-7l2-8z" className="icon-pulse" />
      </svg>
    ),
    chat: (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke={c} strokeWidth="1.5">
        <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" fill={c} fillOpacity="0.1" />
        <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
      </svg>
    ),
    star: (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke={c} strokeWidth="1.5">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={c} fillOpacity="0.15" />
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
    weather: (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke={c} strokeWidth="1.5">
        <circle cx="8" cy="10" r="3" fill={c} fillOpacity="0.2" className="icon-pulse" />
        <path d="M8 4v1M8 15v1M2 10h1M13 10h1M4.2 6.2l.7.7M11.1 6.2l-.7.7M4.2 13.8l.7-.7M11.1 13.8l-.7-.7" strokeOpacity="0.4" />
        <path d="M16 10a4 4 0 10-1.5 7.8A3.5 3.5 0 0018 20a4 4 0 002-7.5" strokeOpacity="0.6" />
      </svg>
    ),
    matches: (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke={c} strokeWidth="1.5">
        {/* Two crossed cricket bats forming a VS / battle shape */}
        <path d="M4 4l7 7M20 4l-7 7" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.6" />
        <path d="M11 11l-5 9M13 11l5 9" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.6" />
        {/* Center clash burst */}
        <circle cx="12" cy="11" r="2.5" fill={c} fillOpacity="0.3" className="icon-pulse" />
        <circle cx="12" cy="11" r="1" fill={c} fillOpacity="0.6" />
      </svg>
    ),
  };

  return <>{icons[name] || icons.star}</>;
}
