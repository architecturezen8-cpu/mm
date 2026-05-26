'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/* ─── Floating Code Particle ─── */
function CodeParticle({ delay, symbol, x, duration }: { delay: number; symbol: string; x: number; duration: number }) {
  return (
    <span
      className="absolute text-[10px] sm:text-xs font-mono select-none pointer-events-none"
      style={{
        left: `${x}%`,
        top: '110%',
        color: 'rgba(255,195,0,0.08)',
        animation: `maint-float-up ${duration}s linear ${delay}s infinite`,
      }}
    >
      {symbol}
    </span>
  );
}

/* ─── Hexagonal Spinner ─── */
function HexSpinner({ onClick, clickCount }: { onClick: () => void; clickCount: number }) {
  return (
    <button
      onClick={onClick}
      className="relative w-20 h-20 sm:w-24 sm:h-24 cursor-default focus:outline-none group"
      aria-label="Loading spinner"
    >
      {/* Outer hex ring — rotating */}
      <svg className="absolute inset-0 w-full h-full animate-[hexSpin_3s_linear_infinite]" viewBox="0 0 100 100">
        <polygon
          points="50,2 93,27 93,73 50,98 7,73 7,27"
          fill="none"
          stroke="url(#hexGrad)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient id="hexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFC300" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#FFD54F" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FFC300" stopOpacity="0.8" />
          </linearGradient>
        </defs>
      </svg>

      {/* Inner hex ring — reverse rotate */}
      <svg className="absolute inset-3 sm:inset-4 w-auto h-auto animate-[hexSpin_2s_linear_infinite_reverse]" viewBox="0 0 100 100">
        <polygon
          points="50,10 85,30 85,70 50,90 15,70 15,30"
          fill="none"
          stroke="rgba(255,195,0,0.2)"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </svg>

      {/* Center dot with pulse */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="w-3 h-3 sm:w-4 sm:h-4 bg-gold/80 animate-[hexPulse_2s_ease-in-out_infinite]"
          style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
        />
      </div>

      {/* Glow behind */}
      <div className="absolute inset-0 rounded-full bg-gold/5 blur-xl group-hover:bg-gold/10 transition-all duration-700" />
    </button>
  );
}

/* ─── Shimmer Text ─── */
function ShimmerText({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`inline-block bg-clip-text text-transparent ${className}`}
      style={{
        backgroundImage: 'linear-gradient(90deg, #FFC300 0%, #FFD54F 25%, #FFFFFF 50%, #FFD54F 75%, #FFC300 100%)',
        backgroundSize: '200% auto',
        animation: 'maintShimmer 3s linear infinite',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}
    >
      {children}
    </span>
  );
}

/* ─── Matrix Rain (Easter Egg) ─── */
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
        ctx.globalAlpha = 0.15 + Math.random() * 0.15;
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
      className="fixed inset-0 z-[100000] pointer-events-none"
      style={{ opacity: 0.6 }}
    />
  );
}

/* ─── Social Links ─── */
function SocialLinks() {
  const socials = [
    {
      name: 'Instagram',
      href: 'https://instagram.com/thomiansmedia',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      ),
    },
    {
      name: 'YouTube',
      href: 'https://youtube.com/@thomiansmedia',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
    },
    {
      name: 'TikTok',
      href: 'https://tiktok.com/@thomiansmedia',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </svg>
      ),
    },
    {
      name: 'Facebook',
      href: 'https://facebook.com/thomiansmedia',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex items-center justify-center gap-3 mt-8">
      {socials.map((s) => (
        <a
          key={s.name}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-10 h-10 border border-[#1a1a22] text-[#6A6560] hover:border-gold/50 hover:text-gold hover:bg-gold/5 transition-all duration-500 group"
          title={s.name}
        >
          <span className="group-hover:scale-110 transition-transform duration-300">{s.icon}</span>
        </a>
      ))}
    </div>
  );
}

