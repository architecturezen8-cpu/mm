/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Cloudflare KV Store Utility — Push Notification Subscriptions
 *
 * KV namespace: PUSH_SUBS
 *
 * Keys:
 *   push:sub:{endpointHash} — individual push subscription
 *   push:config             — push notification settings (VAPID keys etc.)
 *
 * Uses getCloudflareContext() from @opennextjs/cloudflare for binding access.
 * Falls back to no-op when KV is not available (local dev).
 */

// Lazy-load getCloudflareContext to avoid OOM from heavy @opennextjs/cloudflare module
let _getCloudflareContext: (() => { env: Record<string, unknown> }) | null = null;
let _cfContextLoaded = false;

function getCfContext(): { env: Record<string, unknown> } | null {
  if (!_cfContextLoaded) {
    _cfContextLoaded = true;
    try {
      // Use require for synchronous loading (only when actually called)
      const mod = require('@opennextjs/cloudflare');
      _getCloudflareContext = mod.getCloudflareContext;
    } catch {
      _getCloudflareContext = null;
    }
  }
  if (!_getCloudflareContext) return null;
  try {
    return _getCloudflareContext();
  } catch {
    return null;
  }
}

// ─── Types ─────────────────────────────────────────────────────────

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  countryCode: string;
  subscribedAt: number;
}

export interface PushConfig {
  vapidPublicKey: string;
  vapidPrivateKey: string;
  enabled: boolean;
}

interface KVNamespace {
  get(key: string, options?: { type?: 'text' }): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; cursor?: string; limit?: number }): Promise<{
    keys: Array<{ name: string }>;
    list_complete: boolean;
    cursor?: string;
  }>;
}

// ─── Helpers ───────────────────────────────────────────────────────

const SUB_PREFIX = 'push:sub:';
const CONFIG_KEY = 'push:config';

/**
 * Create a deterministic KV-safe key suffix from a push endpoint URL.
 * Uses base64 of the endpoint, trimmed to 30 chars.
 */
function endpointHash(endpoint: string): string {
  try {
    return btoa(endpoint).slice(0, 30);
  } catch {
    // Fallback: simple char-code hash for non-latin1 endpoints
    let hash = 0;
    for (let i = 0; i < endpoint.length; i++) {
      hash = ((hash << 5) - hash + endpoint.charCodeAt(i)) | 0;
    }
    return Math.abs(hash).toString(36).slice(0, 30);
  }
}

// ─── KV Binding Access (cached) ────────────────────────────────────

let cachedKVPushSubs: KVNamespace | null | undefined = undefined;

export function getKVPushSubs(): KVNamespace | null {
  if (cachedKVPushSubs !== undefined) return cachedKVPushSubs;

  const ctx = getCfContext();
  if (ctx?.env?.PUSH_SUBS) {
    console.log('[KV:PUSH_SUBS] ✅ Cloudflare Workers KV binding found');
    cachedKVPushSubs = ctx.env.PUSH_SUBS as KVNamespace;
    return cachedKVPushSubs;
  }

  console.warn('[KV:PUSH_SUBS] ❌ KV binding not available — push subscriptions disabled');
  cachedKVPushSubs = null;
  return null;
}

// ─── Push Subscription Operations ──────────────────────────────────

/**
 * Subscribe — store a new push subscription.
 * Key: push:sub:{endpointHash}
 */
export async function kvAddPushSubscription(sub: PushSubscription): Promise<boolean> {
  const kv = getKVPushSubs();
  if (!kv) return false;
  try {
    const hash = endpointHash(sub.endpoint);
    const key = `${SUB_PREFIX}${hash}`;
    await kv.put(key, JSON.stringify(sub));
    console.log(`[KV:PUSH_SUBS] ✅ Subscription saved (key: ${key})`);
    return true;
  } catch (err) {
    console.error('[KV:PUSH_SUBS] Add subscription error:', err);
    return false;
  }
}

/**
 * Unsubscribe — remove a push subscription by endpoint URL.
 */
export async function kvRemovePushSubscription(endpoint: string): Promise<boolean> {
  const kv = getKVPushSubs();
  if (!kv) return false;
  try {
    const hash = endpointHash(endpoint);
    const key = `${SUB_PREFIX}${hash}`;
    await kv.delete(key);
    console.log(`[KV:PUSH_SUBS] ✅ Subscription removed (key: ${key})`);
    return true;
  } catch (err) {
    console.error('[KV:PUSH_SUBS] Remove subscription error:', err);
    return false;
  }
}

/**
 * Get all subscriptions (for admin to send push).
 * Uses the KV list API with prefix `push:sub:` and handles pagination.
 */
export async function kvGetAllPushSubscriptions(): Promise<PushSubscription[]> {
  const kv = getKVPushSubs();
  if (!kv) return [];
  try {
    const subs: PushSubscription[] = [];
    let cursor: string | undefined;
    do {
      const listed = await kv.list({ prefix: SUB_PREFIX, cursor });
      const getPromises = listed.keys.map(async (k) => {
        const raw = await kv.get(k.name);
        if (raw === null) return null;
        try {
          return JSON.parse(raw) as PushSubscription;
        } catch {
          console.warn(`[KV:PUSH_SUBS] ⚠️ Failed to parse subscription key "${k.name}"`);
          return null;
        }
      });
      const results = await Promise.allSettled(getPromises);
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value !== null) {
          subs.push(result.value);
        }
      }
      cursor = listed.list_complete ? undefined : listed.cursor;
    } while (cursor);
    console.log(`[KV:PUSH_SUBS] ✅ Retrieved ${subs.length} subscription(s)`);
    return subs;
  } catch (err) {
    console.error('[KV:PUSH_SUBS] Get all subscriptions error:', err);
    return [];
  }
}

/**
 * Count subscriptions without fetching full payloads.
 */
export async function kvGetPushSubCount(): Promise<number> {
  const kv = getKVPushSubs();
  if (!kv) return 0;
  try {
    let count = 0;
    let cursor: string | undefined;
    do {
      const listed = await kv.list({ prefix: SUB_PREFIX, cursor });
      count += listed.keys.length;
      cursor = listed.list_complete ? undefined : listed.cursor;
    } while (cursor);
    console.log(`[KV:PUSH_SUBS] ✅ Subscription count: ${count}`);
    return count;
  } catch (err) {
    console.error('[KV:PUSH_SUBS] Count subscriptions error:', err);
    return 0;
  }
}

// ─── Push Config Operations ────────────────────────────────────────

/**
 * Get push config (VAPID keys etc).
 */
export async function kvGetPushConfig(): Promise<PushConfig | null> {
  const kv = getKVPushSubs();
  if (!kv) return null;
  try {
    const raw = await kv.get(CONFIG_KEY);
    if (raw === null) {
      console.log('[KV:PUSH_SUBS] No push config found');
      return null;
    }
    return JSON.parse(raw) as PushConfig;
  } catch (err) {
    console.error('[KV:PUSH_SUBS] Get push config error:', err);
    return null;
  }
}

/**
 * Set push config.
 */
export async function kvSetPushConfig(config: PushConfig): Promise<boolean> {
  const kv = getKVPushSubs();
  if (!kv) return false;
  try {
    await kv.put(CONFIG_KEY, JSON.stringify(config));
    console.log('[KV:PUSH_SUBS] ✅ Push config saved');
    return true;
  } catch (err) {
    console.error('[KV:PUSH_SUBS] Set push config error:', err);
    return false;
  }
}

// ─── Cache Reset ───────────────────────────────────────────────────

export function resetPushKVCache(): void {
  cachedKVPushSubs = undefined;
}
