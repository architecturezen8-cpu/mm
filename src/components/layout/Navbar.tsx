'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import EditableSection from '@/components/admin/EditableSection';
import { SpeakerIcon } from '@/components/MusicPlayer';

const navLinks: { href: string; label: string }[] = [
  { href: '/', label: 'Home' },
  { href: '/live', label: 'Live' },
  { href: '/playing-xi', label: 'Playing XI' },
  { href: '/videos', label: 'Videos' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/about', label: 'About' },
  { href: '/community', label: 'Community' },
];

function ThomiansLogo({ compact = false }: { compact?: boolean }) {
  const width = compact ? 110 : 140;
  return (
    <svg
      width={width}
      viewBox="0 0 1200 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ height: 'auto' }}
      className="transition-all duration-300"
    >
      {/* Text: Thomians' Media — white */}
      <text x="20" y="130" fill="#FFFFFF" stroke="none" fontFamily="inherit" fontSize="100" letterSpacing="1">
        <tspan style={{ fontWeight: 900 }}>THOMIANS&apos;</tspan>
        <tspan style={{ fontWeight: 300 }}> MEDIA</tspan>
      </text>

      {/* Color strip on RIGHT — Gold, Blue, Navy — 30 degree "\" angle from bottom-left */}
      <g transform="translate(980, 55)">
        <path className="logo-bar-animate logo-bar-gold" d="M0 0 H36.7 L80 75 H43.3 Z" />
        <path className="logo-bar-animate logo-bar-blue" d="M50 0 H86.7 L130 75 H93.3 Z" />
        <path className="logo-bar-animate logo-bar-navy" d="M100 0 H136.7 L180 75 H143.3 Z" />
      </g>
    </svg>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  // Reset mobileOpen whenever pathname changes — use a key-based approach
  const [prevPathname, setPrevPathname] = useState(pathname);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change (using ref comparison instead of setState-in-effect)
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    if (mobileOpen) setMobileOpen(false);
  }

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const isActiveLink = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      <EditableSection
        sectionId="navbar-links"
        pageId="layout"
        type="navigation"
        title="Navigation Links"
        content={{
          links: navLinks.map(l => ({ label: l.label, href: l.href })),
          logo_image: '/logos/thomians-media-round-logo.jpg',
        }}
      >
        <motion.nav
          initial={{ y: -60 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
            scrolled
              ? 'bg-[rgba(2,2,4,0.95)] backdrop-blur-xl'
              : 'bg-[rgba(2,2,4,0.85)] backdrop-blur-xl'
          }`}
          style={{
            borderBottom: '1px solid #1a1a22',
          }}
        >
          <div
            className={`max-w-7xl mx-auto flex items-center justify-between transition-all duration-300 ${
              scrolled ? 'px-4 sm:px-6 h-[58px] sm:h-[64px]' : 'px-4 sm:px-6 h-[64px] sm:h-[72px]'
            }`}
          >
            {/* Logo */}
            <Link
              href="/"
              className="shrink-0 flex items-center"
              aria-label="Go to home"
            >
              <ThomiansLogo compact={scrolled} />
            </Link>

            {/* Desktop: Nav Links + Speaker Icon on the FAR RIGHT */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = isActiveLink(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`nav-link-item relative px-3 lg:px-4 py-2 text-[10px] lg:text-xs font-semibold uppercase tracking-[2px] lg:tracking-[3px] transition-colors ${
                      isActive ? 'text-gold' : 'text-text-muted hover:text-gold'
                    }`}
                  >
                    {link.label}
                    {/* Center-outward underline animation */}
                    {isActive && (
                      <motion.div
                        layoutId="activeNavLine"
                        className="absolute bottom-0 left-1/2 right-1/2 h-[2px] bg-gold"
                        initial={{ left: '50%', right: '50%' }}
                        animate={{ left: '4px', right: '4px' }}
                        transition={{ type: 'tween', duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                      />
                    )}
                  </Link>
                );
              })}
              {/* Speaker icon — far right corner (after all nav links) */}
              <div className="ml-2 lg:ml-3">
                <SpeakerIcon />
              </div>
            </div>

            {/* Mobile: Speaker + Hamburger */}
            <div className="md:hidden flex items-center gap-1">
              <SpeakerIcon />
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="flex flex-col items-center justify-center w-10 h-10 gap-1.5"
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              >
                <motion.span
                  animate={mobileOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="block w-6 h-px bg-gold origin-center"
                />
                <motion.span
                  animate={mobileOpen ? { opacity: 0 } : { opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="block w-6 h-px bg-gold"
                />
                <motion.span
                  animate={mobileOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="block w-6 h-px bg-gold origin-center"
                />
              </button>
            </div>
          </div>
        </motion.nav>
      </EditableSection>

      {/* Mobile Overlay Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-40 bg-lux-bg/98 backdrop-blur-xl pt-[64px] md:hidden"
          >
            <div className="flex flex-col items-center justify-center h-full gap-2 -mt-20">
              {navLinks.map((link, i) => {
                const isActive = isActiveLink(link.href);
                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i, duration: 0.4 }}
                  >
                    <Link
                      href={link.href}
                      className={`py-3 px-8 text-sm sm:text-base font-semibold uppercase tracking-[4px] transition-colors inline-block relative ${
                        isActive ? 'text-gold' : 'text-text-muted hover:text-gold'
                      }`}
                    >
                      <span className="relative inline-block">
                        {link.label}
                        {isActive && (
                          <motion.div
                            layoutId="activeMobileNavLine"
                            className="absolute -bottom-1 left-1/2 right-1/2 h-[2px] bg-gold"
                            initial={{ left: '50%', right: '50%' }}
                            animate={{ left: '0', right: '0' }}
                            transition={{ type: 'tween', duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                          />
                        )}
                      </span>
                    </Link>
                  </motion.div>
                );
              })}

              {/* Decorative line */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: 80 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent mt-6"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer to account for fixed navbar */}
      <div className="h-[64px] sm:h-[72px]" />
    </>
  );
}
