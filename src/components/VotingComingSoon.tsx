'use client';

import Image from 'next/image';

interface VotingComingSoonProps {
  variant?: 'voting' | 'predictions';
}

export default function VotingComingSoon({ variant = 'voting' }: VotingComingSoonProps) {
  const title = variant === 'predictions' ? 'The Ultimate Clash Awaits' : 'The Crowd Choice Awaits';
  const subtitle = variant === 'predictions'
    ? 'Get ready to submit your predictions on match day.'
    : 'Voting is currently closed. Polls will open when the admin enables voting.';

  return (
    <div className="relative overflow-hidden border border-gold/25 bg-gradient-to-b from-[#0c0c12] via-[#08080c] to-[#050507] p-[1px]">
      <div className="relative overflow-hidden bg-[#08080c]/95 px-5 py-8 sm:px-7 sm:py-10 text-center">
        {/* Static premium ambience — no heavy looping overlay */}
        <div className="absolute -top-24 -left-20 w-64 h-64 rounded-full bg-gold/[0.045] blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-20 w-64 h-64 rounded-full bg-[#E63946]/[0.04] blur-[80px] pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#E63946]/35 to-transparent" />

        <div className="relative z-10 space-y-5">
          <div className="flex items-center justify-center gap-5 sm:gap-7">
            <div className="w-12 h-12 rounded-full bg-black/30 border border-gold/20 p-1.5 shadow-[0_0_20px_rgba(255,195,0,0.08)]">
              <Image src="/logos/st-thomas-college-matale.jpg" alt="STC" width={48} height={48} className="w-full h-full object-contain rounded-full" />
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-px w-8 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
              <span className="text-gold text-sm font-black tracking-[5px]">VS</span>
              <div className="h-px w-8 bg-gradient-to-r from-transparent via-[#E63946]/40 to-transparent" />
            </div>
            <div className="w-12 h-12 rounded-full bg-black/30 border border-[#E63946]/20 p-1.5 shadow-[0_0_20px_rgba(230,57,70,0.08)]">
              <Image src="/logos/govt-science-college-matale.jpg" alt="GSC" width={48} height={48} className="w-full h-full object-contain rounded-full" />
            </div>
          </div>

          <div>
            <p className="text-[9px] uppercase tracking-[4px] text-text-muted mb-2">Battle of the Golds</p>
            <h3
              className="text-base sm:text-xl font-black uppercase tracking-[3px] sm:tracking-[5px]"
              style={{
                background: 'linear-gradient(105deg, #FFC300 0%, #FFE066 35%, #FFC300 58%, #E63946 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-text-secondary mt-3 max-w-sm mx-auto leading-relaxed">
              {subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="px-3 py-1.5 border border-gold/20 bg-gold/5 text-[9px] uppercase tracking-[2px] text-gold/80">Admin Controlled</span>
            <span className="px-3 py-1.5 border border-lux-border bg-white/[0.02] text-[9px] uppercase tracking-[2px] text-text-muted">Zero Lag Mode</span>
            <span className="px-3 py-1.5 border border-[#E63946]/20 bg-[#E63946]/5 text-[9px] uppercase tracking-[2px] text-[#E63946]/70">Await Match Day</span>
          </div>
        </div>
      </div>
    </div>
  );
}
