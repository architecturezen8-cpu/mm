'use client';

import Image from 'next/image';
import { SCHOOL_INFO, BG_PATHS } from './types';
import type { School, BgColor } from './types';
import { motion } from 'framer-motion';
import { Sparkles, ArrowLeft, User } from 'lucide-react';
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
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-3xl sm:text-4xl font-extrabold text-text-primary uppercase tracking-wider mb-2"
          style={{
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
            textShadow: '0 4px 12px rgba(0, 0, 0, 0.6)',
          }}
        >
          Battle Of The Golds
        </motion.h1>

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
          className="text-xl sm:text-2xl font-bold text-gold uppercase tracking-wider mb-4"
          style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
        >
          {schoolInfo.cheers}
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
          <span className="text-text-muted text-xs uppercase tracking-wider">
            <span className="font-bold">THOMIANS&apos;</span>
            <span className="font-light ml-1">MEDIA</span>
          </span>
          <div className="flex w-4 h-2.5" style={{ transform: 'skewX(25deg)' }}>
            <div className="w-1/3 h-full bg-[#1a3668]" />
            <div className="w-1/3 h-full bg-[#4a7ebb]" />
            <div className="w-1/3 h-full bg-[#f7b717]" />
          </div>
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
          www.thomiansmedia.us
        </motion.p>
      </div>
    </div>
  );
}
