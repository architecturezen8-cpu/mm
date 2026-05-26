/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Cloudflare KV Music Store Utility
 *
 * KV namespace: MUSIC
 *
 * Keys:
 *   music:library       — JSON array of SongMeta
 *   music:active        — JSON object of the currently active song (ActiveSong)
 *   music:song:{id}     — MP3 binary data (ArrayBuffer as base64 string)
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

export interface SongMeta {
  id: string;        // unique ID
  name: string;      // display name
  fileName: string;  // original filename
  size: number;      // bytes
  duration: number;  // seconds (0 if unknown)
  uploadedAt: number; // timestamp
}

export interface ActiveSong {
  songId: string;    // matches SongMeta.id
  version: number;   // incremented on change, used for cache busting
  volume: number;    // 0-100
  loop: boolean;     // whether to loop
}

interface KVNamespace {
  get(key: string, options?: { type?: 'text' | 'arrayBuffer' }): Promise<string | ArrayBuffer | null>;
  put(key: string, value: string | ArrayBuffer): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; cursor?: string; limit?: number }): Promise<{
    keys: Array<{ name: string }>;
    list_complete: boolean;
    cursor?: string;
  }>;
}

// ─── KV Binding Access (cached) ────────────────────────────────────

let cachedKVMusic: KVNamespace | null | undefined = undefined;

export function getKVMusic(): KVNamespace | null {
  if (cachedKVMusic !== undefined) return cachedKVMusic;

  const ctx = getCfContext();
  if (ctx?.env?.MUSIC) {
    console.log('[KV:MUSIC] ✅ Cloudflare Workers KV binding found');
    cachedKVMusic = ctx.env.MUSIC as KVNamespace;
    return cachedKVMusic;
  }

  console.warn('[KV:MUSIC] ❌ KV binding not available — music feature disabled');
  cachedKVMusic = null;
  return null;
}

// ─── Library Operations ────────────────────────────────────────────

const LIBRARY_KEY = 'music:library';

export async function kvGetMusicLibrary(): Promise<SongMeta[]> {
  const kv = getKVMusic();
  if (!kv) return [];
  try {
    const raw = await kv.get(LIBRARY_KEY);
    if (raw === null) return [];
    const parsed = JSON.parse(raw as string);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('[KV:MUSIC] Get library error:', err);
    return [];
  }
}

export async function kvSetMusicLibrary(songs: SongMeta[]): Promise<boolean> {
  const kv = getKVMusic();
  if (!kv) return false;
  try {
    await kv.put(LIBRARY_KEY, JSON.stringify(songs));
    console.log(`[KV:MUSIC] ✅ Library saved (${songs.length} songs)`);
    return true;
  } catch (err) {
    console.error('[KV:MUSIC] Set library error:', err);
    return false;
  }
}

export async function kvAddToMusicLibrary(song: SongMeta): Promise<boolean> {
  const songs = await kvGetMusicLibrary();
  // Prevent duplicate IDs
  if (songs.some((s) => s.id === song.id)) {
    console.warn(`[KV:MUSIC] Song with id "${song.id}" already exists in library`);
    return false;
  }
  songs.push(song);
  return kvSetMusicLibrary(songs);
}

export async function kvRemoveFromMusicLibrary(songId: string): Promise<boolean> {
  const songs = await kvGetMusicLibrary();
  const filtered = songs.filter((s) => s.id !== songId);
  if (filtered.length === songs.length) {
    console.warn(`[KV:MUSIC] Song "${songId}" not found in library`);
    return false;
  }
  return kvSetMusicLibrary(filtered);
}

// ─── Active Song Operations ────────────────────────────────────────

const ACTIVE_KEY = 'music:active';

export async function kvGetActiveSong(): Promise<ActiveSong | null> {
  const kv = getKVMusic();
  if (!kv) return null;
  try {
    const raw = await kv.get(ACTIVE_KEY);
    if (raw === null) return null;
    return JSON.parse(raw as string) as ActiveSong;
  } catch (err) {
    console.error('[KV:MUSIC] Get active song error:', err);
    return null;
  }
}

async function kvPutActiveSong(active: ActiveSong): Promise<ActiveSong | null> {
  const kv = getKVMusic();
  if (!kv) return null;
  try {
    await kv.put(ACTIVE_KEY, JSON.stringify(active));
    return active;
  } catch (err) {
    console.error('[KV:MUSIC] Set active song error:', err);
    return null;
  }
}

export async function kvSetActiveSong(songId: string): Promise<ActiveSong | null> {
  const current = await kvGetActiveSong();
  const nextVersion = current ? current.version + 1 : 1;
  const active: ActiveSong = {
    songId,
    version: nextVersion,
    volume: current?.volume ?? 80,
    loop: current?.loop ?? true,
  };
  const result = await kvPutActiveSong(active);
  if (result) {
    console.log(`[KV:MUSIC] ✅ Active song set to "${songId}" (v${nextVersion})`);
  }
  return result;
}

export async function kvSetMusicVolume(volume: number): Promise<ActiveSong | null> {
  const current = await kvGetActiveSong();
  if (!current) {
    console.warn('[KV:MUSIC] Cannot set volume — no active song');
    return null;
  }
  const clamped = Math.max(0, Math.min(100, Math.round(volume)));
  const updated: ActiveSong = { ...current, volume: clamped };
  const result = await kvPutActiveSong(updated);
  if (result) {
    console.log(`[KV:MUSIC] ✅ Volume set to ${clamped}`);
  }
  return result;
}

export async function kvSetMusicLoop(loop: boolean): Promise<ActiveSong | null> {
  const current = await kvGetActiveSong();
  if (!current) {
    console.warn('[KV:MUSIC] Cannot set loop — no active song');
    return null;
  }
  const updated: ActiveSong = { ...current, loop };
  const result = await kvPutActiveSong(updated);
  if (result) {
    console.log(`[KV:MUSIC] ✅ Loop set to ${loop}`);
  }
  return result;
}

// ─── Song Binary Data Operations ───────────────────────────────────

function songDataKey(songId: string): string {
  return `music:song:${songId}`;
}

export async function kvGetSongData(songId: string): Promise<Uint8Array | null> {
  const kv = getKVMusic();
  if (!kv) return null;
  try {
    const raw = await kv.get(songDataKey(songId), { type: 'arrayBuffer' });
    if (raw === null) return null;
    return new Uint8Array(raw as ArrayBuffer);
  } catch (err) {
    console.error(`[KV:MUSIC] Get song data "${songId}" error:`, err);
    return null;
  }
}

export async function kvSetSongData(songId: string, data: Uint8Array): Promise<boolean> {
  const kv = getKVMusic();
  if (!kv) return false;
  try {
    await kv.put(songDataKey(songId), data.buffer as ArrayBuffer);
    console.log(`[KV:MUSIC] ✅ Song data saved "${songId}" (${data.byteLength} bytes)`);
    return true;
  } catch (err) {
    console.error(`[KV:MUSIC] Set song data "${songId}" error:`, err);
    return false;
  }
}

export async function kvDeleteSongData(songId: string): Promise<boolean> {
  const kv = getKVMusic();
  if (!kv) return false;
  try {
    await kv.delete(songDataKey(songId));
    console.log(`[KV:MUSIC] ✅ Song data deleted "${songId}"`);
    return true;
  } catch (err) {
    console.error(`[KV:MUSIC] Delete song data "${songId}" error:`, err);
    return false;
  }
}

// ─── Cache Reset ────────────────────────────────────────────────────

export function resetKVMusicCache(): void {
  cachedKVMusic = undefined;
}
