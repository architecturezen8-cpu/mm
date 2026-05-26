'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import PremiumIcon from '@/components/PremiumIcon';
import EditableSection from '@/components/admin/EditableSection';
import DynamicSections from '@/components/admin/DynamicSections';
import { MatchInfo } from '@/lib/types';
import { useSectionContent, getContentString, getContentNumber, getContentArray } from '@/lib/useSectionContent';

interface MatchHistoryTabProps {
  matchInfo: MatchInfo;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

// ─── Default Content ────────────────────────────────────────────────────────

const DEFAULT_HERO_CONTENT = {
  heading: 'Battle of the Golds',
  subtitle: 'A Legacy of Grit at Matale',
  total_encounters: 32,
  year_start: '1962',
  year_end: '2025',
  stc_wins: 23,
  gsc_wins: 1,
  draws: 8,
};

const DEFAULT_ORIGIN_CONTENT = {
  text: "The fierce competition between S. Thomas' College (STC) and Government Science College, Matale (GSC) kicked off with a friendly encounter in 1961, setting the stage for a legendary rivalry played out on the hallowed turf of the Matale Esplanade—known today as the Bernard Aluvihare Stadium.",
  venue: 'Bernard Aluvihare Stadium',
  venue_detail: 'Matale Esplanade (Historic Name)',
};

const DEFAULT_FORMAT_CONTENT = {
  timeline_items: [
    { year: '1961', format: 'Friendly Match', description: 'First ever encounter', dot_color: 'gold' },
    { year: '1962–1973', format: 'Official Two-Day Matches', description: 'The annual series began', dot_color: 'gold' },
    { year: '1974', format: 'No Match', description: 'Hiatus', dot_color: 'gray' },
    { year: '1975', format: 'First 50-Over Match', description: 'Birth of limited-overs clash', dot_color: 'red' },
    { year: '1976–1980', format: 'Return to Two-Day Format', description: 'Classic format restored', dot_color: 'gold' },
    { year: '1981–2022', format: 'Alternating Era', description: 'Between two-day and 50-over', dot_color: 'gold' },
    { year: '2023–Present', format: 'Consistent 50-Over Showcase', description: 'Modern era format', dot_color: 'red' },
  ],
};

const DEFAULT_RECORDS_CONTENT = {
  total_encounters: 32,
  encounter_range: '1962–2025',
  stc_two_day_wins: 14,
  stc_two_day_notes: 'Including 2 innings victories: 1966, 1993',
  stc_50_over_wins: 9,
  stc_50_over_notes: 'Unbeaten record!',
  gsc_wins: 1,
  gsc_wins_notes: '1964 two-day encounter — their only victory',
  draws: 8,
  best_bowling: 'Punchihewa 13/53',
  highest_score: 'Senanayake – 135',
  two_day_matches: 23,
  fifty_over_matches: 9,
};

const DEFAULT_HIGHLIGHTS_CONTENT = {
  items: [
    { label: 'Best Bowling', value: 'Punchihewa 13/53', team: 'STC' },
    { label: 'Highest Score', value: 'Senanayake – 135', team: 'STC' },
    { label: 'STC 50-Over Record', value: '9 Wins — Unbeaten!', team: 'STC' },
    { label: 'GSC Sole Victory', value: '1964 Two-Day Encounter', team: 'GSC' },
    { label: 'Innings Victories', value: '1966 & 1993 (STC)', team: 'STC' },
  ],
};

const DEFAULT_MEDIA_CONTENT = {
  photos: [
    { src: '/history/trophy-1989.jpeg', caption: "1989 Trophy Ceremony — Skipper Ravi Punchihewa receiving the winners trophy" },
    { src: '/history/13th-big-match.jpeg', caption: "13th Big Match — Team photos from the newspaper" },
    { src: '/history/win-84-runs.jpeg', caption: "Matale Thomians win by 84 runs — Newspaper report" },
    { src: '/history/sinhala-article.jpeg', caption: "Historic Sinhala newspaper coverage" },
    { src: '/history/awards-1989.jpeg', caption: "1989 Best All-Rounder & Best Bowler awards ceremony" },
  ],
};

// ─── Timeline Dot Color Helper ──────────────────────────────────────────────

function getTimelineDotClasses(dotColor: string) {
  switch (dotColor) {
    case 'gold':
      return 'bg-gold shadow-[0_0_8px_rgba(212,175,55,0.5)]';
    case 'red':
      return 'bg-[#E63946] shadow-[0_0_8px_rgba(230,57,70,0.5)]';
    case 'gray':
    default:
      return 'bg-[#4A4945]';
  }
}

function getTimelineLineClasses(dotColor: string) {
  switch (dotColor) {
    case 'gold':
      return 'border-gold/30';
    case 'red':
      return 'border-[#E63946]/30';
    case 'gray':
    default:
      return 'border-[#4A4945]/30';
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function MatchHistoryTab({ matchInfo }: MatchHistoryTabProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Content hooks
  const heroContent = useSectionContent('history-hero', DEFAULT_HERO_CONTENT);
  const originContent = useSectionContent('history-origin', DEFAULT_ORIGIN_CONTENT);
  const formatContent = useSectionContent('history-format', DEFAULT_FORMAT_CONTENT);
  const recordsContent = useSectionContent('history-records', DEFAULT_RECORDS_CONTENT);
  const highlightsContent = useSectionContent('history-highlights', DEFAULT_HIGHLIGHTS_CONTENT);
  const mediaContent = useSectionContent('history-media', DEFAULT_MEDIA_CONTENT);

  // Hero content
  const heroHeading = getContentString(heroContent, 'heading', DEFAULT_HERO_CONTENT.heading);
  const heroSubtitle = getContentString(heroContent, 'subtitle', DEFAULT_HERO_CONTENT.subtitle);
  const heroTotalEncounters = getContentNumber(heroContent, 'total_encounters', DEFAULT_HERO_CONTENT.total_encounters);
  const heroYearStart = getContentString(heroContent, 'year_start', DEFAULT_HERO_CONTENT.year_start);
  const heroYearEnd = getContentString(heroContent, 'year_end', DEFAULT_HERO_CONTENT.year_end);
  const heroStcWins = getContentNumber(heroContent, 'stc_wins', DEFAULT_HERO_CONTENT.stc_wins);
  const heroGscWins = getContentNumber(heroContent, 'gsc_wins', DEFAULT_HERO_CONTENT.gsc_wins);
  const heroDraws = getContentNumber(heroContent, 'draws', DEFAULT_HERO_CONTENT.draws);

  // Origin content
  const originText = getContentString(originContent, 'text', DEFAULT_ORIGIN_CONTENT.text);
  const originVenue = getContentString(originContent, 'venue', DEFAULT_ORIGIN_CONTENT.venue);
  const originVenueDetail = getContentString(originContent, 'venue_detail', DEFAULT_ORIGIN_CONTENT.venue_detail);

  // Format timeline
  const timelineItems = getContentArray(
    formatContent,
    'timeline_items',
    DEFAULT_FORMAT_CONTENT.timeline_items
  ) as Array<{ year: string; format: string; description: string; dot_color: string }>;

  // Records content
  const recTotalEncounters = getContentNumber(recordsContent, 'total_encounters', DEFAULT_RECORDS_CONTENT.total_encounters);
  const recEncounterRange = getContentString(recordsContent, 'encounter_range', DEFAULT_RECORDS_CONTENT.encounter_range);
  const recStcTwoDayWins = getContentNumber(recordsContent, 'stc_two_day_wins', DEFAULT_RECORDS_CONTENT.stc_two_day_wins);
  const recStcTwoDayNotes = getContentString(recordsContent, 'stc_two_day_notes', DEFAULT_RECORDS_CONTENT.stc_two_day_notes);
  const recStc50OverWins = getContentNumber(recordsContent, 'stc_50_over_wins', DEFAULT_RECORDS_CONTENT.stc_50_over_wins);
  const recStc50OverNotes = getContentString(recordsContent, 'stc_50_over_notes', DEFAULT_RECORDS_CONTENT.stc_50_over_notes);
  const recGscWins = getContentNumber(recordsContent, 'gsc_wins', DEFAULT_RECORDS_CONTENT.gsc_wins);
  const recGscWinsNotes = getContentString(recordsContent, 'gsc_wins_notes', DEFAULT_RECORDS_CONTENT.gsc_wins_notes);
  const recDraws = getContentNumber(recordsContent, 'draws', DEFAULT_RECORDS_CONTENT.draws);
  const recBestBowling = getContentString(recordsContent, 'best_bowling', DEFAULT_RECORDS_CONTENT.best_bowling);
  const recHighestScore = getContentString(recordsContent, 'highest_score', DEFAULT_RECORDS_CONTENT.highest_score);
  const recTwoDayMatches = getContentNumber(recordsContent, 'two_day_matches', DEFAULT_RECORDS_CONTENT.two_day_matches);
  const rec50OverMatches = getContentNumber(recordsContent, 'fifty_over_matches', DEFAULT_RECORDS_CONTENT.fifty_over_matches);

  // Highlights
  const highlightItems = getContentArray(
    highlightsContent,
    'items',
    DEFAULT_HIGHLIGHTS_CONTENT.items
  ) as Array<{ label: string; value: string; team: string }>;

  // Media / Memory Lane
  const photos = getContentArray(
    mediaContent,
    'photos',
    DEFAULT_MEDIA_CONTENT.photos
  ) as Array<{ src: string; caption: string }>;

  const activePhoto = lightboxIndex !== null ? photos[lightboxIndex] : null;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* ═══════════════════════════════════════════════════════════════════════
          1. HERO SECTION
          ═══════════════════════════════════════════════════════════════════════ */}
      <EditableSection sectionId="history-hero" pageId="match-history" type="text" title="Hero" content={{ ...DEFAULT_HERO_CONTENT }}>
        <motion.div variants={item} className="lux-card text-center py-8 px-6 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-gold/5 via-transparent to-transparent pointer-events-none" />

          <div className="relative z-10">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary tracking-tight mb-2">
              {heroHeading}
            </h1>
            <p className="text-text-secondary text-sm sm:text-base mb-8 tracking-wide">
              {heroSubtitle}
            </p>

            {/* Stats Row */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs sm:text-sm">
              <div className="flex items-center gap-1.5">
                <PremiumIcon name="matches" className="w-4 h-4 text-gold" />
                <span className="text-gold-bright font-bold">{heroTotalEncounters}</span>
                <span className="text-text-muted">Encounters</span>
              </div>
              <span className="text-lux-border hidden sm:inline">|</span>
              <div className="flex items-center gap-1.5">
                <span className="text-text-secondary font-medium">{heroYearStart}–{heroYearEnd}</span>
              </div>
              <span className="text-lux-border hidden sm:inline">|</span>
              <div className="flex items-center gap-1.5">
                <span className="text-gold font-bold">{heroStcWins}</span>
                <span className="text-text-muted">STC Wins</span>
              </div>
              <span className="text-lux-border hidden sm:inline">|</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[#E63946] font-bold">{heroGscWins}</span>
                <span className="text-text-muted">GSC Win</span>
              </div>
              <span className="text-lux-border hidden sm:inline">|</span>
              <div className="flex items-center gap-1.5">
                <span className="text-text-secondary font-bold">{heroDraws}</span>
                <span className="text-text-muted">Draws</span>
              </div>
            </div>
          </div>
        </motion.div>
      </EditableSection>

      {/* ═══════════════════════════════════════════════════════════════════════
          2. ORIGIN STORY
          ═══════════════════════════════════════════════════════════════════════ */}
      <EditableSection sectionId="history-origin" pageId="match-history" type="text" title="Origin Story" content={{ ...DEFAULT_ORIGIN_CONTENT }}>
        <motion.div variants={item} className="lux-card-gold">
          <h2 className="card-title">
            <span className="icon"><PremiumIcon name="clipboard" className="w-3.5 h-3.5 text-gold" /></span> The Origin
          </h2>
          <p className="text-text-primary text-sm leading-relaxed mb-5">
            {originText}
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-lux-surface p-4 border border-lux-border">
            <div className="flex items-center gap-2">
              <PremiumIcon name="target" className="w-4 h-4 text-gold" />
              <div>
                <p className="text-text-primary text-xs font-semibold">{originVenue}</p>
                <p className="text-text-muted text-[10px] tracking-wide">{originVenueDetail}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </EditableSection>

      {/* ═══════════════════════════════════════════════════════════════════════
          3. FORMAT EVOLUTION TIMELINE
          ═══════════════════════════════════════════════════════════════════════ */}
      <EditableSection sectionId="history-format" pageId="match-history" type="stats" title="Format Evolution" content={{ ...DEFAULT_FORMAT_CONTENT }}>
        <motion.div variants={item} className="lux-card">
          <h2 className="card-title">
            <span className="icon"><PremiumIcon name="timer" className="w-3.5 h-3.5 text-gold" /></span> Format Evolution
          </h2>

          {/* Legend */}
          <div className="flex items-center gap-4 mb-6 text-[10px] uppercase tracking-[2px] text-text-muted">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-gold rounded-full inline-block" />
              Two-Day
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-[#E63946] rounded-full inline-block" />
              50-Over
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-[#4A4945] rounded-full inline-block" />
              No Match
            </div>
          </div>

          {/* Timeline */}
          <div className="relative">
            {timelineItems.map((entry, idx) => (
              <div key={idx} className="relative flex gap-4 pb-6 last:pb-0">
                {/* Vertical connector line */}
                {idx < timelineItems.length - 1 && (
                  <div
                    className={`absolute left-[9px] top-5 w-[2px] h-[calc(100%-12px)] border-l-2 border-dashed ${getTimelineLineClasses(entry.dot_color)}`}
                  />
                )}

                {/* Dot */}
                <div className="relative z-10 flex-shrink-0 mt-1">
                  <div className={`w-5 h-5 rounded-full ${getTimelineDotClasses(entry.dot_color)} border-2 border-lux-bg`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-gold-bright text-xs font-bold tracking-wide">{entry.year}</p>
                  <p className="text-text-primary text-sm font-semibold">{entry.format}</p>
                  <p className="text-text-muted text-xs mt-0.5">{entry.description}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </EditableSection>

      {/* ═══════════════════════════════════════════════════════════════════════
          4. RECORD BOOK — Side-by-side STC vs GSC
          ═══════════════════════════════════════════════════════════════════════ */}
      <EditableSection sectionId="history-records" pageId="match-history" type="stats" title="Record Book" content={{ ...DEFAULT_RECORDS_CONTENT }}>
        <motion.div variants={item}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* STC Card — Gold Theme */}
            <div className="lux-card-gold relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-gold" />
              <div className="pl-3">
                <div className="flex items-center gap-2 mb-4">
                  <PremiumIcon name="trophy" className="w-4 h-4 text-gold" />
                  <h3 className="text-gold font-bold text-sm uppercase tracking-[2px]">STC Records</h3>
                </div>

                <div className="space-y-0">
                  <div className="stat-row">
                    <span className="text-text-secondary text-xs">Two-Day Wins</span>
                    <span className="text-gold text-xs font-bold">{recStcTwoDayWins}</span>
                  </div>
                  <p className="text-text-muted text-[10px] pl-0 pr-0 pb-2 -mt-1">{recStcTwoDayNotes}</p>
                  <div className="stat-row">
                    <span className="text-text-secondary text-xs">50-Over Wins</span>
                    <span className="text-gold text-xs font-bold">{recStc50OverWins}</span>
                  </div>
                  <p className="text-status-positive text-[10px] pl-0 pr-0 pb-2 -mt-1">{recStc50OverNotes}</p>
                  <div className="stat-row">
                    <span className="text-text-secondary text-xs">Total Wins</span>
                    <span className="text-gold-bright text-sm font-bold">{recStcTwoDayWins + recStc50OverWins}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* GSC Card — Red Theme */}
            <div className="lux-card relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#E63946]" />
              <div className="pl-3">
                <div className="flex items-center gap-2 mb-4">
                  <PremiumIcon name="star" className="w-4 h-4 text-[#E63946]" />
                  <h3 className="text-[#E63946] font-bold text-sm uppercase tracking-[2px]">GSC Records</h3>
                </div>

                <div className="space-y-0">
                  <div className="stat-row">
                    <span className="text-text-secondary text-xs">Two-Day Wins</span>
                    <span className="text-[#E63946] text-xs font-bold">{recGscWins}</span>
                  </div>
                  <p className="text-text-muted text-[10px] pl-0 pr-0 pb-2 -mt-1">{recGscWinsNotes}</p>
                  <div className="stat-row">
                    <span className="text-text-secondary text-xs">50-Over Wins</span>
                    <span className="text-text-muted text-xs font-bold">0</span>
                  </div>
                  <div className="stat-row">
                    <span className="text-text-secondary text-xs">Total Wins</span>
                    <span className="text-[#E63946] text-sm font-bold">{recGscWins}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Shared Record Stats */}
          <div className="lux-card mt-4">
            <div className="space-y-0">
              <div className="stat-row">
                <span className="text-text-secondary text-xs">Total Encounters</span>
                <span className="text-text-primary text-xs font-bold">{recTotalEncounters} ({recEncounterRange})</span>
              </div>
              <div className="stat-row">
                <span className="text-text-secondary text-xs">Draws</span>
                <span className="text-text-primary text-xs font-bold">{recDraws}</span>
              </div>
              <div className="stat-row">
                <span className="text-text-secondary text-xs">Best Bowling</span>
                <span className="text-gold text-xs font-bold">{recBestBowling}</span>
              </div>
              <div className="stat-row">
                <span className="text-text-secondary text-xs">Highest Score</span>
                <span className="text-gold text-xs font-bold">{recHighestScore}</span>
              </div>
            </div>
          </div>

          {/* Format Breakdown */}
          <div className="lux-card mt-4">
            <h2 className="card-title">
              <span className="icon"><PremiumIcon name="bar" className="w-3.5 h-3.5 text-gold" /></span> Format Breakdown
            </h2>

            <div className="space-y-3">
              {/* Stacked bar */}
              <div className="flex h-8 w-full overflow-hidden border border-lux-border">
                <motion.div
                  className="bg-gold/80 flex items-center justify-center"
                  initial={{ width: 0 }}
                  animate={{ width: `${(recTwoDayMatches / (recTwoDayMatches + rec50OverMatches)) * 100}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                >
                  <span className="text-lux-bg text-[10px] font-bold">{recTwoDayMatches}</span>
                </motion.div>
                <motion.div
                  className="bg-[#E63946]/80 flex items-center justify-center"
                  initial={{ width: 0 }}
                  animate={{ width: `${(rec50OverMatches / (recTwoDayMatches + rec50OverMatches)) * 100}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                >
                  <span className="text-white text-[10px] font-bold">{rec50OverMatches}</span>
                </motion.div>
              </div>

              {/* Labels */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-gold/80 inline-block" />
                  <span className="text-text-secondary">Two-Day Matches</span>
                  <span className="text-gold font-bold">{recTwoDayMatches}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-[#E63946]/80 inline-block" />
                  <span className="text-text-secondary">50-Over Matches</span>
                  <span className="text-[#E63946] font-bold">{rec50OverMatches}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </EditableSection>

      {/* ═══════════════════════════════════════════════════════════════════════
          KEY HIGHLIGHTS
          ═══════════════════════════════════════════════════════════════════════ */}
      <EditableSection sectionId="history-highlights" pageId="match-history" type="stats" title="Key Highlights" content={{ ...DEFAULT_HIGHLIGHTS_CONTENT }}>
        <motion.div variants={item} className="lux-card">
          <h2 className="card-title">
            <span className="icon"><PremiumIcon name="lightning" className="w-3.5 h-3.5 text-gold" /></span> Key Highlights
          </h2>
          <div className="space-y-3">
            {highlightItems.map((hl, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-3 p-3 bg-lux-surface border border-lux-border hover:border-gold/30 transition-colors duration-200"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${hl.team === 'STC' ? 'bg-gold' : 'bg-[#E63946]'}`} />
                  <span className="text-text-secondary text-xs truncate">{hl.label}</span>
                </div>
                <span className={`text-xs font-bold flex-shrink-0 ${hl.team === 'STC' ? 'text-gold' : 'text-[#E63946]'}`}>
                  {hl.value}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </EditableSection>

      {/* ═══════════════════════════════════════════════════════════════════════
          6. MEMORY LANE — Photo Grid with Lightbox
          ═══════════════════════════════════════════════════════════════════════ */}
      <EditableSection sectionId="history-media" pageId="match-history" type="media" title="Memory Lane" content={{ ...DEFAULT_MEDIA_CONTENT }}>
        <motion.div variants={item} className="lux-card">
          <h2 className="card-title">
            <span className="icon"><PremiumIcon name="film" className="w-3.5 h-3.5 text-gold" /></span> Memory Lane
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map((photo, idx) => (
              <button
                key={idx}
                onClick={() => setLightboxIndex(idx)}
                className="group relative bg-lux-surface border border-lux-border hover:border-gold/40 transition-colors duration-300 overflow-hidden cursor-pointer aspect-[4/3]"
              >
                {/* Vintage frame effect */}
                <div className="absolute inset-0 border-[3px] border-lux-elevated/60 pointer-events-none z-10" />
                {/* Inner shadow for vintage feel */}
                <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.4)] pointer-events-none z-10" />

                <Image
                  src={photo.src}
                  alt={photo.caption}
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Caption overlay */}
                <div className="absolute bottom-0 left-0 right-0 z-20 px-2 py-1.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                  <p className="text-[9px] sm:text-[10px] text-white/80 leading-tight line-clamp-2">
                    {photo.caption}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </EditableSection>

      {/* ═══════════════════════════════════════════════════════════════════════
          LIGHTBOX MODAL
          ═══════════════════════════════════════════════════════════════════════ */}
      {lightboxIndex !== null && activePhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <div
            className="relative max-w-3xl w-full max-h-[85vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white transition-colors z-50"
              aria-label="Close lightbox"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Image */}
            <div className="relative w-full aspect-[4/3] border border-lux-border bg-lux-surface">
              {/* Vintage frame */}
              <div className="absolute inset-0 border-[6px] border-lux-elevated/50 pointer-events-none z-10" />
              <Image
                src={activePhoto.src}
                alt={activePhoto.caption}
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-contain"
                priority
              />
            </div>

            {/* Caption */}
            <p className="text-text-primary text-xs sm:text-sm text-center mt-4 max-w-lg leading-relaxed">
              {activePhoto.caption}
            </p>

            {/* Navigation arrows */}
            <div className="flex items-center gap-6 mt-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex(lightboxIndex > 0 ? lightboxIndex - 1 : photos.length - 1);
                }}
                className="text-white/60 hover:text-gold transition-colors"
                aria-label="Previous photo"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-text-muted text-xs">
                {lightboxIndex + 1} / {photos.length}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex(lightboxIndex < photos.length - 1 ? lightboxIndex + 1 : 0);
                }}
                className="text-white/60 hover:text-gold transition-colors"
                aria-label="Next photo"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          7. DYNAMIC SECTIONS
          ═══════════════════════════════════════════════════════════════════════ */}
      <DynamicSections pageId="match-history" />
    </motion.div>
  );
}
