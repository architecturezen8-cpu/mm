'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import CurrentOverCard from '@/components/cards/CurrentOverCard';
import BatsmanCard from '@/components/cards/BatsmanCard';
import ChaseProgressCard from '@/components/cards/ChaseProgressCard';
import MatchInfoCard from '@/components/cards/MatchInfoCard';
import ScrollReveal from '@/components/ScrollReveal';
import EditableSection from '@/components/admin/EditableSection';
import { useSectionContent } from '@/lib/useSectionContent';
import { MatchInfo, LiveState } from '@/lib/types';
import DynamicSections from '@/components/admin/DynamicSections';
import { TrophyIcon, StarIcon, SwordsIcon } from '@/components/CricketIcons';

/* ── Win Celebration Banner — Ultra Premium ── */
const STC_LOGO_CDN = 'https://cdn.jsdelivr.net/gh/architecturezen8-cpu/web-assets/battle-of-the-golds/1778142922724-St.Thomas__College_Matale.png';
const GSC_LOGO_CDN = 'https://cdn.jsdelivr.net/gh/architecturezen8-cpu/web-assets/battle-of-the-golds/1778142905872-Govt.Science_college_matale.png';

function WinCelebrationBanner({ matchInfo, liveState }: { matchInfo: MatchInfo; liveState: LiveState }) {
  // Generate particles (must be before any conditional returns per React hooks rules)
  const confetti = useMemo(() =>
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 3 + Math.random() * 4,
      size: 3 + Math.random() * 8,
      color: ['#FFC300', '#FFD54F', '#E6AC00', '#F0EDE6', '#FF8C00', '#FFB347'][Math.floor(Math.random() * 6)],
      type: Math.random() > 0.5 ? 'circle' : 'rect',
      rotation: Math.random() * 360,
    })), []);

  // Parse winning team from matchInfo.result
  const result = matchInfo.result || '';
  let winningTeamName = '';
  let winningTeamLogo = '';
  let losingTeamName = '';
  let losingTeamLogo = '';
  let isSTCWin = false;

  if (result.toLowerCase().includes("st.thomas'") || result.toLowerCase().includes('stc')) {
    winningTeamName = "St.Thomas' College Matale";
    winningTeamLogo = STC_LOGO_CDN;
    losingTeamName = 'Govt. Science College Matale';
    losingTeamLogo = GSC_LOGO_CDN;
    isSTCWin = true;
  } else if (result.toLowerCase().includes('science') || result.toLowerCase().includes('gsc')) {
    winningTeamName = 'Govt.Science College Matale';
    winningTeamLogo = GSC_LOGO_CDN;
    losingTeamName = "St.Thomas' College Matale";
    losingTeamLogo = STC_LOGO_CDN;
    isSTCWin = false;
  } else {
    return null;
  }

  // Extract margin from result text (e.g., "won by 5 wickets" → "5 wickets")
  const marginMatch = result.match(/won by (.+)/i);
  const winMargin = marginMatch ? marginMatch[1] : '';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden mb-4 sm:mb-6"
      style={{
        background: 'linear-gradient(135deg, #0a0808 0%, #1a1208 20%, #0d0d08 40%, #1a1008 60%, #0a0a0f 80%, #141008 100%)',
        boxShadow: '0 0 60px rgba(255, 195, 0, 0.2), 0 0 120px rgba(255, 195, 0, 0.05), inset 0 1px 0 rgba(255, 195, 0, 0.3), inset 0 -1px 0 rgba(255, 195, 0, 0.1)',
        border: '2px solid',
        borderImage: 'linear-gradient(135deg, rgba(255,195,0,0.6), rgba(255,213,79,0.2), rgba(230,172,0,0.6)) 1',
      }}
    >
      {/* Animated confetti layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {confetti.map((p) => (
          <div
            key={p.id}
            className={p.type === 'circle' ? 'absolute rounded-full' : 'absolute'}
            style={{
              left: `${p.x}%`,
              top: '-10px',
              width: `${p.size}px`,
              height: p.type === 'rect' ? `${p.size * 0.6}px` : `${p.size}px`,
              backgroundColor: p.color,
              opacity: 0,
              animation: `confetti-rain ${p.duration}s ease-in ${p.delay}s infinite`,
              transform: `rotate(${p.rotation}deg)`,
            }}
          />
        ))}

        {/* Ambient glow layers */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full"
          style={{
            background: 'radial-gradient(ellipse, rgba(255, 195, 0, 0.1) 0%, transparent 70%)',
            animation: 'victory-pulse 3s ease-in-out infinite',
          }}
        />
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255, 195, 0, 0.4), rgba(255, 213, 79, 0.6), rgba(255, 195, 0, 0.4), transparent)',
            animation: 'gold-line-shimmer 4s ease-in-out infinite',
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255, 195, 0, 0.3), rgba(255, 213, 79, 0.5), rgba(255, 195, 0, 0.3), transparent)',
            animation: 'gold-line-shimmer 4s ease-in-out 2s infinite',
          }}
        />

        {/* Sparkle stars */}
        {[20, 40, 60, 80].map((x, i) => (
          <div
            key={`star-${i}`}
            className="absolute"
            style={{
              left: `${x}%`,
              top: `${15 + i * 18}%`,
              animation: `star-twinkle ${1.5 + i * 0.3}s ease-in-out ${i * 0.5}s infinite`,
            }}
          >
            <span className="text-gold/40" style={{ fontSize: `${6 + i * 2}px` }}>✦</span>
          </div>
        ))}
      </div>

      <div className="relative z-10 py-10 sm:py-16 px-4 text-center">
        {/* Trophy with glow ring */}
        <motion.div
          initial={{ y: -30, opacity: 0, scale: 0.5 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.8, type: 'spring', stiffness: 150, damping: 12 }}
          className="mb-6 relative inline-block"
        >
          <div className="absolute inset-0 -m-4 rounded-full" style={{
            background: 'radial-gradient(circle, rgba(255, 195, 0, 0.2) 0%, transparent 70%)',
            animation: 'trophy-glow 2s ease-in-out infinite',
          }} />
          <div className="relative z-10" style={{ filter: 'drop-shadow(0 0 20px rgba(255, 195, 0, 0.5))' }}><TrophyIcon className="text-gold" size={56} /></div>
        </motion.div>

        {/* VICTORY text */}
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          <h2
            className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-[8px] sm:tracking-[14px] mb-2"
            style={{
              background: 'linear-gradient(135deg, #FFC300 0%, #FFD54F 25%, #FFF8E1 50%, #FFD54F 75%, #FFC300 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 30px rgba(255, 195, 0, 0.5))',
              animation: 'victory-shimmer 3s ease-in-out infinite',
              backgroundSize: '200% 100%',
            }}
          >
            VICTORY
          </h2>
        </motion.div>

        {/* Decorative divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.6, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="w-32 sm:w-48 h-px mx-auto mt-6 sm:mt-8 mb-14 sm:mb-20"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255, 195, 0, 0.6), transparent)' }}
        />

        {/* Winning team logo with animated ring */}
        <motion.div
          initial={{ scale: 0, rotate: -360 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.8, duration: 1, type: 'spring', stiffness: 180, damping: 12 }}
          className="flex justify-center mb-16 sm:mb-24"
        >
          <div className="relative">
            {/* Animated ring around logo */}
            <div className="absolute inset-0 -m-4 sm:-m-5 rounded-full border-2 border-gold/30"
              style={{ animation: 'logo-ring-spin 8s linear infinite' }}
            />
            <div className="absolute inset-0 -m-6 sm:-m-8 rounded-full border border-gold/10"
              style={{ animation: 'logo-ring-spin 12s linear infinite reverse' }}
            />
            <div className="w-24 h-24 sm:w-36 sm:h-36 relative">
              <Image
                src={winningTeamLogo}
                alt={winningTeamName}
                fill
                sizes="(max-width: 640px) 96px, 144px"
                className="object-contain"
                unoptimized
                style={{
                  filter: 'drop-shadow(0 0 20px rgba(255, 195, 0, 0.4))',
                }}
              />
            </div>
          </div>
        </motion.div>

        {/* Winning team name */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.8 }}
        >
          <h3 className={`text-xl sm:text-3xl font-bold tracking-[4px] sm:tracking-[6px] uppercase mb-4 ${isSTCWin ? 'text-gold' : 'text-[#E63946]'}`}
            style={{ filter: `drop-shadow(0 0 15px ${isSTCWin ? 'rgba(255, 195, 0, 0.3)' : 'rgba(230, 57, 70, 0.3)'})` }}
          >
            {winningTeamName}
          </h3>
          <p className="text-text-muted text-[9px] sm:text-[10px] uppercase tracking-[3px]">Winner</p>
        </motion.div>

        {/* Win margin details */}
        {winMargin && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3, duration: 0.8 }}
            className="mt-5 sm:mt-6"
          >
            <div className="inline-block px-6 sm:px-10 py-3 sm:py-4 border border-gold/20 bg-gold-ghost/10"
              style={{ boxShadow: '0 0 20px rgba(255, 195, 0, 0.05)' }}
            >
              <p className="text-text-secondary text-[8px] sm:text-[9px] uppercase tracking-[3px] mb-1">Won by</p>
              <p className="text-gold text-lg sm:text-2xl font-bold tracking-[2px]">{winMargin}</p>
            </div>
          </motion.div>
        )}

        {/* Match result text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="mt-4"
        >
          <p className="text-text-secondary text-xs sm:text-sm tracking-[1px] max-w-lg mx-auto">
            {matchInfo.result}
          </p>
        </motion.div>

        {/* Score summary */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.7, duration: 0.8 }}
          className="mt-5 flex items-center justify-center gap-4 sm:gap-8"
        >
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 relative mb-1">
              <Image src={winningTeamLogo} alt={winningTeamName} fill sizes="40px" className="object-contain" unoptimized />
            </div>
            <span className="text-[8px] text-gold uppercase tracking-[1px]">Winner</span>
          </div>
          <SwordsIcon className="text-gold/40" size={20} />
          <div className="flex flex-col items-center opacity-50">
            <div className="w-8 h-8 sm:w-10 sm:h-10 relative mb-1">
              <Image src={losingTeamLogo} alt={losingTeamName} fill sizes="40px" className="object-contain" unoptimized />
            </div>
            <span className="text-[8px] text-text-muted uppercase tracking-[1px]">Runner-up</span>
          </div>
        </motion.div>

        {/* Player of the match */}
        {matchInfo.playerOfMatch && matchInfo.playerOfMatch !== 'TBD' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 0.8 }}
            className="mt-6 inline-block"
          >
            <div className="px-4 sm:px-6 py-2 sm:py-3 border border-gold/10 bg-gold-ghost/5">
              <span className="text-[8px] sm:text-[9px] uppercase tracking-[3px] text-text-muted block mb-1">
                <StarIcon className="inline w-3 h-3 text-gold mr-1" size={12} /> Player of the Match
              </span>
              <span className="text-gold font-semibold text-sm sm:text-base tracking-[1px]">{matchInfo.playerOfMatch}</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* CSS animations */}
      <style jsx>{`
        @keyframes confetti-rain {
          0% { opacity: 0; transform: translateY(-10px) rotate(0deg); }
          10% { opacity: 0.9; }
          90% { opacity: 0.3; }
          100% { opacity: 0; transform: translateY(100vh) rotate(720deg); }
        }
        @keyframes victory-pulse {
          0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.15); }
        }
        @keyframes victory-shimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes gold-line-shimmer {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        @keyframes star-twinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 0.8; transform: scale(1.2); }
        }
        @keyframes trophy-glow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        @keyframes logo-ring-spin {
          0% { transform: rotate(0deg); border-color: rgba(255, 195, 0, 0.3); }
          50% { border-color: rgba(255, 195, 0, 0.5); }
          100% { transform: rotate(360deg); border-color: rgba(255, 195, 0, 0.3); }
        }
      `}</style>
    </motion.div>
  );
}

