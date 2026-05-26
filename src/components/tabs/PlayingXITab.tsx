'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import EditableSection from '@/components/admin/EditableSection';
import { useSectionContent, getContentString, getContentArray } from '@/lib/useSectionContent';
import DynamicSections from '@/components/admin/DynamicSections';

type PlayerRole = 'batsman' | 'bowler' | 'all-rounder' | 'wicketkeeper';

interface PlayerData {
  name: string;
  school: string;
  jerseyNumber: number;
  role: PlayerRole;
  designation?: string;
  photoUrl: string;
}

// ─── St.Thomas' College Matale (Gold) ───
const STHOMAS_PLAYERS: PlayerData[] = [
  { name: 'Dilith Perera', school: "St.Thomas' College Matale", jerseyNumber: 1, role: 'batsman', designation: 'captain', photoUrl: '/players/thomian-batsman.png' },
  { name: 'Kavinda Silva', school: "St.Thomas' College Matale", jerseyNumber: 2, role: 'batsman', photoUrl: '/players/thomian-batsman.png' },
  { name: 'Ranithu Fernando', school: "St.Thomas' College Matale", jerseyNumber: 3, role: 'batsman', photoUrl: '/players/thomian-batsman.png' },
  { name: 'Senal Jayawardena', school: "St.Thomas' College Matale", jerseyNumber: 4, role: 'batsman', photoUrl: '/players/thomian-allrounder.png' },
  { name: 'Thenuka Wickramasinghe', school: "St.Thomas' College Matale", jerseyNumber: 5, role: 'all-rounder', photoUrl: '/players/thomian-allrounder.png' },
  { name: 'Vidunu Dissanayake', school: "St.Thomas' College Matale", jerseyNumber: 6, role: 'all-rounder', photoUrl: '/players/thomian-allrounder.png' },
  { name: 'Mahima Ratnayake', school: "St.Thomas' College Matale", jerseyNumber: 7, role: 'wicketkeeper', photoUrl: '/players/thomian-batsman.png' },
  { name: 'Dulanjana Wijeratne', school: "St.Thomas' College Matale", jerseyNumber: 8, role: 'bowler', photoUrl: '/players/thomian-allrounder.png' },
  { name: 'Kisal Alahakoon', school: "St.Thomas' College Matale", jerseyNumber: 9, role: 'bowler', photoUrl: '/players/thomian-allrounder.png' },
  { name: 'Nethma Herath', school: "St.Thomas' College Matale", jerseyNumber: 10, role: 'bowler', photoUrl: '/players/thomian-allrounder.png' },
  { name: 'Sahan Bandaranayake', school: "St.Thomas' College Matale", jerseyNumber: 11, role: 'bowler', photoUrl: '/players/thomian-allrounder.png' },
];

// ─── Govt.Science College Matale (Blue) ───
const SCIENCE_PLAYERS: PlayerData[] = [
  { name: 'Yasiru Rodrigo', school: 'Govt.Science College Matale', jerseyNumber: 1, role: 'batsman', designation: 'captain', photoUrl: '/players/science-batsman.png' },
  { name: 'Hiruna Goonewardene', school: 'Govt.Science College Matale', jerseyNumber: 2, role: 'batsman', photoUrl: '/players/science-batsman.png' },
  { name: 'Daham Dharmaratne', school: 'Govt.Science College Matale', jerseyNumber: 3, role: 'batsman', photoUrl: '/players/science-batsman.png' },
  { name: 'Tharindu Wickramanayake', school: 'Govt.Science College Matale', jerseyNumber: 4, role: 'batsman', photoUrl: '/players/science-bowler.png' },
  { name: 'Lakshitha Weerasinghe', school: 'Govt.Science College Matale', jerseyNumber: 5, role: 'all-rounder', photoUrl: '/players/science-bowler.png' },
  { name: 'Ramitha Silva', school: 'Govt.Science College Matale', jerseyNumber: 6, role: 'all-rounder', photoUrl: '/players/science-bowler.png' },
  { name: 'Seniru Pasqual', school: 'Govt.Science College Matale', jerseyNumber: 7, role: 'wicketkeeper', photoUrl: '/players/science-batsman.png' },
  { name: 'Ashen Bandara', school: 'Govt.Science College Matale', jerseyNumber: 8, role: 'bowler', photoUrl: '/players/science-bowler.png' },
  { name: 'Chamindu Asal', school: 'Govt.Science College Matale', jerseyNumber: 9, role: 'bowler', photoUrl: '/players/science-bowler.png' },
  { name: 'Malith Rathnayake', school: 'Govt.Science College Matale', jerseyNumber: 10, role: 'bowler', photoUrl: '/players/science-bowler.png' },
  { name: 'Tharana Walpita', school: 'Govt.Science College Matale', jerseyNumber: 11, role: 'bowler', photoUrl: '/players/science-bowler.png' },
];

