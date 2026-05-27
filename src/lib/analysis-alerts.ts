import { getEnv } from '@/lib/cf-env';
import { d1GetSetting, d1SetSetting, getD1Database, initD1Database } from '@/lib/d1';

export type AlertLevel = 'info' | 'warning' | 'danger' | 'success';
export type AlertChannel = 'dashboard' | 'telegram' | 'email';

export interface AnalysisThresholds {
  warning1: number;
  warning2: number;
  warning3: number;
  autoPeak: number;
}

export interface AnalysisTemplates {
  test: string;
  warning1: string;
  warning2: string;
  warning3: string;
  autoPeak: string;
  dangerZone: string;
  supabaseToggle: string;
  tursoToggle: string;
}

export interface AnalysisSettings {
  enabled: boolean;
  peakSafeMode: boolean;
  autoPeakEnabled: boolean;
  channels: Record<AlertChannel, boolean>;
  telegram: {
    enabled: boolean;
    chatIds: string[];
  };
  email: {
    enabled: boolean;
    to: string;
    from: string;
  };
  thresholds: AnalysisThresholds;
  templates: AnalysisTemplates;
}

export interface SystemAlert {
  id: string;
  type: string;
  level: AlertLevel;
  title: string;
  message: string;
  channels: AlertChannel[];
  delivery_status: Record<string, { ok: boolean; error?: string }>;
  created_at: number;
  read: boolean;
}

export const DEFAULT_ANALYSIS_SETTINGS: AnalysisSettings = {
  enabled: true,
  peakSafeMode: false,
  autoPeakEnabled: true,
  channels: {
    dashboard: true,
    telegram: false,
    email: false,
  },
  telegram: {
    enabled: false,
    chatIds: [],
  },
  email: {
    enabled: false,
    to: '',
    from: 'alerts@thomiansmedia.us',
  },
  thresholds: {
    warning1: 30_000,
    warning2: 50_000,
    warning3: 60_000,
    autoPeak: 68_000,
  },
  templates: {
    test: '<b>✅ Test Alert</b>\n\nSite: {siteName}\nTime: {time}\nChannel test completed.',
    warning1: '<b>⚠️ Voting Warning 1</b>\n\nStrict vote writes today: <b>{count}</b>\nThreshold: {threshold}\nMode: {mode}\nTime: {time}\n\nRecommendation: {recommendation}',
    warning2: '<b>🚨 Voting Warning 2</b>\n\nStrict vote writes today: <b>{count}</b>\nThreshold: {threshold}\nMode: {mode}\nTime: {time}\n\nPrepare to enable Peak Crowd Safe Mode.',
    warning3: '<b>🔥 Voting Warning 3</b>\n\nStrict vote writes today: <b>{count}</b>\nThreshold: {threshold}\nMode: {mode}\nTime: {time}\n\nHigh free-tier risk approaching. Enable Peak Crowd Safe Mode now.',
    autoPeak: '<b>✅ Peak Crowd Safe Mode Enabled</b>\n\nReason: {recommendation}\nStrict vote writes today: <b>{count}</b>\nTime: {time}',
    dangerZone: '<b>🚨 Danger Zone Action</b>\n\nAction: {recommendation}\nTime: {time}',
    supabaseToggle: '<b>🏏 Supabase Live Score {mode}</b>\n\nMatch ID: {matchId}\nTime: {time}',
    tursoToggle: '<b>📦 Turso Read {mode}</b>\n\nTime: {time}',
  },
};

const SETTINGS_KEY = 'analysis_alert_settings';

let fallbackSettings = DEFAULT_ANALYSIS_SETTINGS;
let fallbackAlerts: SystemAlert[] = [];

function mergeSettings(input: Partial<AnalysisSettings> | null | undefined): AnalysisSettings {
  const source = input || {};
  return {
    ...DEFAULT_ANALYSIS_SETTINGS,
    ...source,
    channels: { ...DEFAULT_ANALYSIS_SETTINGS.channels, ...(source.channels || {}) },
    telegram: { ...DEFAULT_ANALYSIS_SETTINGS.telegram, ...(source.telegram || {}) },
    email: { ...DEFAULT_ANALYSIS_SETTINGS.email, ...(source.email || {}) },
    thresholds: { ...DEFAULT_ANALYSIS_SETTINGS.thresholds, ...(source.thresholds || {}) },
    templates: { ...DEFAULT_ANALYSIS_SETTINGS.templates, ...(source.templates || {}) },
  };
}

export function renderTemplate(template: string, vars: Record<string, string | number | boolean | null | undefined>): string {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => String(vars[key] ?? ''));
}

export async function ensureAnalysisTables(): Promise<void> {
  const db = getD1Database();
  if (!db) return;
  await initD1Database();
  await db.prepare(`CREATE TABLE IF NOT EXISTS system_alerts (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    level TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    channels TEXT NOT NULL,
    delivery_status TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    read INTEGER DEFAULT 0
  )`).run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_system_alerts_created ON system_alerts(created_at DESC)').run();
}

export async function getAnalysisSettings(): Promise<AnalysisSettings> {
  try {
    const raw = await d1GetSetting(SETTINGS_KEY);
    if (!raw) return fallbackSettings;
    const parsed = JSON.parse(raw) as Partial<AnalysisSettings>;
    fallbackSettings = mergeSettings(parsed);
    return fallbackSettings;
  } catch {
    return fallbackSettings;
  }
}

