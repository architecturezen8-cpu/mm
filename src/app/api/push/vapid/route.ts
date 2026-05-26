import { NextResponse } from 'next/server';
import { getEnv } from '@/lib/cf-env';

/**
 * VAPID Public Key API (Public)
 *
 * GET /api/push/vapid — Returns the VAPID public key for client-side push subscription
 *
 * No auth required — any client needs this key to register for push notifications.
 * Reads from the VAPID_PUBLIC_KEY environment variable via cf-env (Cloudflare Workers compatible).
 */

export async function GET() {
  const publicKey = getEnv('VAPID_PUBLIC_KEY');

  if (!publicKey) {
    console.error('[GET /api/push/vapid] VAPID_PUBLIC_KEY not configured');
    return NextResponse.json(
      { error: 'VAPID public key not configured', publicKey: null },
      { status: 503 }
    );
  }

  return NextResponse.json({ publicKey });
}
