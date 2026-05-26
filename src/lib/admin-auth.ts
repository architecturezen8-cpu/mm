import { NextRequest } from 'next/server';
import { getEnv } from '@/lib/cf-env';

/**
 * Simple cookie-based admin auth check.
 * Checks for a NextAuth session token cookie, or allows in development mode.
 * Used across all admin API routes for consistent auth.
 */
export function isAdminRequest(req: NextRequest): boolean {
  const sessionToken = req.cookies.get('next-auth.session-token')?.value;
  if (sessionToken) return true;
  if (process.env.NODE_ENV === 'development') return true;
  return false;
}

export function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowedEmails = getEnv('ADMIN_ALLOWED_EMAILS')?.split(',').map(e => e.trim()) ?? [];
  return allowedEmails.includes(email);
}
