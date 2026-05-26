'use client';

import { useState, useEffect } from 'react';

const DEFAULT_SENTENCES = [
  "Visualizing Thomian Excellence",
  "Capturing the Peak Performance",
  "Amplifying Thomian Voices",
  "Broadcasting the Gold Fever",
];

const TYPING_SPEED = 65; // ms per character
const DELETING_SPEED = 30; // ms per character
const PAUSE_AFTER_TYPE = 1800; // ms pause after full sentence typed
const PAUSE_AFTER_DELETE = 500; // ms pause after sentence fully deleted

interface PreloaderStyleSettings {
  background_color: string;
  primary_color: string;
  secondary_color: string;
  tertiary_color: string;
  duration: number;
  text_color: string;
  bar_color: string;
}

const DEFAULT_STYLE: PreloaderStyleSettings = {
  background_color: '#030303',
  primary_color: '#FFC300',
  secondary_color: '#F0EDE6',
  tertiary_color: '#E63946',
  duration: 16,
  text_color: '#8A8780',
  bar_color: '#FFFFFF',
};

export default function Preloader({ children }: { children: React.ReactNode }) {
  // ── Full-page preloader approach ──
  // Children are NOT rendered until the preloader is fully done.
  // This eliminates ALL content flash — nothing exists in DOM until ready.
  // The preloader is a standalone full page, not an overlay.

  const [mounted, setMounted] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [childrenVisible, setChildrenVisible] = useState(false);

  // Load sentences from settings (API)
  const [sentences, setSentences] = useState<string[]>(DEFAULT_SENTENCES);
  const [styleSettings, setStyleSettings] = useState<PreloaderStyleSettings>(DEFAULT_STYLE);

  // Typewriter state
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Mount: determine if preloader should show ──
  useEffect(() => {
    const path = window.location.pathname;
    const alreadyShown = sessionStorage.getItem('preloaderShown');
    const show = path === '/' && !alreadyShown;
    setShouldShow(show);
    setMounted(true);

    // If preloader should not show, mark as done immediately
    if (!show) {
      setIsDone(true);
      setChildrenVisible(true);
    }
  }, []);

  // Load preloader settings from API
  useEffect(() => {
    if (!shouldShow) return;

    // Helper to apply settings from any source
    const applySettings = (settingsData: Record<string, unknown> | null) => {
      if (!settingsData) return;
      if (settingsData.sentences) {
        const loaded = (settingsData.sentences as Array<{ text?: string } | string>).map((s) =>
          typeof s === 'string' ? s : (s as { text?: string }).text || ''
        ).filter(Boolean);
        if (loaded.length > 0) setSentences(loaded);
      }
      // Handle BOTH snake_case (used by this component) and camelCase (from API/DB)
      const getVal = (snake: string, camel: string) => settingsData[snake] ?? settingsData[camel];
      
      setStyleSettings({
        background_color: (getVal('background_color', 'backgroundColor') as string) || DEFAULT_STYLE.background_color,
        primary_color: (getVal('primary_color', 'primaryColor') as string) || DEFAULT_STYLE.primary_color,
        secondary_color: (getVal('secondary_color', 'secondaryColor') as string) || DEFAULT_STYLE.secondary_color,
        tertiary_color: (getVal('tertiary_color', 'tertiaryColor') as string) || DEFAULT_STYLE.tertiary_color,
        duration: (settingsData.duration as number) || DEFAULT_STYLE.duration,
        text_color: (getVal('text_color', 'textColor') as string) || DEFAULT_STYLE.text_color,
        bar_color: (getVal('bar_color', 'barColor') as string) || DEFAULT_STYLE.bar_color,
      });
    };

    // Fetch settings from the public API
    fetch('/api/preloader-settings', { cache: 'no-cache' })
      .then(r => r.ok ? r.json() : null)
      .then(apiData => {
        if (apiData && Object.keys(apiData).length > 0) {
          applySettings(apiData);
        }
      })
      .catch(() => {});
  }, [shouldShow]);

  // Typewriter effect
  useEffect(() => {
    if (!shouldShow) return;

    const sentence = sentences[currentSentenceIndex];
    if (!sentence) return;

    if (!isDeleting) {
      // Typing phase
      if (displayedText.length < sentence.length) {
        const timer = setTimeout(() => {
          setDisplayedText(sentence.slice(0, displayedText.length + 1));
        }, TYPING_SPEED);
        return () => clearTimeout(timer);
      } else {
        // Finished typing — pause then start deleting
        const timer = setTimeout(() => {
          setIsDeleting(true);
        }, PAUSE_AFTER_TYPE);
        return () => clearTimeout(timer);
      }
    } else {
      // Deleting phase
      if (displayedText.length > 0) {
        const timer = setTimeout(() => {
          setDisplayedText(displayedText.slice(0, -1));
        }, DELETING_SPEED);
        return () => clearTimeout(timer);
      } else {
        // Finished deleting — pause then move to next sentence
        const timer = setTimeout(() => {
          setCurrentSentenceIndex((prev) => (prev + 1) % sentences.length);
          setIsDeleting(false);
        }, PAUSE_AFTER_DELETE);
        return () => clearTimeout(timer);
      }
    }
  }, [displayedText, isDeleting, currentSentenceIndex, sentences, shouldShow]);

  // Preloader timing — uses configurable duration from settings
  useEffect(() => {
    if (!shouldShow) return;

    const durationMs = styleSettings.duration * 1000;
    const fadeTime = durationMs;
    const doneTime = durationMs + 1200; // 1.2s for fade-out transition

    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, fadeTime);

    const doneTimer = setTimeout(() => {
      setIsDone(true);
      sessionStorage.setItem('preloaderShown', 'true');
    }, doneTime);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [shouldShow, styleSettings.duration]);

  // Show children with a slight delay after isDone to allow smooth fade transition
  useEffect(() => {
    if (!isDone) return;
    // Small delay to ensure DOM is ready before showing children
    const timer = setTimeout(() => {
      setChildrenVisible(true);
    }, 50);
    return () => clearTimeout(timer);
  }, [isDone]);

  // ── RENDER ──
  // Full-page preloader: children are NOT rendered until preloader is done.
  // This eliminates ALL content flash (FOUC) because nothing exists in the DOM
  // until we're ready to show it.

  // Phase 1: Preloader is showing (full page, not overlay)
  if (!isDone) {
    return (
      <div
        className={`preloader-fullpage ${isFading ? 'fade-out' : ''}`}
        style={{ backgroundColor: mounted ? styleSettings.background_color : DEFAULT_STYLE.background_color }}
      >
        {/* Ambient glow */}
        <div
          className="preloader-glow"
          style={{
            background: `radial-gradient(circle, ${mounted ? styleSettings.primary_color : DEFAULT_STYLE.primary_color}08 0%, ${mounted ? styleSettings.secondary_color : DEFAULT_STYLE.secondary_color}04 35%, transparent 65%)`
          }}
        />

        {/* Centered content column — only show typewriter if mounted */}
        {mounted && (
          <div className="preloader-content">
            {/* ── Centered logo ── */}
            <div className="preloader-logo-wrap">
              <svg
                viewBox="0 0 1200 180"
                xmlns="http://www.w3.org/2000/svg"
                className="preloader-svg"
              >
                {/* Text: Thomians' Media — stroke draw then fill */}
                <text x="-10" y="130" className="preloader-text-animate">
                  <tspan className="preloader-bold-txt">THOMIANS&apos;</tspan>
                  <tspan className="preloader-light-txt"> MEDIA</tspan>
                </text>

                {/* Color strip on RIGHT — using configured colors */}
                <g transform="translate(1080, 55)">
                  <path
                    className="preloader-bar-animate preloader-bar-1"
                    d="M0 0 H36.7 L80 75 H43.3 Z"
                    style={{ stroke: styleSettings.primary_color, '--fill-col': styleSettings.primary_color } as React.CSSProperties}
                  />
                  <path
                    className="preloader-bar-animate preloader-bar-2"
                    d="M50 0 H86.7 L130 75 H93.3 Z"
                    style={{ stroke: styleSettings.secondary_color, '--fill-col': styleSettings.secondary_color } as React.CSSProperties}
                  />
                  <path
                    className="preloader-bar-animate preloader-bar-3"
                    d="M100 0 H136.7 L180 75 H143.3 Z"
                    style={{ stroke: styleSettings.tertiary_color, '--fill-col': styleSettings.tertiary_color } as React.CSSProperties}
                  />
                </g>
              </svg>
            </div>

            {/* ── Progress bar — directly below logo ── */}
            <div className="preloader-bar-container">
              <div
                className="preloader-bar-fill"
                style={{
                  background: `linear-gradient(90deg, ${styleSettings.bar_color}99, ${styleSettings.bar_color}, ${styleSettings.bar_color}99)`,
                  animationDuration: `${styleSettings.duration}s`,
                }}
              />
            </div>

            {/* ── Typewriter sentence ── */}
            <div className="preloader-typewriter">
              <span
                className="preloader-typewriter-text"
                style={{ color: styleSettings.text_color }}
              >
                {displayedText}
              </span>
              <span
                className="preloader-typewriter-cursor"
                style={{ color: styleSettings.primary_color }}
              >
                |
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Phase 2: Preloader is done — show children with fade-in
  return (
    <div className={childrenVisible ? 'page-content-fadein' : 'page-content-hidden'}>
      {children}
    </div>
  );
}
