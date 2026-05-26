import { NextRequest, NextResponse } from 'next/server';

/**
 * Custom session check endpoint
 *
 * Reliable alternative to NextAuth's /api/auth/session
 * which breaks in Next.js 16 + Turbopack (returns HTML instead of JSON).
 *
 * Checks for the next-auth.session-token cookie directly.
 * In development mode, always returns an admin session.
 */
export async function GET(req: NextRequest) {
  try {
    // In development mode, always return an admin session
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        user: {
          id: 'dev-admin',
          email: 'admin@thomiansmedia.com',
          name: 'Admin',
        },
        isAdmin: true,
      });
    }

    // In production, check custom admin cookie or legacy NextAuth cookie
    const sessionToken = req.cookies.get('admin-session')?.value ||
      req.cookies.get('next-auth.session-token')?.value ||
      req.cookies.get('__Secure-next-auth.session-token')?.value;
    if (sessionToken) {
      // Session cookie exists — user is logged in
      return NextResponse.json({
        user: {
          id: '1',
          email: 'admin@thomiansmedia.com',
          name: 'Admin',
        },
        isAdmin: true,
      });
    }

    // No session cookie — not logged in
    return NextResponse.json({});
  } catch (err) {
    console.error('[/api/admin/session] Error:', err);
    // Return empty session rather than crashing
    return NextResponse.json({});
  }
}
