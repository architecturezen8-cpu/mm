'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

/**
 * VotingComingSoon — Super Premium "Coming Soon" display shown when
 * Turso voting connection is disconnected.
 *
 * Premium SVG icons, glass morphism, animated gradient borders,
 * light rays, sparkle effects, and refined typography.
 */

// Premium keyframes
const premiumKeyframes = `
@keyframes premiumShimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes premiumPulse {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.08); }
}
@keyframes vsGlow {
  0%, 100% { text-shadow: 0 0 6px rgba(255,195,0,0.2), 0 0 16px rgba(255,195,0,0.08); }
  50% { text-shadow: 0 0 12px rgba(255,195,0,0.5), 0 0 32px rgba(255,195,0,0.15); }
}
@keyframes floatUp {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
}
@keyframes borderRotate {
  0% { --border-angle: 0deg; }
  100% { --border-angle: 360deg; }
}
@keyframes sparkle {
  0%, 100% { opacity: 0; transform: scale(0.5); }
  50% { opacity: 1; transform: scale(1); }
}
@keyframes rayRotate {
  0% { transform: translate(-50%, -50%) rotate(0deg); }
  100% { transform: translate(-50%, -50%) rotate(360deg); }
}
@keyframes slideIn {
  0% { opacity: 0; transform: translateY(8px); }
  100% { opacity: 1; transform: translateY(0); }
}
`;

// ─── Premium SVG Icons ───
function IconTrophy({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 010-5C7 4 7 7 7 7" />
      <path d="M18 9h1.5a2.5 2.5 0 000-5C17 4 17 7 17 7" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0012 0V2z" />
    </svg>
  );
}

function IconTarget({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" strokeOpacity="0.4" />
    </svg>
  );
}

function IconChart({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10" />
      <path d="M12 20V4" />
      <path d="M6 20v-6" />
    </svg>
  );
}

function IconVote({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  );
}

function IconStar({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function IconFire({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 12c2-2.96 0-7-1-8 0 3.038-1.773 4.741-3 6-1.226 1.26-2 3.24-2 5a6 6 0 1012 0c0-1.532-1.056-3.94-2-5-1.786 3-2.791 3-4 2z" />
    </svg>
  );
}

function IconBat({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0012 0V2z" />
    </svg>
  );
}

function IconSparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z" />
    </svg>
  );
}

// ─── Animated Gradient Border Component ───
function GradientBorder({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative rounded-2xl p-[1px] ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(255,195,0,0.3), rgba(230,57,70,0.15), rgba(255,195,0,0.1), rgba(230,57,70,0.3))',
        backgroundSize: '300% 300%',
        animation: 'premiumShimmer 6s ease-in-out infinite',
      }}
    >
      {children}
    </div>
  );
}

// ─── Feature Pill with SVG Icon ───
function FeaturePill({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] sm:text-[10px] font-semibold uppercase tracking-[1.5px] transition-all duration-300"
      style={{
        background: `linear-gradient(135deg, ${color}08, ${color}03)`,
        border: `1px solid ${color}20`,
        color: `${color}B0`,
      }}
    >
      <span style={{ color: `${color}CC` }}>{icon}</span>
      {label}
    </span>
  );
}

interface VotingComingSoonProps {
  variant?: 'voting' | 'predictions';
}

