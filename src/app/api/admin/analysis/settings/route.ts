import { NextRequest, NextResponse } from 'next/server';
import { getAnalysisSettings, saveAnalysisSettings } from '@/lib/analysis-alerts';

function isAdminRequest(req: NextRequest): boolean {
  const sessionToken =
    req.cookies.get('admin-session')?.value ||
    req.cookies.get('__Secure-next-auth.session-token')?.value ||
    req.cookies.get('next-auth.session-token')?.value;
  if (sessionToken) return true;
  if (process.env.NODE_ENV === 'development') return true;
  return false;
}

export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const incoming = await req.json();
  const current = await getAnalysisSettings();
  const saved = await saveAnalysisSettings({
    ...current,
    ...incoming,
    channels: { ...current.channels, ...(incoming.channels || {}) },
    telegram: { ...current.telegram, ...(incoming.telegram || {}) },
    email: { ...current.email, ...(incoming.email || {}) },
    thresholds: { ...current.thresholds, ...(incoming.thresholds || {}) },
    templates: { ...current.templates, ...(incoming.templates || {}) },
  });
  return NextResponse.json({ success: true, settings: saved });
}