export async function saveAnalysisSettings(settings: AnalysisSettings): Promise<AnalysisSettings> {
  const merged = mergeSettings(settings);
  fallbackSettings = merged;
  try {
    await initD1Database();
    await d1SetSetting(SETTINGS_KEY, JSON.stringify(merged));
  } catch {
    // Keep memory fallback so local/dev admin does not break.
  }
  return merged;
}

export async function getSystemAlerts(limit = 30): Promise<SystemAlert[]> {
  try {
    await ensureAnalysisTables();
    const db = getD1Database();
    if (!db) return fallbackAlerts.slice(0, limit);
    const result = await db.prepare('SELECT * FROM system_alerts ORDER BY created_at DESC LIMIT ?').bind(limit).all<Record<string, unknown>>();
    return (result.results || []).map((row) => ({
      id: String(row.id),
      type: String(row.type),
      level: String(row.level) as AlertLevel,
      title: String(row.title),
      message: String(row.message),
      channels: JSON.parse(String(row.channels || '[]')),
      delivery_status: JSON.parse(String(row.delivery_status || '{}')),
      created_at: Number(row.created_at),
      read: Number(row.read) === 1,
    }));
  } catch {
    return fallbackAlerts.slice(0, limit);
  }
}

export async function saveSystemAlert(alert: SystemAlert): Promise<void> {
  fallbackAlerts = [alert, ...fallbackAlerts.filter((a) => a.id !== alert.id)].slice(0, 50);
  try {
    await ensureAnalysisTables();
    const db = getD1Database();
    if (!db) return;
    await db.prepare(`INSERT OR REPLACE INTO system_alerts
      (id, type, level, title, message, channels, delivery_status, created_at, read)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
        alert.id,
        alert.type,
        alert.level,
        alert.title,
        alert.message,
        JSON.stringify(alert.channels),
        JSON.stringify(alert.delivery_status),
        alert.created_at,
        alert.read ? 1 : 0,
      ).run();
  } catch {
    // Memory fallback already updated.
  }
}

export async function markAlertRead(id: string, read = true): Promise<void> {
  fallbackAlerts = fallbackAlerts.map((a) => a.id === id ? { ...a, read } : a);
  try {
    await ensureAnalysisTables();
    const db = getD1Database();
    if (!db) return;
    await db.prepare('UPDATE system_alerts SET read = ? WHERE id = ?').bind(read ? 1 : 0, id).run();
  } catch {}
}

async function sendTelegram(message: string, chatIds: string[]): Promise<Record<string, { ok: boolean; error?: string }>> {
  const token = getEnv('TELEGRAM_BOT_TOKEN');
  const status: Record<string, { ok: boolean; error?: string }> = {};
  if (!token) {
    for (const id of chatIds) status[`telegram:${id}`] = { ok: false, error: 'TELEGRAM_BOT_TOKEN is not configured' };
    return status;
  }
  for (const chatId of chatIds) {
    const key = `telegram:${chatId}`;
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML', disable_web_page_preview: true }),
      });
      const data = await res.json().catch(() => ({}));
      status[key] = res.ok && data.ok !== false ? { ok: true } : { ok: false, error: data.description || `HTTP ${res.status}` };
    } catch (err) {
      status[key] = { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }
  return status;
}

async function sendEmail(message: string, settings: AnalysisSettings): Promise<Record<string, { ok: boolean; error?: string }>> {
  const apiKey = getEnv('RESEND_API_KEY');
  const to = settings.email.to.trim();
  const from = settings.email.from.trim();
  const statusKey = `email:${to || 'missing'}`;
  if (!apiKey) return { [statusKey]: { ok: false, error: 'RESEND_API_KEY is not configured' } };
  if (!to || !from) return { [statusKey]: { ok: false, error: 'Email from/to is not configured' } };
  try {
    const plain = message.replace(/<[^>]*>/g, '');
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject: 'Thomians Media Alert', text: plain, html: message.replace(/\n/g, '<br/>') }),
    });
    const data = await res.json().catch(() => ({}));
    return { [statusKey]: res.ok ? { ok: true } : { ok: false, error: data.message || `HTTP ${res.status}` } };
  } catch (err) {
    return { [statusKey]: { ok: false, error: err instanceof Error ? err.message : String(err) } };
  }
}

export async function createAndDispatchAlert(input: {
  type: string;
  level: AlertLevel;
  title: string;
  template: string;
  vars: Record<string, string | number | boolean | null | undefined>;
  channels?: AlertChannel[];
}): Promise<SystemAlert> {
  const settings = await getAnalysisSettings();
  const allChannels = input.channels || (Object.keys(settings.channels).filter((key) => settings.channels[key as AlertChannel]) as AlertChannel[]);
  const channels = Array.from(new Set<AlertChannel>(['dashboard', ...allChannels]));
  const message = renderTemplate(input.template, input.vars);
  const alert: SystemAlert = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: input.type,
    level: input.level,
    title: input.title,
    message,
    channels,
    delivery_status: { dashboard: { ok: true } },
    created_at: Date.now(),
    read: false,
  };

  // Dashboard fallback is saved first and always available.
  await saveSystemAlert(alert);

  if (settings.enabled && channels.includes('telegram') && settings.telegram.enabled) {
    Object.assign(alert.delivery_status, await sendTelegram(message, settings.telegram.chatIds.filter(Boolean)));
  }
  if (settings.enabled && channels.includes('email') && settings.email.enabled) {
    Object.assign(alert.delivery_status, await sendEmail(message, settings));
  }

  await saveSystemAlert(alert);
  return alert;
}