// ─── Content-format player items for InlineEditPanel ───
interface ContentPlayerItem {
  name: string;
  role: string;
  photo: string;
  school: string;
  jerseyNumber: string;
  designation?: string;
}

const DEFAULT_STC_PLAYER_ITEMS: ContentPlayerItem[] = STHOMAS_PLAYERS.map(p => ({
  name: p.name,
  role: p.role,
  photo: p.photoUrl,
  school: p.school,
  jerseyNumber: String(p.jerseyNumber),
  designation: p.designation,
}));

const DEFAULT_SCIENCE_PLAYER_ITEMS: ContentPlayerItem[] = SCIENCE_PLAYERS.map(p => ({
  name: p.name,
  role: p.role,
  photo: p.photoUrl,
  school: p.school,
  jerseyNumber: String(p.jerseyNumber),
  designation: p.designation,
}));

const DEFAULT_STC_CONTENT = {
  heading: "St.Thomas' College Matale",
  team: 'st_thomas',
  show_count: 11,
  team_logo: '/logos/st-thomas-college-matale.jpg',
  team_subtitle: 'Playing XI',
  player_items: DEFAULT_STC_PLAYER_ITEMS,
};

const DEFAULT_SCIENCE_CONTENT = {
  heading: 'Govt.Science College Matale',
  team: 'govt_science',
  show_count: 11,
  team_logo: '/logos/govt-science-college-matale.jpg',
  team_subtitle: 'Playing XI',
  player_items: DEFAULT_SCIENCE_PLAYER_ITEMS,
};

/** Convert a content player item back to PlayerData for PlayerCard */
function contentItemToPlayer(item: ContentPlayerItem): PlayerData {
  return {
    name: item.name,
    role: item.role as PlayerRole,
    photoUrl: item.photo,
    school: item.school,
    jerseyNumber: parseInt(item.jerseyNumber, 10) || 0,
    designation: item.designation || '',
  };
}

const roleLabels: Record<PlayerRole, string> = {
  batsman: 'Batsman',
  bowler: 'Bowler',
  'all-rounder': 'All-Rounder',
  wicketkeeper: 'Wicketkeeper',
};

type PlayerDesignation = 'captain' | 'vice-captain' | 'coach' | 'master-in-charge';

const designationLabels: Record<PlayerDesignation, string> = {
  'captain': 'Captain',
  'vice-captain': 'Vice Captain',
  'coach': 'Coach',
  'master-in-charge': 'Master-in-Charge',
};

