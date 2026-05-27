'use client';

import { useEffect, useState } from 'react';
import AdminBar from '@/components/admin/AdminBar';
import AdminNav from '@/components/admin/ui/AdminNav';
import { Activity, Bell, CheckCircle, Loader2, Mail, Send, ShieldAlert, XCircle } from 'lucide-react';

interface AnalysisSettings {
  enabled: boolean;
  peakSafeMode: boolean;
  autoPeakEnabled: boolean;
  channels: { dashboard: boolean; telegram: boolean; email: boolean };
  telegram: { enabled: boolean; chatIds: string[] };
  email: { enabled: boolean; to: string; from: string };
  thresholds: { warning1: number; warning2: number; warning3: number; autoPeak: number };
  templates: Record<string, string>;
}

interface SystemAlert {
  id: string;
  type: string;
  level: 'info' | 'warning' | 'danger' | 'success';
  title: string;
  message: string;
  channels: string[];
  delivery_status: Record<string, { ok: boolean; error?: string }>;
  created_at: number;
  read: boolean;
}

const templateLabels: Record<string, string> = {
  test: 'Test Message',
  warning1: '30K Warning',
  warning2: '50K Warning',
  warning3: '60K Warning',
  autoPeak: 'Auto Peak Enabled',
  dangerZone: 'Danger Zone Action',
  supabaseToggle: 'Supabase Toggle',
  tursoToggle: 'Turso Toggle',
};

