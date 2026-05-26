import { NextRequest, NextResponse } from 'next/server';
import { kvGetAllPushSubscriptions } from '@/lib/push-store';
import { getEnv } from '@/lib/cf-env';

/**
 * Push Send API (Admin)
 *
 * POST /api/push/send — Send a push notification to ALL subscribers
 *
 * Auth required — same cookie check as poll-config admin API.
 * Uses the Web Push Protocol with VAPID authentication via Web Crypto API
 * (compatible with Cloudflare Workers environment).
 *
 * Body:
 *   { title, body, icon?, url? }
 *
 * Returns:
 *   { sent, failed, total, failures[] }
 */

// ─── Auth Check (same as poll-config) ────────────────────────────

function isAdminRequest(req: NextRequest): boolean {
  const sessionToken = req.cookies.get('next-auth.session-token')?.value;
  if (sessionToken) return true;
  if (process.env.NODE_ENV === 'development') return true;
  return false;
}

// ─── Base64URL Helpers ───────────────────────────────────────────

function base64UrlEncode(data: ArrayBuffer | Uint8Array): string {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ─── VAPID JWT Generation ────────────────────────────────────────

/**
 * Import a VAPID private key (raw 32 bytes) as a JWK, then derive
 * the public key coordinates and create a VAPID JWT signed with ES256.
 */
async function createVapidJWT(
  vapidPrivateKey: string,
  origin: string
): Promise<string> {
  const rawBytes = base64UrlDecode(vapidPrivateKey);
  const d = base64UrlEncode(rawBytes);

  // Import the private key as JWK — Web Crypto can derive x,y from d on P-256
  const key = await crypto.subtle.importKey(
    'jwk',
    { kty: 'EC', crv: 'P-256', d } as JsonWebKey,
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign']
  );

  // Export to get the full JWK with x, y coordinates
  const fullJwk = await crypto.subtle.exportKey('jwk', key);

  // Re-import with all fields for reliable signing
  const cryptoKey = await crypto.subtle.importKey(
    'jwk',
    {
      kty: 'EC',
      crv: 'P-256',
      d: fullJwk.d!,
      x: fullJwk.x!,
      y: fullJwk.y!,
      ext: true,
    },
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  // Build JWT
  const encoder = new TextEncoder();
  const header = { typ: 'JWT', alg: 'ES256' };
  const payload = {
    aud: origin,
    exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
    sub: `mailto:admin@${new URL(origin).hostname}`,
  };

  const headerB64 = base64UrlEncode(encoder.encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Sign with ES256
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    encoder.encode(unsignedToken)
  );

  const signatureB64 = base64UrlEncode(signature);
  return `${unsignedToken}.${signatureB64}`;
}

// ─── Web Push Encryption (RFC 8291 + RFC 8188) ──────────────────

/**
 * HKDF-SHA-256 implementation using Web Crypto API.
 */
async function hkdfSha256(
  salt: Uint8Array,
  ikm: Uint8Array,
  info: Uint8Array,
  length: number
): Promise<Uint8Array> {
  // Extract: PRK = HMAC-SHA-256(salt, IKM)
  const saltKey = await crypto.subtle.importKey(
    'raw', salt, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const prk = await crypto.subtle.sign('HMAC', saltKey, ikm);

  // Expand: OKM = HKDF-Expand(PRK, info, length)
  const prkKey = await crypto.subtle.importKey(
    'raw', prk, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );

  const n = Math.ceil(length / 32);
  const okm = new Uint8Array(n * 32);
  let previousBlock = new Uint8Array(0);

  for (let i = 1; i <= n; i++) {
    const infoWithCounter = new Uint8Array(info.length + previousBlock.length + 1);
    infoWithCounter.set(previousBlock);
    infoWithCounter.set(info, previousBlock.length);
    infoWithCounter[infoWithCounter.length - 1] = i;

    const block = await crypto.subtle.sign('HMAC', prkKey, infoWithCounter);
    okm.set(new Uint8Array(block), (i - 1) * 32);
    previousBlock = new Uint8Array(block);
  }

  return okm.slice(0, length);
}

/**
 * Encrypt a push message payload for a specific subscription using
 * the Web Push encryption scheme (RFC 8291 aes128gcm content coding).
 */
async function encryptPayload(
  payload: string,
  p256dhKey: string,
  authKey: string
): Promise<{ encrypted: ArrayBuffer; salt: Uint8Array; serverPublicKey: Uint8Array }> {
  const encoder = new TextEncoder();

  // 1. Generate ephemeral ECDH key pair (server-side, per-message)
  const serverKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );

  // Export the server public key (raw, 65 bytes uncompressed)
  const serverPublicKeyRaw = await crypto.subtle.exportKey('raw', serverKeyPair.publicKey);
  const serverPublicKey = new Uint8Array(serverPublicKeyRaw);

  // 2. Import the subscription's public key (p256dh) for ECDH
  const clientPublicKeyRaw = base64UrlDecode(p256dhKey);
  const clientPublicKey = await crypto.subtle.importKey(
    'raw',
    clientPublicKeyRaw,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );

  // 3. Derive shared secret using ECDH
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: clientPublicKey },
    serverKeyPair.privateKey,
    256
  );

  // 4. Generate a random salt (16 bytes)
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // 5. Derive the pseudo-random key (PRK)
  //    PRK = HKDF-SHA-256(authKey, sharedSecret, "Content-Encoding: auth\0", 32)
  const authBytes = base64UrlDecode(authKey);
  const prk = await hkdfSha256(
    authBytes,
    new Uint8Array(sharedSecret),
    encoder.encode('Content-Encoding: auth\x00'),
    32
  );

  // 6. Derive the encryption key and nonce
  //    Key   = HKDF-SHA-256(salt, PRK, "Content-Encoding: aes128gcm\0", 16)
  //    Nonce = HKDF-SHA-256(salt, PRK, "Content-Encoding: nonce\0", 12)
  const encryptionKey = await hkdfSha256(
    salt,
    prk,
    encoder.encode('Content-Encoding: aes128gcm\x00'),
    16
  );

  const nonceBase = await hkdfSha256(
    salt,
    prk,
    encoder.encode('Content-Encoding: nonce\x00'),
    12
  );

  // 7. Pad the payload (RFC 8291): payload || 0x02 [|| padding zeros]
  const payloadBytes = encoder.encode(payload);
  const paddedPayload = new Uint8Array(payloadBytes.length + 1);
  paddedPayload.set(payloadBytes);
  paddedPayload[payloadBytes.length] = 0x02; // minimal padding delimiter

  // 8. Use the derived nonce as-is (single record, counter = 0)
  const iv = new Uint8Array(12);
  iv.set(nonceBase);

  // 9. Encrypt with AES-128-GCM
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encryptionKey,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    cryptoKey,
    paddedPayload
  );

  return { encrypted, salt, serverPublicKey };
}

