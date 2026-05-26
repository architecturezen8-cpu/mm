'use client';

import { useState, useEffect, useCallback } from 'react';
import { Globe, Shield, Bell, Palette, Github, CheckCircle, XCircle, Loader2, Wifi, WifiOff, RefreshCw, ChevronDown, ChevronRight, Zap, Clock, Database, AlertTriangle, Server, Upload, CloudUpload, RotateCcw } from 'lucide-react';
import AdminBar from '@/components/admin/AdminBar';
import AdminNav from '@/components/admin/ui/AdminNav';
import ImageField from '@/components/admin/editors/ImageField';
import MusicAdminSection from '@/components/admin/MusicAdminSection';
import { useAdminStore } from '@/lib/admin-store';
import { DEFAULT_ACTUAL_RESULTS } from '@/lib/voting';

interface SiteSettings {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  siteLogo: string;
  siteFavicon: string;
  stThomasEmblem: string;
  royalEmblem: string;
  primaryColor: string;
  accentColor: string;
  googleAnalyticsId: string;
  allowedEmails: string;
  enableNotifications: boolean;
  maintenanceMode: boolean;
  githubToken?: string;
  githubRepoOwner?: string;
  githubRepoName?: string;
  githubRepoPath?: string;
  home_visibility?: { showLiveScoreCard?: boolean; showMatchHighlights?: boolean };
  happening_now?: { enabled: boolean };
  coming_soon?: { enabled: boolean; title?: string; details?: string; countdownDate?: string };
}

interface PreloaderSettings {
  sentences: { text: string }[];
  primary_color: string;
  secondary_color: string;
  tertiary_color: string;
  background_color: string;
  duration: number;
  text_color: string;
  bar_color: string;
}

const defaultSettings: SiteSettings = {
  siteName: 'Battle of the Golds',
  siteDescription: "Official coverage of Battle of the Golds — The Golden Rivalry. Live scores, analytics, community and more.",
  siteUrl: 'https://thomiansmedia.com',
  siteLogo: '',
  siteFavicon: '',
  stThomasEmblem: '',
  royalEmblem: '',
  primaryColor: '#FFC300',
  accentColor: '#E63946',
  googleAnalyticsId: '',
  allowedEmails: 'admin@thomiansmedia.com',
  enableNotifications: true,
  maintenanceMode: false,
  githubToken: '',
  githubRepoOwner: 'architecturezen8-cpu',
  githubRepoName: 'thomians-media-cms',
  githubRepoPath: 'battle-of-the-golds',
};

const defaultPreloaderSettings: PreloaderSettings = {
  sentences: [
    { text: 'Visualizing Thomian Excellence' },
    { text: 'Capturing the Peak Performance' },
    { text: 'Amplifying Thomian Voices' },
    { text: 'Broadcasting the Gold Fever' },
  ],
  primary_color: '#FFC300',
  secondary_color: '#F0EDE6',
  tertiary_color: '#E63946',
  background_color: '#020204',
  duration: 16,
  text_color: '#8A8780',
  bar_color: '#FFFFFF',
};

