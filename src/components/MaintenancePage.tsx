'use client';

import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from 'react';

/* ═══════════════════════════════════════════════════════════════
   PREMIUM MAINTENANCE PAGE — Luxury, Professional, Cool Animations
   ═══════════════════════════════════════════════════════════════ */

/* ─── Animated Dots ─── */
function AnimatedDots() {
  const [dots, setDots] = useState('');
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);
  return <span>{dots}</span>;
}

/* ─── Code Rain Particle ─── */
function CodeParticle({ delay, symbol, x, duration }: { delay: number; symbol: string; x: number; duration: number }) {
  return (
    <span
      className="absolute text-[10px] sm:text-xs font-mono select-none pointer-events-none"
      style={{
        left: `${x}%`,
        top: '110%',
        color: 'rgba(255,195,0,0.06)',
        animation: `maint-float-up ${duration}s linear ${delay}s infinite`,
      }}
    >
      {symbol}
    </span>
  );
}

/* ─── Rotating Shield Icon ─── */
function ShieldIcon() {
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer rotating ring with dashed stroke */}
      <svg
        className="absolute w-28 h-28 sm:w-36 sm:h-36"
        viewBox="0 0 120 120"
        style={{ animation: 'maint-ring-rotate 12s linear infinite' }}
      >
        <circle
          cx="60" cy="60" r="56"
          fill="none"
          stroke="rgba(255,195,0,0.12)"
          strokeWidth="0.5"
          strokeDasharray="3 7"
        />
        <circle
          cx="60" cy="60" r="50"
          fill="none"
          stroke="rgba(255,195,0,0.08)"
          strokeWidth="0.3"
          strokeDasharray="1 12"
        />
      </svg>

      {/* Second rotating ring — opposite direction */}
      <svg
        className="absolute w-24 h-24 sm:w-30 sm:h-30"
        viewBox="0 0 100 100"
        style={{ animation: 'maint-ring-rotate 8s linear infinite reverse' }}
      >
        <circle
          cx="50" cy="50" r="46"
          fill="none"
          stroke="rgba(255,195,0,0.06)"
          strokeWidth="0.4"
          strokeDasharray="5 10"
        />
      </svg>

      {/* Main Shield SVG */}
      <svg
        className="w-14 h-14 sm:w-18 sm:h-18 relative z-10"
        viewBox="0 0 64 64"
        fill="none"
        style={{
          animation: 'maint-shield-breathe 3s ease-in-out infinite',
          filter: 'drop-shadow(0 0 20px rgba(255,195,0,0.3))',
        }}
      >
        {/* Shield body */}
        <path
          d="M32 6L8 18v14c0 13.3 10.2 25.7 24 28 13.8-2.3 24-14.7 24-28V18L32 6z"
          fill="rgba(255,195,0,0.08)"
          stroke="rgba(255,195,0,0.7)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Inner shield glow */}
        <path
          d="M32 12L14 22v10c0 10.5 8 20.3 18 22 10-1.7 18-11.5 18-22V22L32 12z"
          fill="rgba(255,195,0,0.04)"
          stroke="rgba(255,195,0,0.3)"
          strokeWidth="0.5"
        />
        {/* Wrench */}
        <path
          d="M38 28l-2-2 4-4a3.5 3.5 0 00-4.5-4.5l-4 4-2-2-1.5 1.5 2 2-6 6a2.2 2.2 0 003 3l6-6 2 2L38 28z"
          fill="rgba(255,195,0,0.5)"
        />
        {/* Gear */}
        <circle
          cx="27" cy="38" r="4"
          fill="none"
          stroke="rgba(255,195,0,0.4)"
          strokeWidth="1"
          style={{ animation: 'maint-gear-spin 4s linear infinite', transformOrigin: '27px 38px' }}
        />
        <circle cx="27" cy="38" r="1.5" fill="rgba(255,195,0,0.3)" />
      </svg>
    </div>
  );
}

/* ─── Shimmer Title Text ─── */
function ShimmerText({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`inline-block bg-clip-text text-transparent ${className}`}
      style={{
        backgroundImage: 'linear-gradient(90deg, #FFC300 0%, #FFD54F 20%, #FFFFFF 50%, #FFD54F 80%, #FFC300 100%)',
        backgroundSize: '200% auto',
        animation: 'maint-shimmer 3s linear infinite',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}
    >
      {children}
    </span>
  );
}

/* ─── Neon Progress Bar ─── */
function NeonProgress() {
  return (
    <div className="w-52 sm:w-72 h-[2px] bg-[#111118] relative overflow-hidden rounded-full">
      <div
        className="absolute inset-y-0 left-0 h-full rounded-full"
        style={{
          width: '25%',
          background: 'linear-gradient(90deg, transparent, #FFC300, transparent)',
          animation: 'maint-progress 2.5s ease-in-out infinite',
        }}
      />
    </div>
  );
}