const designationIcons: Record<PlayerDesignation, React.ReactNode> = {
  'captain': (
    <svg viewBox="0 0 16 16" className="w-2.5 h-2.5" fill="currentColor">
      <path d="M8 1l2 4 4.5.7-3.2 3.2.7 4.5L8 11.3 3.9 13.4l.7-4.5L1.4 5.7 6 5z" />
    </svg>
  ),
  'vice-captain': (
    <svg viewBox="0 0 16 16" className="w-2.5 h-2.5" fill="currentColor">
      <path d="M8 1l2 4 4.5.7-3.2 3.2.7 4.5L8 11.3 3.9 13.4l.7-4.5L1.4 5.7 6 5z" />
    </svg>
  ),
  'coach': (
    <svg viewBox="0 0 24 24" className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2a5 5 0 015 5v3a5 5 0 01-10 0V7a5 5 0 015-5z" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <path d="M12 18v4M8 22h8" />
    </svg>
  ),
  'master-in-charge': (
    <svg viewBox="0 0 24 24" className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  ),
};

const roleSVGIcon: Record<PlayerRole, React.ReactNode> = {
  batsman: (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" strokeOpacity="0.3" />
      <path d="M15.5 4L9 12l3 2 1.5 6L17 12l-3-2L15.5 4z" fill="currentColor" fillOpacity="0.6" />
    </svg>
  ),
  bowler: (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
      <path d="M12 6v6l4 2" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="12" r="2" fill="currentColor" fillOpacity="0.5" />
    </svg>
  ),
  'all-rounder': (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeOpacity="0.5" fill="currentColor" fillOpacity="0.3" />
    </svg>
  ),
  wicketkeeper: (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="8" y="3" width="8" height="18" rx="1" strokeOpacity="0.5" />
      <line x1="8" y1="7" x2="16" y2="7" strokeOpacity="0.3" />
      <line x1="8" y1="11" x2="16" y2="11" strokeOpacity="0.3" />
      <line x1="8" y1="15" x2="16" y2="15" strokeOpacity="0.3" />
      <path d="M6 21h12" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.5" />
    </svg>
  ),
};