export default function AnalysisPage() {
  const [settings, setSettings] = useState<AnalysisSettings | null>(null);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/analysis', { cache: 'no-store' });
      const data = await res.json();
      setSettings(data.settings);
      setAlerts(data.alerts || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const updateSettings = (updates: Partial<AnalysisSettings>) => {
    setSettings((prev) => prev ? ({ ...prev, ...updates }) : prev);
  };

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/analysis/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.settings) setSettings(data.settings);
      setToast('Analysis settings saved');
      setTimeout(() => setToast(''), 2500);
    } finally {
      setSaving(false);
    }
  };

  const testAlert = async (channels: string[], label: string) => {
    setTesting(label);
    try {
      await fetch('/api/admin/analysis/test-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channels }),
      });
      await load();
      setToast(`Test alert sent: ${label}`);
      setTimeout(() => setToast(''), 2500);
    } finally {
      setTesting(null);
    }
  };

  const markRead = async (id: string, read = true) => {
    await fetch('/api/admin/analysis/alerts/read', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, read }),
    });
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, read } : a));
  };

  if (loading || !settings) {
    return (
      <>
        <AdminBar />
        <div className="pt-12 min-h-screen bg-[#020204] flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#FFC300]" />
        </div>
      </>
    );
  }

  return (
    <>
      <AdminBar />
      <div className="pt-12 min-h-screen bg-[#020204] flex">
        <aside className="fixed lg:static top-12 left-0 bottom-0 w-64 bg-[#030303] border-r border-[#1a1a22] p-4 z-40 hidden lg:block">
          <p className="text-[#4A4945] text-[9px] uppercase tracking-[3px] mb-3">Navigation</p>
          <AdminNav />
        </aside>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-h-screen">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-[#F0EDE6]">Analysis</h1>
                <p className="text-[#8A8780] text-sm mt-1">Alerts, voting protection, and delivery channel controls.</p>
              </div>
              <button
                onClick={save}
                disabled={saving}
                className="px-5 py-2.5 bg-[#FFC300] text-[#020204] text-xs font-bold uppercase tracking-[2px] hover:bg-[#FFD54F] disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Analysis Settings'}
              </button>
            </div>

            {/* Alert Center */}
            <section className="bg-[#08080c] border border-[#1a1a22] rounded-sm overflow-hidden">
              <div className="p-4 border-b border-[#1a1a22] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#FFC300]" />
                  <h2 className="text-[#F0EDE6] font-semibold text-sm uppercase tracking-[2px]">Dashboard Alerts</h2>
                </div>
                <span className="text-[#8A8780] text-xs">Always enabled</span>
              </div>
              <div className="divide-y divide-[#12121a]">
                {alerts.length === 0 ? (
                  <div className="p-6 text-center text-[#4A4945] text-sm">No alerts yet. Use a test button below.</div>
                ) : alerts.map((alert) => (
                  <div key={alert.id} className={`p-4 ${alert.read ? 'opacity-50' : ''}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${alert.level === 'danger' ? 'bg-red-400' : alert.level === 'warning' ? 'bg-amber-400' : alert.level === 'success' ? 'bg-emerald-400' : 'bg-[#FFC300]'}`} />
                          <p className="text-[#F0EDE6] text-sm font-semibold">{alert.title}</p>
                          <span className="text-[#4A4945] text-[10px] uppercase tracking-[1px]">{new Date(alert.created_at).toLocaleString()}</span>
                        </div>
                        <pre className="whitespace-pre-wrap text-[#8A8780] text-xs mt-2 font-sans leading-relaxed">{alert.message.replace(/<[^>]+>/g, '')}</pre>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {Object.entries(alert.delivery_status).map(([key, status]) => (
                            <span key={key} className={`px-2 py-0.5 border text-[8px] uppercase tracking-[1px] ${status.ok ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' : 'border-red-500/20 text-red-400 bg-red-500/5'}`} title={status.error || ''}>
                              {key}: {status.ok ? 'ok' : 'failed'}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button onClick={() => markRead(alert.id, !alert.read)} className="text-[#8A8780] hover:text-[#FFC300] text-xs uppercase tracking-[1px]">
                        {alert.read ? 'Unread' : 'Read'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Channels */}
              <section className="bg-[#08080c] border border-[#1a1a22] rounded-sm p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-[#FFC300]" />
                  <h2 className="text-[#F0EDE6] font-semibold text-sm uppercase tracking-[2px]">Alert Channels</h2>
                </div>

                <div className="space-y-3">
                  <ChannelRow label="Dashboard" desc="Always stores alerts inside admin analysis." checked disabled />
                  <ChannelRow
                    label="Telegram"
                    desc="Send warnings to one or multiple Telegram chat IDs. Bot token is a Cloudflare secret."
                    checked={settings.channels.telegram}
                    onChange={(v) => updateSettings({ channels: { ...settings.channels, telegram: v }, telegram: { ...settings.telegram, enabled: v } })}
                  />
                  <ChannelRow
                    label="Email"
                    desc="Send fallback email via Resend. API key is a Cloudflare secret."
                    checked={settings.channels.email}
                    onChange={(v) => updateSettings({ channels: { ...settings.channels, email: v }, email: { ...settings.email, enabled: v } })}
                  />
                </div>

                <div>
                  <label className="block text-[#8A8780] text-xs mb-1.5">Telegram Chat IDs (one per line)</label>
                  <textarea
                    value={settings.telegram.chatIds.join('\n')}
                    onChange={(e) => updateSettings({ telegram: { ...settings.telegram, chatIds: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) } })}
                    rows={4}
                    placeholder="123456789\n-1001234567890"
                    className="w-full bg-[#0e0e14] border border-[#1a1a22] rounded-sm px-3 py-2 text-[#F0EDE6] text-sm font-mono focus:outline-none focus:border-[#FFC300]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#8A8780] text-xs mb-1.5">Email To</label>
                    <input value={settings.email.to} onChange={(e) => updateSettings({ email: { ...settings.email, to: e.target.value } })} className="w-full bg-[#0e0e14] border border-[#1a1a22] rounded-sm px-3 py-2 text-[#F0EDE6] text-sm focus:outline-none focus:border-[#FFC300]" />
                  </div>
                  <div>
                    <label className="block text-[#8A8780] text-xs mb-1.5">Email From</label>
                    <input value={settings.email.from} onChange={(e) => updateSettings({ email: { ...settings.email, from: e.target.value } })} className="w-full bg-[#0e0e14] border border-[#1a1a22] rounded-sm px-3 py-2 text-[#F0EDE6] text-sm focus:outline-none focus:border-[#FFC300]" />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <TestButton loading={testing === 'dashboard'} onClick={() => testAlert(['dashboard'], 'dashboard')}>Test Dashboard</TestButton>
                  <TestButton loading={testing === 'telegram'} onClick={() => testAlert(['dashboard', 'telegram'], 'telegram')}>Test Telegram</TestButton>
                  <TestButton loading={testing === 'email'} onClick={() => testAlert(['dashboard', 'email'], 'email')}>Test Email</TestButton>
                  <TestButton loading={testing === 'all'} onClick={() => testAlert(['dashboard', 'telegram', 'email'], 'all')}>Test Enabled</TestButton>
                </div>
              </section>

              {/* Protection */}
              <section className="bg-[#08080c] border border-[#1a1a22] rounded-sm p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#FFC300]" />
                  <h2 className="text-[#F0EDE6] font-semibold text-sm uppercase tracking-[2px]">Peak Crowd Protection</h2>
                </div>

                <ChannelRow label="Peak Crowd Safe Mode" desc="Phase 1 stores this setting. Phase 2 will connect it to voting dedup strategy." checked={settings.peakSafeMode} onChange={(v) => updateSettings({ peakSafeMode: v })} />
                <ChannelRow label="Auto-enable at safety threshold" desc="When connected in Phase 2, this will enable Peak Mode automatically." checked={settings.autoPeakEnabled} onChange={(v) => updateSettings({ autoPeakEnabled: v })} />

                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(settings.thresholds).map(([key, val]) => (
                    <div key={key}>
                      <label className="block text-[#8A8780] text-xs mb-1.5 capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
                      <input
                        type="number"
                        value={val}
                        onChange={(e) => updateSettings({ thresholds: { ...settings.thresholds, [key]: parseInt(e.target.value, 10) || 0 } })}
                        className="w-full bg-[#0e0e14] border border-[#1a1a22] rounded-sm px-3 py-2 text-[#F0EDE6] text-sm focus:outline-none focus:border-[#FFC300]"
                      />
                    </div>
                  ))}
                </div>

                <div className="bg-[#0e0e14] border border-[#1a1a22] rounded-sm p-3">
                  <p className="text-[#FFC300] text-[10px] uppercase tracking-[2px] font-bold mb-1">Phase-safe note</p>
                  <p className="text-[#8A8780] text-xs leading-relaxed">This page adds alert controls and delivery tests without changing current vote logic. Peak mode voting strategy can be connected in the next phase after this is verified.</p>
                </div>
              </section>
            </div>

            {/* Templates */}
            <section className="bg-[#08080c] border border-[#1a1a22] rounded-sm p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#FFC300]" />
                <h2 className="text-[#F0EDE6] font-semibold text-sm uppercase tracking-[2px]">Message Templates</h2>
              </div>
              <p className="text-[#8A8780] text-xs">Telegram uses HTML formatting. Variables: <code>{'{siteName}'}</code>, <code>{'{level}'}</code>, <code>{'{count}'}</code>, <code>{'{threshold}'}</code>, <code>{'{mode}'}</code>, <code>{'{time}'}</code>, <code>{'{date}'}</code>, <code>{'{matchId}'}</code>, <code>{'{recommendation}'}</code>.</p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {Object.entries(settings.templates).map(([key, val]) => (
                  <div key={key}>
                    <label className="block text-[#8A8780] text-xs mb-1.5">{templateLabels[key] || key}</label>
                    <textarea
                      value={val}
                      onChange={(e) => updateSettings({ templates: { ...settings.templates, [key]: e.target.value } })}
                      rows={5}
                      className="w-full bg-[#0e0e14] border border-[#1a1a22] rounded-sm px-3 py-2 text-[#F0EDE6] text-xs font-mono focus:outline-none focus:border-[#FFC300]"
                    />
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>

      {toast && (
        <div className="fixed top-16 right-4 z-[10000] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 text-xs font-medium">
          {toast}
        </div>
      )}
    </>
  );
}

function ChannelRow({ label, desc, checked, onChange, disabled = false }: { label: string; desc: string; checked: boolean; onChange?: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 p-3 bg-[#0e0e14] border border-[#1a1a22] rounded-sm">
      <div>
        <p className="text-[#F0EDE6] text-sm font-medium">{label}</p>
        <p className="text-[#8A8780] text-xs mt-0.5">{desc}</p>
      </div>
      <button
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={`relative w-11 h-6 transition-colors shrink-0 ${checked ? 'bg-[#FFC300]' : 'bg-[#1a1a22]'} ${disabled ? 'opacity-60 cursor-default' : ''}`}
      >
        <span className={`absolute top-1 w-4 h-4 bg-white transition-all ${checked ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
  );
}

function TestButton({ children, onClick, loading }: { children: React.ReactNode; onClick: () => void; loading: boolean }) {
  return (
    <button onClick={onClick} disabled={loading} className="flex items-center gap-2 px-3 py-2 border border-[#FFC300]/30 text-[#FFC300] text-[10px] font-bold uppercase tracking-[1.5px] hover:bg-[#FFC300]/10 disabled:opacity-50">
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
      {children}
    </button>
  );
}
