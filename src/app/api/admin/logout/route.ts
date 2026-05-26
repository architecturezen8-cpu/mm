import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ success: true });
  for (const name of ['admin-session', 'next-auth.session-token', '__Secure-next-auth.session-token']) {
    res.cookies.set(name, '', { path: '/', maxAge: 0 });
  }
  return res;
}
