'use client';

import { motion } from 'framer-motion';

/**
 * Shared "Supabase Offline" banner — shown at the top of pages/tabs
 * when the Supabase Connection toggle is OFF.
 *
 * Design: Glowing red banner, "Enabled on Match Day" style.
 * Only affects LIVE SCORE DATA — voting works independently via Turso.
 */
export default function SupabaseOfflineBanner({ className = '' }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35 }}
      className={`relative overflow-hidden rounded-lg border border-[#E63946]/40 ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(230,57,70,0.12) 0%, rgba(230,57,70,0.04) 50%, rgba(230,57,70,0.08) 100%)',
      }}
    >
      {/* Animated glow border effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(230,57,70,0.15) 50%, transparent 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 3s ease-in-out infinite',
        }}
      />

      <div className="relative z-10 flex items-center gap-3 px-4 py-3">
        {/* Icon with pulsing ring */}
        <div className="relative shrink-0">
          <span className="absolute inset-0 rounded-full bg-[#E63946]/20 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full border border-[#E63946]/40 bg-[#E63946]/10">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#E63946]" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M4.93 4.93l14.14 14.14" />
            </svg>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[#E63946] text-[10px] sm:text-[11px] font-bold uppercase tracking-[3px]">
            Enabled on Match Day
          </p>
          <p className="text-text-muted text-[9px] sm:text-[10px] mt-0.5">
            Live score data is currently offline. Voting &amp; predictions still work independently via Turso.
          </p>
        </div>

        {/* Status dot */}
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full bg-[#E63946] opacity-40" />
          <span className="relative inline-flex h-2 w-2 bg-[#E63946] rounded-full" />
        </span>
      </div>
    </motion.div>
  );
}
