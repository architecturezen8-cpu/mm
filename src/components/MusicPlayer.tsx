'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';

/* ──────────────────────────────────────────────
   Types
   ────────────────────────────────────────────── */

interface ActiveSong {
  songId: string;
  version: number;
  loop: boolean;
  volume: number;
}

interface MusicContextType {
  isMuted: boolean;
  toggleMute: () => void;
  hasActiveSong: boolean;
  isLoading: boolean;
}

/* ──────────────────────────────────────────────
   Context
   ────────────────────────────────────────────── */

const MusicContext = createContext<MusicContextType>({
  isMuted: true,
  toggleMute: () => {},
  hasActiveSong: false,
  isLoading: true,
});

export function useMusic() {
  return useContext(MusicContext);
}

/* ──────────────────────────────────────────────
   MusicProvider — invisible audio manager
   ────────────────────────────────────────────── */

export function MusicProvider({ children }: { children: ReactNode }) {
  // Always start with isMuted=true for SSR consistency (prevents hydration mismatch).
  // Read the real preference from localStorage after mount via useEffect.
  const [isMuted, setIsMuted] = useState(true);
  const [activeSong, setActiveSong] = useState<ActiveSong | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasUnmutedOnInteraction = useRef(false);
  const mountedRef = useRef(true);

  const persistPlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !activeSong) return;
    try {
      localStorage.setItem('music-playback', JSON.stringify({
        songId: activeSong.songId,
        version: activeSong.version,
        time: audio.currentTime || 0,
        muted: audio.muted,
        paused: audio.paused,
        savedAt: Date.now(),
      }));
    } catch {
      // ignore
    }
  }, [activeSong]);

  /* ── Read muted preference from localStorage after mount ── */
  useEffect(() => {
    try {
      const stored = localStorage.getItem('music-muted');
      if (stored !== null) {
        setIsMuted(stored === 'true');
      }
    } catch {
      // localStorage not available — keep default
    }
  }, []);

  /* ── Fetch active song config ── */
  const fetchActiveSong = useCallback(async () => {
    try {
      const res = await fetch('/api/music');
      if (!res.ok) return null;
      const data = await res.json();
      // API returns { active: { songId, version, loop, volume } | null, library: [...] }
      const active = data?.active;
      if (active && active.songId) {
        return {
          songId: active.songId,
          version: active.version ?? 1,
          loop: active.loop ?? true,
          volume: active.volume ?? 50,
        } as ActiveSong;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  /* ── Initial fetch ── */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const song = await fetchActiveSong();
      if (!cancelled) {
        setActiveSong(song);
        setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fetchActiveSong]);

  /* ── Poll for changes every 30s ── */
  useEffect(() => {
    const interval = setInterval(async () => {
      const song = await fetchActiveSong();
      if (mountedRef.current) {
        setActiveSong((prev) => {
          // If version changed, update (this will trigger audio source change via separate effect)
          if (!prev && !song) return prev;
          if (!song) return null;
          if (!prev) return song;
          if (prev.songId !== song.songId || prev.version !== song.version) {
            return song;
          }
          // Volume or loop changed — still update state so audio effect picks it up
          if (prev.volume !== song.volume || prev.loop !== song.loop) {
            return song;
          }
          return prev;
        });
      }
    }, 30_000);

    return () => clearInterval(interval);
  }, [fetchActiveSong]);

  /* ── Create & manage audio element ── */
  useEffect(() => {
    if (!activeSong) {
      // No active song — destroy any existing audio
      persistPlayback();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
      return;
    }

    let audio = audioRef.current;

    // Determine if we need a new audio element or can update in place
    const src = `/api/music/stream?songId=${activeSong.songId}&v=${activeSong.version}`;

    if (!audio) {
      audio = new Audio();
      audioRef.current = audio;
    }

    // Update source if it changed
    const currentSrc = audio.src
      ? new URL(audio.src, window.location.origin).pathname +
        new URL(audio.src, window.location.origin).search
      : '';

    if (currentSrc !== src) {
      // eslint-disable-next-line react-hooks/immutability
      audio.src = src;
      audio.load();
      try {
        const saved = JSON.parse(localStorage.getItem('music-playback') || '{}');
        if (saved.songId === activeSong.songId && saved.version === activeSong.version && typeof saved.time === 'number') {
          const age = Date.now() - (saved.savedAt || 0);
          if (age < 10 * 60 * 1000) {
            audio.currentTime = Math.max(0, saved.time);
          }
        }
      } catch {
        // ignore restore failures
      }
    }

    // Apply settings
    audio.loop = activeSong.loop;
    audio.volume = activeSong.volume / 100;
    audio.muted = isMuted;

    // Attempt autoplay (will work when muted)
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay blocked — will be handled by first-interaction listener
      });
    }

    return () => {
      // Cleanup only on unmount
    };
  }, [activeSong, isMuted]);

  /* ── First-interaction unmute listener ── */
  useEffect(() => {
    if (!activeSong) return;

    const handleFirstInteraction = () => {
      if (!hasUnmutedOnInteraction.current) {
        hasUnmutedOnInteraction.current = true;

        // Check localStorage — if user previously muted, respect that
        try {
          const stored = localStorage.getItem('music-muted');
          if (stored === 'true') {
            // User explicitly muted before — don't auto-unmute
            return;
          }
        } catch {
          // proceed to unmute
        }

        setIsMuted(false);
        try {
          localStorage.setItem('music-muted', 'false');
        } catch {
          // ignore
        }
      }
    };

    // Listen for first user interaction (click, touch, keydown)
    window.addEventListener('click', handleFirstInteraction, { once: false });
    window.addEventListener('keydown', handleFirstInteraction, { once: false });
    window.addEventListener('touchstart', handleFirstInteraction, { once: false });

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, [activeSong]);

  /* ── Persist playback position so page navigation does not feel like a reset ── */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !activeSong) return;
    const onTimeUpdate = () => persistPlayback();
    const onPageHide = () => persistPlayback();
    audio.addEventListener('timeupdate', onTimeUpdate);
    window.addEventListener('pagehide', onPageHide);
    document.addEventListener('visibilitychange', onPageHide);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      window.removeEventListener('pagehide', onPageHide);
      document.removeEventListener('visibilitychange', onPageHide);
      persistPlayback();
    };
  }, [activeSong, persistPlayback]);

  /* ── Cleanup on unmount ── */
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      persistPlayback();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, [persistPlayback]);

  /* ── Toggle mute ── */
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('music-muted', String(next));
      } catch {
        // ignore
      }
      // Mark that user has interacted with music controls
      hasUnmutedOnInteraction.current = true;
      return next;
    });
  }, []);

  const hasActiveSong = activeSong !== null;

  return (
    <MusicContext.Provider
      value={{ isMuted, toggleMute, hasActiveSong, isLoading }}
    >
      {children}
    </MusicContext.Provider>
  );
}

/* ──────────────────────────────────────────────
   SpeakerIcon — placed in navbar
   ────────────────────────────────────────────── */

export function SpeakerIcon() {
  const { isMuted, toggleMute, hasActiveSong, isLoading } = useMusic();

  // Always show the icon — dim when no song is active
  const noSong = !hasActiveSong || isLoading;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        if (!noSong) toggleMute();
      }}
      className={`
        w-8 h-8 flex items-center justify-center
        transition-all duration-200
        rounded-sm
        ${noSong
          ? 'cursor-default opacity-30 text-gold-muted'
          : isMuted
            ? 'cursor-pointer text-gold-muted hover:text-gold hover:scale-110'
            : 'cursor-pointer text-gold hover:text-gold-bright animate-pulse-gold hover:scale-110'
        }
        active:scale-95
      `}
      aria-label={noSong ? 'No music playing' : isMuted ? 'Unmute background music' : 'Mute background music'}
      title={noSong ? 'No music set' : isMuted ? 'Unmute music' : 'Mute music'}
    >
      {noSong || isMuted ? (
        /* Speaker OFF (muted or no song) */
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      ) : (
        /* Speaker ON (with waves) */
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      )}
    </button>
  );
}