/**
 * Build the full RFC 8291 encrypted push message body.
 * Format: salt(16) | rs(4) | serverPublicKey(65) | encryptedPayload
 */
function buildPushMessageBody(
  encrypted: ArrayBuffer,
  salt: Uint8Array,
  serverPublicKey: Uint8Array
): Uint8Array {
  const rs = 4096;
  const recordSize = new Uint8Array(4);
  recordSize[0] = (rs >> 24) & 0xff;
  recordSize[1] = (rs >> 16) & 0xff;
  recordSize[2] = (rs >> 8) & 0xff;
  recordSize[3] = rs & 0xff;

  const encryptedBytes = new Uint8Array(encrypted);
  const body = new Uint8Array(
    salt.length + recordSize.length + serverPublicKey.length + encryptedBytes.length
  );

  let offset = 0;
  body.set(salt, offset); offset += salt.length;
  body.set(recordSize, offset); offset += recordSize.length;
  body.set(serverPublicKey, offset); offset += serverPublicKey.length;
  body.set(encryptedBytes, offset);

  return body;
}

// ─── Main Handler ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Validate required fields
    const { title, body: messageBody } = body;
    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "title" field' },
        { status: 400 }
      );
    }
    if (!messageBody || typeof messageBody !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "body" field' },
        { status: 400 }
      );
    }

    const icon = body.icon || '/logos/thomians-media-round-logo.jpg';
    const url = body.url || '/';

    // Check VAPID keys
    const vapidPrivateKey = getEnv('VAPID_PRIVATE_KEY');
    const vapidPublicKey = getEnv('VAPID_PUBLIC_KEY');

    if (!vapidPrivateKey || !vapidPublicKey) {
      console.error('[POST /api/push/send] VAPID keys not configured');
      return NextResponse.json(
        {
          error: 'VAPID keys not configured',
          hint: 'Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY environment variables',
        },
        { status: 503 }
      );
    }

    // Get all subscriptions from KV
    const subscriptions = await kvGetAllPushSubscriptions();

    if (subscriptions.length === 0) {
      return NextResponse.json({
        sent: 0,
        failed: 0,
        total: 0,
        message: 'No subscribers to send push notifications to',
      });
    }

    // Prepare the push payload (JSON string that the service worker will parse)
    const pushPayload = JSON.stringify({ title, body: messageBody, icon, url });

    // Send to each subscriber in parallel
    let sent = 0;
    let failed = 0;
    const failures: Array<{ endpoint: string; error: string }> = [];

    const sendPromises = subscriptions.map(async (sub) => {
      try {
        // Determine the push service origin from the subscription endpoint
        const endpointUrl = new URL(sub.endpoint);
        const origin = endpointUrl.origin;

        // 1. Create VAPID JWT for this push service origin
        const jwt = await createVapidJWT(vapidPrivateKey, origin);

        // 2. Encrypt the payload with the subscription's keys
        const { encrypted, salt, serverPublicKey } = await encryptPayload(
          pushPayload,
          sub.keys.p256dh,
          sub.keys.auth
        );

        // 3. Build the RFC 8291 encrypted message body
        const messageBody_bytes = buildPushMessageBody(encrypted, salt, serverPublicKey);

        // 4. POST to the push service endpoint
        const response = await fetch(sub.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Encoding': 'aes128gcm',
            'TTL': '86400',
            'Authorization': `vapid t=${jwt}, k=${vapidPublicKey}`,
          },
          body: messageBody_bytes,
        });

        if (response.status >= 200 && response.status < 300) {
          sent++;
        } else {
          const errorText = await response.text().catch(() => 'Unknown error');
          failed++;
          failures.push({
            endpoint: sub.endpoint.substring(0, 50) + '...',
            error: `HTTP ${response.status}: ${errorText}`,
          });

          // 410 Gone means the subscription is no longer valid —
          // could auto-remove in a future improvement
        }
      } catch (err: any) {
        failed++;
        failures.push({
          endpoint: sub.endpoint.substring(0, 50) + '...',
          error: err.message || 'Unknown error',
        });
      }
    });

    await Promise.allSettled(sendPromises);

    console.log(
      `[POST /api/push/send] Push sent: ${sent}/${subscriptions.length} ` +
      `(failed: ${failed})`
    );

    return NextResponse.json({
      sent,
      failed,
      total: subscriptions.length,
      ...(failures.length > 0 ? { failures } : {}),
    });
  } catch (error: any) {
    console.error('[POST /api/push/send] Error:', error);
    return NextResponse.json(
      { error: 'Failed to send push notifications', details: error.message },
      { status: 500 }
    );
  }
}
