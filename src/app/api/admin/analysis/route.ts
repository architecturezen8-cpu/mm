import { NextRequest, NextResponse } from 'next/server';
import { getAnalysisSettings, getSystemAlerts } from '@/lib/analysis-alerts';

function isAdminRequest(req: NextRequest): boolean {
  const sessionToken =
    req.cookies.get('admin-session')?.value ||
    req.cookies.get('__Secure-next-auth.session-token')?.value ||
    req.cookies.get('next-auth.session-token')?.value;
  if (sessionToken) return true;
  if (process.env.NODE_ENV === 'development') return true;
  return false;
}

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const [settings, alerts] = await Promise.all([getAnalysisSettings(), getSystemAlerts(50)]);
  return NextResponse.json({ settings, alerts });
}
