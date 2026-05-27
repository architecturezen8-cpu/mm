import { NextRequest, NextResponse } from 'next/server';
import { markAlertRead } from '@/lib/analysis-alerts';

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
  const { id, read = true } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  await markAlertRead(String(id), !!read);
  return NextResponse.json({ success: true });
}