// ─── Player Card Component ───
function PlayerCard({
  player,
  teamColor,
  teamAccent,
  isHighlighted,
  animationDelay,
}: {
  player: PlayerData;
  teamColor: string;
  teamAccent: string;
  isHighlighted: boolean;
  animationDelay: number;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: animationDelay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`player-card-portrait ${isHighlighted ? 'player-card-highlighted' : ''}`}
      style={{
        '--team-color': teamColor,
        '--team-accent': teamAccent,
      } as React.CSSProperties}
    >
      {/* Photo Background */}
      <div className="player-card-photo-wrap">
        {!imgError ? (
          <img
            src={player.photoUrl}
            alt={player.name}
            className={`player-card-photo ${imageLoaded ? 'loaded' : ''} ${isHighlighted ? 'photo-zoomed' : ''}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="player-card-photo-fallback" style={{ background: `linear-gradient(135deg, ${teamColor}40, ${teamAccent}20, #08080c)` }}>
            <span className="player-card-initials">
              {player.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
        )}
        {/* Shimmer overlay while loading */}
        {!imageLoaded && !imgError && <div className="player-card-shimmer" />}
      </div>

      {/* Dark gradient overlay at bottom */}
      <div className="player-card-gradient" />

      {/* Team color accent line at top */}
      <div className="player-card-accent-line" style={{ background: teamColor }} />

      {/* Designation badge */}
      {player.designation && designationLabels[player.designation as PlayerDesignation] && (
        <div className="player-card-captain-badge" style={{ background: `${teamColor}20`, borderColor: `${teamColor}40`, color: teamColor }}>
          {designationIcons[player.designation as PlayerDesignation]}
          <span>{designationLabels[player.designation as PlayerDesignation].toUpperCase()}</span>
        </div>
      )}

      {/* Jersey number - top right */}
      <div className="player-card-jersey-top" style={{ color: teamColor }}>
        {player.jerseyNumber}
      </div>

      {/* Bottom info overlay */}
      <div className="player-card-info">
        <div className="player-card-role-row" style={{ color: teamColor }}>
          {roleSVGIcon[player.role]}
          <span>{roleLabels[player.role]}</span>
        </div>
        <h3 className="player-card-name">{player.name}</h3>
        <p className="player-card-school">{player.school}</p>
        <div className="player-card-jersey-badge" style={{ borderColor: teamColor + '40', color: teamColor }}>
          #{player.jerseyNumber}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Team Header Component ───
function TeamHeader({
  logoSrc,
  schoolName,
  subtitle,
  color,
  teamId,
}: {
  logoSrc: string;
  schoolName: string;
  subtitle: string;
  color: string;
  teamId: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="team-header-section"
    >
      {/* School logo with aurora ring */}
      <div className="team-header-logo relative">
        {/* Aurora ring — outer */}
        <div className={`xi-aurora-ring xi-aurora-ring-outer-${teamId}`} />
        {/* Aurora ring — inner */}
        <div className={`xi-aurora-ring xi-aurora-ring-inner-${teamId}`} />
        <div className="w-16 h-16 sm:w-20 sm:h-20 relative z-10">
          <Image
            src={logoSrc}
            alt={schoolName}
            fill
            sizes="(max-width: 640px) 64px, 80px"
            className="object-contain"
          />
        </div>
      </div>
      <motion.h2
        initial={{ opacity: 0, letterSpacing: '8px' }}
        animate={{ opacity: 1, letterSpacing: '4px' }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="team-header-name"
        style={{ color }}
      >
        {schoolName}
      </motion.h2>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: 60 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="team-header-divider"
        style={{ background: `linear-gradient(90deg, transparent, ${color}40, transparent)` }}
      />
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="team-header-subtitle"
      >
        {subtitle}
      </motion.p>

      {/* Aurora ring CSS — unique per team to avoid @property / @keyframes collisions */}
      <style>{`
        @property --xi-aurora-angle-${teamId} {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes xi-aurora-rotate-${teamId} {
          0% { --xi-aurora-angle-${teamId}: 0deg; }
          100% { --xi-aurora-angle-${teamId}: 360deg; }
        }
        .xi-aurora-ring {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }
        .xi-aurora-ring-outer-${teamId} {
          inset: -10px;
          background: conic-gradient(
            from var(--xi-aurora-angle-${teamId}),
            transparent 0%,
            ${color}50 8%,
            transparent 18%,
            ${color}30 30%,
            transparent 45%,
            ${color}45 55%,
            transparent 68%,
            ${color}25 82%,
            transparent 100%
          );
          -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px));
          mask: radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px));
          animation: xi-aurora-rotate-${teamId} 5s linear infinite;
        }
        .xi-aurora-ring-inner-${teamId} {
          inset: -5px;
          background: conic-gradient(
            from var(--xi-aurora-angle-${teamId}),
            transparent 0%,
            ${color}35 12%,
            transparent 28%,
            ${color}20 48%,
            transparent 62%,
            ${color}30 78%,
            transparent 100%
          );
          -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 1px), #000 calc(100% - 1px));
          mask: radial-gradient(farthest-side, transparent calc(100% - 1px), #000 calc(100% - 1px));
          animation: xi-aurora-rotate-${teamId} 7s linear infinite reverse;
        }
      `}</style>
    </motion.div>
  );
}

// ─── Main Playing XI Tab ───
export default function PlayingXITab() {
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Merge default content with saved admin edits
  const stcContent = useSectionContent('xi-sthomas', DEFAULT_STC_CONTENT);
  const scienceContent = useSectionContent('xi-science', DEFAULT_SCIENCE_CONTENT);

  // Extract player arrays from merged content
  const stcPlayerItems = getContentArray<ContentPlayerItem>(stcContent, 'player_items', DEFAULT_STC_PLAYER_ITEMS);
  const sciencePlayerItems = getContentArray<ContentPlayerItem>(scienceContent, 'player_items', DEFAULT_SCIENCE_PLAYER_ITEMS);

  // Convert content player items to PlayerData for PlayerCard
  const stcPlayers: PlayerData[] = stcPlayerItems.map(contentItemToPlayer);
  const sciencePlayers: PlayerData[] = sciencePlayerItems.map(contentItemToPlayer);

  // Extract header data from merged content
  const stcHeading = getContentString(stcContent, 'heading', "St.Thomas' College Matale");
  const stcLogo = getContentString(stcContent, 'team_logo', '/logos/st-thomas-college-matale.jpg');
  const stcSubtitle = getContentString(stcContent, 'team_subtitle', 'Playing XI');

  const scienceHeading = getContentString(scienceContent, 'heading', 'Govt.Science College Matale');
  const scienceLogo = getContentString(scienceContent, 'team_logo', '/logos/govt-science-college-matale.jpg');
  const scienceSubtitle = getContentString(scienceContent, 'team_subtitle', 'Playing XI');

  const allCards = [
    ...stcPlayers.map((p, i) => ({ player: p, team: 'sthomas' as const, localIndex: i })),
    ...sciencePlayers.map((p, i) => ({ player: p, team: 'science' as const, localIndex: i })),
  ];

  // Sequential highlight animation: 3s per card, all cards
  const startAnimation = useCallback(() => {
    setHighlightIndex(0);
    let current = 0;
    intervalRef.current = setInterval(() => {
      current++;
      if (current >= allCards.length) {
        current = 0;
      }
      setHighlightIndex(current);
    }, 3000);
  }, [allCards.length]);

  useEffect(() => {
    startAnimation();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [startAnimation]);

  const team1Cards = allCards.filter(c => c.team === 'sthomas');
  const team2Cards = allCards.filter(c => c.team === 'science');

  // St.Thomas' = Gold (#FFC300), Govt.Science = Red (#E63946)
  const ST_COLOR = '#FFC300';
  const ST_ACCENT = '#997500';
  const SC_COLOR = '#E63946';
  const SC_ACCENT = '#7B1A2A';

  return (
    <div className="space-y-10">
      {/* Team 1 - St.Thomas' College Matale — Premium Gold Round Border */}
      <EditableSection sectionId="xi-sthomas" pageId="playing-xi" type="players" title="St.Thomas' Squad" content={stcContent}>
        <div>
          <TeamHeader
            logoSrc={stcLogo}
            schoolName={stcHeading}
            subtitle={stcSubtitle}
            color={ST_COLOR}
            teamId="stc"
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {team1Cards.map((card, i) => (
              <PlayerCard
                key={`${card.player.name}-${i}`}
                player={card.player}
                teamColor={ST_COLOR}
                teamAccent={ST_ACCENT}
                isHighlighted={highlightIndex === i}
                animationDelay={i * 0.08}
              />
            ))}
          </div>
        </div>
      </EditableSection>

      {/* Divider */}
      <div className="flex items-center gap-4 py-2">
        <div className="flex-1 h-px bg-lux-border" />
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rotate-45" style={{ background: ST_COLOR }} />
          <span className="text-text-muted text-xs font-bold tracking-[4px]">VS</span>
          <div className="w-2.5 h-2.5 rotate-45" style={{ background: SC_COLOR }} />
        </div>
        <div className="flex-1 h-px bg-lux-border" />
      </div>

      {/* Team 2 - Govt.Science College Matale — Premium Logo */}
      <EditableSection sectionId="xi-science" pageId="playing-xi" type="players" title="Govt.Science Squad" content={scienceContent}>
        <div>
          <TeamHeader
            logoSrc={scienceLogo}
            schoolName={scienceHeading}
            subtitle={scienceSubtitle}
            color={SC_COLOR}
            teamId="gsc"
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {team2Cards.map((card, i) => (
              <PlayerCard
                key={`${card.player.name}-${i}`}
                player={card.player}
                teamColor={SC_COLOR}
                teamAccent={SC_ACCENT}
                isHighlighted={highlightIndex === team1Cards.length + i}
                animationDelay={(team1Cards.length + i) * 0.08}
              />
            ))}
          </div>
        </div>
      </EditableSection>

      <DynamicSections pageId="playing-xi" />
    </div>
  );
}
