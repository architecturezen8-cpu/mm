import { NextRequest, NextResponse } from 'next/server';
import {
  kvAddPushSubscription,
  kvRemovePushSubscription,
  type PushSubscription,
} from '@/lib/push-store';

/**
 * Push Subscribe API
 *
 * POST   /api/push/subscribe — Subscribe a user to push notifications
 * DELETE /api/push/subscribe — Unsubscribe from push notifications
 *
 * No auth required — any user can subscribe or unsubscribe.
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate required fields
    const { endpoint, keys } = body;

    if (!endpoint || typeof endpoint !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "endpoint" field' },
        { status: 400 }
      );
    }

    if (!keys || typeof keys !== 'object') {
      return NextResponse.json(
        { error: 'Missing or invalid "keys" object' },
        { status: 400 }
      );
    }

    if (!keys.p256dh || typeof keys.p256dh !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "keys.p256dh" field' },
        { status: 400 }
      );
    }

    if (!keys.auth || typeof keys.auth !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "keys.auth" field' },
        { status: 400 }
      );
    }

    // Read country from Cloudflare header
    const countryCode = req.headers.get('cf-ipcountry') || 'XX';

    const subscription: PushSubscription = {
      endpoint,
      keys: {
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
      countryCode,
      subscribedAt: Date.now(),
    };

    const saved = await kvAddPushSubscription(subscription);

    if (!saved) {
      return NextResponse.json(
        { error: 'Failed to save subscription — KV store unavailable' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Subscribed to push notifications',
        countryCode,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[POST /api/push/subscribe] Error:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();

    const { endpoint } = body;

    if (!endpoint || typeof endpoint !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "endpoint" field' },
        { status: 400 }
      );
    }

    const removed = await kvRemovePushSubscription(endpoint);

    if (!removed) {
      return NextResponse.json(
        { error: 'Failed to remove subscription — KV store unavailable or subscription not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Unsubscribed from push notifications',
    });
  } catch (error: any) {
    console.error('[DELETE /api/push/subscribe] Error:', error);
    return NextResponse.json(
      { error: 'Failed to unsubscribe', details: error.message },
      { status: 500 }
    );
  }
}
