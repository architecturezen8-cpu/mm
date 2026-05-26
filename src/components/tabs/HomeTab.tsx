'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import { MatchInfo } from '@/lib/types';
import PremiumIcon from '@/components/PremiumIcon';
import ScrollReveal from '@/components/ScrollReveal';
import EditableSection from '@/components/admin/EditableSection';
import EditableField from '@/components/admin/EditableField';
import { useSectionContent, getContentString, getContentArray, getContentNumber } from '@/lib/useSectionContent';
import DynamicSections from '@/components/admin/DynamicSections';
import { CoinIcon, StadiumIcon, CricketIcon, TrophyIcon, StarIcon } from '@/components/CricketIcons';

/* ── Win Celebration Banner (Home version — compact) ── */
const STC_LOGO_CDN = 'https://cdn.jsdelivr.net/gh/architecturezen8-cpu/web-assets/battle-of-the-golds/1778142922724-St.Thomas__College_Matale.png';
const GSC_LOGO_CDN = 'https://cdn.jsdelivr.net/gh/architecturezen8-cpu/web-assets/battle-of-the-golds/1778142905872-Govt.Science_college_matale.png';

function HomeWinBanner({ matchInfo }: { matchInfo: MatchInfo }) {
  const confetti = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 4,
      duration: 2.5 + Math.random() * 3,
      size: 2 + Math.random() * 6,
      color: ['#FFC300', '#FFD54F', '#E6AC00', '#F0EDE6'][Math.floor(Math.random() * 4)],
    })), []);

  const result = matchInfo.result || '';
  let winningTeamName = '';
  let winningTeamLogo = '';
  let isSTCWin = false;

  if (result.toLowerCase().includes("st.thomas'") || result.toLowerCase().includes('stc')) {
    winningTeamName = "St.Thomas' College Matale";
    winningTeamLogo = STC_LOGO_CDN;
    isSTCWin = true;
  } else if (result.toLowerCase().includes('science') || result.toLowerCase().includes('gsc')) {
    winningTeamName = 'Govt.Science College Matale';
    winningTeamLogo = GSC_LOGO_CDN;
    isSTCWin = false;
  } else {
    return null;
  }

  const marginMatch = result.match(/won by (.+)/i);
  const winMargin = marginMatch ? marginMatch[1] : '';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8 }}
      className="relative overflow-hidden mb-6"
      style={{
        background: 'linear-gradient(135deg, #0a0808 0%, #1a1208 50%, #0a0a0f 100%)',
        boxShadow: '0 0 40px rgba(255, 195, 0, 0.15), inset 0 1px 0 rgba(255, 195, 0, 0.2)',
        border: '1px solid rgba(255, 195, 0, 0.3)',
      }}
    >
      {/* Confetti */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {confetti.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: `${p.x}%`,
              top: '-10px',
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              opacity: 0,
              animation: `confetti-rain ${p.duration}s ease-in ${p.delay}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 py-8 sm:py-12 px-4 text-center">
        <TrophyIcon className="mx-auto mb-4 text-gold" size={48} />
        <h2
          className="text-2xl sm:text-4xl font-black tracking-[6px] sm:tracking-[10px] mb-5"
          style={{
            background: 'linear-gradient(135deg, #FFC300, #FFD54F, #FFC300)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          VICTORY
        </h2>
        {/* Decorative divider */}
        <div className="w-24 sm:w-40 h-px mx-auto mb-10 sm:mb-14" style={{ background: 'linear-gradient(90deg, transparent, rgba(255, 195, 0, 0.5), transparent)' }} />
        <div className="flex justify-center mb-10 sm:mb-14">
          <div className="w-16 h-16 sm:w-20 sm:h-20 relative">
            <Image src={winningTeamLogo} alt={winningTeamName} fill sizes="80px" className="object-contain" unoptimized />
          </div>
        </div>
        <h3 className={`text-base sm:text-xl font-bold tracking-[3px] uppercase mb-2 ${isSTCWin ? 'text-gold' : 'text-[#E63946]'}`}>
          {winningTeamName}
        </h3>
        {winMargin && (
          <p className="text-gold text-sm sm:text-base font-medium mt-2">Won by {winMargin}</p>
        )}
        {matchInfo.playerOfMatch && matchInfo.playerOfMatch !== 'TBD' && (
          <p className="text-text-muted text-xs mt-4"><StarIcon className="inline w-3 h-3 text-gold mr-1" size={12} /> Player of the Match: <span className="text-gold">{matchInfo.playerOfMatch}</span></p>
        )}
      </div>

      <style jsx>{`
        @keyframes confetti-rain {
          0% { opacity: 0; transform: translateY(-10px); }
          10% { opacity: 0.8; }
          90% { opacity: 0.2; }
          100% { opacity: 0; transform: translateY(60vh); }
        }
      `}</style>
    </motion.div>
  );
}

interface HomeTabProps {
  matchInfo: MatchInfo;
  liveState?: import('@/lib/types').LiveState;
  innings1?: import('@/lib/types').InningsData;
  innings2?: import('@/lib/types').InningsData;
}

/* ─── Count-Up Animation Hook ─── */
function useCountUp(target: number, duration: number = 2000, startOnView: boolean = true) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!startOnView) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasStarted, startOnView]);

  useEffect(() => {
    if (!hasStarted) return;
    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [hasStarted, target, duration]);

  return { count, ref };
}

function CountUpStat({ value, label, icon, suffix = '' }: { value: number; label: string; icon: 'matches' | 'trophy' | 'chart'; suffix?: string }) {
  const { count, ref } = useCountUp(value, 2200);
  return (
    <div ref={ref} className="lux-card text-center py-6">
      <span className="text-gold mb-2 flex justify-center">
        <PremiumIcon name={icon} className="w-6 h-6" color="#FFC300" />
      </span>
      <span className="text-xl sm:text-2xl font-bold text-gold block">{count}{suffix}</span>
      <span className="text-[9px] sm:text-[10px] uppercase tracking-[3px] text-text-muted mt-2 block">
        {label}
      </span>
    </div>
  );
}

function CountdownTimer({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (!Number.isFinite(targetDate.getTime()) || distance <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      // Count from the exact admin-selected date/time, while still counting the match day.
      const inclusiveDays = Math.max(1, Math.ceil(distance / (1000 * 60 * 60 * 24)));
      setTimeLeft({
        days: inclusiveDays,
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  const units = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Mins', value: timeLeft.minutes },
    { label: 'Secs', value: timeLeft.seconds },
  ];

  return (
    <div className="flex items-center justify-center gap-3 sm:gap-6">
      {units.map((unit, i) => (
        <div key={unit.label} className="flex items-center gap-3 sm:gap-6">
          {i > 0 && <span className="text-gold text-xl sm:text-2xl font-light">:</span>}
          <div className="flex flex-col items-center">
            <motion.span
              key={unit.value}
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-2xl sm:text-4xl font-bold text-text-primary font-mono tabular-nums"
            >
              {String(unit.value).padStart(2, '0')}
            </motion.span>
            <span className="text-[8px] sm:text-[9px] uppercase tracking-[3px] text-text-muted mt-1">
              {unit.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } },
};

// Default content objects — these are the fallback values when no saved edits exist
const DEFAULT_HERO_CONTENT = {
  heading: "Thomians' Media",
  subheading: "Sri Lanka's Premier School Cricket Media Network",
  tagline: 'Dedicated to Capturing the Spirit of Thomian Cricket Since 2024',
  logo_image: '/logos/thomians-media-round-logo.jpg',
  stc_logo: '/logos/st-thomas-college-matale.jpg',
  gsc_logo: '/logos/govt-science-college-matale.jpg',
  stc_name: "St.Thomas' College Matale",
  gsc_name: 'Govt.Science College Matale',
  cta_text: 'Explore the Rivalry',
  cta_link: '#match-hero',
};

const DEFAULT_NEWS_CONTENT = {
  heading: 'News & Updates',
  show_count: 6,
  news_items: [
    { title: 'Thomians Dominate Day One', description: "St.Thomas' College Matale took firm control on the opening day, with captain Dilith Perera scoring a fluent 87 to put the Thomians in a commanding position.", image: '/news/cricket-action.jpg', date: 'May 10, 2026' },
    { title: 'Science College Fight Back', description: 'Govt.Science College Matale showed remarkable resilience in the second innings, with their pace attack dismantling the Thomian top order early on day two.', image: '/news/cricket-bowling.jpg', date: 'May 9, 2026' },
    { title: 'Big Match Preview & Predictions', description: 'The 111th Battle of the Golds is set to be an electrifying encounter. Both schools have been in tremendous form this season, setting the stage for an unforgettable clash.', image: '/news/cricket-crowd.jpg', date: 'May 8, 2026' },
  ],
};

const DEFAULT_BATTLE_CONTENT = {
  heading: 'Battle of the Golds',
  subheading: "Thomians' Media — Official Coverage",
  cta_text: 'View Live Score',
  cta_link: '/live',
  stc_logo: '/logos/st-thomas-college-matale.jpg',
  gsc_logo: '/logos/govt-science-college-matale.jpg',
  stc_name: "St.Thomas' College Matale",
  gsc_name: 'Govt.Science College Matale',
  event_label: 'Upcoming Event',
  rivalry_label: 'The Golden Rivalry',
  second_cta_text: 'Playing XI',
  second_cta_link: '/playing-xi',
};

const DEFAULT_COUNTDOWN_CONTENT = {
  heading: 'Match Countdown',
  match_date: '2026-05-15T09:00',
  match_date_text: "May 15, 2026 — St.Thomas' College Grounds, Matale",
};

const DEFAULT_WHOWEARE_CONTENT = {
  heading: 'Who We Are',
  text: "Thomians' Media is the official media unit of St.Thomas' College Matale, dedicated to capturing and broadcasting the spirit of Thomian cricket. From live score updates to in-depth match analysis, we bring the Battle of the Golds closer to fans around the world.",
  stat1_value: 111,
  stat1_label: 'Matches Played',
  stat2_value: 10,
  stat2_label: 'Biggest Win (Wkts)',
  stat3_value: 345,
  stat3_label: 'Highest Score',
};

const DEFAULT_PORTFOLIO_CONTENT = {
  heading: 'Our Portfolio',
  portfolio_items: [
    { label: 'Live Score Updates', icon: 'lightning' },
    { label: 'Match Photography', icon: 'star' },
    { label: 'Video Highlights', icon: 'film' },
    { label: 'Analysis & Stats', icon: 'chart' },
  ],
};

export default function HomeTab({ matchInfo, liveState, innings1, innings2 }: HomeTabProps) {
  const introRef = useRef<HTMLDivElement>(null);

  // Home page visibility controls — fetch from API so ALL visitors see admin's settings
  const [showLiveScoreCard, setShowLiveScoreCard] = useState(true);
  const [showMatchHighlights, setShowMatchHighlights] = useState(true);

  // Happening Now control — fetch from API so ALL visitors see admin's settings
  const [happeningNowEnabled, setHappeningNowEnabled] = useState(false);

  useEffect(() => {
    // Fetch all settings in a single API call
    const fetchSettings = () => {
      fetch('/api/admin/site-settings?t=' + Date.now())
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.home_visibility) {
            const vis = data.home_visibility;
            setShowLiveScoreCard(vis.showLiveScoreCard !== false);
            setShowMatchHighlights(vis.showMatchHighlights !== false);
          }
          if (data?.happening_now) {
            const hn = data.happening_now;
            setHappeningNowEnabled(!!hn.enabled);
          }
        })
        .catch(() => {});
    };
    fetchSettings();

    // Listen for real-time updates from admin panel
    window.addEventListener('home-visibility-updated', fetchSettings);
    window.addEventListener('happening-now-updated', fetchSettings);
    return () => {
      window.removeEventListener('home-visibility-updated', fetchSettings);
      window.removeEventListener('happening-now-updated', fetchSettings);
    };
  }, []);

  // Determine live score display for mini-card
  const hasLiveData = liveState && liveState.score;
  const maxOvers = innings1?.maxOvers || innings2?.maxOvers;
  const matchFormat = maxOvers
    ? maxOvers === 20 ? 'T20' : maxOvers === 50 ? 'ODI' : `${maxOvers} Overs`
    : '';

  // Get merged content for each section (default + saved edits)
  const heroContent = useSectionContent('home-hero', DEFAULT_HERO_CONTENT);
  const newsContent = useSectionContent('home-news', DEFAULT_NEWS_CONTENT);
  const battleContent = useSectionContent('home-battle', DEFAULT_BATTLE_CONTENT);
  const countdownContent = useSectionContent('home-countdown', DEFAULT_COUNTDOWN_CONTENT);
  const whoweareContent = useSectionContent('home-whoweare', DEFAULT_WHOWEARE_CONTENT);
  const portfolioContent = useSectionContent('home-portfolio', DEFAULT_PORTFOLIO_CONTENT);

  // Parse the editable match_date for countdown timer
  const countdownDateStr = getContentString(countdownContent, 'match_date', '2026-05-15T09:00');
  const matchDate = new Date(countdownDateStr);

  // Parallax scroll effect for intro section
  const { scrollYProgress } = useScroll({
    target: introRef,
    offset: ['start start', 'end start'],
  });
  const introOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const introScale = useTransform(scrollYProgress, [0, 0.8], [1, 0.95]);
  const introTranslateY = useTransform(scrollYProgress, [0, 0.8], [0, -40]);

  const scrollToMatch = () => {
    const el = document.getElementById('match-hero');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Extract values from merged content
  const heroHeading = getContentString(heroContent, 'heading', "Thomians' Media");
  const heroSubheading = getContentString(heroContent, 'subheading', "Sri Lanka's Premier School Cricket Media Network");
  const heroTagline = getContentString(heroContent, 'tagline', 'Dedicated to Capturing the Spirit of Thomian Cricket Since 2024');
  const heroStcLogo = getContentString(heroContent, 'stc_logo', '/logos/st-thomas-college-matale.jpg');
  const heroGscLogo = getContentString(heroContent, 'gsc_logo', '/logos/govt-science-college-matale.jpg');
  const heroStcName = getContentString(heroContent, 'stc_name', "St.Thomas' College Matale");
  const heroGscName = getContentString(heroContent, 'gsc_name', 'Govt.Science College Matale');
  const heroCtaText = getContentString(heroContent, 'cta_text', 'Explore the Rivalry');

  const battleHeading = getContentString(battleContent, 'heading', 'Battle of the Golds');
  const battleSubheading = getContentString(battleContent, 'subheading', "Thomians' Media — Official Coverage");
  const battleCtaText = getContentString(battleContent, 'cta_text', 'View Live Score');
  const battleCtaLink = getContentString(battleContent, 'cta_link', '/live');
  const battleStcLogo = getContentString(battleContent, 'stc_logo', '/logos/st-thomas-college-matale.jpg');
  const battleGscLogo = getContentString(battleContent, 'gsc_logo', '/logos/govt-science-college-matale.jpg');
  const battleStcName = getContentString(battleContent, 'stc_name', "St.Thomas' College Matale");
  const battleGscName = getContentString(battleContent, 'gsc_name', 'Govt.Science College Matale');
  const battleEventLabel = getContentString(battleContent, 'event_label', 'Upcoming Event');
  const battleRivalryLabel = getContentString(battleContent, 'rivalry_label', 'The Golden Rivalry');
  const battleSecondCtaText = getContentString(battleContent, 'second_cta_text', 'Playing XI');
  const battleSecondCtaLink = getContentString(battleContent, 'second_cta_link', '/playing-xi');

  const newsItems = getContentArray<Record<string, unknown>>(newsContent, 'news_items', DEFAULT_NEWS_CONTENT.news_items as unknown as Record<string, unknown>[]);

  const countdownDateText = getContentString(countdownContent, 'match_date_text', "May 15, 2026 — St.Thomas' College Grounds, Matale");

  const whoweareText = getContentString(whoweareContent, 'text', DEFAULT_WHOWEARE_CONTENT.text);
  const whoweareStat1Value = getContentNumber(whoweareContent, 'stat1_value', 111);
  const whoweareStat1Label = getContentString(whoweareContent, 'stat1_label', 'Matches Played');
  const whoweareStat2Value = getContentNumber(whoweareContent, 'stat2_value', 10);
  const whoweareStat2Label = getContentString(whoweareContent, 'stat2_label', 'Biggest Win (Wkts)');
  const whoweareStat3Value = getContentNumber(whoweareContent, 'stat3_value', 345);
  const whoweareStat3Label = getContentString(whoweareContent, 'stat3_label', 'Highest Score');

  const portfolioItems = getContentArray<Record<string, string>>(portfolioContent, 'portfolio_items', DEFAULT_PORTFOLIO_CONTENT.portfolio_items as unknown as Record<string, string>[]);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 sm:space-y-8"
    >
      {/* ═══════════════════════════════════════════
          HAPPENING NOW BANNER
          ═══════════════════════════════════════════ */}
      {happeningNowEnabled && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative"
        >
          {/* Animated traveling border wrapper */}
          <div className="relative overflow-hidden" style={{ padding: '1.5px' }}>
            {/* The traveling golden border — uses a conic gradient that rotates */}
            <div
              className="absolute inset-0"
              style={{
                background: `conic-gradient(
                  from var(--happening-now-angle, 0deg),
                  transparent 0%,
                  transparent 30%,
                  rgba(255, 195, 0, 0.9) 40%,
                  rgba(255, 213, 79, 1) 50%,
                  rgba(255, 195, 0, 0.9) 60%,
                  transparent 70%,
                  transparent 100%
                )`,
                animation: 'happening-now-rotate 4s linear infinite',
              }}
            />

            {/* Inner content card */}
            <div
              className="relative z-10"
              style={{
                background: 'linear-gradient(135deg, #0a0808 0%, #1a1208 50%, #0a0a0f 100%)',
              }}
            >
              {/* Ambient glow */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-24 rounded-full"
                  style={{
                    background: 'radial-gradient(ellipse, rgba(255, 195, 0, 0.08) 0%, transparent 70%)',
                  }}
                />
              </div>
              <div className="relative z-10 py-5 sm:py-6 px-4 text-center">
                <div className="flex items-center justify-center gap-3 mb-2">
                  {/* Pulsing live dot */}
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full bg-[#FFC300] opacity-60" />
                    <span className="relative inline-flex h-2.5 w-2.5 bg-[#FFC300]" />
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[3px] text-[#8A8780]">
                    Live Now
                  </span>
                </div>
                <h2
                  className="text-base sm:text-xl font-black tracking-[3px] sm:tracking-[5px] uppercase"
                  style={{
                    background: 'linear-gradient(135deg, #FFC300, #FFD54F, #FFC300)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Battle of the Golds — Happening Now
                </h2>
              </div>
            </div>
          </div>

          <style jsx>{`
            @keyframes happening-now-rotate {
              from {
                --happening-now-angle: 0deg;
              }
              to {
                --happening-now-angle: 360deg;
              }
            }
          `}</style>
          <style>{`
            @property --happening-now-angle {
              syntax: '<angle>';
              initial-value: 0deg;
              inherits: false;
            }
          `}</style>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════
          WIN CELEBRATION BANNER (Bug #7)
          ═══════════════════════════════════════════ */}
      {matchInfo.result && !matchInfo.result.toLowerCase().includes('in progress') && !matchInfo.result.toLowerCase().includes('tbd') && !matchInfo.result.toLowerCase().includes('not started') && (
        <HomeWinBanner matchInfo={matchInfo} />
      )}

      {/* ═══════════════════════════════════════════
          THOMIANS' MEDIA — Intro Hero Section
          ═══════════════════════════════════════════ */}
      <EditableSection sectionId="home-hero" pageId="home" type="hero" title="Home Hero Banner" content={heroContent}>
        <motion.div
          ref={introRef}
          style={{ opacity: introOpacity, scale: introScale, y: introTranslateY }}
          className="relative min-h-[80vh] sm:min-h-[85vh] flex flex-col items-center justify-center text-center px-4 py-16 sm:py-20 overflow-hidden"
        >
          {/* Ambient glow effects */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 sm:w-[500px] sm:h-[500px] bg-gold/[0.03] rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-lux-bg to-transparent" />
          </div>

          <div className="relative z-10 max-w-xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="flex items-center justify-center gap-6 sm:gap-10 mb-8 sm:mb-10"
            >
              <EditableField sectionId="home-hero" pageId="home" type="hero" title="Home Hero Banner" sectionContent={heroContent} fieldKey="stc_logo" fieldType="image">
                <div className="w-20 h-20 sm:w-28 sm:h-28 relative flex-shrink-0">
                  <Image src={heroStcLogo} alt={heroStcName} fill sizes="(max-width: 640px) 80px, 112px" className="object-contain" priority />
                </div>
              </EditableField>
              <EditableField sectionId="home-hero" pageId="home" type="hero" title="Home Hero Banner" sectionContent={heroContent} fieldKey="gsc_logo" fieldType="image">
                <div className="w-20 h-20 sm:w-28 sm:h-28 relative flex-shrink-0">
                  <Image src={heroGscLogo} alt={heroGscName} fill sizes="(max-width: 640px) 80px, 112px" className="object-contain" priority />
                </div>
              </EditableField>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="mb-4"
            >
              <EditableField sectionId="home-hero" pageId="home" type="hero" title="Home Hero Banner" sectionContent={heroContent} fieldKey="heading" fieldType="text">
                <svg viewBox="0 0 1400 180" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-md sm:max-w-lg mx-auto h-auto" fill="none">
                  <text x="550" y="120" textAnchor="middle" style={{ animation: 'none', fill: '#F0EDE6', stroke: 'transparent' }}>
                    <tspan style={{ fontWeight: 900, fontSize: '112px', letterSpacing: '1.5px' }}>{heroHeading.toUpperCase().replace("'S", "&apos;S")}</tspan>
                  </text>
                  <g transform="translate(1090, 45)">
                    <path className="logo-bar-animate logo-bar-gold" d="M0 0 H36.7 L80 75 H43.3 Z" />
                    <path className="logo-bar-animate logo-bar-blue" d="M50 0 H86.7 L130 75 H93.3 Z" />
                    <path className="logo-bar-animate logo-bar-navy" d="M100 0 H136.7 L180 75 H143.3 Z" />
                  </g>
                </svg>
              </EditableField>
            </motion.div>

            <EditableField sectionId="home-hero" pageId="home" type="hero" title="Home Hero Banner" sectionContent={heroContent} fieldKey="subheading" fieldType="text">
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="text-sm sm:text-base text-text-secondary tracking-[3px] sm:tracking-[4px] uppercase mb-3"
              >
                {heroSubheading}
              </motion.p>
            </EditableField>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="text-[10px] sm:text-xs text-text-muted tracking-[2px] uppercase mb-10 sm:mb-14 max-w-sm mx-auto"
            >
              {heroTagline}
            </motion.p>

            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 80 }}
              transition={{ delay: 1.1, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="h-px mx-auto mb-10 sm:mb-14"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,195,0,0.3), transparent)' }}
            />

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3, duration: 0.6 }}
              onClick={scrollToMatch}
              className="group flex flex-col items-center gap-3 mx-auto cursor-pointer"
            >
              <span className="text-[9px] sm:text-[10px] uppercase tracking-[4px] text-text-muted group-hover:text-gold transition-colors duration-500">
                {heroCtaText}
              </span>
              <div className="w-5 h-8 border border-lux-border group-hover:border-gold/40 rounded-full flex items-start justify-center pt-1.5 transition-colors duration-500">
                <motion.div
                  animate={{ y: [0, 6, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-1 h-1.5 bg-gold/60 rounded-full"
                />
              </div>
            </motion.button>
          </div>
        </motion.div>
      </EditableSection>

      {/* ═══════════════════════════════════════════
          LIVE SCORE MINI-CARD — Prominent score display on home page
          ═══════════════════════════════════════════ */}
      {hasLiveData && showLiveScoreCard && (
        <ScrollReveal animation="scale">
          <Link href="/live" className="block">
            <div className="lux-card-gold text-center py-6 sm:py-8 px-4 cursor-pointer group">
              <div className="flex items-center justify-center gap-2 mb-3">
                {liveState!.isLive && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full bg-gold opacity-60" />
                    <span className="relative inline-flex h-2 w-2 bg-gold" />
                  </span>
                )}
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[3px] text-text-muted">
                  {liveState!.isLive ? 'Live Score' : 'Match Score'}
                </span>
                {matchFormat && (
                  <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[2px] px-2 py-0.5 border border-gold/30 text-gold bg-gold-ghost/50">
                    {matchFormat}
                  </span>
                )}
              </div>
              {/* Use actual innings data to determine which team batted first */}
              {(() => {
                // Determine which innings belongs to which team
                const stcInnings = innings1?.battingTeam?.includes("St.Thomas'") ? innings1
                  : innings2?.battingTeam?.includes("St.Thomas'") ? innings2 : null;
                const gscInnings = innings1?.battingTeam?.includes('Science') ? innings1
                  : innings2?.battingTeam?.includes('Science') ? innings2 : null;
                // Determine which team is currently batting (for highlight)
                const currentBattingTeam = liveState?.battingTeam || '';
                const isSTCBatting = currentBattingTeam.includes("St.Thomas'");
                const isGSCBatting = currentBattingTeam.includes('Science');
                return (
                  <div className="flex items-center justify-center gap-6 sm:gap-10 mb-3">
                    <div className={`flex flex-col items-center ${isSTCBatting ? 'scale-105' : ''} transition-transform`}>
                      <div className="w-12 h-12 sm:w-16 sm:h-16 relative mb-1">
                        <Image
                          src="https://cdn.jsdelivr.net/gh/architecturezen8-cpu/web-assets/battle-of-the-golds/1778142922724-St.Thomas__College_Matale.png"
                          alt="STC"
                          fill
                          sizes="(max-width: 640px) 48px, 64px"
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-gold">STC</span>
                      {isSTCBatting && <span className="text-[7px] text-gold uppercase tracking-[1px]">Batting</span>}
                      <span className="text-lg sm:text-2xl font-light text-text-primary tracking-wider">
                        {stcInnings ? `${stcInnings.totalRuns}/${stcInnings.totalWkts}` : '—'}
                      </span>
                      {stcInnings && <span className="text-[8px] text-text-muted">({stcInnings.totalOvers} ov)</span>}
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-gold text-base sm:text-lg font-bold tracking-[3px]">VS</span>
                      <span className="text-[8px] text-text-muted mt-1 group-hover:text-gold transition-colors">Tap for details →</span>
                    </div>
                    <div className={`flex flex-col items-center ${isGSCBatting ? 'scale-105' : ''} transition-transform`}>
                      <div className="w-12 h-12 sm:w-16 sm:h-16 relative mb-1">
                        <Image
                          src="https://cdn.jsdelivr.net/gh/architecturezen8-cpu/web-assets/battle-of-the-golds/1778142905872-Govt.Science_college_matale.png"
                          alt="GSC"
                          fill
                          sizes="(max-width: 640px) 48px, 64px"
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-[#E63946]">GSC</span>
                      {isGSCBatting && <span className="text-[7px] text-[#E63946] uppercase tracking-[1px]">Batting</span>}
                      <span className="text-lg sm:text-2xl font-light text-text-primary tracking-wider">
                        {gscInnings ? `${gscInnings.totalRuns}/${gscInnings.totalWkts}` : '—'}
                      </span>
                      {gscInnings && <span className="text-[8px] text-text-muted">({gscInnings.totalOvers} ov)</span>}
                    </div>
                  </div>
                );
              })()}
              {matchInfo.result && !matchInfo.result.toLowerCase().includes('in progress') && (
                <p className="text-xs sm:text-sm text-gold font-medium tracking-wider">{matchInfo.result}</p>
              )}
            </div>
          </Link>
        </ScrollReveal>
      )}

      {/* ═══════════════════════════════════════════
          MATCH DAY HIGHLIGHTS (Bug #6 — Differentiate from Live page)
          ═══════════════════════════════════════════ */}
      {showMatchHighlights && (
      <ScrollReveal animation="fade-up">
        <div className="lux-card">
          <h2 className="card-title">
            <span className="icon"><PremiumIcon name="broadcast" className="w-3.5 h-3.5 text-gold" /></span> Match Day Highlights
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Toss Info */}
            <div className="border border-lux-border p-4 text-center">
              <span className="text-gold mb-2 flex justify-center"><CoinIcon size={22} /></span>
              <p className="text-[9px] uppercase tracking-[2px] text-text-muted mb-1">Toss</p>
              <p className="text-xs sm:text-sm text-text-primary font-medium">{matchInfo.toss || 'Yet to be decided'}</p>
            </div>
            {/* Venue */}
            <div className="border border-lux-border p-4 text-center">
              <span className="text-gold mb-2 flex justify-center"><StadiumIcon size={22} /></span>
              <p className="text-[9px] uppercase tracking-[2px] text-text-muted mb-1">Venue</p>
              <p className="text-xs sm:text-sm text-text-primary font-medium">{matchInfo.venue}</p>
            </div>
            {/* Series */}
            <div className="border border-lux-border p-4 text-center">
              <span className="text-gold mb-2 flex justify-center"><CricketIcon size={22} /></span>
              <p className="text-[9px] uppercase tracking-[2px] text-text-muted mb-1">Series</p>
              <p className="text-xs sm:text-sm text-text-primary font-medium">{matchInfo.series}</p>
            </div>
          </div>
          {/* Key Stats Row */}
          {(innings1 || innings2) && (
            <div className="mt-4 pt-4 border-t border-lux-border grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div>
                <p className="text-[8px] uppercase tracking-[2px] text-text-muted">1st Innings</p>
                <p className="text-sm text-text-primary font-medium">{innings1 ? `${innings1.totalRuns}/${innings1.totalWkts}` : '—'}</p>
                <p className="text-[8px] text-text-muted">{innings1 ? `(${innings1.totalOvers} ov)` : ''}</p>
              </div>
              <div>
                <p className="text-[8px] uppercase tracking-[2px] text-text-muted">2nd Innings</p>
                <p className="text-sm text-text-primary font-medium">{innings2?.totalRuns ? `${innings2.totalRuns}/${innings2.totalWkts}` : '—'}</p>
                <p className="text-[8px] text-text-muted">{innings2 ? `(${innings2.totalOvers} ov)` : ''}</p>
              </div>
              <div>
                <p className="text-[8px] uppercase tracking-[2px] text-text-muted">CRR</p>
                <p className="text-sm text-gold font-medium">{liveState?.crr?.toFixed(2) || '—'}</p>
              </div>
              <div>
                <p className="text-[8px] uppercase tracking-[2px] text-text-muted">Match</p>
                <p className="text-sm text-text-primary font-medium">{matchInfo.matchTitle}</p>
              </div>
            </div>
          )}
          <div className="mt-4 text-center">
            <Link href="/live" className="text-[9px] sm:text-[10px] uppercase tracking-[3px] text-gold hover:text-gold-bright transition-colors">
              View Full Live Score →
            </Link>
          </div>
        </div>
      </ScrollReveal>
      )}

      {/* ═══════════════════════════════════════════
          UPCOMING EVENTS SECTION
          Combines: Event Label → Countdown → Golden Rivalry Card
          ═══════════════════════════════════════════ */}
      <EditableSection sectionId="home-battle" pageId="home" type="hero" title="Upcoming Event" content={battleContent}>
        {/* "Upcoming Event" label */}
        <ScrollReveal animation="fade-up">
          <div className="text-center mb-4">
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-[9px] sm:text-[10px] uppercase tracking-[5px] sm:tracking-[6px] text-[#E63946] font-bold"
            >
              {battleEventLabel}
            </motion.p>
          </div>
        </ScrollReveal>

        {/* Match Countdown — directly under the label */}
        <EditableSection sectionId="home-countdown" pageId="home" type="stats" title="Match Countdown" content={countdownContent}>
          <ScrollReveal animation="fade-up">
            <div className="lux-card mb-6">
              <h2 className="card-title">
                <span className="icon"><PremiumIcon name="timer" className="w-3.5 h-3.5 text-gold" /></span> {getContentString(countdownContent, 'heading', 'Match Countdown')}
              </h2>
              <div className="py-4">
                <CountdownTimer targetDate={matchDate} />
                <p className="text-center text-[10px] sm:text-xs text-text-muted uppercase tracking-[3px] mt-4">
                  {countdownDateText}
                </p>
              </div>
            </div>
          </ScrollReveal>
        </EditableSection>

        {/* The Golden Rivalry — match hero card */}
        <ScrollReveal animation="scale">
          <div id="match-hero" className="lux-card-gold text-center py-10 sm:py-16 px-4">
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-96 sm:h-96 bg-gold/5 rounded-full blur-3xl" />
            </div>
            <div className="relative z-10">
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-[9px] sm:text-[10px] uppercase tracking-[5px] sm:tracking-[6px] text-text-muted mb-4"
              >
                {battleRivalryLabel}
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="text-3xl sm:text-5xl lg:text-6xl font-bold text-text-primary mb-2"
              >
                {battleHeading.toUpperCase()}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.6 }}
                className="text-xs sm:text-sm text-text-secondary tracking-[2px] sm:tracking-[3px] uppercase mb-8"
              >
                {battleSubheading}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.6 }}
                className="flex items-center justify-center gap-6 sm:gap-10 mb-8"
              >
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 relative mb-2">
                    <Image src={battleStcLogo} alt={battleStcName} fill sizes="(max-width: 640px) 64px, 96px" className="object-contain" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold tracking-[2px] text-gold uppercase max-w-[120px] sm:max-w-[160px] leading-tight text-center">
                    {battleStcName}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-gold text-lg sm:text-xl font-bold tracking-[4px]">VS</span>
                  <div className="w-12 sm:w-20 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent mt-2" />
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 relative mb-2">
                    <Image src={battleGscLogo} alt={battleGscName} fill sizes="(max-width: 640px) 64px, 96px" className="object-contain" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold tracking-[2px] text-[#E63946] uppercase max-w-[120px] sm:max-w-[160px] leading-tight text-center">
                    {battleGscName}
                  </span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1, duration: 0.6 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
              >
                <Link href={battleCtaLink} className="px-6 sm:px-8 py-3 bg-gold text-lux-bg font-semibold text-xs sm:text-sm uppercase tracking-[3px] hover:bg-gold-bright transition-colors w-full sm:w-auto text-center">
                  {battleCtaText}
                </Link>
                <Link href={battleSecondCtaLink} className="px-6 sm:px-8 py-3 border border-lux-border text-text-secondary font-semibold text-xs sm:text-sm uppercase tracking-[3px] hover:border-gold hover:text-gold transition-colors w-full sm:w-auto text-center">
                  {battleSecondCtaText}
                </Link>
              </motion.div>
            </div>
          </div>
        </ScrollReveal>
      </EditableSection>

      {/* NEWS & UPDATES */}
      <EditableSection sectionId="home-news" pageId="home" type="news" title="News & Updates" content={newsContent}>
        <ScrollReveal animation="fade-up">
          <div className="lux-card">
            <h2 className="card-title">
              <span className="icon"><PremiumIcon name="clipboard" className="w-3.5 h-3.5 text-gold" /></span> {getContentString(newsContent, 'heading', 'News & Updates')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {newsItems.map((news, idx) => {
                const title = getContentString(news, 'title', `News Item ${idx + 1}`);
                const desc = getContentString(news, 'description', '');
                const image = getContentString(news, 'image', '');
                const date = getContentString(news, 'date', '');
                const hasImage = image && image.trim() !== '';
                return (
                  <div key={idx} className="group relative border border-lux-border overflow-hidden hover:border-gold/30 transition-all duration-500 hover:shadow-[0_8px_40px_-12px_rgba(255,195,0,0.15)] hover:-translate-y-1">
                    {/* Gold accent bar at top of card */}
                    <div className="h-[2px] w-full bg-gradient-to-r from-gold/0 via-gold/40 to-gold/0 group-hover:via-gold/70 transition-all duration-500" />
                    {/* Image area */}
                    <div className="relative w-full h-44 sm:h-52 overflow-hidden">
                      {hasImage ? (
                        <>
                          {/* Blurred background for depth */}
                          <Image src={image} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover blur-xl scale-110 opacity-40" aria-hidden="true" />
                          {/* Actual image */}
                          <Image src={image} alt={title} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover group-hover:scale-105 transition-transform duration-700 z-[1]" unoptimized={image.includes('cdn.jsdelivr.net')} />
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0a0808 0%, #0d0d08 50%, #0a0a0f 100%)' }}>
                          <span className="text-gold/15 text-3xl font-black uppercase">{title.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent" />
                      {/* Date badge — prominent gold styling */}
                      {date && (
                        <div className="absolute top-3 left-3">
                          <span className="text-[8px] sm:text-[9px] uppercase tracking-[2px] font-bold text-gold bg-lux-bg/70 border border-gold/30 px-2.5 py-1 backdrop-blur-sm">{date}</span>
                        </div>
                      )}
                    </div>
                    {/* Content */}
                    <div className="p-5">
                      {/* Gold accent bar above title */}
                      <div className="w-6 h-[1.5px] bg-gold/50 mb-3 group-hover:w-10 group-hover:bg-gold/80 transition-all duration-500" />
                      <h3 className="text-sm sm:text-base font-semibold text-text-primary mb-2.5 leading-tight group-hover:text-gold/90 transition-colors duration-300">{title}</h3>
                      <p className="text-xs sm:text-sm text-text-secondary leading-relaxed line-clamp-3">{desc}</p>
                    </div>
                    {/* Bottom accent line on hover */}
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center" />
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollReveal>
      </EditableSection>

      {/* WHO WE ARE Section */}
      <EditableSection sectionId="home-whoweare" pageId="home" type="text" title="Who We Are" content={whoweareContent}>
        <ScrollReveal animation="fade-up">
          <div className="lux-card">
            <h2 className="card-title">
              <span className="icon"><PremiumIcon name="broadcast" className="w-3.5 h-3.5 text-gold" /></span> {getContentString(whoweareContent, 'heading', 'Who We Are')}
            </h2>
            <p className="text-text-secondary text-sm mb-6 leading-relaxed">
              {whoweareText}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <CountUpStat value={whoweareStat1Value} label={whoweareStat1Label} icon="matches" />
              <CountUpStat value={whoweareStat2Value} label={whoweareStat2Label} icon="trophy" />
              <CountUpStat value={whoweareStat3Value} label={whoweareStat3Label} icon="chart" />
            </div>
          </div>
        </ScrollReveal>
      </EditableSection>

      {/* Our Portfolio */}
      <EditableSection sectionId="home-portfolio" pageId="home" type="text" title="Our Portfolio" content={portfolioContent}>
        <ScrollReveal animation="fade-up" delay={100}>
          <div className="lux-card">
            <h2 className="card-title">
              <span className="icon"><PremiumIcon name="film" className="w-3.5 h-3.5 text-gold" /></span> {getContentString(portfolioContent, 'heading', 'Our Portfolio')}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {portfolioItems.map((pItem, idx) => {
                const label = getContentString(pItem, 'label', `Item ${idx + 1}`);
                const icon = (getContentString(pItem, 'icon', 'star') || 'star') as 'lightning' | 'star' | 'film' | 'chart';
                return (
                  <div key={idx} className="flex flex-col items-center text-center py-4 gap-2">
                    <span className="text-gold"><PremiumIcon name={icon} className="w-5 h-5" color="#FFC300" /></span>
                    <span className="text-[9px] sm:text-[10px] uppercase tracking-[2px] text-text-secondary">{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollReveal>
      </EditableSection>

      {/* Series Info */}
      <EditableSection sectionId="home-series" pageId="home" type="stats" title="Series Information" content={{ heading: 'Series Information' }}>
        <ScrollReveal animation="fade-up">
          <div className="lux-card">
            <h2 className="card-title">
              <span className="icon"><PremiumIcon name="clipboard" className="w-3.5 h-3.5 text-gold" /></span> Series Information
            </h2>
            <div className="space-y-0">
              <div className="stat-row">
                <span className="text-text-secondary text-xs sm:text-sm">Series</span>
                <span className="text-text-primary text-xs sm:text-sm font-medium">{matchInfo.series}</span>
              </div>
              <div className="stat-row">
                <span className="text-text-secondary text-xs sm:text-sm">Match</span>
                <span className="text-text-primary text-xs sm:text-sm font-medium">{matchInfo.matchTitle}</span>
              </div>
              <div className="stat-row">
                <span className="text-text-secondary text-xs sm:text-sm">Venue</span>
                <span className="text-text-primary text-xs sm:text-sm font-medium">{matchInfo.venue}</span>
              </div>
              <div className="stat-row">
                <span className="text-text-secondary text-xs sm:text-sm">Toss</span>
                <span className="text-text-primary text-xs sm:text-sm font-medium">{matchInfo.toss}</span>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </EditableSection>

      {/* Last Result */}
      <EditableSection sectionId="home-result" pageId="home" type="stats" title="Last Result" content={{ heading: 'Last Result' }}>
        <ScrollReveal animation="fade-up">
          <div className="lux-card-gold">
            <h2 className="card-title">
              <span className="icon"><PremiumIcon name="target" className="w-3.5 h-3.5 text-gold" /></span> Last Result
            </h2>
            <p className="text-text-primary text-sm sm:text-base font-medium mb-2">{matchInfo.result}</p>
            <p className="text-text-secondary text-xs">Player of the Match: <span className="text-gold">{matchInfo.playerOfMatch}</span></p>
          </div>
        </ScrollReveal>
      </EditableSection>

      {/* Dynamic Sections - renders sections added via "Add Section" button */}
      <DynamicSections pageId="home" />
    </motion.div>
  );
}