export default function SettingsPage() {
  const { setCurrentPageId, setSidebarOpen, sidebarOpen } = useAdminStore();
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [preloaderSettings, setPreloaderSettings] = useState<PreloaderSettings>(defaultPreloaderSettings);

  // GitHub config state (Images CDN)
  const [githubToken, setGithubToken] = useState('');
  const [githubRepoOwner, setGithubRepoOwner] = useState('architecturezen8-cpu');
  const [githubRepoName, setGithubRepoName] = useState('thomians-media-cms');
  const [githubRepoPath, setGithubRepoPath] = useState('battle-of-the-golds');
  const [githubHasToken, setGithubHasToken] = useState(false);
  const [testingGithub, setTestingGithub] = useState(false);
  const [githubStatus, setGithubStatus] = useState<{ connected: boolean; error?: string; repo?: string; branch?: string; pathExists?: boolean; pathWarning?: string } | null>(null);

  // Live Data Control state
  const [liveDataEnabled, setLiveDataEnabled] = useState(true);
  const [togglingLiveData, setTogglingLiveData] = useState(false);
  const [testingSupabase, setTestingSupabase] = useState(false);
  const [supabaseTestResult, setSupabaseTestResult] = useState<{ success: boolean; message: string; responseTime?: number } | null>(null);

  // Supabase Connection state (MASTER toggle)
  const [supabaseConnected, setSupabaseConnected] = useState(true);
  const [togglingSupabase, setTogglingSupabase] = useState(false);

  // Voting Control state
  const [votingEnabled, setVotingEnabled] = useState(false);
  const [togglingVoting, setTogglingVoting] = useState(false);

  // Voting D1 Connection state
  const [votingD1Connected, setVotingD1Connected] = useState(true);
  const [togglingVotingD1, setTogglingVotingD1] = useState(false);

  // Clear Votes state
  const [clearingVotes, setClearingVotes] = useState(false);

  // Turso connection test state
  const [testingTurso, setTestingTurso] = useState(false);
  const [tursoTestResult, setTursoTestResult] = useState<{
    success: boolean;
    message: string;
    responseTime?: number;
    dataKeys?: string[];
    mismatches?: Array<{ key: string; tursoLength: number; localLength: number }>;
  } | null>(null);

  // Home page visibility controls
  const [showLiveScoreCard, setShowLiveScoreCard] = useState(true);
  const [showMatchHighlights, setShowMatchHighlights] = useState(true);

  // Happening Now control
  const [happeningNowEnabled, setHappeningNowEnabled] = useState(false);

  // Polling config state
  const [pollInterval, setPollInterval] = useState(10000);
  const [jitterMax, setJitterMax] = useState(3000);

  // Coming Soon control
  const [comingSoonEnabled, setComingSoonEnabled] = useState(false);
  const [comingSoonTitle, setComingSoonTitle] = useState('Coming Soon');
  const [comingSoonDetails, setComingSoonDetails] = useState('Score will be updated on 15th May 2026');
  const [comingSoonCountdownDate, setComingSoonCountdownDate] = useState('2026-05-15T09:00');

  // Win signal state
  const [winResult, setWinResult] = useState('');
  const [sendingWin, setSendingWin] = useState(false);
  const [winResultAuto, setWinResultAuto] = useState('Match in progress');
  const [showManualOverride, setShowManualOverride] = useState(false);

  // Reset match data state
  const [resettingMatch, setResettingMatch] = useState(false);

  // Actual Results state (admin editable)
  const [actualResults, setActualResults] = useState({
    topScorer: '',
    topScorerRuns: '',
    topWicketTaker: '',
    topWicketTakerFigures: '',
    playerOfMatch: '',
    playerOfMatchDetail: '',
    matchResult: '',
    isPublished: false,
  });
  const [savingActualResults, setSavingActualResults] = useState(false);
  const [actualResultsSaved, setActualResultsSaved] = useState(false);

  // Unsaved changes tracking
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Force Turso Push state
  const [pushing, setPushing] = useState(false);
  const [pushSteps, setPushSteps] = useState<{ step: string; status: 'done' | 'failed' | 'skipped'; detail?: string }[]>([]);
  const [pushResult, setPushResult] = useState<{ success: boolean } | null>(null);
  const [pushError, setPushError] = useState<string | null>(null);

  // Publish & Rebuild state
  const [rebuildPublishing, setRebuildPublishing] = useState(false);
  const [rebuildSteps, setRebuildSteps] = useState<{ step: string; status: 'done' | 'failed' | 'skipped'; detail?: string }[]>([]);
  const [rebuildResult, setRebuildResult] = useState<{ success: boolean } | null>(null);
  const [rebuildError, setRebuildError] = useState<string | null>(null);

  // Turso Read toggle state
  const [tursoReadEnabled, setTursoReadEnabled] = useState(true);
  const [togglingTursoRead, setTogglingTursoRead] = useState(false);
  const [tursoReadLastUpdated, setTursoReadLastUpdated] = useState<string | null>(null);

  // Success toast
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    setCurrentPageId(null);

    // Load current live data state from /api/live (noCache=1 for fresh isOffline state)
    fetch('/api/live?noCache=1')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && !data.fallback && data.live_state) {
          const ls = typeof data.live_state === 'string' ? JSON.parse(data.live_state) : data.live_state;
          if (ls.isOffline === true) {
            setLiveDataEnabled(false);
          }
        } else if (data && data.fallback) {
          // No Supabase data — default to offline
          setLiveDataEnabled(false);
        }
      })
      .catch(() => {});

    // Load settings from API — merge with defaults so no field is undefined
    fetch('/api/admin/settings')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setSettings({
          ...defaultSettings,
          ...data,
          siteName: data.siteName ?? defaultSettings.siteName,
          siteDescription: data.siteDescription ?? defaultSettings.siteDescription,
          siteUrl: data.siteUrl ?? defaultSettings.siteUrl,
          siteLogo: data.siteLogo ?? defaultSettings.siteLogo,
          siteFavicon: data.siteFavicon ?? defaultSettings.siteFavicon,
          stThomasEmblem: data.stThomasEmblem ?? defaultSettings.stThomasEmblem,
          royalEmblem: data.royalEmblem ?? defaultSettings.royalEmblem,
          primaryColor: data.primaryColor ?? defaultSettings.primaryColor,
          accentColor: data.accentColor ?? defaultSettings.accentColor,
          googleAnalyticsId: data.googleAnalyticsId ?? defaultSettings.googleAnalyticsId,
          allowedEmails: data.allowedEmails ?? defaultSettings.allowedEmails,
        });
      })
      .catch(() => {});

    // Load GitHub config from dedicated API
    fetch('/api/admin/github-config')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setGithubRepoOwner(data.githubRepoOwner || 'architecturezen8-cpu');
          setGithubRepoName(data.githubRepoName || 'thomians-media-cms');
          setGithubRepoPath(data.githubRepoPath || 'battle-of-the-golds');
          setGithubHasToken(!!data.hasToken);
          if (data.hasToken) setGithubToken(data.githubToken || '');
        }
      })
      .catch(() => {});

    // Fetch authoritative state from API
    fetch('/api/admin/site-settings')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          if (data.happening_now) setHappeningNowEnabled(!!data.happening_now.enabled);
          if (data.coming_soon) {
            setComingSoonEnabled(!!data.coming_soon.enabled);
            if (data.coming_soon.title) setComingSoonTitle(data.coming_soon.title);
            if (data.coming_soon.details) setComingSoonDetails(data.coming_soon.details);
            if (data.coming_soon.countdownDate) setComingSoonCountdownDate(data.coming_soon.countdownDate);
          }
          if (data.home_visibility) {
            setShowLiveScoreCard(data.home_visibility.showLiveScoreCard !== false);
            setShowMatchHighlights(data.home_visibility.showMatchHighlights !== false);
          }
        }
      })
      .catch(() => {});

    // Load current win result
    fetch('/api/live')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.match_info) {
          const mi = typeof data.match_info === 'string' ? JSON.parse(data.match_info) : data.match_info;
          if (mi.result) {
            const isOngoing = mi.result.toLowerCase().includes('in progress') || mi.result.toLowerCase().includes('tbd');
            setWinResultAuto(isOngoing ? 'Match in progress' : mi.result);
            if (!isOngoing) setWinResult(mi.result);
          }
        }
      })
      .catch(() => {});

    // Load Turso Read toggle state
    fetch('/api/admin/turso-read-toggle')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setTursoReadEnabled(!!data.enabled);
          if (data.lastUpdated) setTursoReadLastUpdated(data.lastUpdated);
        }
      })
      .catch(() => {});

    // Load Voting toggle state
    fetch('/api/admin/voting-toggle')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && typeof data.votingEnabled === 'boolean') {
          setVotingEnabled(data.votingEnabled);
        }
      })
      .catch(() => {});

    // Load Voting D1 Connection toggle state
    fetch('/api/admin/voting-turso-toggle')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && typeof data.connected === 'boolean') {
          setVotingD1Connected(data.connected);
        }
      })
      .catch(() => {});

    // Load Actual Results — merge with defaults so no field is undefined (prevents controlled→uncontrolled error)
    fetch('/api/admin/actual-results')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.results) {
          setActualResults({
            topScorer: data.results.topScorer ?? '',
            topScorerRuns: data.results.topScorerRuns ?? '',
            topWicketTaker: data.results.topWicketTaker ?? '',
            topWicketTakerFigures: data.results.topWicketTakerFigures ?? '',
            playerOfMatch: data.results.playerOfMatch ?? '',
            playerOfMatchDetail: data.results.playerOfMatchDetail ?? '',
            matchResult: data.results.matchResult ?? '',
            isPublished: !!data.results.isPublished,
          });
        }
      })
      .catch(() => {});

    // Load Supabase Connection toggle state
    fetch('/api/admin/supabase-toggle')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && typeof data.connected === 'boolean') {
          setSupabaseConnected(data.connected);
        }
      })
      .catch(() => {});

    // Load preloader settings from API
    fetch('/api/admin/preloader-settings')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && Object.keys(data).length > 0) {
          const getVal = (snake: string, camel: string): string | undefined => {
            const v = data[snake] ?? data[camel];
            return typeof v === 'string' ? v : undefined;
          };
          setPreloaderSettings({
            sentences: (data.sentences as Array<{ text?: string } | string> || defaultPreloaderSettings.sentences).map(s =>
              typeof s === 'string' ? { text: s } : { text: (s as { text?: string }).text || '' }
            ),
            primary_color: getVal('primary_color', 'primaryColor') || defaultPreloaderSettings.primary_color,
            secondary_color: getVal('secondary_color', 'secondaryColor') || defaultPreloaderSettings.secondary_color,
            tertiary_color: getVal('tertiary_color', 'tertiaryColor') || defaultPreloaderSettings.tertiary_color,
            background_color: getVal('background_color', 'backgroundColor') || defaultPreloaderSettings.background_color,
            duration: data.duration || defaultPreloaderSettings.duration,
            text_color: getVal('text_color', 'textColor') || defaultPreloaderSettings.text_color,
            bar_color: getVal('bar_color', 'barColor') || defaultPreloaderSettings.bar_color,
          });
        }
      })
      .catch(() => {});

    // Load poll_config from site-data API
    fetch('/api/site-data?source=preview')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.pollConfig) {
          const pc = data.pollConfig;
          if (typeof pc.pollInterval === 'number' && pc.pollInterval >= 1000 && pc.pollInterval <= 60000) {
            setPollInterval(pc.pollInterval);
          }
          if (typeof pc.jitterMax === 'number' && pc.jitterMax >= 0 && pc.jitterMax <= 10000) {
            setJitterMax(pc.jitterMax);
          }
        }
      })
      .catch(() => {});
  }, [setCurrentPageId]);

  // Warn on page leave if unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  // Mark as unsaved when any form field changes
  const markDirty = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  // ─── FORCE TURSO PUSH ───
  const handleForceTursoPush = async () => {
    setPushing(true);
    setPushResult(null);
    setPushError(null);
    setPushSteps([]);
    try {
      // Collect ALL current browser state
      const pushData: Record<string, unknown> = {};

      // Settings (full object)
      pushData.settings = {
        ...settings,
        home_visibility: { showLiveScoreCard, showMatchHighlights },
        happening_now: { enabled: happeningNowEnabled },
        coming_soon: {
          enabled: comingSoonEnabled,
          title: comingSoonTitle,
          details: comingSoonDetails,
          countdownDate: comingSoonCountdownDate,
        },
      };

      // Preloader
      pushData.preloader = preloaderSettings;

      // Poll config
      pushData.poll_config = { pollInterval, jitterMax };

      // GitHub config
      pushData.github_config = {
        githubToken,
        githubRepoOwner,
        githubRepoName,
        githubRepoPath,
      };

      const res = await fetch('/api/admin/force-turso-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pushData),
      });

      const data = await res.json();
      // Convert steps from API format to display format
      const displaySteps = (data.steps || []).map((s: { step: string; status: string }) => ({
        step: s.step,
        status: s.status === 'done' ? 'done' as const : s.status === 'error' ? 'failed' as const : 'skipped' as const,
      }));
      setPushSteps(displaySteps);

      if (data.status === 'complete') {
        setPushResult({ success: true });
        setHasUnsavedChanges(false);
        setSuccessToast('All data pushed to Turso!');
        setTimeout(() => {
          setPushResult(null);
          setPushSteps([]);
          setSuccessToast(null);
        }, 8000);
      } else {
        setPushError(data.message || 'Force push failed');
      }
    } catch {
      setPushError('Network error — please try again');
    } finally {
      setPushing(false);
    }
  };

  // ─── PUBLISH & REBUILD ───
  const handlePublishAndRebuild = async () => {
    setRebuildPublishing(true);
    setRebuildResult(null);
    setRebuildError(null);
    setRebuildSteps([]);
    try {
      // Use the go-live action: reads from Turso → bakes → triggers Vercel rebuild
      const res = await fetch('/api/admin/publish?action=go-live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (res.ok && data.bakeOk) {
        const steps: Array<{ step: string; status: 'done' | 'failed' | 'skipped' }> = [
          { step: `Reading data from ${data.readSource || 'Turso'}...`, status: 'done' },
          { step: `Baking data to static files (tursoReadEnabled: ${data.tursoReadEnabled ?? '?'})...`, status: 'done' },
        ];
        if (data.githubPushOk) {
          steps.push({ step: `Pushed ${data.githubFilesPushed || 0} files to GitHub (commit ${data.githubCommitSha?.slice(0, 7) || '?'}) — Vercel will auto-deploy`, status: 'done' });
        } else if (data.githubPushError) {
          steps.push({ step: `GitHub push failed: ${data.githubPushError}`, status: 'failed' });
          if (data.deployError) {
            steps.push({ step: `Vercel webhook also failed: ${data.deployError}`, status: 'failed' });
          } else if (data.deployStatus) {
            steps.push({ step: `Fallback: Vercel rebuild triggered (status ${data.deployStatus})`, status: 'done' });
          }
        } else if (data.deployStatus) {
          steps.push({ step: `Vercel rebuild triggered (status ${data.deployStatus})! Site will update in 1-2 minutes`, status: 'done' });
        } else if (data.deployError) {
          steps.push({ step: `Vercel rebuild failed: ${data.deployError}`, status: 'failed' });
        } else {
          steps.push({ step: 'No deploy method configured (set GITHUB_CMS_* env vars)', status: 'skipped' });
        }
        setRebuildSteps(steps);
        setRebuildResult({ success: true });
        setSuccessToast('Published & Deploy triggered!');
        setTimeout(() => {
          setRebuildResult(null);
          setRebuildSteps([]);
          setSuccessToast(null);
        }, 12000);
      } else {
        setRebuildError(data.message || data.error || 'Publish & Rebuild failed');
      }
    } catch {
      setRebuildError('Network error — please try again');
    } finally {
      setRebuildPublishing(false);
    }
  };

  // ─── IMMEDIATE TOGGLE HANDLERS (these still save to API right away) ───

  const handleToggleLiveData = async (enable: boolean) => {
    setTogglingLiveData(true);
    try {
      const action = enable ? 'setOnline' : 'setOffline';
      const res = await fetch('/api/admin/clear-supabase', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLiveDataEnabled(enable);
        // Bust the CDN cache so all users get fresh isOffline state immediately
        fetch('/api/live?noCache=1').catch(() => {});
        // Dispatch event so the live data hook re-fetches immediately
        // instead of waiting for the next polling cycle
        window.dispatchEvent(new CustomEvent('live-data-toggled', {
          detail: { isOffline: !enable },
        }));
      } else {
        alert(`Failed: ${data.error || 'Unknown error'}`);
      }
    } catch {
      alert('Network error — could not reach server');
    } finally {
      setTogglingLiveData(false);
    }
  };

  const handleToggleVoting = async (enable: boolean) => {
    setTogglingVoting(true);
    try {
      const res = await fetch('/api/admin/voting-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: enable }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setVotingEnabled(enable);
        // Bust CDN cache so users see voting status change immediately
        fetch('/api/vote-results?noCache=1').catch(() => {});
        // Dispatch event so open tabs update immediately
        window.dispatchEvent(new CustomEvent('voting-toggled', {
          detail: { votingEnabled: enable },
        }));
      } else {
        alert(`Failed: ${data.error || 'Unknown error'}`);
      }
    } catch {
      alert('Network error — could not reach server');
    } finally {
      setTogglingVoting(false);
    }
  };

  const handleToggleVotingD1 = async (connect: boolean) => {
    setTogglingVotingD1(true);
    try {
      const res = await fetch('/api/admin/voting-turso-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connected: connect }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setVotingD1Connected(connect);
        // Bust CDN cache so users see voting connection change immediately
        fetch('/api/vote-results?noCache=1').catch(() => {});
        // Dispatch events so open tabs update immediately
        window.dispatchEvent(new CustomEvent('voting-d1-toggled', {
          detail: { connected: connect },
        }));
        // Also dispatch legacy event for backward compat
        window.dispatchEvent(new CustomEvent('voting-turso-toggled', {
          detail: { connected: connect },
        }));
        // When disconnecting, also disable voting
        if (!connect) {
          setVotingEnabled(false);
        }
      } else {
        alert(`Failed: ${data.error || 'Unknown error'}`);
      }
    } catch {
      alert('Network error — could not reach server');
    } finally {
      setTogglingVotingD1(false);
    }
  };

  const handleToggleSupabase = async (connect: boolean) => {
    setTogglingSupabase(true);
    try {
      const res = await fetch('/api/admin/supabase-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connected: connect }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSupabaseConnected(connect);
        // Dispatch event so live data hook and voting components react immediately
        window.dispatchEvent(new CustomEvent('supabase-toggled', {
          detail: { connected: connect },
        }));
        // Bust CDN caches so visitors see the change immediately
        fetch('/api/live?noCache=1').catch(() => {});
        fetch('/api/vote-results?noCache=1').catch(() => {});
      } else {
        alert(`Failed: ${data.error || 'Unknown error'}`);
      }
    } catch {
      alert('Network error — could not reach server');
    } finally {
      setTogglingSupabase(false);
    }
  };

  const handleClearVotes = async () => {
    if (!confirm('Are you sure you want to clear ALL vote data? All crowd choice polls and player predictions will be reset to zero. This cannot be undone.')) return;
    setClearingVotes(true);
    try {
      const res = await fetch('/api/admin/clear-supabase', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clearVotes' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('✅ All vote data cleared successfully!');
        // Bust CDN cache
        fetch('/api/vote-results?noCache=1').catch(() => {});
      } else {
        alert('❌ Failed: ' + (data.error || 'Unknown error'));
      }
    } catch {
      alert('❌ Network error — could not reach server');
    } finally {
      setClearingVotes(false);
    }
  };

  const handleToggleTursoRead = async (enable: boolean) => {
    setTogglingTursoRead(true);
    try {
      const res = await fetch('/api/admin/turso-read-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: enable }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTursoReadEnabled(enable);
        if (data.lastUpdated) setTursoReadLastUpdated(data.lastUpdated);
      } else {
        alert(`Failed: ${data.error || 'Unknown error'}`);
      }
    } catch {
      alert('Network error — could not reach server');
    } finally {
      setTogglingTursoRead(false);
    }
  };

  const handleTestSupabase = async () => {
    setTestingSupabase(true);
    setSupabaseTestResult(null);
    try {
      const res = await fetch('/api/admin/test-supabase');
      if (res.ok) {
        const data = await res.json();
        if (data.overallSuccess) {
          const readMs = data.readTest?.responseTime;
          const writeMs = data.writeTest?.responseTime;
          setSupabaseTestResult({ success: true, message: `Connected! Read: ${readMs}ms, Admin: ${writeMs}ms`, responseTime: readMs });
        } else if (!data.configured) {
          setSupabaseTestResult({ success: false, message: data.overallMessage || 'Supabase not configured — missing env vars' });
        } else {
          const details: string[] = [];
          if (data.readTest && !data.readTest.success) details.push(`Read: ${data.readTest.message}`);
          if (data.writeTest && !data.writeTest.success) details.push(`Admin: ${data.writeTest.message}`);
          setSupabaseTestResult({ success: false, message: details.join(' | ') || data.overallMessage || 'Connection failed' });
        }
      } else {
        setSupabaseTestResult({ success: false, message: `HTTP ${res.status} — server error` });
      }
    } catch {
      setSupabaseTestResult({ success: false, message: 'Network error — cannot reach server' });
    } finally {
      setTestingSupabase(false);
    }
  };

  // ─── Save Actual Results ───
  const handleSaveActualResults = async () => {
    setSavingActualResults(true);
    setActualResultsSaved(false);
    try {
      const res = await fetch('/api/admin/actual-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results: actualResults }),
      });
      if (res.ok) {
        setActualResultsSaved(true);
        setTimeout(() => setActualResultsSaved(false), 3000);
        // Bust CDN cache so public site sees the changes immediately
        fetch('/api/actual-results?noCache=1').catch(() => {});
        // Dispatch event so open tabs update immediately
        window.dispatchEvent(new CustomEvent('actual-results-saved'));
      } else {
        const data = await res.json().catch(() => ({}));
        alert('❌ Failed to save: ' + (data.error || `HTTP ${res.status}`));
      }
    } catch {
      alert('❌ Network error — could not reach server');
    } finally {
      setSavingActualResults(false);
    }
  };

  // ─── Auto-fill Actual Results from Live Data ───
  const handleAutoFillLiveResults = async () => {
    try {
      const res = await fetch('/api/live');
      if (!res.ok) return;
      const data = await res.json();

      const mi = typeof data.match_info === 'string' ? JSON.parse(data.match_info) : data.match_info;
      const inn1 = typeof data.innings1 === 'string' ? JSON.parse(data.innings1) : data.innings1;
      const inn2 = typeof data.innings2 === 'string' ? JSON.parse(data.innings2) : data.innings2;

      const updates: Partial<typeof actualResults> = {};

      // Match Result
      if (mi?.result && !mi.result.toLowerCase().includes('in progress') && !mi.result.toLowerCase().includes('tbd')) {
        updates.matchResult = mi.result;
      }

      // Player of the Match
      if (mi?.playerOfMatch) {
        updates.playerOfMatch = mi.playerOfMatch;
      }

      // Top Scorer (highest runs across both innings)
      const allBatting = [
        ...(inn1?.batting || []),
        ...(inn2?.batting || []),
      ];
      if (allBatting.length > 0) {
        const topBat = allBatting.reduce((best: any, b: any) =>
          (b.runs || 0) > (best.runs || 0) ? b : best
        , allBatting[0]);
        if (topBat && topBat.runs > 0) {
          updates.topScorer = topBat.name;
          updates.topScorerRuns = `${topBat.runs}${topBat.isOut ? '' : '*'} (${topBat.balls})`;
        }
      }

      // Top Wicket-Taker (highest wickets)
      const allBowling = [
        ...(inn1?.bowling || []),
        ...(inn2?.bowling || []),
      ];
      if (allBowling.length > 0) {
        const topBowl = allBowling.reduce((best: any, b: any) => {
          if ((b.wickets || 0) > (best.wickets || 0)) return b;
          if (b.wickets === best.wickets && b.econ < best.econ) return b;
          return best;
        }, allBowling[0]);
        if (topBowl && topBowl.wickets > 0) {
          updates.topWicketTaker = topBowl.name;
          updates.topWicketTakerFigures = `${topBowl.wickets}/${topBowl.runs} (${topBowl.overs})`;
        }
      }

      if (Object.keys(updates).length > 0) {
        setActualResults(prev => ({ ...prev, ...updates }));
      }
    } catch {
      // silent
    }
  };

  const handleTestTurso = async () => {
    setTestingTurso(true);
    setTursoTestResult(null);
    try {
      const res = await fetch('/api/admin/test-turso');
      if (res.ok) {
        const data = await res.json();

        // ⚠️ FIX 2026-05-21:
        //   The previous code displayed "Connected! Conn: undefinedms, Data: undefinedms"
        //   when the backend ran in Cloudflare Workers mode (which returns d1Test/kvTest
        //   instead of connectionTest/dataTest). It also said "Connected" when actually
        //   Turso was not connected (only D1/KV were).
        //   Now we accurately reflect what was actually tested.

        if (data.runtime === 'cloudflare-workers') {
          // Workers mode — backend tested D1 + KV (and now Turso via HTTP if configured)
          const tursoStatus = data.tursoTest;
          const d1 = data.d1Test;
          const kv = data.kvTest;
          const parts: string[] = [];

          if (tursoStatus) {
            parts.push(tursoStatus.success
              ? `✅ Turso HTTP: ${tursoStatus.responseTime ?? '?'}ms`
              : `❌ Turso: ${tursoStatus.message}`);
          }
          if (d1) {
            parts.push(d1.success
              ? `✅ D1: ${d1.responseTime ?? '?'}ms`
              : `❌ D1: ${d1.message}`);
          }
          if (kv) {
            parts.push(kv.success ? `✅ KV: ok` : `❌ KV: ${kv.message}`);
          }

          setTursoTestResult({
            success: !!data.overallSuccess,
            message: parts.join(' | ') || data.overallMessage || 'No test results',
            responseTime: tursoStatus?.responseTime ?? d1?.responseTime,
            dataKeys: data.dataTest?.keys,
            mismatches: data.consistencyCheck?.mismatches,
          });
        } else if (data.overallSuccess) {
          // Node.js mode — original Turso test path
          const connMs = data.connectionTest?.responseTime;
          const dataMs = data.dataTest?.responseTime;
          const connStr = connMs !== undefined ? `${connMs}ms` : 'n/a';
          const dataStr = dataMs !== undefined ? `${dataMs}ms` : 'n/a';
          setTursoTestResult({
            success: true,
            message: `Connected! Conn: ${connStr}, Data: ${dataStr}`,
            responseTime: connMs,
            dataKeys: data.dataTest?.keys,
            mismatches: data.consistencyCheck?.mismatches,
          });
        } else if (!data.configured) {
          setTursoTestResult({ success: false, message: data.overallMessage || 'Turso not configured — missing env vars' });
        } else {
          const details: string[] = [];
          if (data.connectionTest && !data.connectionTest.success) details.push(`Connection: ${data.connectionTest.message}`);
          if (data.dataTest && !data.dataTest.success) details.push(`Data: ${data.dataTest.message}`);
          if (data.consistencyCheck && !data.consistencyCheck.consistent) {
            const keys = data.consistencyCheck.mismatches.map((m: { key: string }) => m.key).join(', ');
            details.push(`Mismatch: ${keys}`);
          }
          setTursoTestResult({ success: false, message: details.join(' | ') || data.overallMessage || 'Connection failed', mismatches: data.consistencyCheck?.mismatches });
        }
      } else {
        setTursoTestResult({ success: false, message: `HTTP ${res.status} — server error` });
      }
    } catch {
      setTursoTestResult({ success: false, message: 'Network error — cannot reach server' });
    } finally {
      setTestingTurso(false);
    }
  };

  const handleRefreshWinResult = async () => {
    setSendingWin(true);
    try {
      const res = await fetch('/api/live');
      if (res.ok) {
        const data = await res.json();
        if (data && data.match_info) {
          const mi = typeof data.match_info === 'string' ? JSON.parse(data.match_info) : data.match_info;
          if (mi.result) {
            const isOngoing = mi.result.toLowerCase().includes('in progress') || mi.result.toLowerCase().includes('tbd');
            setWinResultAuto(isOngoing ? 'Match in progress' : mi.result);
            if (!isOngoing) setWinResult(mi.result);
          } else {
            setWinResultAuto('Match in progress');
          }
        }
      }
    } catch {
      // silently fail
    } finally {
      setSendingWin(false);
    }
  };

  const handleResetMatch = async () => {
    if (!confirm('Are you sure you want to reset all match data? This will clear all scores, batsmen, bowlers, and innings data. This cannot be undone.')) return;
    setResettingMatch(true);
    try {
      const res = await fetch('/api/admin/clear-supabase', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resetMatch' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLiveDataEnabled(true);
        setWinResult('');
        setWinResultAuto('Match in progress');
        alert('✅ Match data reset successfully! All scores cleared.');
      } else {
        alert('❌ Failed: ' + (data.error || 'Unknown error'));
      }
    } catch {
      alert('❌ Network error — could not reach server');
    } finally {
      setResettingMatch(false);
    }
  };

  // Preloader sentence helpers
  const addSentence = () => {
    setPreloaderSettings({ ...preloaderSettings, sentences: [...preloaderSettings.sentences, { text: '' }] });
    markDirty();
  };
  const updateSentence = (index: number, value: string) => {
    const updated = [...preloaderSettings.sentences];
    updated[index] = { text: value };
    setPreloaderSettings({ ...preloaderSettings, sentences: updated });
    markDirty();
  };
  const removeSentence = (index: number) => {
    setPreloaderSettings({ ...preloaderSettings, sentences: preloaderSettings.sentences.filter((_, i) => i !== index) });
    markDirty();
  };

  // ─── SAVE PRELOADER SETTINGS (immediate) ───
  const [savingPreloader, setSavingPreloader] = useState(false);
  const [preloaderSaveResult, setPreloaderSaveResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSavePreloader = async () => {
    setSavingPreloader(true);
    setPreloaderSaveResult(null);
    try {
      const res = await fetch('/api/admin/preloader-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preloaderSettings),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPreloaderSaveResult({ success: true, message: 'Preloader settings saved!' });
        setHasUnsavedChanges(false);
        setTimeout(() => setPreloaderSaveResult(null), 4000);
      } else {
        setPreloaderSaveResult({ success: false, message: data.error || 'Save failed' });
      }
    } catch {
      setPreloaderSaveResult({ success: false, message: 'Network error' });
    } finally {
      setSavingPreloader(false);
    }
  };

  return (
    <>
      <AdminBar />
      <div className="pt-12 min-h-screen bg-[#020204] flex">
        {/* Sidebar */}
        <aside className={`fixed lg:static top-12 left-0 bottom-0 w-64 bg-[#030303] border-r border-[#1a1a22] p-4 transition-transform duration-300 z-40 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
          <AdminNav />
        </aside>

        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Main content */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            {/* ═══ HEADER + ACTION BUTTONS ═══ */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-bold text-[#F0EDE6]">Settings</h1>
                <p className="text-[#8A8780] text-sm">Configure your website settings</p>
              </div>
              <div className="flex items-center gap-3">
                {hasUnsavedChanges && (
                  <span className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-sm text-amber-400 text-[9px] font-bold uppercase tracking-wider animate-pulse">
                    Unsaved
                  </span>
                )}
              </div>
            </div>

            {/* ═══ ACTION BUTTONS: Force Turso Push + Publish & Rebuild ═══ */}
            <div className="bg-[#08080c] border border-[#FFC300]/30 rounded-sm mb-6">
              <div className="p-4 border-b border-[#1a1a22] flex items-center gap-2">
                <CloudUpload className="w-4 h-4 text-[#FFC300]" />
                <h2 className="text-[#F0EDE6] font-semibold text-sm uppercase tracking-[2px]">Actions</h2>
              </div>
              <div className="p-4 space-y-4">
                {/* Info text */}
                <div className="bg-[#0e0e14] border border-[#1a1a22] rounded-sm p-3">
                  <p className="text-[#8A8780] text-xs">
                    <strong className="text-[#F0EDE6]">Force Turso Push</strong> saves all your current browser edits to the Turso cloud database.
                    <strong className="text-[#F0EDE6]"> Publish &amp; Rebuild</strong> reads from Turso, bakes static files, pushes them to GitHub, and triggers a Vercel auto-deploy. The public site then serves data from CDN (no database calls) — handles millions of users.
                  </p>
                  <p className="text-[#4A4945] text-[10px] mt-2">
                    💡 Workflow: Make changes → Force Turso Push (save to DB) → Publish &amp; Rebuild (update public site)
                  </p>
                </div>

                {/* Push Steps */}
                {pushSteps.length > 0 && (
                  <div className="bg-[#0e0e14] border border-[#1a1a22] rounded-sm p-3">
                    <div className="text-[#8A8780] text-[10px] space-y-0.5">
                      {pushSteps.map((s, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          {s.status === 'done' ? <span className="w-1 h-1 rounded-full bg-green-400" /> :
                           s.status === 'failed' ? <span className="w-1 h-1 rounded-full bg-red-400" /> :
                           <span className="w-1 h-1 rounded-full bg-[#4A4945]" />}
                          <span>{s.step}{s.detail ? ` — ${s.detail}` : ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Push Success */}
                {pushResult && pushResult.success && (
                  <div className="p-3 rounded-sm border bg-green-500/5 border-green-500/20">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-green-400 text-xs font-semibold">All data pushed to Turso!</p>
                        <p className="text-[#8A8780] text-[10px] mt-1">Now click Publish &amp; Rebuild to bake data and deploy to the public site.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Push Error */}
                {pushError && (
                  <div className="p-3 rounded-sm border bg-red-500/5 border-red-500/20">
                    <div className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                      <p className="text-red-400 text-xs">{pushError}</p>
                    </div>
                  </div>
                )}

                {/* Rebuild Steps */}
                {rebuildSteps.length > 0 && (
                  <div className="bg-[#0e0e14] border border-[#1a1a22] rounded-sm p-3">
                    <div className="text-[#8A8780] text-[10px] space-y-0.5">
                      {rebuildSteps.map((s, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          {s.status === 'done' ? <span className="w-1 h-1 rounded-full bg-green-400" /> :
                           s.status === 'failed' ? <span className="w-1 h-1 rounded-full bg-red-400" /> :
                           <span className="w-1 h-1 rounded-full bg-[#4A4945]" />}
                          <span>{s.step}{s.detail ? ` — ${s.detail}` : ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rebuild Success */}
                {rebuildResult && rebuildResult.success && (
                  <div className="p-3 rounded-sm border bg-green-500/5 border-green-500/20">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-green-400 text-xs font-semibold">Publish &amp; Rebuild complete!</p>
                        <p className="text-[#8A8780] text-[10px] mt-1">Static data files baked and rebuild triggered. Site will update in 1-2 minutes.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Rebuild Error */}
                {rebuildError && (
                  <div className="p-3 rounded-sm border bg-red-500/5 border-red-500/20">
                    <div className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                      <p className="text-red-400 text-xs">{rebuildError}</p>
                    </div>
                  </div>
                )}

                {/* TWO ACTION BUTTONS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleForceTursoPush}
                    disabled={pushing}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-[#FFC300] text-[#020204] rounded-sm text-xs font-bold uppercase tracking-[2px] hover:bg-[#FFD54F] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {pushing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Pushing...
                      </>
                    ) : (
                      <>
                        <CloudUpload className="w-4 h-4" />
                        Force Turso Push
                      </>
                    )}
                  </button>
                  <button
                    onClick={handlePublishAndRebuild}
                    disabled={rebuildPublishing}
                    className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-[#FFC300] text-[#FFC300] rounded-sm text-xs font-bold uppercase tracking-[2px] hover:bg-[#FFC300]/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {rebuildPublishing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Rebuilding...
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-4 h-4" />
                        Publish &amp; Rebuild
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[#4A4945] text-[10px] text-center">
                  Force Turso Push = Save all browser edits to Turso DB · Publish &amp; Rebuild = Bake data → GitHub push → Vercel auto-deploy
                </p>
              </div>
            </div>

            {/* ═══ TURSO READ CONNECTION ═══ */}
            <div className="bg-[#08080c] border border-[#1a1a22] rounded-sm mb-6">
              <div className="p-4 border-b border-[#1a1a22] flex items-center gap-2">
                <Server className="w-4 h-4 text-[#FFC300]" />
                <h2 className="text-[#F0EDE6] font-semibold text-sm uppercase tracking-[2px]">Turso Read Connection</h2>
                <span className={`ml-2 px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider ${
                  tursoReadEnabled
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                    : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                }`}>
                  {tursoReadEnabled ? 'ON' : 'OFF'}
                </span>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#F0EDE6] text-sm font-medium">Read from Turso DB</p>
                    <p className="text-[#8A8780] text-xs mt-0.5">
                      When ON, the public site reads data from Turso DB at runtime. When OFF, the public site reads from baked static data files (CDN, unlimited scale). Admin always reads from Turso.
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleTursoRead(!tursoReadEnabled)}
                    disabled={togglingTursoRead}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#08080c] disabled:opacity-50 ${
                      tursoReadEnabled ? 'bg-emerald-500 focus:ring-emerald-500' : 'bg-amber-500 focus:ring-amber-500'
                    }`}
                  >
                    {togglingTursoRead && (
                      <Loader2 className="w-3 h-3 animate-spin text-white absolute left-1/2 -translate-x-1/2" />
                    )}
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        tursoReadEnabled ? 'translate-x-6' : 'translate-x-1'
                      } ${togglingTursoRead ? 'opacity-0' : ''}`}
                    />
                  </button>
                </div>

                {tursoReadEnabled && (
                  <div className="bg-[#0e0e14] border border-emerald-500/10 rounded-sm p-3">
                    <div className="flex items-start gap-2">
                      <Server className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-emerald-400 text-xs font-semibold">Turso Read Enabled</p>
                        <p className="text-[#8A8780] text-[10px] mt-1">
                          The public site reads data directly from Turso DB on each request. Good for development. For production with high traffic, turn OFF and use Publish &amp; Rebuild to serve from CDN.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {!tursoReadEnabled && (
                  <div className="bg-[#0e0e14] border border-amber-500/10 rounded-sm p-3">
                    <div className="flex items-start gap-2">
                      <Server className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-amber-400 text-xs font-semibold">Baked Static Mode</p>
                        <p className="text-[#8A8780] text-[10px] mt-1">
                          The public site reads from pre-baked static data files served via CDN — unlimited scale, zero DB calls. Admin always reads from Turso. Use &quot;Publish &amp; Rebuild&quot; to update CDN data.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {tursoReadLastUpdated && (
                  <p className="text-[#4A4945] text-[10px]">Last toggled: {tursoReadLastUpdated}</p>
                )}
              </div>
            </div>

            {/* ═══ Supabase Connection (MASTER Toggle) ═══ */}
            <div className="bg-[#08080c] border border-[#1a1a22] rounded-sm mb-6">
              <div className="p-4 border-b border-[#1a1a22] flex items-center gap-2">
                {supabaseConnected ? (
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                )}
                <h2 className="text-[#F0EDE6] font-semibold text-sm uppercase tracking-[2px]">Supabase Connection</h2>
                <span className={`ml-2 px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider ${
                  supabaseConnected
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/10 border border-red-500/20 text-red-400'
                }`}>
                  {supabaseConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#F0EDE6] text-sm font-medium">Supabase Realtime</p>
                    <p className="text-[#8A8780] text-xs mt-0.5">
                      {supabaseConnected
                        ? 'Live scores are powered by Supabase. Voting runs independently on D1. Turn OFF to disconnect — zero bandwidth usage.'
                        : 'Supabase is disconnected. Live scores show offline data. Voting still works independently via D1.'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleSupabase(!supabaseConnected)}
                    disabled={togglingSupabase}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#08080c] disabled:opacity-50 ${
                      supabaseConnected ? 'bg-emerald-500 focus:ring-emerald-500' : 'bg-red-500 focus:ring-red-500'
                    }`}
                  >
                    {togglingSupabase && (
                      <Loader2 className="w-3 h-3 animate-spin text-white absolute left-1/2 -translate-x-1/2" />
                    )}
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        supabaseConnected ? 'translate-x-6' : 'translate-x-1'
                      } ${togglingSupabase ? 'opacity-0' : ''}`}
                    />
                  </button>
                </div>

                {!supabaseConnected && (
                  <div className="bg-[#0e0e14] border border-red-500/10 rounded-sm p-3">
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                      <div>
                        <p className="text-red-400 text-xs font-semibold">Supabase Disconnected</p>
                        <p className="text-[#8A8780] text-[10px] mt-1">
                          Live score data from Supabase is offline — shows placeholder data (0/0). Voting still works independently via D1.
                          No Supabase API calls are made — zero bandwidth waste. Toggle ON to reconnect.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {supabaseConnected && (
                  <div className="bg-[#0e0e14] border border-emerald-500/10 rounded-sm p-3">
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <div>
                        <p className="text-emerald-400 text-xs font-semibold">Supabase Connected</p>
                        <p className="text-[#8A8780] text-[10px] mt-1">
                          Live scores are powered by Supabase. Voting runs independently on D1. Use the individual Live Data and Voting toggles below to control each feature.
                          Toggle OFF to disconnect Supabase completely and save bandwidth.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* ═══ Live Data Control ═══ */}
            <div className="bg-[#08080c] border border-[#1a1a22] rounded-sm mb-6">
              <div className="p-4 border-b border-[#1a1a22] flex items-center gap-2">
                {liveDataEnabled ? (
                  <Wifi className="w-4 h-4 text-emerald-400" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-400" />
                )}
                <h2 className="text-[#F0EDE6] font-semibold text-sm uppercase tracking-[2px]">Live Data Control</h2>
                <span className={`ml-2 px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider ${
                  liveDataEnabled
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/10 border border-red-500/20 text-red-400'
                }`}>
                  {liveDataEnabled ? 'Online' : 'Offline'}
                </span>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#F0EDE6] text-sm font-medium">Realtime Data</p>
                    <p className="text-[#8A8780] text-xs mt-0.5">
                      {liveDataEnabled
                        ? 'Live match data is displayed on the Spector site.'
                        : 'Spector site shows offline placeholder data (0/0, example names).'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleLiveData(!liveDataEnabled)}
                    disabled={togglingLiveData}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#08080c] disabled:opacity-50 ${
                      liveDataEnabled ? 'bg-emerald-500 focus:ring-emerald-500' : 'bg-red-500 focus:ring-red-500'
                    }`}
                  >
                    {togglingLiveData && (
                      <Loader2 className="w-3 h-3 animate-spin text-white absolute left-1/2 -translate-x-1/2" />
                    )}
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        liveDataEnabled ? 'translate-x-6' : 'translate-x-1'
                      } ${togglingLiveData ? 'opacity-0' : ''}`}
                    />
                  </button>
                </div>

                {!liveDataEnabled && (
                  <div className="bg-[#0e0e14] border border-red-500/10 rounded-sm p-3">
                    <div className="flex items-start gap-2">
                      <WifiOff className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-red-400 text-xs font-semibold">Offline Mode Active</p>
                        <p className="text-[#8A8780] text-[10px] mt-1">
                          The Spector site is showing placeholder data: scores as 0/0, overs as 0.0,
                          batsmen as &quot;Batsman 1&quot; / &quot;Batsman 2&quot;, bowler as &quot;Bowler&quot;, and an OFFLINE badge.
                          Toggle ON to restore live data.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {liveDataEnabled && (
                  <div className="bg-[#0e0e14] border border-emerald-500/10 rounded-sm p-3">
                    <div className="flex items-start gap-2">
                      <Wifi className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-emerald-400 text-xs font-semibold">Live Mode Active</p>
                        <p className="text-[#8A8780] text-[10px] mt-1">
                          Real-time match data from the scoring system is displayed on the Spector site.
                          Toggle OFF to hide live data and show placeholder values.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Test Supabase Connection */}
                <div className="border-t border-[#1a1a22] pt-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleTestSupabase}
                      disabled={testingSupabase}
                      className="flex items-center gap-2 px-4 py-2 bg-[#0e0e14] border border-[#1a1a22] text-[#F0EDE6] rounded-sm text-xs font-semibold hover:border-[#FFC300] disabled:opacity-50 transition-colors"
                    >
                      {testingSupabase ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      )}
                      {testingSupabase ? 'Testing...' : 'Test Supabase Connection'}
                    </button>
                    {supabaseTestResult && (
                      <div className="flex items-center gap-2">
                        {supabaseTestResult.success ? (
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400" />
                        )}
                        <span className={`text-xs ${supabaseTestResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
                          {supabaseTestResult.message}
                        </span>
                        {supabaseTestResult.responseTime !== undefined && (
                          <span className="text-[#4A4945] text-[10px]">({supabaseTestResult.responseTime}ms)</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ═══ Voting Control ═══ */}
            <div className="bg-[#08080c] border border-[#1a1a22] rounded-sm mb-6">
              <div className="p-4 border-b border-[#1a1a22] flex items-center gap-2">
                {votingD1Connected ? (
                  votingEnabled ? (
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  )
                ) : (
                  <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                )}
                <h2 className="text-[#F0EDE6] font-semibold text-sm uppercase tracking-[2px]">Voting Control</h2>
                <span className={`ml-2 px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider ${
                  !votingD1Connected
                    ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                    : votingEnabled
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                    : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                }`}>
                  {!votingD1Connected ? 'Disconnected' : votingEnabled ? 'Open' : 'Closed'}
                </span>
              </div>
              <div className="p-4 space-y-4">
                {/* ── Voting Database Connection (MASTER toggle for voting) ── */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#F0EDE6] text-sm font-medium">Voting Database Connection</p>
                    <p className="text-[#8A8780] text-xs mt-0.5">
                      {votingD1Connected
                        ? 'Voting is connected to D1 (Cloudflare) + Turso (fallback). Toggle voting on/off below. Disconnect during off-season.'
                        : 'Voting connection is OFF. Zero database reads/writes — saves limits. No voting data is displayed or collected.'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleVotingD1(!votingD1Connected)}
                    disabled={togglingVotingD1}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#08080c] disabled:opacity-50 ${
                      votingD1Connected ? 'bg-emerald-500 focus:ring-emerald-500' : 'bg-red-500 focus:ring-red-500'
                    }`}
                  >
                    {togglingVotingD1 && (
                      <Loader2 className="w-3 h-3 animate-spin text-white absolute left-1/2 -translate-x-1/2" />
                    )}
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        votingD1Connected ? 'translate-x-6' : 'translate-x-1'
                      } ${togglingVotingD1 ? 'opacity-0' : ''}`}
                    />
                  </button>
                </div>

                {/* Disconnected info box */}
                {!votingD1Connected && (
                  <div className="bg-[#0e0e14] border border-red-500/10 rounded-sm p-3">
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                      <div>
                        <p className="text-red-400 text-xs font-semibold">Voting Disconnected</p>
                        <p className="text-[#8A8780] text-[10px] mt-1">
                          Zero database reads/writes for voting — saves limits during off-season. Visitors see a stunning &quot;The Ultimate Clash Awaits — Coming Soon&quot; display with team logos and animated effects.
                          Existing vote data is preserved and will be available when you reconnect.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Connected info box */}
                {votingD1Connected && (
                  <div className="bg-[#0e0e14] border border-emerald-500/10 rounded-sm p-3">
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <div>
                        <p className="text-emerald-400 text-xs font-semibold">Voting Connected (D1)</p>
                        <p className="text-[#8A8780] text-[10px] mt-1">
                          Voting uses Cloudflare D1 (100K writes/day free). Use the toggle below to control when visitors can vote.
                          Disconnect during off-season to save database limits.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Voting On/Off toggle (only visible when connected) ── */}
                <div className={`border-t border-[#1a1a22] pt-4 ${!votingD1Connected ? 'opacity-40 pointer-events-none' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#F0EDE6] text-sm font-medium">Crowd Choice &amp; Predictions</p>
                      <p className="text-[#8A8780] text-xs mt-0.5">
                        {votingEnabled
                          ? 'Visitors can vote on polls and submit predictions. Results update every 60s.'
                          : 'Voting is closed. Visitors see read-only results or "Available on match day" message.'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggleVoting(!votingEnabled)}
                      disabled={togglingVoting || !votingD1Connected}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#08080c] disabled:opacity-50 ${
                        votingEnabled ? 'bg-emerald-500 focus:ring-emerald-500' : 'bg-amber-500 focus:ring-amber-500'
                      }`}
                    >
                      {togglingVoting && (
                        <Loader2 className="w-3 h-3 animate-spin text-white absolute left-1/2 -translate-x-1/2" />
                      )}
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                          votingEnabled ? 'translate-x-6' : 'translate-x-1'
                        } ${togglingVoting ? 'opacity-0' : ''}`}
                      />
                    </button>
                  </div>

                  {!votingEnabled && votingD1Connected && (
                    <div className="bg-[#0e0e14] border border-amber-500/10 rounded-sm p-3 mt-3">
                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <div>
                          <p className="text-amber-400 text-xs font-semibold">Voting Closed</p>
                          <p className="text-[#8A8780] text-[10px] mt-1">
                            Visitors cannot vote. Toggle ON on match day to enable. Previous results still visible.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {votingEnabled && votingD1Connected && (
                    <div className="bg-[#0e0e14] border border-emerald-500/10 rounded-sm p-3 mt-3">
                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="text-emerald-400 text-xs font-semibold">Voting is Live!</p>
                          <p className="text-[#8A8780] text-[10px] mt-1">
                            6 crowd choice polls + player predictions active. Toggle OFF after match to show final results.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Clear Vote Data ── */}
                <div className="border-t border-[#1a1a22] pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#F0EDE6] text-sm font-medium">Clear Vote Data</p>
                      <p className="text-[#8A8780] text-xs mt-0.5">Reset all crowd choice polls and player predictions to zero (D1). Use after each match.</p>
                    </div>
                    <button
                      onClick={handleClearVotes}
                      disabled={clearingVotes}
                      className="flex items-center gap-2 px-4 py-2 border border-red-500/30 text-red-400 rounded-sm text-xs font-bold uppercase tracking-[2px] hover:bg-red-500/10 disabled:opacity-50 transition-colors"
                    >
                      {clearingVotes ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Clearing...
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Clear Votes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ═══ Actual Match Results (Admin Editable) ═══ */}
            <div className="bg-[#08080c] border border-[#1a1a22] rounded-sm mb-6">
              <div className="p-4 border-b border-[#1a1a22] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#FFC300]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  <h2 className="text-[#F0EDE6] font-semibold text-sm uppercase tracking-[2px]">Actual Match Results</h2>
                </div>
                <span className={`px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider ${
                  actualResults.isPublished
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                    : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                }`}>
                  {actualResults.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>
              <div className="p-4 space-y-3">
                <p className="text-[#8A8780] text-[10px] mb-3">
                  Edit actual match results shown below Crowd Choice on the public site. The public site auto-detects from live match data when you haven&apos;t published — use this to override with official results. Publish when ready.
                </p>

                {/* Auto-fill from Live Data */}
                <button
                  onClick={handleAutoFillLiveResults}
                  className="flex items-center gap-2 px-3 py-2 border border-[#FFC300]/30 bg-[#FFC300]/5 rounded-sm text-[9px] font-bold uppercase tracking-[2px] text-[#FFC300] hover:bg-[#FFC300]/10 transition-colors mb-3"
                >
                  <Zap className="w-3 h-3" />
                  Auto-fill from Live Data
                </button>

                {/* Match Result */}
                <div>
                  <label className="text-[#8A8780] text-[10px] uppercase tracking-[2px] block mb-1">Match Result</label>
                  <input
                    type="text"
                    value={actualResults.matchResult}
                    onChange={e => setActualResults(r => ({ ...r, matchResult: e.target.value }))}
                    placeholder="e.g. St.Thomas' College won by 5 wickets"
                    className="w-full bg-[#0e0e14] border border-[#1a1a22] rounded-sm px-3 py-2 text-sm text-[#F0EDE6] placeholder-[#444] focus:border-[#FFC300] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Top Scorer */}
                  <div>
                    <label className="text-[#8A8780] text-[10px] uppercase tracking-[2px] block mb-1">Top Scorer</label>
                    <input
                      type="text"
                      value={actualResults.topScorer}
                      onChange={e => setActualResults(r => ({ ...r, topScorer: e.target.value }))}
                      placeholder="Player name"
                      className="w-full bg-[#0e0e14] border border-[#1a1a22] rounded-sm px-3 py-2 text-sm text-[#F0EDE6] placeholder-[#444] focus:border-[#FFC300] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[#8A8780] text-[10px] uppercase tracking-[2px] block mb-1">Score</label>
                    <input
                      type="text"
                      value={actualResults.topScorerRuns}
                      onChange={e => setActualResults(r => ({ ...r, topScorerRuns: e.target.value }))}
                      placeholder="e.g. 85 (62)"
                      className="w-full bg-[#0e0e14] border border-[#1a1a22] rounded-sm px-3 py-2 text-sm text-[#F0EDE6] placeholder-[#444] focus:border-[#FFC300] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Top Wicket Taker */}
                  <div>
                    <label className="text-[#8A8780] text-[10px] uppercase tracking-[2px] block mb-1">Top Wicket-Taker</label>
                    <input
                      type="text"
                      value={actualResults.topWicketTaker}
                      onChange={e => setActualResults(r => ({ ...r, topWicketTaker: e.target.value }))}
                      placeholder="Player name"
                      className="w-full bg-[#0e0e14] border border-[#1a1a22] rounded-sm px-3 py-2 text-sm text-[#F0EDE6] placeholder-[#444] focus:border-[#FFC300] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[#8A8780] text-[10px] uppercase tracking-[2px] block mb-1">Figures</label>
                    <input
                      type="text"
                      value={actualResults.topWicketTakerFigures}
                      onChange={e => setActualResults(r => ({ ...r, topWicketTakerFigures: e.target.value }))}
                      placeholder="e.g. 3/24 (8)"
                      className="w-full bg-[#0e0e14] border border-[#1a1a22] rounded-sm px-3 py-2 text-sm text-[#F0EDE6] placeholder-[#444] focus:border-[#FFC300] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Player of the Match */}
                  <div>
                    <label className="text-[#8A8780] text-[10px] uppercase tracking-[2px] block mb-1">Player of the Match</label>
                    <input
                      type="text"
                      value={actualResults.playerOfMatch}
                      onChange={e => setActualResults(r => ({ ...r, playerOfMatch: e.target.value }))}
                      placeholder="Player name"
                      className="w-full bg-[#0e0e14] border border-[#1a1a22] rounded-sm px-3 py-2 text-sm text-[#F0EDE6] placeholder-[#444] focus:border-[#FFC300] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[#8A8780] text-[10px] uppercase tracking-[2px] block mb-1">Detail</label>
                    <input
                      type="text"
                      value={actualResults.playerOfMatchDetail}
                      onChange={e => setActualResults(r => ({ ...r, playerOfMatchDetail: e.target.value }))}
                      placeholder="e.g. 85 runs & 2 wickets"
                      className="w-full bg-[#0e0e14] border border-[#1a1a22] rounded-sm px-3 py-2 text-sm text-[#F0EDE6] placeholder-[#444] focus:border-[#FFC300] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Publish toggle + Save */}
                <div className="flex items-center justify-between pt-3 border-t border-[#1a1a22]">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setActualResults(r => ({ ...r, isPublished: !r.isPublished }))}
                      className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors focus:outline-none ${
                        actualResults.isPublished ? 'bg-emerald-500' : 'bg-[#1a1a22]'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        actualResults.isPublished ? 'translate-x-5' : 'translate-x-1'
                      }`} />
                    </button>
                    <span className="text-[#8A8780] text-[10px] uppercase tracking-[1px]">
                      {actualResults.isPublished ? 'Visible to public' : 'Draft only'}
                    </span>
                  </div>
                  <button
                    onClick={handleSaveActualResults}
                    disabled={savingActualResults}
                    className="flex items-center gap-2 px-4 py-2 bg-[#FFC300] text-[#020204] rounded-sm text-[10px] font-bold uppercase tracking-[2px] hover:bg-[#FFD54F] disabled:opacity-50 transition-colors"
                  >
                    {savingActualResults ? <Loader2 className="w-3 h-3 animate-spin" /> : actualResultsSaved ? <CheckCircle className="w-3 h-3" /> : <CloudUpload className="w-3 h-3" />}
                    {savingActualResults ? 'Saving...' : actualResultsSaved ? 'Saved!' : 'Save Results'}
                  </button>
                </div>
              </div>
            </div>

            {/* ═══ Turso Database Connection ═══ */}
            <div className="bg-[#08080c] border border-[#1a1a22] rounded-sm mb-6">
              <div className="p-4 border-b border-[#1a1a22] flex items-center gap-2">
                <Database className="w-4 h-4 text-[#FFC300]" />
                <h2 className="text-[#F0EDE6] font-semibold text-sm uppercase tracking-[2px]">Turso Database</h2>
                <span className={`ml-2 px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider ${
                  tursoTestResult?.success
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                    : tursoTestResult && !tursoTestResult.success
                    ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                    : 'bg-[#1a1a22] text-[#8A8780]'
                }`}>
                  {tursoTestResult?.success ? 'Connected' : tursoTestResult && !tursoTestResult.success ? 'Error' : 'Not Tested'}
                </span>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleTestTurso}
                    disabled={testingTurso}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0e0e14] border border-[#1a1a22] text-[#F0EDE6] rounded-sm text-xs font-semibold hover:border-[#FFC300] disabled:opacity-50 transition-colors"
                  >
                    {testingTurso ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    )}
                    {testingTurso ? 'Testing...' : 'Test Turso Connection'}
                  </button>
                  {tursoTestResult && (
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {tursoTestResult.success ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                      )}
                      <span className={`text-xs truncate ${tursoTestResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
                        {tursoTestResult.message}
                      </span>
                      {tursoTestResult.responseTime !== undefined && (
                        <span className="text-[#4A4945] text-[10px] shrink-0">({tursoTestResult.responseTime}ms)</span>
                      )}
                    </div>
                  )}
                </div>
                {tursoTestResult?.mismatches && tursoTestResult.mismatches.length > 0 && (
                  <div className="bg-[#0e0e14] border border-amber-500/10 rounded-sm p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-amber-400 text-xs font-semibold">Data Mismatch Detected</p>
                        <p className="text-[#8A8780] text-[10px] mt-1">
                          {tursoTestResult.mismatches.map(m => `${m.key} (Turso: ${m.tursoLength}B, Local: ${m.localLength}B)`).join(', ')}
                        </p>
                        <p className="text-[#8A8780] text-[10px] mt-1">Use &quot;Force Turso Push&quot; to sync local data to Turso.</p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="bg-[#0e0e14] border border-[#1a1a22] rounded-sm p-3">
                  <p className="text-[#8A8780] text-[10px]">
                    <span className="text-[#F0EDE6] font-semibold">Turso Cloud:</span> Primary persistent database (libSQL)
                  </p>
                  <p className="text-[#8A8780] text-[10px] mt-1">
                    <span className="text-[#F0EDE6] font-semibold">Local Fallback:</span> data/site-data/*.json (per-key files matching Turso table structure)
                  </p>
                  <p className="text-[#4A4945] text-[9px] mt-1">
                    Each key (sections, settings, preloader, pages, nav_items, media, poll_config) is stored as a separate JSON file — matching the Turso site_data table's per-key row structure.
                  </p>
                </div>
              </div>
            </div>

            {/* ═══ Supabase Polling Config ═══ */}
            <div className="bg-[#08080c] border border-[#1a1a22] rounded-sm mb-6">
              <div className="p-4 border-b border-[#1a1a22] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#FFC300]" />
                <h2 className="text-[#F0EDE6] font-semibold text-sm uppercase tracking-[2px]">Supabase Polling Config</h2>
              </div>
              <div className="bg-[#0e0e14] border border-[#1a1a22] rounded-sm p-3">
                <p className="text-[#8A8780] text-xs">These settings control how often the site checks for new live score data. Poll Interval is how often (in ms) the site fetches updated scores. Jitter adds randomness to prevent all users from requesting at the exact same time. Default: 10000ms interval, 3000ms jitter.</p>
              </div>
              <div className="p-4 space-y-4">
                <div className="bg-[#0e0e14] border border-[#1a1a22] rounded-sm p-3">
                  <p className="text-[#8A8780] text-xs mb-3">
                    Control how frequently the spectator site polls Supabase for live match data updates.
                    Shorter intervals = more real-time but higher API usage.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[#8A8780] text-[10px] uppercase tracking-[2px] font-semibold block mb-1.5">
                        Poll Interval (ms)
                      </label>
                      <input
                        type="number"
                        min="1000"
                        max="60000"
                        step="500"
                        value={pollInterval}
                        onChange={(e) => { setPollInterval(Number(e.target.value)); markDirty(); }}
                        className="w-full bg-[#020204] border border-[#1a1a22] text-[#F0EDE6] px-3 py-2 text-sm rounded-sm focus:border-[#FFC300] focus:outline-none"
                      />
                      <p className="text-[#4A4945] text-[9px] mt-1">Min: 1000ms · Default: 10000ms (10s)</p>
                    </div>
                    <div>
                      <label className="text-[#8A8780] text-[10px] uppercase tracking-[2px] font-semibold block mb-1.5">
                        Max Jitter (ms)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="10000"
                        step="500"
                        value={jitterMax}
                        onChange={(e) => { setJitterMax(Number(e.target.value)); markDirty(); }}
                        className="w-full bg-[#020204] border border-[#1a1a22] text-[#F0EDE6] px-3 py-2 text-sm rounded-sm focus:border-[#FFC300] focus:outline-none"
                      />
                      <p className="text-[#4A4945] text-[9px] mt-1">Random 0–Nms delay to prevent thundering herd. Default: 3000ms</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="text-[#4A4945] text-[9px]">Effective interval: {pollInterval}ms + 0–{jitterMax}ms jitter</span>
                  </div>
                </div>
                <p className="text-[#4A4945] text-[10px] italic">Changes will be saved when you click &quot;Force Turso Push&quot; above.</p>
              </div>
            </div>

            {/* ═══ Reset Match Data ═══ */}
            <div className="bg-[#08080c] border border-red-500/20 rounded-sm mb-6">
              <div className="p-4 border-b border-[#1a1a22] flex items-center gap-2">
                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <h2 className="text-[#F0EDE6] font-semibold text-sm uppercase tracking-[2px]">Reset Match Data</h2>
                <span className="ml-2 px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded-sm text-red-400 text-[9px] font-bold uppercase tracking-wider">Danger</span>
              </div>
              <div className="bg-[#0e0e14] border border-[#1a1a22] rounded-sm p-3">
                <p className="text-[#8A8780] text-xs">Completely clears all match data (scores, batsmen, bowlers, innings) from Supabase. Use this when starting a new match or if data is corrupted. This cannot be undone.</p>
              </div>
              <div className="p-4 space-y-4">
                <div className="bg-[#0e0e14] border border-red-500/10 rounded-sm p-3">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                      <p className="text-red-400 text-xs font-semibold">This will reset ALL match data</p>
                      <p className="text-[#8A8780] text-[10px] mt-1">
                        All scores, batsmen, bowlers, innings data, and win results will be reset to 0/defaults.
                        This is equivalent to starting a new match. The Supabase row is preserved (not deleted).
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleResetMatch}
                  disabled={resettingMatch}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-red-500/30 text-red-400 rounded-sm text-xs font-bold uppercase tracking-[2px] hover:bg-red-500/10 disabled:opacity-50 transition-colors"
                >
                  {resettingMatch ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Reset All Match Data
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* ═══ Home Page Visibility ═══ */}
            <div className="bg-[#08080c] border border-[#1a1a22] rounded-sm mb-6">
              <div className="p-4 border-b border-[#1a1a22] flex items-center gap-2">
                <svg className="w-4 h-4 text-[#FFC300]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                </svg>
                <h2 className="text-[#F0EDE6] font-semibold text-sm uppercase tracking-[2px]">Home Page Visibility</h2>
              </div>
              <div className="bg-[#0e0e14] border border-[#1a1a22] rounded-sm p-3">
                <p className="text-[#8A8780] text-xs">Control which cards/sections appear on the home page. Hide elements you don&apos;t need during off-season or when there&apos;s no active match.</p>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#F0EDE6] text-sm font-medium">Live Score Card</p>
                    <p className="text-[#8A8780] text-xs mt-0.5">Show the live score mini-card on the home page</p>
                  </div>
                  <button
                    onClick={() => {
                      const newVal = !showLiveScoreCard;
                      setShowLiveScoreCard(newVal);
                      setSettings(prev => ({ ...prev, home_visibility: { ...(prev.home_visibility || {}), showLiveScoreCard: newVal } }));
                      markDirty();
                      window.dispatchEvent(new CustomEvent('home-visibility-updated'));
                      // Persist immediately
                      fetch('/api/admin/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ home_visibility: { showLiveScoreCard: newVal } }) }).catch(() => {});
                    }}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${
                      showLiveScoreCard ? 'bg-emerald-500' : 'bg-[#1a1a22]'
                    }`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${showLiveScoreCard ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#F0EDE6] text-sm font-medium">Match Day Highlights</p>
                    <p className="text-[#8A8780] text-xs mt-0.5">Show the toss/venue/series highlights card on home page</p>
                  </div>
                  <button
                    onClick={() => {
                      const newVal = !showMatchHighlights;
                      setShowMatchHighlights(newVal);
                      setSettings(prev => ({ ...prev, home_visibility: { ...(prev.home_visibility || {}), showMatchHighlights: newVal } }));
                      markDirty();
                      window.dispatchEvent(new CustomEvent('home-visibility-updated'));
                      // Persist immediately
                      fetch('/api/admin/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ home_visibility: { showMatchHighlights: newVal } }) }).catch(() => {});
                    }}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${
                      showMatchHighlights ? 'bg-emerald-500' : 'bg-[#1a1a22]'
                    }`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${showMatchHighlights ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* ═══ Happening Now ═══ */}
            <div className="bg-[#08080c] border border-[#1a1a22] rounded-sm mb-6">
              <div className="p-4 border-b border-[#1a1a22] flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#FFC300]" />
                <h2 className="text-[#F0EDE6] font-semibold text-sm uppercase tracking-[2px]">Happening Now</h2>
                {happeningNowEnabled && (
                  <span className="ml-2 px-2 py-0.5 bg-[#FFC300]/10 border border-[#FFC300]/20 rounded-sm text-[#FFC300] text-[9px] font-bold uppercase tracking-wider">Active</span>
                )}
              </div>
              <div className="bg-[#0e0e14] border border-[#1a1a22] rounded-sm p-3">
                <p className="text-[#8A8780] text-xs">When Happening Now is enabled, a special banner appears on the home page highlighting a current event (like match day). Use this to draw attention to live events.</p>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#F0EDE6] text-sm font-medium">Happening Now Banner</p>
                    <p className="text-[#8A8780] text-xs mt-0.5">Show a &quot;Battle of the Golds — Happening Now&quot; card at the top of the home page</p>
                  </div>
                  <button
                    onClick={() => {
                      const newVal = !happeningNowEnabled;
                      setHappeningNowEnabled(newVal);
                      setSettings(prev => ({ ...prev, happening_now: { enabled: newVal } }));
                      markDirty();
                      // Persist immediately to prevent stale cache override
                      fetch('/api/admin/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ happening_now: { enabled: newVal } }) }).catch(() => {});
                    }}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${
                      happeningNowEnabled ? 'bg-[#FFC300]' : 'bg-[#1a1a22]'
                    }`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${happeningNowEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                {happeningNowEnabled && (
                  <div className="bg-[#0e0e14] border border-[#FFC300]/10 rounded-sm p-3">
                    <div className="flex items-start gap-2">
                      <Zap className="w-4 h-4 text-[#FFC300] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[#FFC300] text-xs font-semibold">Happening Now Banner Active</p>
                        <p className="text-[#8A8780] text-[10px] mt-1">
                          A &quot;Battle of the Golds — Happening Now&quot; card with a pulsing live indicator will appear at the top of the home page.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ═══ Coming Soon ═══ */}
            <div className="bg-[#08080c] border border-[#1a1a22] rounded-sm mb-6">
              <div className="p-4 border-b border-[#1a1a22] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#FFC300]" />
                <h2 className="text-[#F0EDE6] font-semibold text-sm uppercase tracking-[2px]">Coming Soon</h2>
                {comingSoonEnabled && (
                  <span className="ml-2 px-2 py-0.5 bg-[#FFC300]/10 border border-[#FFC300]/20 rounded-sm text-[#FFC300] text-[9px] font-bold uppercase tracking-wider">Active</span>
                )}
              </div>
              <div className="bg-[#0e0e14] border border-[#1a1a22] rounded-sm p-3">
                <p className="text-[#8A8780] text-xs">When Coming Soon is enabled, visitors see a countdown page instead of the normal site. This is useful before a big match when you want to build anticipation. Set the countdown date to match day. The title and details are shown on the countdown page.</p>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#F0EDE6] text-sm font-medium">Coming Soon Banner</p>
                    <p className="text-[#8A8780] text-xs mt-0.5">Show a &quot;Coming Soon&quot; banner at the top of the Live page</p>
                  </div>
                  <button
                    onClick={() => {
                      const newVal = !comingSoonEnabled;
                      setComingSoonEnabled(newVal);
                      setSettings(prev => ({ ...prev, coming_soon: { enabled: newVal, title: comingSoonTitle, details: comingSoonDetails, countdownDate: comingSoonCountdownDate } }));
                      markDirty();
                      // Persist immediately to prevent stale cache override
                      fetch('/api/admin/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ coming_soon: { enabled: newVal } }) }).catch(() => {});
                    }}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${
                      comingSoonEnabled ? 'bg-[#FFC300]' : 'bg-[#1a1a22]'
                    }`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${comingSoonEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                {comingSoonEnabled && (
                  <>
                    <div>
                      <label className="block text-[#8A8780] text-xs mb-1.5">Banner Title</label>
                      <input
                        value={comingSoonTitle}
                        onChange={(e) => { setComingSoonTitle(e.target.value); markDirty(); }}
                        placeholder="Coming Soon"
                        className="w-full bg-[#0e0e14] border border-[#1a1a22] rounded-sm px-3 py-2.5 text-[#F0EDE6] text-sm placeholder-[#4A4945] focus:outline-none focus:border-[#FFC300]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#8A8780] text-xs mb-1.5">Countdown Target Date & Time</label>
                      <input
                        type="datetime-local"
                        value={comingSoonCountdownDate}
                        onChange={(e) => { setComingSoonCountdownDate(e.target.value); markDirty(); }}
                        className="w-full bg-[#0e0e14] border border-[#1a1a22] rounded-sm px-3 py-2.5 text-[#F0EDE6] text-sm focus:outline-none focus:border-[#FFC300]"
                      />
                      <p className="text-[#4A4945] text-[10px] mt-1">A live countdown timer will display on the banner counting down to this date</p>
                    </div>
                    <div>
                      <label className="block text-[#8A8780] text-xs mb-1.5">Details / Subtitle</label>
                      <textarea
                        value={comingSoonDetails}
                        onChange={(e) => { setComingSoonDetails(e.target.value); markDirty(); }}
                        placeholder="Score will be updated on 15th May 2026"
                        rows={2}
                        className="w-full bg-[#0e0e14] border border-[#1a1a22] rounded-sm px-3 py-2.5 text-[#F0EDE6] text-sm placeholder-[#4A4945] focus:outline-none focus:border-[#FFC300] resize-y"
                      />
                    </div>
                    <p className="text-[#4A4945] text-[10px] italic">Toggle and text changes are saved to Turso immediately. Use Publish &amp; Rebuild to update the public site.</p>
                    <div className="bg-[#0e0e14] border border-[#FFC300]/10 rounded-sm p-3">
                      <div className="flex items-start gap-2">
                        <Clock className="w-4 h-4 text-[#FFC300] mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[#FFC300] text-xs font-semibold">Coming Soon Banner Active</p>
                          <p className="text-[#8A8780] text-[10px] mt-1">
                            A &quot;{comingSoonTitle}&quot; banner with a countdown timer will appear at the top of the Live page.
                            {comingSoonDetails && <span> Message: &quot;{comingSoonDetails}&quot;</span>}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ═══ Win Signal ═══ */}
            <div className="bg-[#08080c] border border-gold/30 rounded-sm mb-6">
              <div className="p-4 border-b border-[#1a1a22] flex items-center gap-2">
                <svg className="w-4 h-4 text-[#FFC300]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                <h2 className="text-[#F0EDE6] font-semibold text-sm uppercase tracking-[2px]">Win Signal</h2>
                <span className="ml-2 px-2 py-0.5 bg-gold/10 border border-gold/20 rounded-sm text-[#FFC300] text-[9px] font-bold uppercase tracking-wider">Auto-detect</span>
              </div>
              <div className="bg-[#0e0e14] border border-[#1a1a22] rounded-sm p-3">
                <p className="text-[#8A8780] text-xs">Manually override the match result message. Use this to display a custom win/loss/draw announcement after the match. Leave empty to show the auto-detected result from live scoring data.</p>
              </div>
              <div className="p-4 space-y-4">
                <p className="text-[#8A8780] text-xs">
                  Win signal is automatically sent from the Score Updater Admin when a match ends.
                  The result below is auto-detected from Supabase.
                </p>

                <div className="bg-[#0e0e14] border border-[#1a1a22] rounded-sm p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {winResultAuto !== 'Match in progress' ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-[#8A8780] shrink-0" />
                      )}
                      <div>
                        <p className={`text-xs font-semibold ${winResultAuto !== 'Match in progress' ? 'text-emerald-400' : 'text-[#8A8780]'}`}>
                          {winResultAuto !== 'Match in progress' ? 'Win Signal Detected' : 'No Win Signal Yet'}
                        </p>
                        <p className="text-[#F0EDE6] text-sm mt-0.5">{winResultAuto}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider ${
                      winResultAuto !== 'Match in progress'
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                        : 'bg-[#1a1a22] text-[#8A8780]'
                    }`}>
                      {winResultAuto !== 'Match in progress' ? 'Result Set' : 'In Progress'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleRefreshWinResult}
                    disabled={sendingWin}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0e0e14] border border-[#1a1a22] text-[#F0EDE6] rounded-sm text-xs font-semibold hover:border-[#FFC300] disabled:opacity-50 transition-colors"
                  >
                    {sendingWin ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    Refresh Result
                  </button>
                  <button
                    onClick={async () => {
                      setSendingWin(true);
                      try {
                        const res = await fetch('/api/admin/clear-supabase', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ action: 'clearWin' }),
                        });
                        const data = await res.json();
                        if (res.ok && data.success) {
                          setWinResult('');
                          setWinResultAuto('Match in progress');
                        } else {
                          alert('Failed: ' + (data.error || 'Unknown error'));
                        }
                      } catch { alert('Network error'); }
                      finally { setSendingWin(false); }
                    }}
                    disabled={sendingWin}
                    className="flex items-center gap-2 px-4 py-2 border border-red-500/30 text-red-400 rounded-sm text-xs font-bold uppercase tracking-[2px] hover:bg-red-500/10 disabled:opacity-50 transition-colors"
                  >
                    Clear Win
                  </button>
                </div>

                <div className="border-t border-[#1a1a22] pt-3">
                  <button
                    onClick={() => setShowManualOverride(!showManualOverride)}
                    className="flex items-center gap-1.5 text-[#4A4945] text-[10px] uppercase tracking-[2px] font-semibold hover:text-[#8A8780] transition-colors"
                  >
                    {showManualOverride ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    Manual Override
                  </button>
                  {showManualOverride && (
                    <div className="mt-3 space-y-3">
                      <p className="text-[#4A4945] text-[10px]">Use this only as a fallback when auto-detect fails.</p>
                      <div>
                        <label className="block text-[#8A8780] text-xs mb-1.5">Win Result Text</label>
                        <input
                          value={winResult}
                          onChange={(e) => setWinResult(e.target.value)}
                          placeholder="e.g. St.Thomas' College won by 5 wickets"
                          className="w-full bg-[#0e0e14] border border-[#1a1a22] rounded-sm px-3 py-2.5 text-[#F0EDE6] text-sm placeholder-[#4A4945] focus:outline-none focus:border-[#FFC300]"
                        />
                      </div>
                      <button
                        onClick={async () => {
                          if (!winResult.trim()) { alert('Please enter a win result text'); return; }
                          setSendingWin(true);
                          try {
                            const res = await fetch('/api/admin/clear-supabase', {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ action: 'setWin', result: winResult.trim() }),
                            });
                            const data = await res.json();
                            if (res.ok && data.success) {
                              setWinResultAuto(winResult.trim());
                              alert('Win signal sent! Victory banner will show on Spector.');
                            } else {
                              alert('Failed: ' + (data.error || 'Unknown error'));
                            }
                          } catch { alert('Network error'); }
                          finally { setSendingWin(false); }
                        }}
                        disabled={sendingWin || !winResult.trim()}
                        className="flex items-center gap-2 px-4 py-2 bg-[#FFC300] text-[#020204] rounded-sm text-xs font-bold uppercase tracking-[2px] hover:bg-[#FFD54F] disabled:opacity-50 transition-colors"
                      >
                        {sendingWin ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                          </svg>
                        )}
                        {sendingWin ? 'Sending...' : 'Send Win Signal'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ═══ General Settings ═══ */}
            <div className="bg-[#08080c] border border-[#1a1a22] rounded-sm mb-6">
              <div className="p-4 border-b border-[#1a1a22] flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#FFC300]" />
                <h2 className="text-[#F0EDE6] font-semibold text-sm">General</h2>
              </div>
              <div className="bg-[#0e0e14] border border-[#1a1a22] rounded-sm p-3">
                <p className="text-[#8A8780] text-xs">These are the basic site-wide settings. Site Name and Description appear in browser tabs and search results. Site URL is used for SEO canonical links. Colors control the gold/red theme.</p>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-[#8A8780] text-xs mb-1.5">Site Name</label>
                  <input
                    value={settings.siteName}
                    onChange={(e) => { setSettings({ ...settings, siteName: e.target.value }); markDirty(); }}
                    className="w-full bg-[#0e0e14] border border-[#1a1a22] rounded-sm px-3 py-2.5 text-[#F0EDE6] text-sm placeholder-[#4A4945] focus:outline-none focus:border-[#FFC300]"
                  />
                </div>
                <div>
                  <label className="block text-[#8A8780] text-xs mb-1.5">Site Description</label>
                  <textarea
                    value={settings.siteDescription}
                    onChange={(e) => { setSettings({ ...settings, siteDescription: e.target.value }); markDirty(); }}
                    rows={3}
                    className="w-full bg-[#0e0e14] border border-[#1a1a22] rounded-sm px-3 py-2.5 text-[#F0EDE6] text-sm placeholder-[#4A4945] focus:outline-none focus:border-[#FFC300] resize-y"
                  />
                </div>
                <div>
                  <label className="block text-[#8A8780] text-xs mb-1.5">Site URL</label>
                  <input
                    value={settings.siteUrl}
                    onChange={(e) => { setSettings({ ...settings, siteUrl: e.target.value }); markDirty(); }}
                    className="w-full bg-[#0e0e14] border border-[#1a1a22] rounded-sm px-3 py-2.5 text-[#F0EDE6] text-sm font-mono placeholder-[#4A4945] focus:outline-none focus:border-[#FFC300]"
                  />
                </div>
              </div>
            </div>

            {/* ═══ Branding & Images ═══ */}
            <div className="bg-[#08080c] border border-[#1a1a22] rounded-sm mb-6">
              <div className="p-4 border-b border-[#1a1a22] flex items-center gap-2">
                <Palette className="w-4 h-4 text-[#FFC300]" />
                <h2 className="text-[#F0EDE6] font-semibold text-sm">Branding & Images</h2>
              </div>
              <div className="p-4 space-y-5">
                <ImageField
                  label="Site Logo"
                  value={settings.siteLogo}
                  onChange={(url) => { setSettings({ ...settings, siteLogo: url }); markDirty(); }}
                  placeholder="Upload or paste site logo URL"
                  aspectHint="Any size, transparent PNG recommended"
                />
                <ImageField
                  label="Favicon"
                  value={settings.siteFavicon}
                  onChange={(url) => { setSettings({ ...settings, siteFavicon: url }); markDirty(); }}
                  placeholder="Upload or paste favicon URL"
                  aspectHint="32x32 or 64x64"
                />
                <div className="border-t border-[#1a1a22] pt-4">
                  <p className="text-[#4A4945] text-[9px] uppercase tracking-[3px] mb-3">Team Emblems</p>
                  <div className="grid grid-cols-2 gap-4">
                    <ImageField
                      label="S. Thomas' Emblem"
                      value={settings.stThomasEmblem}
                      onChange={(url) => { setSettings({ ...settings, stThomasEmblem: url }); markDirty(); }}
                      placeholder="Upload S. Thomas' crest"
                      isEmblem
                      showEmblemBadge
                      aspectHint="Square (1:1)"
                    />
                    <ImageField
                      label="Royal Emblem"
                      value={settings.royalEmblem}
                      onChange={(url) => { setSettings({ ...settings, royalEmblem: url }); markDirty(); }}
                      placeholder="Upload Royal crest"
                      isEmblem
                      showEmblemBadge
                      aspectHint="Square (1:1)"
                    />
                  </div>
                </div>
                <div className="border-t border-[#1a1a22] pt-4">
                  <p className="text-[#4A4945] text-[9px] uppercase tracking-[3px] mb-3">Colors</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#8A8780] text-xs mb-1.5">Primary Color</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={settings.primaryColor} onChange={(e) => { setSettings({ ...settings, primaryColor: e.target.value }); markDirty(); }} className="w-10 h-10 rounded-sm border border-[#1a1a22] cursor-pointer" />
                        <input value={settings.primaryColor} onChange={(e) => { setSettings({ ...settings, primaryColor: e.target.value }); markDirty(); }} className="flex-1 bg-[#0e0e14] border border-[#1a1a22] rounded-sm px-3 py-2.5 text-[#F0EDE6] text-sm font-mono focus:outline-none focus:border-[#FFC300]" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[#8A8780] text-xs mb-1.5">Accent Color</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={settings.accentColor} onChange={(e) => { setSettings({ ...settings, accentColor: e.target.value }); markDirty(); }} className="w-10 h-10 rounded-sm border border-[#1a1a22] cursor-pointer" />
                        <input value={settings.accentColor} onChange={(e) => { setSettings({ ...settings, accentColor: e.target.value }); markDirty(); }} className="flex-1 bg-[#0e0e14] border border-[#1a1a22] rounded-sm px-3 py-2.5 text-[#F0EDE6] text-sm font-mono focus:outline-none focus:border-[#FFC300]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ═══ Preloader Settings ═══ */}
            <div className="bg-[#08080c] border border-[#1a1a22] rounded-sm mb-6">
              <div className="p-4 border-b border-[#1a1a22] flex items-center gap-2">
                <svg className="w-4 h-4 text-[#FFC300]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <h2 className="text-[#F0EDE6] font-semibold text-sm">Preloader Settings</h2>
              </div>
              <div className="bg-[#0e0e14] border border-[#1a1a22] rounded-sm p-3">
                <p className="text-[#8A8780] text-xs">The preloader is the loading animation visitors see when they first open the site. Sentences rotate as text during loading. Duration controls how long the preloader shows (in seconds). Colors control the loading animation theme.</p>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[#8A8780] text-xs">Typewriter Sentences</label>
                    <button onClick={addSentence} className="text-[#FFC300] text-[9px] font-bold uppercase tracking-[1px] hover:text-[#FFD54F]">
                      + Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {preloaderSettings.sentences.map((s, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-[#4A4945] text-[10px] w-4 text-right">{i + 1}</span>
                        <input
                          type="text"
                          value={s.text}
                          onChange={(e) => updateSentence(i, e.target.value)}
                          className="flex-1 bg-[#0e0e14] border border-[#1a1a22] rounded-sm px-3 py-2 text-[#F0EDE6] text-sm focus:outline-none focus:border-[#FFC300]"
                        />
                        <button onClick={() => removeSentence(i)} className="text-[#4A4945] hover:text-red-400 transition-colors p-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[#8A8780] text-xs mb-1.5">Duration (seconds)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={4}
                      max={30}
                      step={1}
                      value={preloaderSettings.duration}
                      onChange={(e) => { setPreloaderSettings({ ...preloaderSettings, duration: parseInt(e.target.value) }); markDirty(); }}
                      className="flex-1 accent-[#FFC300]"
                    />
                    <span className="text-[#F0EDE6] text-sm font-mono w-10 text-center">{preloaderSettings.duration}s</span>
                  </div>
                  <p className="text-[#4A4945] text-[10px] mt-1">How long the preloader shows before fading out (4–30 seconds)</p>
                </div>
                {/* Color Strips Preview */}
                <div className="bg-[#0e0e14] border border-[#1a1a22] rounded-sm p-3">
                  <p className="text-[#8A8780] text-[10px] uppercase tracking-[2px] font-semibold mb-2">Strip Colors Preview</p>
                  <div className="flex items-center gap-1.5">
                    <div className="h-6 flex-1 rounded-sm" style={{ backgroundColor: preloaderSettings.primary_color }} />
                    <div className="h-6 flex-1 rounded-sm" style={{ backgroundColor: preloaderSettings.secondary_color }} />
                    <div className="h-6 flex-1 rounded-sm" style={{ backgroundColor: preloaderSettings.tertiary_color }} />
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="flex-1 text-[9px] text-[#4A4945] text-center">Strip 1</span>
                    <span className="flex-1 text-[9px] text-[#4A4945] text-center">Strip 2</span>
                    <span className="flex-1 text-[9px] text-[#4A4945] text-center">Strip 3</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#8A8780] text-xs mb-1.5">Strip 1 — Primary Color</label>
                    <div className="flex items-center gap-1">
                      <input type="color" value={preloaderSettings.primary_color} onChange={(e) => { setPreloaderSettings({ ...preloaderSettings, primary_color: e.target.value }); markDirty(); }} className="w-8 h-8 rounded-sm border border-[#1a1a22] cursor-pointer" />
                      <input value={preloaderSettings.primary_color} onChange={(e) => { setPreloaderSettings({ ...preloaderSettings, primary_color: e.target.value }); markDirty(); }} className="flex-1 bg-[#0e0e14] border border-[#1a1a22] rounded-sm px-2 py-1.5 text-[#F0EDE6] text-xs font-mono focus:outline-none focus:border-[#FFC300]" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[#8A8780] text-xs mb-1.5">Strip 2 — Secondary Color</label>
                    <div className="flex items-center gap-1">
                      <input type="color" value={preloaderSettings.secondary_color} onChange={(e) => { setPreloaderSettings({ ...preloaderSettings, secondary_color: e.target.value }); markDirty(); }} className="w-8 h-8 rounded-sm border border-[#1a1a22] cursor-pointer" />
                      <input value={preloaderSettings.secondary_color} onChange={(e) => { setPreloaderSettings({ ...preloaderSettings, secondary_color: e.target.value }); markDirty(); }} className="flex-1 bg-[#0e0e14] border border-[#1a1a22] rounded-sm px-2 py-1.5 text-[#F0EDE6] text-xs font-mono focus:outline-none focus:border-[#FFC300]" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[#8A8780] text-xs mb-1.5">Strip 3 — Tertiary Color</label>
                    <div className="flex items-center gap-1">
                      <input type="color" value={preloaderSettings.tertiary_color} onChange={(e) => { setPreloaderSettings({ ...preloaderSettings, tertiary_color: e.target.value }); markDirty(); }} className="w-8 h-8 rounded-sm border border-[#1a1a22] cursor-pointer" />
                      <input value={preloaderSettings.tertiary_color} onChange={(e) => { setPreloaderSettings({ ...preloaderSettings, tertiary_color: e.target.value }); markDirty(); }} className="flex-1 bg-[#0e0e14] border border-[#1a1a22] rounded-sm px-2 py-1.5 text-[#F0EDE6] text-xs font-mono focus:outline-none focus:border-[#FFC300]" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[#8A8780] text-xs mb-1.5">Background</label>
                    <div className="flex items-center gap-1">
                      <input type="color" value={preloaderSettings.background_color} onChange={(e) => { setPreloaderSettings({ ...preloaderSettings, background_color: e.target.value }); markDirty(); }} className="w-8 h-8 rounded-sm border border-[#1a1a22] cursor-pointer" />
                      <input value={preloaderSettings.background_color} onChange={(e) => { setPreloaderSettings({ ...preloaderSettings, background_color: e.target.value }); markDirty(); }} className="flex-1 bg-[#0e0e14] border border-[#1a1a22] rounded-sm px-2 py-1.5 text-[#F0EDE6] text-xs font-mono focus:outline-none focus:border-[#FFC300]" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#8A8780] text-xs mb-1.5">Text Color</label>
                    <div className="flex items-center gap-1">
                      <input type="color" value={preloaderSettings.text_color} onChange={(e) => { setPreloaderSettings({ ...preloaderSettings, text_color: e.target.value }); markDirty(); }} className="w-8 h-8 rounded-sm border border-[#1a1a22] cursor-pointer" />
                      <input value={preloaderSettings.text_color} onChange={(e) => { setPreloaderSettings({ ...preloaderSettings, text_color: e.target.value }); markDirty(); }} className="flex-1 bg-[#0e0e14] border border-[#1a1a22] rounded-sm px-2 py-1.5 text-[#F0EDE6] text-xs font-mono focus:outline-none focus:border-[#FFC300]" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[#8A8780] text-xs mb-1.5">Progress Bar Color</label>
                    <div className="flex items-center gap-1">
                      <input type="color" value={preloaderSettings.bar_color} onChange={(e) => { setPreloaderSettings({ ...preloaderSettings, bar_color: e.target.value }); markDirty(); }} className="w-8 h-8 rounded-sm border border-[#1a1a22] cursor-pointer" />
                      <input value={preloaderSettings.bar_color} onChange={(e) => { setPreloaderSettings({ ...preloaderSettings, bar_color: e.target.value }); markDirty(); }} className="flex-1 bg-[#0e0e14] border border-[#1a1a22] rounded-sm px-2 py-1.5 text-[#F0EDE6] text-xs font-mono focus:outline-none focus:border-[#FFC300]" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleSavePreloader}
                    disabled={savingPreloader}
                    className="flex items-center gap-2 px-4 py-2 bg-[#FFC300] text-[#020204] rounded-sm text-xs font-bold uppercase tracking-[2px] hover:bg-[#FFD54F] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {savingPreloader ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</>
                    ) : (
                      'Save Preloader'
                    )}
                  </button>
                  {preloaderSaveResult && (
                    <span className={`text-xs ${preloaderSaveResult.success ? 'text-green-400' : 'text-red-400'}`}>
                      {preloaderSaveResult.message}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ═══ MUSIC MANAGER ═══ */}
            <MusicAdminSection />

            {/* ═══ Security ═══ */}
            <div className="bg-[#08080c] border border-[#1a1a22] rounded-sm mb-6">
              <div className="p-4 border-b border-[#1a1a22] flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#FFC300]" />
                <h2 className="text-[#F0EDE6] font-semibold text-sm">Security</h2>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-[#8A8780] text-xs mb-1.5">Admin Allowed Emails (comma-separated)</label>
                  <input
                    value={settings.allowedEmails}
                    onChange={(e) => { setSettings({ ...settings, allowedEmails: e.target.value }); markDirty(); }}
                    className="w-full bg-[#0e0e14] border border-[#1a1a22] rounded-sm px-3 py-2.5 text-[#F0EDE6] text-sm placeholder-[#4A4945] focus:outline-none focus:border-[#FFC300]"
                  />
                  <p className="text-[#4A4945] text-xs mt-1">Only these email addresses will be allowed to access the admin panel</p>
                </div>
              </div>
            </div>

            {/* ═══ Advanced ═══ */}
            <div className="bg-[#08080c] border border-[#1a1a22] rounded-sm mb-6">
              <div className="p-4 border-b border-[#1a1a22] flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#FFC300]" />
                <h2 className="text-[#F0EDE6] font-semibold text-sm">Advanced</h2>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-[#8A8780] text-xs mb-1.5">Google Analytics ID</label>
                  <input
                    value={settings.googleAnalyticsId}
                    onChange={(e) => { setSettings({ ...settings, googleAnalyticsId: e.target.value }); markDirty(); }}
                    placeholder="G-XXXXXXXXXX"
                    className="w-full bg-[#0e0e14] border border-[#1a1a22] rounded-sm px-3 py-2.5 text-[#F0EDE6] text-sm font-mono placeholder-[#4A4945] focus:outline-none focus:border-[#FFC300]"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#F0EDE6] text-sm">Enable Notifications</p>
                    <p className="text-[#4A4945] text-xs">Receive admin notifications</p>
                  </div>
                  <button
                    onClick={() => { setSettings({ ...settings, enableNotifications: !settings.enableNotifications }); markDirty(); }}
                    className={`w-12 h-6 rounded-full transition-colors ${settings.enableNotifications ? 'bg-[#FFC300]' : 'bg-[#1a1a22]'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${settings.enableNotifications ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#F0EDE6] text-sm">Maintenance Mode</p>
                    <p className="text-[#4A4945] text-xs">Show maintenance page to visitors</p>
                  </div>
                  <button
                    onClick={async () => {
                      const newMode = !settings.maintenanceMode;
                      setSettings({ ...settings, maintenanceMode: newMode });
                      // Save immediately to server
                      try {
                        await fetch('/api/admin/settings', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ maintenanceMode: newMode }),
                        });
                        // Dispatch event so ClientLayout picks it up immediately
                        window.dispatchEvent(new CustomEvent('site-settings-updated', { detail: { maintenanceMode: newMode } }));
                      } catch {
                        console.warn('Failed to save maintenance mode');
                      }
                    }}
                    className={`w-12 h-6 rounded-full transition-colors ${settings.maintenanceMode ? 'bg-red-500' : 'bg-[#1a1a22]'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${settings.maintenanceMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* ═══ GitHub CDN Configuration ═══ */}
            <div className="bg-[#08080c] border border-[#1a1a22] rounded-sm mb-6">
              <div className="p-4 border-b border-[#1a1a22] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Github className="w-4 h-4 text-[#FFC300]" />
                  <h2 className="text-[#F0EDE6] font-semibold text-sm">GitHub CDN Upload</h2>
                  {githubStatus ? (
                    githubStatus.connected ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded-sm text-green-400 text-[9px] font-bold uppercase tracking-wider">
                        <Wifi className="w-3 h-3" /> Connected
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded-sm text-red-400 text-[9px] font-bold uppercase tracking-wider">
                        <WifiOff className="w-3 h-3" /> Disconnected
                      </span>
                    )
                  ) : githubHasToken ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-[#FFC300]/10 border border-[#FFC300]/20 rounded-sm text-[#FFC300] text-[9px] font-bold uppercase tracking-wider">
                      <Wifi className="w-3 h-3" /> Token Set
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded-sm text-red-400 text-[9px] font-bold uppercase tracking-wider">
                      <WifiOff className="w-3 h-3" /> No Token
                    </span>
                  )}
                </div>
                <button
                  onClick={async () => {
                    setTestingGithub(true);
                    setGithubStatus(null);
                    try {
                      if (githubToken && !githubToken.startsWith('••••')) {
                        await fetch('/api/admin/github-config', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ githubToken, githubRepoOwner, githubRepoName, githubRepoPath }),
                        });
                      }
                      const res = await fetch('/api/admin/github-config', { method: 'PUT' });
                      const data = await res.json();
                      setGithubStatus(data);
                      if (data.connected) setGithubHasToken(true);
                    } catch {
                      setGithubStatus({ connected: false, error: 'Network error' });
                    } finally {
                      setTestingGithub(false);
                    }
                  }}
                  disabled={testingGithub}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-[#1a1a22] text-[#8A8780] rounded-sm text-[9px] font-bold uppercase tracking-[1px] hover:text-[#F0EDE6] hover:border-[#28283a] disabled:opacity-50 transition-colors"
                >
                  {testingGithub ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wifi className="w-3 h-3" />}
                  {testingGithub ? 'Testing...' : 'Test'}
                </button>
              </div>
              <div className="bg-[#0e0e14] border border-[#1a1a22] rounded-sm p-3">
                <p className="text-[#8A8780] text-xs">GitHub CDN is used for uploading and serving images. When you upload an image through the admin panel, it gets pushed to the GitHub repo and served via jsDelivr CDN (free, fast, unlimited). The repo owner/name/path must match your GitHub repository settings. The token needs &apos;repo&apos; write permissions.</p>
              </div>
              <div className="p-4 space-y-4">
                {githubStatus && (
                  <div className={`p-3 rounded-sm border ${githubStatus.connected ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                    <div className="flex items-start gap-2">
                      {githubStatus.connected ? (
                        <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                      )}
                      <div>
                        {githubStatus.connected ? (
                          <>
                            <p className="text-green-400 text-xs font-semibold">Connected to {githubStatus.repo}</p>
                            <p className="text-[#8A8780] text-[10px] mt-0.5">Branch: {githubStatus.branch} • {githubStatus.private ? 'Private' : 'Public'} repo</p>
                            {githubStatus.pathWarning && (
                              <p className="text-[#FFC300] text-[10px] mt-1">⚠ {githubStatus.pathWarning}</p>
                            )}
                          </>
                        ) : (
                          <p className="text-red-400 text-xs">{githubStatus.error}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {!githubHasToken && !githubStatus?.connected && (
                  <div className="p-3 rounded-sm border bg-red-500/5 border-red-500/20">
                    <div className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-red-400 text-xs font-semibold">GitHub Token not configured</p>
                        <p className="text-[#8A8780] text-[10px] mt-0.5">Images will upload to local server instead of GitHub CDN.</p>
                      </div>
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-[#8A8780] text-xs mb-1.5">GitHub Personal Access Token</label>
                  <input
                    type="password"
                    value={githubToken}
                    onChange={(e) => { setGithubToken(e.target.value); setGithubStatus(null); markDirty(); }}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    className="w-full bg-[#0e0e14] border border-[#1a1a22] rounded-sm px-3 py-2.5 text-[#F0EDE6] text-sm font-mono placeholder-[#4A4945] focus:outline-none focus:border-[#FFC300]"
                  />
                  <p className="text-[#4A4945] text-xs mt-1">Token with <code className="text-[#8A8780]">repo</code> permissions.</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[#8A8780] text-xs mb-1.5">Repo Owner</label>
                    <input
                      value={githubRepoOwner}
                      onChange={(e) => { setGithubRepoOwner(e.target.value); setGithubStatus(null); markDirty(); }}
                      className="w-full bg-[#0e0e14] border border-[#1a1a22] rounded-sm px-3 py-2.5 text-[#F0EDE6] text-sm font-mono placeholder-[#4A4945] focus:outline-none focus:border-[#FFC300]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#8A8780] text-xs mb-1.5">Repo Name</label>
                    <input
                      value={githubRepoName}
                      onChange={(e) => { setGithubRepoName(e.target.value); setGithubStatus(null); markDirty(); }}
                      className="w-full bg-[#0e0e14] border border-[#1a1a22] rounded-sm px-3 py-2.5 text-[#F0EDE6] text-sm font-mono placeholder-[#4A4945] focus:outline-none focus:border-[#FFC300]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#8A8780] text-xs mb-1.5">Repo Path</label>
                    <input
                      value={githubRepoPath}
                      onChange={(e) => { setGithubRepoPath(e.target.value); setGithubStatus(null); markDirty(); }}
                      className="w-full bg-[#0e0e14] border border-[#1a1a22] rounded-sm px-3 py-2.5 text-[#F0EDE6] text-sm font-mono placeholder-[#4A4945] focus:outline-none focus:border-[#FFC300]"
                    />
                  </div>
                </div>
                <div className="bg-[#0e0e14] border border-[#1a1a22] rounded-sm p-3">
                  <p className="text-[#8A8780] text-[10px] uppercase tracking-[2px] font-semibold mb-2">CDN URL Format</p>
                  <code className="text-[#FFC300] text-[11px] font-mono break-all">
                    https://cdn.jsdelivr.net/gh/{githubRepoOwner || 'architecturezen8-cpu'}/{githubRepoName || 'web-assets'}/{githubRepoPath || 'uploads'}/filename.jpg
                  </code>
                </div>
                <p className="text-[#4A4945] text-[10px] italic">Changes will be saved when you click &quot;Force Turso Push&quot; above.</p>
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* Success Toast */}
      {successToast && (
        <div className="fixed top-16 right-4 z-[9999] max-w-sm bg-green-500/10 border border-green-500/30 rounded-sm px-4 py-3 shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-green-400 text-xs font-medium">{successToast}</p>
            <button onClick={() => setSuccessToast(null)} className="text-green-400/60 hover:text-green-400 ml-2">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
