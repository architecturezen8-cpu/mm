'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

interface ComingSoonBannerProps {
  title?: string;
  details?: string;
  countdownDate?: string;
}

export default function ComingSoonBanner({ title = 'Coming Soon', details = '', countdownDate = '' }: ComingSoonBannerProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const targetDate = new Date(countdownDate);
  const hasCountdown = !isNaN(targetDate.getTime());

  useEffect(() => {
    if (!hasCountdown) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance < 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [hasCountdown, targetDate]);

  const units = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Mins', value: timeLeft.minutes },
    { label: 'Secs', value: timeLeft.seconds },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="relative mb-4 sm:mb-6"
    >
      {/* Animated traveling border wrapper */}
      <div className="relative overflow-hidden" style={{ padding: '1.5px' }}>
        {/* The traveling golden border — uses a conic gradient that rotates */}
        <div
          className="absolute inset-0"
          style={{
            background: `conic-gradient(
              from var(--coming-soon-angle, 0deg),
              transparent 0%,
              transparent 30%,
              rgba(255, 195, 0, 0.9) 40%,
              rgba(255, 213, 79, 1) 50%,
              rgba(255, 195, 0, 0.9) 60%,
              transparent 70%,
              transparent 100%
            )`,
            animation: 'coming-soon-rotate 4s linear infinite',
          }}
        />

        {/* Inner content card */}
        <div
          className="relative z-10"
          style={{
            background: 'linear-gradient(135deg, #0a0808 0%, #141008 50%, #0a0a0f 100%)',
          }}
        >
          <div className="py-5 sm:py-7 px-4 sm:px-6 text-center">
            {/* Top label */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FFC300]" />
              <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-[3px] sm:tracking-[4px] text-[#8A8780]">
                Upcoming
              </span>
            </div>

            {/* Title with gold gradient */}
            <h2
              className="text-base sm:text-2xl font-black tracking-[3px] sm:tracking-[5px] uppercase mb-4"
              style={{
                background: 'linear-gradient(135deg, #FFC300, #FFD54F, #FFC300)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {title}
            </h2>

            {/* Countdown Timer */}
            {hasCountdown && (
              <div className="flex items-center justify-center gap-2 sm:gap-5 mb-3">
                {units.map((unit, i) => (
                  <div key={unit.label} className="flex items-center gap-2 sm:gap-5">
                    {i > 0 && <span className="text-[#FFC300] text-sm sm:text-xl font-light">:</span>}
                    <div className="flex flex-col items-center">
                      <motion.span
                        key={unit.value}
                        initial={{ y: -5, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-lg sm:text-3xl font-bold text-text-primary font-mono tabular-nums"
                      >
                        {String(unit.value).padStart(2, '0')}
                      </motion.span>
                      <span className="text-[6px] sm:text-[8px] uppercase tracking-[2px] text-[#8A8780] mt-0.5">
                        {unit.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {details && (
              <p className="text-[10px] sm:text-sm text-[#8A8780] tracking-[1px] max-w-md mx-auto">
                {details}
              </p>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes coming-soon-rotate {
          from {
            --coming-soon-angle: 0deg;
          }
          to {
            --coming-soon-angle: 360deg;
          }
        }
      `}</style>

      {/* Fallback animation for browsers that don't support @property */}
      <style>{`
        @property --coming-soon-angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
      `}</style>
    </motion.div>
  );
}
