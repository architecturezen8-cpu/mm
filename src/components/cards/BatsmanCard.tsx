'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Card from '@/components/ui/lux-card';
import AnimatedCounter from '@/components/ui/animated-counter';
import { CurrentBatsman } from '@/lib/types';
import { PLAYER_CDN_PHOTOS } from '@/lib/constants';

// St.Thomas' players list
const STC_PLAYERS = [
  'Dilith Perera', 'Kavinda Silva', 'Ranithu Fernando', 'Senal Jayawardena',
  'Thenuka Wickramasinghe', 'Vidunu Dissanayake', 'Mahima Ratnayake',
  'Dulanjana Wijeratne', 'Kisal Alahakoon', 'Nethma Herath', 'Sahan Bandaranayake',
];

// Fallback local images when CDN image fails to load
const LOCAL_FALLBACK_PHOTOS: Record<string, string> = {
  'Dilith Perera': '/players/thomian-batsman.png',
  'Kavinda Silva': '/players/thomian-batsman.png',
  'Ranithu Fernando': '/players/thomian-batsman.png',
  'Senal Jayawardena': '/players/thomian-allrounder.png',
  'Thenuka Wickramasinghe': '/players/thomian-allrounder.png',
  'Vidunu Dissanayake': '/players/thomian-allrounder.png',
  'Mahima Ratnayake': '/players/thomian-batsman.png',
  'Dulanjana Wijeratne': '/players/thomian-allrounder.png',
  'Kisal Alahakoon': '/players/thomian-allrounder.png',
  'Nethma Herath': '/players/thomian-allrounder.png',
  'Sahan Bandaranayake': '/players/thomian-allrounder.png',
  'Yasiru Rodrigo': '/players/science-batsman.png',
  'Hiruna Goonewardene': '/players/science-batsman.png',
  'Daham Dharmaratne': '/players/science-batsman.png',
  'Tharindu Wickramanayake': '/players/science-bowler.png',
  'Lakshitha Weerasinghe': '/players/science-bowler.png',
  'Ramitha Silva': '/players/science-bowler.png',
  'Seniru Pasqual': '/players/science-batsman.png',
  'Ashen Bandara': '/players/science-bowler.png',
  'Chamindu Asal': '/players/science-bowler.png',
  'Malith Rathnayake': '/players/science-bowler.png',
  'Tharana Walpita': '/players/science-bowler.png',
};

interface BatsmanCardProps {
  batsman: CurrentBatsman;
  delay?: number;
}