export default function VotingComingSoon({ variant = 'voting' }: VotingComingSoonProps) {
  return (
    <>
      {/* Inject premium keyframes */}
      <style dangerouslySetInnerHTML={{ __html: premiumKeyframes }} />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <GradientBorder>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#0c0c12] via-[#08080c] to-[#060609]">

            {/* ─── Background Effects ─── */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {/* Gold ambient glow - top */}
              <div
                style={{ animation: 'premiumPulse 5s ease-in-out infinite' }}
                className="absolute -top-24 -left-16 w-72 h-72 rounded-full bg-[#FFC300]/[0.06] blur-[100px]"
              />
              {/* Red ambient glow - bottom */}
              <div
                style={{ animation: 'premiumPulse 5s ease-in-out infinite 2.5s' }}
                className="absolute -bottom-24 -right-16 w-72 h-72 rounded-full bg-[#E63946]/[0.06] blur-[100px]"
              />

              {/* Rotating light rays from center */}
              <div
                className="absolute top-1/2 left-1/2 w-[300px] h-[300px] opacity-[0.03]"
                style={{
                  background: 'conic-gradient(from 0deg, transparent 0%, #FFC300 8%, transparent 16%, transparent 50%, #E63946 58%, transparent 66%)',
                  animation: 'rayRotate 20s linear infinite',
                }}
              />

              {/* Sparkle dots */}
              <div className="absolute top-[15%] left-[20%]" style={{ animation: 'sparkle 3s ease-in-out infinite' }}>
                <IconSparkle className="w-2 h-2 text-[#FFC300]/40" />
              </div>
              <div className="absolute top-[25%] right-[18%]" style={{ animation: 'sparkle 3s ease-in-out infinite 1s' }}>
                <IconSparkle className="w-1.5 h-1.5 text-[#E63946]/30" />
              </div>
              <div className="absolute bottom-[20%] left-[30%]" style={{ animation: 'sparkle 3s ease-in-out infinite 2s' }}>
                <IconSparkle className="w-1.5 h-1.5 text-[#FFC300]/30" />
              </div>
              <div className="absolute top-[40%] right-[25%]" style={{ animation: 'sparkle 4s ease-in-out infinite 0.5s' }}>
                <IconSparkle className="w-1 h-1 text-[#FFE066]/40" />
              </div>
            </div>

            {/* ─── Top shimmer border ─── */}
            <div
              className="absolute top-0 left-0 right-0 h-[1px] z-20"
              style={{
                background: 'linear-gradient(90deg, transparent 10%, #FFC300/50 30%, #E63946/50 70%, transparent 90%)',
                backgroundSize: '200% 100%',
                animation: 'premiumShimmer 4s ease-in-out infinite',
              }}
            />

            {/* ─── Content ─── */}
            <div className="relative z-10 py-10 sm:py-12 px-6 sm:px-8 text-center space-y-6">

              {/* Trophy Icon with double ring */}
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.6, type: 'spring', stiffness: 180, damping: 15 }}
                className="flex justify-center"
              >
                <div
                  className="relative"
                  style={{ animation: 'floatUp 3.5s ease-in-out infinite' }}
                >
                  {/* Outer ring */}
                  <div className="absolute -inset-3 rounded-full border border-[#FFC300]/[0.08]"
                    style={{ animation: 'premiumPulse 3s ease-in-out infinite' }}
                  />
                  {/* Middle ring */}
                  <div className="absolute -inset-1.5 rounded-full border border-[#FFC300]/[0.12]"
                    style={{ animation: 'premiumPulse 3s ease-in-out infinite 1s' }}
                  />
                  {/* Icon container */}
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, #FFC300/10 0%, #FFC300/03 50%, #E63946/05 100%)',
                      border: '1px solid #FFC300/20',
                      boxShadow: '0 0 24px #FFC300/08, inset 0 1px 0 #FFC300/10',
                    }}
                  >
                    <IconTrophy className="w-7 h-7 sm:w-8 sm:h-8 text-[#FFC300]" />
                  </div>
                </div>
              </motion.div>

              {/* Team Logos VS Section */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="flex items-center justify-center gap-5 sm:gap-7"
              >
                {/* STC Logo with ring */}
                <div className="relative">
                  <div className="absolute -inset-1.5 rounded-full border border-[#FFC300]/[0.1]"
                    style={{ animation: 'premiumPulse 4s ease-in-out infinite' }}
                  />
                  <div className="relative w-11 h-11 sm:w-13 sm:h-13 rounded-full p-[2px]"
                    style={{
                      background: 'linear-gradient(135deg, #FFC300/40, #FFC300/10)',
                    }}
                  >
                    <div className="w-full h-full rounded-full bg-[#0c0c12] p-[3px]">
                      <Image
                        src="/logos/st-thomas-college-matale.jpg"
                        alt="St.Thomas' College Matale"
                        width={44}
                        height={44}
                        className="w-full h-full object-contain rounded-full"
                      />
                    </div>
                  </div>
                </div>

                {/* VS Badge */}
                <div className="flex flex-col items-center gap-1">
                  <div className="h-[1px] w-6 bg-gradient-to-r from-[#FFC300]/30 to-transparent" />
                  <div
                    className="text-[#FFC300] text-sm sm:text-base font-black uppercase tracking-[5px]"
                    style={{ animation: 'vsGlow 2.5s ease-in-out infinite' }}
                  >
                    VS
                  </div>
                  <div className="h-[1px] w-6 bg-gradient-to-l from-[#E63946]/30 to-transparent" />
                </div>

                {/* GSC Logo with ring */}
                <div className="relative">
                  <div className="absolute -inset-1.5 rounded-full border border-[#E63946]/[0.1]"
                    style={{ animation: 'premiumPulse 4s ease-in-out infinite 2s' }}
                  />
                  <div className="relative w-11 h-11 sm:w-13 sm:h-13 rounded-full p-[2px]"
                    style={{
                      background: 'linear-gradient(135deg, #E63946/40, #E63946/10)',
                    }}
                  >
                    <div className="w-full h-full rounded-full bg-[#0c0c12] p-[3px]">
                      <Image
                        src="/logos/govt-science-college-matale.jpg"
                        alt="Govt. Science College Matale"
                        width={44}
                        height={44}
                        className="w-full h-full object-contain rounded-full"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Main Heading with shimmer gradient */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="space-y-2.5"
              >
                <h3
                  className="text-[15px] sm:text-lg font-bold uppercase tracking-[3px] sm:tracking-[5px]"
                  style={{
                    background: 'linear-gradient(105deg, #FFC300 0%, #FFE066 25%, #FFC300 45%, #FFFFFF 50%, #FFC300 55%, #E63946 75%, #FF6B6B 100%)',
                    backgroundSize: '250% 100%',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    animation: 'premiumShimmer 5s ease-in-out infinite',
                  }}
                >
                  The Ultimate Clash Awaits
                </h3>
                <p className="text-[#6B6860] text-[11px] sm:text-[13px] font-medium leading-relaxed max-w-[260px] mx-auto tracking-wide">
                  Get Ready to Unleash Your Vote on Match Day!
                </p>
              </motion.div>

              {/* Decorative diamond divider */}
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center justify-center gap-2.5"
              >
                <div className="h-[1px] w-10 sm:w-14 bg-gradient-to-r from-transparent via-[#FFC300]/25 to-[#FFC300]/40" />
                <div className="w-1 h-1 rotate-45 bg-[#FFC300]/50" />
                <div className="w-1.5 h-1.5 rotate-45 border border-[#FFC300]/30" />
                <div className="w-1 h-1 rotate-45 bg-[#E63946]/50" />
                <div className="h-[1px] w-10 sm:w-14 bg-gradient-to-l from-transparent via-[#E63946]/25 to-[#E63946]/40" />
              </motion.div>

              {/* Feature pills with SVG icons */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="flex flex-wrap items-center justify-center gap-2"
              >
                {variant === 'predictions' ? (
                  <>
                    <FeaturePill icon={<IconTarget className="w-3 h-3" />} label="Predictions" color="#FFC300" />
                    <FeaturePill icon={<IconBat className="w-3 h-3" />} label="Top Scorer" color="#FF8C00" />
                    <FeaturePill icon={<IconStar className="w-3 h-3" />} label="Player of Match" color="#E63946" />
                  </>
                ) : (
                  <>
                    <FeaturePill icon={<IconVote className="w-3 h-3" />} label="Crowd Choice" color="#FFC300" />
                    <FeaturePill icon={<IconChart className="w-3 h-3" />} label="Live Polls" color="#FF8C00" />
                    <FeaturePill icon={<IconFire className="w-3 h-3" />} label="6 Categories" color="#E63946" />
                  </>
                )}
              </motion.div>

              {/* Match day badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="flex justify-center"
              >
                <span
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[8px] sm:text-[9px] font-bold uppercase tracking-[2.5px]"
                  style={{
                    background: 'linear-gradient(135deg, #FFC300/06, #E63946/04)',
                    border: '1px solid #FFC300/12',
                    color: '#6B6860',
                    boxShadow: '0 0 12px #FFC300/04',
                  }}
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFC300]/40" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#FFC300]/60" />
                  </span>
                  Available on Match Day
                </span>
              </motion.div>
            </div>

            {/* ─── Bottom shimmer border ─── */}
            <div
              className="absolute bottom-0 left-0 right-0 h-[1px] z-20"
              style={{
                background: 'linear-gradient(90deg, transparent 10%, #E63946/50 30%, #FFC300/50 70%, transparent 90%)',
                backgroundSize: '200% 100%',
                animation: 'premiumShimmer 4s ease-in-out infinite reverse',
              }}
            />
          </div>
        </GradientBorder>
      </motion.div>
    </>
  );
}
