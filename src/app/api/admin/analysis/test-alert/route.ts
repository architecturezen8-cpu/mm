import { NextRequest, NextResponse } from 'next/server';
import { createAndDispatchAlert, getAnalysisSettings, AlertChannel } from '@/lib/analysis-alerts';

function isAdminRequest(req: NextRequest): boolean {
  const sessionToken =
    req.cookies.get('admin-session')?.value ||
    req.cookies.get('__Secure-next-auth.session-token')?.value ||
    req.cookies.get('next-auth.session-token')?.value;
  if (sessionToken) return true;
  if (process.env.NODE_ENV === 'development') return true;
  return false;
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const settings = await getAnalysisSettings();
  const requested = Array.isArray(body.channels) ? body.channels : undefined;
  const channels = requested as AlertChannel[] | undefined;
  const alert = await createAndDispatchAlert({
    type: 'test',
    level: 'success',
    title: 'Test Alert',
    template: settings.templates.test,
    channels,
    vars: {
      siteName: 'Thomians Media',
      level: 'Test',
      count: 0,
      threshold: 0,
      mode: settings.peakSafeMode ? 'Peak Safe' : 'Strict',
      time: new Date().toLocaleString('en-US', { timeZone: 'Asia/Colombo' }),
      date: new Date().toISOString().slice(0, 10),
      matchId: process.env.NEXT_PUBLIC_MATCH_ID || 'match_001',
      recommendation: 'This is a test alert from Analysis.',
    },
  });
  return NextResponse.json({ success: true, alert });
}
