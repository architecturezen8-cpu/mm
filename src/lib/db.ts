/**
 * Database client — Edge-compatible stub
 *
 * Prisma + libsql require Node.js filesystem and native modules
 * which are NOT available on Cloudflare Workers (Edge runtime).
 *
 * The app uses Supabase REST API and Cloudflare D1 instead.
 * This stub prevents the heavy Prisma/libsql libraries from
 * being bundled into the Cloudflare Worker.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = null as any;