export default function BatsmanCard({ batsman, delay = 0 }: BatsmanCardProps) {
  const isSTC = STC_PLAYERS.includes(batsman.name);
  const teamColor = isSTC ? '#FFC300' : '#E63946';

  // Check if this is an offline/placeholder batsman (no photoUrl, not a known player)
  const isOfflinePlaceholder = !batsman.photoUrl && !PLAYER_CDN_PHOTOS[batsman.name] && !LOCAL_FALLBACK_PHOTOS[batsman.name];

  // Priority: 1) batsman.photoUrl (from admin/live data), 2) CDN mapping, 3) local fallback
  const getPhotoUrl = () => {
    if (batsman.photoUrl && batsman.photoUrl.trim()) {
      // External URLs (CDN, ImgBB, etc.) — use directly
      if (batsman.photoUrl.startsWith('http')) {
        return batsman.photoUrl;
      }
      // Non-standard paths that aren't local images
      if (!batsman.photoUrl.startsWith('/images/')) {
        return batsman.photoUrl;
      }
    }
    // Use GitHub CDN mapping as primary fallback
    if (PLAYER_CDN_PHOTOS[batsman.name]) {
      return PLAYER_CDN_PHOTOS[batsman.name];
    }
    // Final fallback: local placeholder images
    return LOCAL_FALLBACK_PHOTOS[batsman.name] || (isSTC ? '/players/thomian-batsman.png' : '/players/science-batsman.png');
  };

  const primaryPhotoUrl = getPhotoUrl();
  const fallbackPhotoUrl = LOCAL_FALLBACK_PHOTOS[batsman.name] || (isSTC ? '/players/thomian-batsman.png' : '/players/science-batsman.png');

  // Track image loading errors for fallback
  const [imgError, setImgError] = useState(false);
  const [fallbackError, setFallbackError] = useState(false);

  // For offline placeholders, skip image loading entirely and show initials
  const shouldShowInitials = isOfflinePlaceholder || fallbackError;
  const photoUrl = imgError ? fallbackPhotoUrl : primaryPhotoUrl;
  const isExternalPhoto = photoUrl.startsWith('http');

  // Generate initials for when no image is available
  const initials = batsman.initials || batsman.name.split(' ').map(n => n[0]).join('');

  return (
    <Card delay={delay}>
      <div className="flex gap-4 sm:gap-6 items-start">
        {/* Player Photo with team color border */}
        <div
          className="w-14 h-14 sm:w-20 sm:h-20 overflow-hidden border-2 flex-shrink-0 relative"
          style={{ borderColor: teamColor }}
        >
          {shouldShowInitials ? (
            // No image available — show initials
            <div
              className="w-full h-full flex items-center justify-center text-lg sm:text-xl font-bold"
              style={{ color: teamColor, backgroundColor: `${teamColor}10` }}
            >
              {initials}
            </div>
          ) : (
            <Image
              src={photoUrl}
              alt={batsman.name}
              fill
              sizes="(max-width: 640px) 56px, 80px"
              className="object-cover object-top"
              unoptimized={isExternalPhoto}
              onError={() => {
                if (!imgError) {
                  setImgError(true);
                } else {
                  setFallbackError(true);
                }
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-lux-bg/40 to-transparent" />
          {/* Striking indicator */}
          {batsman.isStriking && (
            <motion.div
              layoutId="striking-indicator"
              className="absolute bottom-0 left-0 right-0 h-[2px]"
              style={{ background: teamColor }}
              transition={{ type: 'spring', stiffness: 500, damping: 40 }}
            />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-5">
            <h3 className="text-xs sm:text-sm font-semibold text-text-primary tracking-wider truncate">{batsman.name}</h3>
            <span className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-[2px] px-1.5 sm:px-2 py-0.5 flex-shrink-0 ${
              batsman.isStriking
                ? 'bg-gold-ghost text-gold border border-gold-dim/30'
                : 'bg-lux-surface text-text-muted border border-lux-border'
            }`}>
              {batsman.isStriking ? 'Striking' : 'Active'}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2 sm:gap-3">
            <div>
              <p className="text-2xl sm:text-3xl font-extralight tracking-wider" style={{ color: teamColor }}>
                <AnimatedCounter value={batsman.runs} />
              </p>
              <p className="text-[8px] sm:text-[9px] uppercase tracking-[2px] text-text-muted mt-1 sm:mt-2">Runs</p>
            </div>
            <div>
              <p className="text-base sm:text-lg font-light text-text-primary tracking-wider">
                <AnimatedCounter value={batsman.balls} />
              </p>
              <p className="text-[8px] sm:text-[9px] uppercase tracking-[2px] text-text-muted mt-1 sm:mt-2">Balls</p>
            </div>
            <div>
              <p className="text-base sm:text-lg font-light text-text-secondary tracking-wider">
                <AnimatedCounter value={batsman.sr} decimals={1} />
              </p>
              <p className="text-[8px] sm:text-[9px] uppercase tracking-[2px] text-text-muted mt-1 sm:mt-2">SR</p>
            </div>
            <div>
              <p className="text-base sm:text-lg font-light text-text-secondary tracking-wider">{batsman.fours}</p>
              <p className="text-[8px] sm:text-[9px] uppercase tracking-[2px] text-text-muted mt-1 sm:mt-2">4s</p>
            </div>
            <div>
              <p className="text-base sm:text-lg font-light text-text-secondary tracking-wider">{batsman.sixes}</p>
              <p className="text-[8px] sm:text-[9px] uppercase tracking-[2px] text-text-muted mt-1 sm:mt-2">6s</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
