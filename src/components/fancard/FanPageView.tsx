'use client';

import Image from 'next/image';
import { SCHOOL_INFO, BG_PATHS, DEFAULT_FAN_CARD_TEXT } from './types';
import type { School, BgColor } from './types';
import { motion } from 'framer-motion';
import { Sparkles, ArrowLeft, User } from 'lucide-react';
import { useSectionContent } from '@/lib/useSectionContent';
import { useRouter } from 'next/navigation';

interface FanPageViewProps {
  name: string;
  school: School;
  batch: string;
  bgColor: BgColor;
}

export default function FanPageView({ name, school, batch, bgColor }: FanPageViewProps) {
  const router = useRouter();
  const schoolInfo = SCHOOL_INFO[school];
  const bgPath = BG_PATHS[bgColor];
  const hashtag = `#${name.toUpperCase().replace(/\s+/g, '')}`;
  const rawFanCardText = useSectionContent('legacy-fan-card', DEFAULT_FAN_CARD_TEXT);
  const fanCardText = {
    event_overline: rawFanCardText.event_overline || DEFAULT_FAN_CARD_TEXT.event_overline,
    title_line1: rawFanCardText.title_line1 || DEFAULT_FAN_CARD_TEXT.title_line1,
    title_line2: rawFanCardText.title_line2 || DEFAULT_FAN_CARD_TEXT.title_line2,
    stc_cheers: rawFanCardText.stc_cheers || DEFAULT_FAN_CARD_TEXT.stc_cheers,
    gsc_cheers: rawFanCardText.gsc_cheers || DEFAULT_FAN_CARD_TEXT.gsc_cheers,
    website: rawFanCardText.website || DEFAULT_FAN_CARD_TEXT.website,
    branding_image: rawFanCardText.branding_image || DEFAULT_FAN_CARD_TEXT.branding_image,
  };
  const cheersText = school === 'gsc' ? fanCardText.gsc_cheers : fanCardText.stc_cheers;

  return (
    <div className="min-h-screen bg-lux-bg flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url(${bgPath})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(60px) saturate(1.5)',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-lux-bg/80 via-lux-bg/90 to-lux-bg" />

      <div className="relative z-10 w-full max-w-md text-center">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => router.push('/')}
          className="absolute -top-16 left-0 flex items-center gap-2 text-text-muted hover:text-text-secondary transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </motion.button>

        {/* Fan Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-lux-border bg-lux-card"
        >
          <Sparkles className="w-4 h-4 text-gold" />
          <span className="text-text-secondary text-xs uppercase tracking-[2px] font-medium">Official Fan</span>
        </motion.div>

        {/* School Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex justify-center mb-6"
        >
          <div className="w-20 h-20 bg-white rounded-xl p-2 shadow-lg shadow-black/40">
            <Image src={schoolInfo.logo} alt={schoolInfo.shortName} width={64} height={64} style={{ objectFit: 'contain' }} unoptimized />
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="uppercase mb-3"
          style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
        >
          <div className="text-[10px] sm:text-xs font-extrabold tracking-[5px] text-gold/90 mb-2">
            {fanCardText.event_overline}
          </div>
          <div className="text-2xl sm:text-4xl font-black tracking-[2px] text-text-primary leading-none" style={{ textShadow: '0 5px 14px rgba(0, 0, 0, 0.7)' }}>
            {fanCardText.title_line1}
          </div>
          <div
            className="text-4xl sm:text-6xl font-black tracking-[6px] leading-none"
            style={{
              color: '#FFC300',
              textShadow: '0 5px 16px rgba(0, 0, 0, 0.75), 0 0 26px rgba(255, 195, 0, 0.22)',
            }}
          >
            {fanCardText.title_line2}
          </div>
          <div className="w-32 h-px mx-auto mt-4" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,195,0,0.8), transparent)' }} />
        </motion.div>

        {/* Fan Name Hashtag */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-6 mb-2"
        >
          <span
            className="text-4xl sm:text-5xl font-bold text-text-primary tracking-wide"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
          >
            {hashtag}
          </span>
        </motion.div>

        {/* Cheers Text */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="inline-block text-lg sm:text-xl font-extrabold text-white uppercase tracking-[2px] mb-4 px-5 py-2 border-y border-gold/40 bg-gold/10"
          style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5), 0 0 16px rgba(255,195,0,0.2)' }}
        >
          {cheersText}
        </motion.p>

        {/* School + Batch */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mb-8 space-y-1"
        >
          <p className="text-text-secondary text-sm uppercase tracking-widest font-semibold">{schoolInfo.name}</p>
          {batch && <p className="text-text-muted text-sm uppercase tracking-widest">{batch}</p>}
        </motion.div>

        {/* Avatar Placeholder */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="mx-auto w-24 h-24 rounded-full border-2 border-lux-border bg-lux-card flex items-center justify-center mb-8"
        >
          <User className="w-10 h-10 text-text-muted/30" />
        </motion.div>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="w-32 h-px mx-auto mb-8"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,195,0,0.3), transparent)' }}
        />

        {/* Branding */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 }}
          className="flex items-center justify-center gap-2 mb-6"
        >
          <img src={fanCardText.branding_image} alt="Thomians' Media" className="w-36 h-auto opacity-70" />
        </motion.div>

        {/* CTA - Create your own card */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push('/')}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-sm font-semibold text-sm uppercase tracking-wider transition-all duration-300"
          style={{
            background: 'linear-gradient(135deg, #f7b717, #FFC300, #FFD54F)',
            color: '#0a0a0a',
            boxShadow: '0 4px 20px rgba(247, 183, 23, 0.3)',
          }}
        >
          <Sparkles className="w-4 h-4" />
          Create Your Fan Card
        </motion.button>

        {/* Website */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 text-text-muted/30 text-xs tracking-widest"
        >
          {fanCardText.website}
        </motion.p>
      </div>
    </div>
  );
}
