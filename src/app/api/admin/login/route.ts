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
      // In development mode, just return success
      // The admin session is checked via /api/admin/session which returns isAdmin in dev mode
      return NextResponse.json({
        success: true,
        user: {
          id: '1',
          email,
          name: email.split('@')[0],
        },
      });
    }

    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  } catch (err) {
    console.error('[/api/admin/login] Error:', err);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