/* ─── Animated Progress Bar ─── */
function NeonProgress() {
  return (
    <div className="w-48 sm:w-64 h-[2px] bg-[#1a1a22] mt-6 relative overflow-hidden">
      <div
        className="absolute inset-y-0 left-0 h-full"
        style={{
          width: '30%',
          background: 'linear-gradient(90deg, transparent, #FFC300, transparent)',
          animation: 'maintProgress 2s ease-in-out infinite',
        }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN: Premium Maintenance Overlay
   ═══════════════════════════════════════════════════════ */
export default function MaintenanceOverlay() {
  const [mounted, setMounted] = useState(true);
  const [easterEggClicks, setEasterEggClicks] = useState(0);
  const [showMatrix, setShowMatrix] = useState(false);
  const [matrixMode, setMatrixMode] = useState(false);

  const handleSpinnerClick = useCallback(() => {
    setEasterEggClicks(prev => {
      const next = prev + 1;
      if (next >= 5) {
        setShowMatrix(true);
        setMatrixMode(true);
        // Auto-hide matrix after 8 seconds
        setTimeout(() => {
          setShowMatrix(false);
        }, 8000);
        return 0;
      }
      return next;
    });
  }, []);

  // Code symbols for floating particles
  const codeSymbols = ['{ }', '< />', '0 1', '//', '=>', '&&', '||', '[]', '()', '++', '::', '##'];
  const particles = codeSymbols.map((symbol, i) => ({
    symbol,
    delay: i * 1.2,
    x: 5 + (i * 7.5) % 90,
    duration: 12 + (i % 4) * 3,
  }));

  if (!mounted) return null;

  return (
    <>
      {/* Matrix Rain Easter Egg */}
      {showMatrix && <MatrixRain />}

      <div
        className="fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden"
        style={{ background: '#020204' }}
      >
        {/* ── Background Effects ── */}

        {/* Radial glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] sm:w-[900px] sm:h-[900px] pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(255,195,0,0.04) 0%, rgba(255,195,0,0.01) 30%, transparent 60%)',
            animation: 'maintGlow 4s ease-in-out infinite',
          }}
        />

        {/* Grid lines — subtle Tron-style */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
          {/* Horizontal lines */}
          {[...Array(20)].map((_, i) => (
            <div
              key={`h-${i}`}
              className="absolute left-0 right-0 h-px"
              style={{
                top: `${i * 5}%`,
                background: 'linear-gradient(90deg, transparent 0%, #FFC300 20%, #FFC300 80%, transparent 100%)',
                animation: `maintGridPulse ${3 + (i % 3)}s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
          {/* Vertical lines */}
          {[...Array(20)].map((_, i) => (
            <div
              key={`v-${i}`}
              className="absolute top-0 bottom-0 w-px"
              style={{
                left: `${i * 5}%`,
                background: 'linear-gradient(180deg, transparent 0%, #FFC300 20%, #FFC300 80%, transparent 100%)',
                animation: `maintGridPulse ${4 + (i % 3)}s ease-in-out ${i * 0.15}s infinite`,
              }}
            />
          ))}
        </div>

        {/* Floating code particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {particles.map((p, i) => (
            <CodeParticle key={i} {...p} />
          ))}
        </div>

        {/* Scan line effect */}
        <div
          className="absolute left-0 right-0 h-[1px] pointer-events-none"
          style={{
            top: '0%',
            background: 'linear-gradient(90deg, transparent, rgba(255,195,0,0.15), transparent)',
            animation: 'maintScan 6s linear infinite',
          }}
        />

        {/* ── Main Content ── */}
        <div
          className="relative z-10 text-center px-6 max-w-lg"
          style={{
            animation: mounted ? 'maintFadeIn 1s ease-out forwards' : 'none',
            opacity: 0,
          }}
        >
          {/* Glassmorphism Card */}
          <div
            className="relative p-8 sm:p-12 border border-[#1a1a22] overflow-hidden"
            style={{
              background: 'rgba(8, 8, 12, 0.6)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 0 80px rgba(255,195,0,0.03), inset 0 1px 0 rgba(255,195,0,0.1)',
            }}
          >
            {/* Card top border glow */}
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,195,0,0.4), transparent)',
              }}
            />

            {/* Hexagonal Spinner */}
            <div className="flex justify-center mb-8">
              <HexSpinner onClick={handleSpinnerClick} clickCount={easterEggClicks} />
            </div>

            {/* Main Title */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-[4px] sm:tracking-[6px] uppercase mb-3">
              <ShimmerText>
                System Upgrading
              </ShimmerText>
            </h1>

            {/* Tagline */}
            <p className="text-sm sm:text-base text-[#8A8780] font-light tracking-[2px] mb-2" style={{ fontStyle: 'italic' }}>
              We&apos;re building something incredible
            </p>

            {/* Animated dots */}
            <AnimatedDots />

            {/* Neon Progress Bar */}
            <div className="flex justify-center">
              <NeonProgress />
            </div>

            {/* Decorative divider */}
            <div className="flex items-center justify-center gap-3 mt-6 mb-4">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#FFC300]/30" />
              <div
                className="w-1.5 h-1.5 rotate-45 bg-gold/40"
                style={{ animation: 'maintDiamondPulse 2s ease-in-out infinite' }}
              />
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#FFC300]/30" />
            </div>

            {/* Status indicator */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div
                className="w-1.5 h-1.5 rounded-full bg-gold"
                style={{ animation: 'maintBlink 1.5s ease-in-out infinite' }}
              />
              <span className="text-[#6A6560] text-[9px] sm:text-[10px] uppercase tracking-[3px] font-medium font-mono">
                Maintenance in Progress
              </span>
            </div>

            {/* Social Links */}
            <SocialLinks />

            {/* Card bottom border glow */}
            <div
              className="absolute bottom-0 left-0 right-0 h-px"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,195,0,0.15), transparent)',
              }}
            />
          </div>

          {/* Easter egg hint — very subtle */}
          {easterEggClicks > 0 && easterEggClicks < 5 && (
            <p
              className="text-[8px] text-[#2a2a2a] mt-4 tracking-[2px] uppercase font-mono"
              style={{ animation: 'maintFadeIn 0.3s ease-out forwards' }}
            >
              {5 - easterEggClicks} more...
            </p>
          )}

          {/* Matrix mode indicator */}
          {matrixMode && !showMatrix && (
            <p className="text-[8px] text-gold/30 mt-4 tracking-[2px] uppercase font-mono">
              Access Granted
            </p>
          )}
        </div>

        {/* Corner decorations */}
        <div className="absolute top-4 left-4 w-6 h-6 border-t border-l border-gold/10" />
        <div className="absolute top-4 right-4 w-6 h-6 border-t border-r border-gold/10" />
        <div className="absolute bottom-4 left-4 w-6 h-6 border-b border-l border-gold/10" />
        <div className="absolute bottom-4 right-4 w-6 h-6 border-b border-r border-gold/10" />
      </div>

      {/* ── CSS Keyframes ── */}
      <style jsx global>{`
        @keyframes hexSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes hexPulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes maintShimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes maintGlow {
          0%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.05); }
        }
        @keyframes maintGridPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes maint-float-up {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-110vh); opacity: 0; }
        }
        @keyframes maintScan {
          0% { top: -1px; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes maintProgress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(500%); }
        }
        @keyframes maintBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes maintDiamondPulse {
          0%, 100% { opacity: 0.3; transform: rotate(45deg) scale(1); }
          50% { opacity: 0.8; transform: rotate(45deg) scale(1.3); }
        }
        @keyframes maintFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes maintDots {
          0%, 20% { content: ''; }
          40% { content: '.'; }
          60% { content: '..'; }
          80%, 100% { content: '...'; }
        }
      `}</style>
    </>
  );
}

/* ── Animated Dots Component ── */
function AnimatedDots() {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="text-[#6A6560] text-xs font-mono tracking-[2px]">{dots}</span>
  );
}
