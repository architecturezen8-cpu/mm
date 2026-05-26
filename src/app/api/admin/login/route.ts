import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/cf-env';

/**
 * Custom login endpoint
 *
 * Alternative to NextAuth's signIn which breaks in Next.js 16 + Turbopack.
 * Sets the session cookie directly for development mode.
 * In production, this would verify credentials against a database.
 */

const ADMIN_EMAILS = getEnv('ADMIN_ALLOWED_EMAILS')?.split(',').map(e => e.trim()).filter(Boolean) ?? ['admin@thomiansmedia.com'];
const ADMIN_PASSWORD = 'admin123';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    // Simple credential check
    if (ADMIN_EMAILS.includes(email) && password === ADMIN_PASSWORD) {
      const res = NextResponse.json({
        success: true,
        user: {
          id: '1',
          email,
          name: email.split('@')[0],
        },
      });
      const secure = process.env.NODE_ENV === 'production';
      const cookieOptions = { httpOnly: true, sameSite: 'lax' as const, secure, path: '/', maxAge: 60 * 60 * 24 * 7 };
      // Keep legacy cookie name too because existing admin API routes check it.
      res.cookies.set('admin-session', '1', cookieOptions);
      res.cookies.set('next-auth.session-token', '1', cookieOptions);
      return res;
    }

    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  } catch (err) {
    console.error('[/api/admin/login] Error:', err);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