/* ─── Status Blinker ─── */
function StatusBlinker() {
  return (
    <div className="flex items-center justify-center gap-2">
      <div
        className="w-1.5 h-1.5 rounded-full"
        style={{
          backgroundColor: '#FFC300',
          animation: 'maint-blink 1.5s ease-in-out infinite',
          boxShadow: '0 0 6px rgba(255,195,0,0.5)',
        }}
      />
      <span className="text-[#5A5750] text-[9px] sm:text-[10px] uppercase tracking-[3px] font-medium font-mono">
        Maintenance in Progress
      </span>
    </div>
  );
}

/* ─── Social Links ─── */
function SocialLinks() {
  const socials = [
    {
      name: 'Instagram',
      href: 'https://instagram.com/thomiansmedia',
      path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z',
    },
    {
      name: 'YouTube',
      href: 'https://youtube.com/@thomiansmedia',
      path: 'M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
    },
    {
      name: 'TikTok',
      href: 'https://tiktok.com/@thomiansmedia',
      path: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z',
    },
    {
      name: 'Facebook',
      href: 'https://facebook.com/thomiansmedia',
      path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
    },
  ];

  return (
    <div className="flex items-center justify-center gap-3">
      {socials.map((s) => (
        <a
          key={s.name}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-10 h-10 border border-[#1a1a22] text-[#5A5750] hover:border-[#FFC300]/40 hover:text-[#FFC300] hover:bg-[#FFC300]/5 transition-all duration-500 group"
          title={s.name}
        >
          <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
            <path d={s.path} />
          </svg>
        </a>
      ))}
    </div>
  );
}

/* ─── Matrix Rain Easter Egg ─── */
function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops: number[] = Array(columns).fill(1);

    const draw = () => {
      ctx.fillStyle = 'rgba(2, 2, 4, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#FFC300';
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.globalAlpha = 0.12 + Math.random() * 0.12;
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
      ctx.globalAlpha = 1;
    };

    const interval = setInterval(draw, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[100001] pointer-events-none"
      style={{ opacity: 0.6 }}
    />
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN: Premium Maintenance Page
   ═══════════════════════════════════════════════════════ */
export default function MaintenancePage() {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [easterEggClicks, setEasterEggClicks] = useState(0);
  const [showMatrix, setShowMatrix] = useState(false);

  const handleShieldClick = useCallback(() => {
    setEasterEggClicks(prev => {
      const next = prev + 1;
      if (next >= 5) {
        setShowMatrix(true);
        setTimeout(() => setShowMatrix(false), 8000);
        return 0;
      }
      return next;
    });
  }, []);

  // Code symbols for floating particles
  const codeSymbols = ['{ }', '< />', '0 1', '//', '=>', '&&', '||', '[]', '()', '++', '::', '##', '??', '!=', '===', '>>>'];
  const particles = codeSymbols.map((symbol, i) => ({
    symbol,
    delay: i * 1.0,
    x: 3 + (i * 6) % 94,
    duration: 14 + (i % 5) * 3,
  }));

  return (
    <>
      {/* Matrix Rain Easter Egg */}
      {showMatrix && <MatrixRain />}

      <div
        className="fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden select-none"
        style={{ background: '#020204' }}
      >
        {/* ── Background Effects ── */}

        {/* Pulsing Gold Radial Glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] sm:w-[800px] sm:h-[800px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(255,195,0,0.05) 0%, rgba(255,195,0,0.02) 30%, transparent 60%)',
              animation: 'maint-glow-pulse 4s ease-in-out infinite',
            }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(255,195,0,0.07) 0%, transparent 55%)',
              animation: 'maint-glow-pulse 3s ease-in-out 1s infinite',
            }}
          />
        </div>

        {/* Subtle Grid Lines — Tron-style */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.02]">
          {[...Array(20)].map((_, i) => (
            <div
              key={`h-${i}`}
              className="absolute left-0 right-0 h-px"
              style={{
                top: `${i * 5}%`,
                background: 'linear-gradient(90deg, transparent 0%, #FFC300 20%, #FFC300 80%, transparent 100%)',
                animation: `maint-grid-pulse ${3 + (i % 3)}s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
          {[...Array(20)].map((_, i) => (
            <div
              key={`v-${i}`}
              className="absolute top-0 bottom-0 w-px"
              style={{
                left: `${i * 5}%`,
                background: 'linear-gradient(180deg, transparent 0%, #FFC300 20%, #FFC300 80%, transparent 100%)',
                animation: `maint-grid-pulse ${4 + (i % 3)}s ease-in-out ${i * 0.15}s infinite`,
              }}
            />
          ))}
        </div>

        {/* Floating Code Particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {particles.map((p, i) => (
            <CodeParticle key={i} {...p} />
          ))}
        </div>

        {/* Scan Line */}
        <div
          className="absolute left-0 right-0 h-[1px] pointer-events-none"
          style={{
            top: '0%',
            background: 'linear-gradient(90deg, transparent, rgba(255,195,0,0.12), transparent)',
            animation: 'maint-scan 6s linear infinite',
          }}
        />

        {/* Corner Decorations */}
        <div className="absolute top-4 left-4 w-8 h-8 border-t border-l border-[#FFC300]/10" />
        <div className="absolute top-4 right-4 w-8 h-8 border-t border-r border-[#FFC300]/10" />
        <div className="absolute bottom-4 left-4 w-8 h-8 border-b border-l border-[#FFC300]/10" />
        <div className="absolute bottom-4 right-4 w-8 h-8 border-b border-r border-[#FFC300]/10" />

        {/* ── Main Content Card ── */}
        <div
          className="relative z-10 px-4 sm:px-6 max-w-lg w-full"
          style={{
            animation: mounted ? 'maint-fade-in 0.8s ease-out forwards' : 'none',
            opacity: 0,
          }}
        >
          {/* Aurora Rotating Border Wrapper */}
          <div
            className="relative p-[1px] rounded-sm overflow-hidden"
            style={{
              background: 'conic-gradient(from var(--maint-border-angle, 0deg), transparent 0%, rgba(255,195,0,0.5) 10%, transparent 20%, transparent 80%, rgba(255,195,0,0.3) 90%, transparent 100%)',
              animation: 'maint-rotate-border 4s linear infinite',
            }}
          >
            {/* Glassmorphism Card */}
            <div
              className="relative p-8 sm:p-10 md:p-12 rounded-sm overflow-hidden"
              style={{
                background: 'rgba(6, 6, 10, 0.8)',
                backdropFilter: 'blur(30px)',
                WebkitBackdropFilter: 'blur(30px)',
                boxShadow: '0 0 100px rgba(255,195,0,0.04), inset 0 1px 0 rgba(255,195,0,0.08)',
              }}
            >
              {/* Top edge glow line */}
              <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,195,0,0.4), transparent)',
                }}
              />

              {/* Shield Icon */}
              <div className="flex justify-center mb-8 cursor-pointer" onClick={handleShieldClick}>
                <ShieldIcon />
              </div>

              {/* Title — Shimmer Gold */}
              <h1
                className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-[3px] sm:tracking-[5px] uppercase mb-3 text-center"
              >
                <ShimmerText>
                  Under Maintenance
                </ShimmerText>
              </h1>

              {/* Tagline */}
              <p className="text-sm sm:text-base text-[#7A7770] font-light tracking-[2px] text-center mb-2" style={{ fontStyle: 'italic' }}>
                We&apos;ll be back shortly
              </p>

              {/* Animated Dots */}
              <div className="text-center mb-5">
                <span className="text-[#5A5750] text-xs font-mono tracking-[2px]">
                  <AnimatedDots />
                </span>
              </div>

              {/* Neon Progress Bar */}
              <div className="flex justify-center mb-6">
                <NeonProgress />
              </div>

              {/* Decorative Divider */}
              <div className="flex items-center justify-center gap-3 mb-5">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#FFC300]/25" />
                <div
                  className="w-1.5 h-1.5 rotate-45 bg-[#FFC300]/30"
                  style={{ animation: 'maint-diamond-pulse 2s ease-in-out infinite' }}
                />
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#FFC300]/25" />
              </div>

              {/* Status Indicator */}
              <div className="mb-6">
                <StatusBlinker />
              </div>

              {/* Social Links */}
              <SocialLinks />

              {/* Bottom edge glow line */}
              <div
                className="absolute bottom-0 left-0 right-0 h-px"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,195,0,0.15), transparent)',
                }}
              />
            </div>
          </div>

          {/* Easter egg hint */}
          {easterEggClicks > 0 && easterEggClicks < 5 && (
            <p
              className="text-[8px] text-[#2a2a2a] mt-4 text-center tracking-[2px] uppercase font-mono"
              style={{ animation: 'maint-fade-in 0.3s ease-out forwards' }}
            >
              {5 - easterEggClicks} more...
            </p>
          )}
        </div>
      </div>

      {/* ── CSS Keyframes & @property ── */}
      <style jsx global>{`
        @property --maint-border-angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }

        @keyframes maint-rotate-border {
          0% { --maint-border-angle: 0deg; }
          100% { --maint-border-angle: 360deg; }
        }

        @keyframes maint-glow-pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          50% { transform: translate(-50%, -50%) scale(1.08); opacity: 0.6; }
        }

        @keyframes maint-grid-pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }

        @keyframes maint-float-up {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 0.6; }
          100% { transform: translateY(-110vh); opacity: 0; }
        }

        @keyframes maint-scan {
          0% { top: -1px; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }

        @keyframes maint-fade-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes maint-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        @keyframes maint-progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(500%); }
        }

        @keyframes maint-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        @keyframes maint-diamond-pulse {
          0%, 100% { opacity: 0.3; transform: rotate(45deg) scale(1); }
          50% { opacity: 0.8; transform: rotate(45deg) scale(1.3); }
        }

        @keyframes maint-ring-rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes maint-shield-breathe {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.06); opacity: 1; }
        }

        @keyframes maint-gear-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