interface LiveTabProps {
  matchInfo: MatchInfo;
  liveState: LiveState;
  maxOvers?: number;
}

const DEFAULT_CURRENT_OVER_CONTENT = {
  heading: 'Current Over',
  over_number: '33',
  runs_this_over: '4',
  balls: '1 0 2 0 1 W',
};

const DEFAULT_BATSMEN_CONTENT = {
  heading: 'Current Batsmen',
  batsmen: [
    { name: 'Dilith Perera', runs: '67', balls: '84', fours: '8', sixes: '1', sr: '79.76', on_strike: true },
    { name: 'Kavinda Silva', runs: '23', balls: '31', fours: '3', sixes: '0', sr: '74.19', on_strike: false },
  ],
};

const DEFAULT_MATCH_INFO_CONTENT = {
  heading: 'Match Info',
  venue: "St.Thomas' College Grounds, Matale",
  series: 'Battle of the Golds - 111th Encounter',
  toss: "St.Thomas' College won the toss and elected to bat",
  result: 'Match in progress',
  player_of_match: 'TBD',
};

export default function LiveTab({ matchInfo, liveState, maxOvers }: LiveTabProps) {
  const isOffline = liveState.isOffline === true;

  // Editable content
  const overContent = useSectionContent('live-currentover', DEFAULT_CURRENT_OVER_CONTENT);
  const batsmenContent = useSectionContent('live-batsmen', DEFAULT_BATSMEN_CONTENT);
  const infoContent = useSectionContent('live-info', DEFAULT_MATCH_INFO_CONTENT);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-3 sm:space-y-4 lg:space-y-6"
    >
      {/* Offline Banner — shown when live data is toggled OFF by admin */}
      {isOffline && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-sm border border-red-500/20 bg-red-500/5"
        >
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6 sm:py-4">
            <div className="shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21m-3.636-3.636L14.535 14.535M5.636 18.364a9 9 0 010-12.728m0 0L2.808 2.808m2.828 2.828L8.464 8.464M12 12h.01" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-red-400 text-xs sm:text-sm font-semibold uppercase tracking-[2px]">Live Score Offline</p>
              <p className="text-[#8A8780] text-[10px] sm:text-xs mt-0.5">Live data updates are currently paused. Score will appear when admin enables live mode.</p>
            </div>
            <div className="shrink-0 hidden sm:block">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full bg-red-500 opacity-40" />
                <span className="relative inline-flex h-2.5 w-2.5 bg-red-500 rounded-full" />
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Win Celebration Banner - shown when match is completed with a winner */}
      {!liveState.isLive && matchInfo.result && !matchInfo.result.toLowerCase().includes('in progress') && !matchInfo.result.toLowerCase().includes('tbd') && (
        <WinCelebrationBanner matchInfo={matchInfo} liveState={liveState} />
      )}

      <EditableSection sectionId="live-currentover" pageId="live" type="stats" title="Current Over" content={overContent}>
        <CurrentOverCard liveState={liveState} />
      </EditableSection>

      <EditableSection sectionId="live-batsmen" pageId="live" type="stats" title="Current Batsmen" content={batsmenContent}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
          {liveState.currentBatsmen.map((batsman, idx) => (
            <ScrollReveal key={batsman.name || `batsman-${idx}`} animation={idx === 0 ? 'fade-left' : 'fade-right'} delay={idx * 100}>
              <BatsmanCard batsman={batsman} delay={0.3 + idx * 0.1} />
            </ScrollReveal>
          ))}
        </div>
      </EditableSection>

      <EditableSection sectionId="live-info" pageId="live" type="stats" title="Match Info" content={infoContent}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
          <ScrollReveal animation="fade-up" delay={100}>
            <ChaseProgressCard liveState={liveState} />
          </ScrollReveal>
          <ScrollReveal animation="fade-up" delay={200}>
            <MatchInfoCard matchInfo={matchInfo} maxOvers={maxOvers} />
          </ScrollReveal>
        </div>
      </EditableSection>

      {/* Dynamic Sections - renders sections added via "Add Section" button */}
      <DynamicSections pageId="live" />
    </motion.div>
  );
}
