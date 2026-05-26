import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/cf-env';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/test-turso
 *
 * Tests the database/storage connection with detailed diagnostics.
 *
 * Strategy: Try @libsql/client first. If not available (Cloudflare Workers),
 * automatically test D1 + KV instead. No need for runtime detection —
 * we just try and handle the failure gracefully.
 */
export async function GET(request: NextRequest) {
  // Simple auth check
  const sessionToken = request.cookies.get('next-auth.session-token')?.value;
  if (!sessionToken && process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const TURSO_URL = getEnv('TURSO_DATABASE_URL');
  const TURSO_AUTH_TOKEN = getEnv('TURSO_AUTH_TOKEN');

  // ── Step 1: Try to load @libsql/client ──
  let createClient: any = null;
  let libsqlAvailable = false;
  try {
    // eslint-disable-next-line no-eval
    const libsql = eval('require')('@libsql/client');
    createClient = libsql.createClient;
    libsqlAvailable = true;
  } catch {
    // Not available — we're on Cloudflare Workers or package not installed
    libsqlAvailable = false;
  }

  // ── If @libsql/client is NOT available → test Turso HTTP + D1 + KV (Workers mode) ──
  if (!libsqlAvailable) {
    const results: {
      runtime: string;
      tursoAvailable: boolean;
      tursoTest: { success: boolean; message: string; responseTime?: number; keys?: string[] } | null;
      d1Available: boolean;
      d1Test: { success: boolean; message: string; responseTime?: number } | null;
      kvTest: { success: boolean; message: string } | null;
      overallSuccess: boolean;
      overallMessage: string;
    } = {
      runtime: 'cloudflare-workers',
      tursoAvailable: false,
      tursoTest: null,
      d1Available: false,
      d1Test: null,
      kvTest: null,
      overallSuccess: false,
      overallMessage: '',
    };

    // ── Test Turso HTTP API (new — works on Workers) ──
    const tursoStart = performance.now();
    try {
      const { isTursoHttpConfigured, createTursoHttpClient } = await import('@/lib/turso-http');
      if (isTursoHttpConfigured()) {
        const client = createTursoHttpClient();
        // Quick connectivity probe
        await client.execute('SELECT 1 as test');
        // Read keys to confirm real data access
        const keysResult = await client.execute('SELECT key FROM site_data');
        const keys = keysResult.rows.map((r) => String(r.key));
        const tursoTime = Math.round(performance.now() - tursoStart);
        results.tursoAvailable = true;
        results.tursoTest = {
          success: true,
          message: `Turso HTTP connected! ${keys.length} keys in ${tursoTime}ms`,
          responseTime: tursoTime,
          keys,
        };
      } else {
        results.tursoTest = {
          success: false,
          message: 'Turso not configured (TURSO_DATABASE_URL or TURSO_AUTH_TOKEN missing)',
        };
      }
    } catch (err: any) {
      const tursoTime = Math.round(performance.now() - tursoStart);
      results.tursoTest = {
        success: false,
        message: `Turso HTTP error: ${err?.message?.substring(0, 200) || 'Unknown error'}`,
        responseTime: tursoTime,
      };
    }

    // Test D1
    const d1Start = performance.now();
    try {
      const { isD1Available, initD1Database, d1GetVoteResults } = await import('@/lib/d1');
      if (isD1Available()) {
        results.d1Available = true;
        await initD1Database();
        const voteData = await d1GetVoteResults();
        const d1Time = Math.round(performance.now() - d1Start);
        results.d1Test = {
          success: true,
          message: `D1 connected! Read ${Object.keys(voteData || {}).length} community keys in ${d1Time}ms`,
          responseTime: d1Time,
        };
      } else {
        results.d1Test = {
          success: false,
          message: 'D1 binding not configured. Check wrangler.jsonc d1_databases.',
        };
      }
    } catch (err: any) {
      const d1Time = Math.round(performance.now() - d1Start);
      results.d1Test = {
        success: false,
        message: `D1 error: ${err?.message?.substring(0, 200) || 'Unknown error'}`,
        responseTime: d1Time,
      };
    }

    // Test KV (baked data)
    try {
      const { kvIsAvailable, kvGetBakedData } = await import('@/lib/kv-store');
      if (kvIsAvailable()) {
        const configData = await kvGetBakedData('config');
        results.kvTest = {
          success: true,
          message: configData
            ? `KV connected! Config found (published: ${(configData as Record<string, unknown>)?.lastPublished || 'never'})`
            : 'KV connected! No baked data yet (use Publish to create).',
        };
      } else {
        results.kvTest = {
          success: false,
          message: 'KV binding not configured. Check wrangler.jsonc kv_namespaces.',
        };
      }
    } catch (err: any) {
      results.kvTest = {
        success: false,
        message: `KV error: ${err?.message?.substring(0, 200) || 'Unknown error'}`,
      };
    }

    // Overall
    const tursoOk = results.tursoTest?.success ?? false;
    const d1Ok = results.d1Test?.success ?? false;
    const kvOk = results.kvTest?.success ?? false;
    // Success = at least Turso OR (D1 + KV) is working
    results.overallSuccess = tursoOk || (d1Ok && kvOk);

    const parts: string[] = [];
    parts.push(tursoOk ? '✅ Turso HTTP' : '❌ Turso');
    parts.push(d1Ok ? '✅ D1' : '❌ D1');
    parts.push(kvOk ? '✅ KV' : '❌ KV');
    const summary = parts.join(' | ');

    if (tursoOk && d1Ok && kvOk) {
      results.overallMessage = `✅ All Cloudflare Workers storage OK — ${summary}`;
    } else if (tursoOk) {
      results.overallMessage = `✅ Turso connected (primary data store working). ${summary}`;
    } else if (d1Ok && kvOk) {
      results.overallMessage = `⚠️ Turso unreachable, but D1+KV fallback working. ${summary}`;
    } else {
      results.overallMessage = `❌ Storage issues detected. ${summary}`;
    }

    return NextResponse.json(results, { status: 200 });
  }

  // ── If @libsql/client IS available → test Turso directly (Node.js mode) ──
  const results: {
    runtime: string;
    configured: boolean;
    urlSet: boolean;
    tokenSet: boolean;
    urlPrefix: string;
    connectionTest: {
      success: boolean;
      message: string;
      responseTime?: number;
    } | null;
    dataTest: {
      success: boolean;
      message: string;
      keyCount?: number;
      keys?: string[];
      responseTime?: number;
    } | null;
    consistencyCheck: {
      consistent: boolean;
      mismatches: Array<{
        key: string;
        tursoLength: number;
        localLength: number;
      }>;
    } | null;
    overallSuccess: boolean;
    overallMessage: string;
  } = {
    runtime: 'nodejs',
    configured: false,
    urlSet: !!TURSO_URL,
    tokenSet: !!TURSO_AUTH_TOKEN,
    urlPrefix: TURSO_URL ? TURSO_URL.replace(/\/\/.*@/, '//***@') : 'not set',
    connectionTest: null,
    dataTest: null,
    consistencyCheck: null,
    overallSuccess: false,
    overallMessage: '',
  };

  // Check if all required config is present
  if (!TURSO_URL || !TURSO_AUTH_TOKEN) {
    const missing: string[] = [];
    if (!TURSO_URL) missing.push('TURSO_DATABASE_URL');
    if (!TURSO_AUTH_TOKEN) missing.push('TURSO_AUTH_TOKEN');

    results.overallSuccess = false;
    results.overallMessage = `Missing env vars: ${missing.join(', ')}. Add them to .env and restart the server.`;
    return NextResponse.json(results, { status: 200 });
  }

  results.configured = true;

  // ── Connection Test ──
  const connStart = performance.now();
  try {
    const client = createClient({ url: TURSO_URL, authToken: TURSO_AUTH_TOKEN });
    await Promise.race([
      client.execute('SELECT 1 as test'),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Connection timed out')), 8000)
      ),
    ]);

    const connTime = Math.round(performance.now() - connStart);
    results.connectionTest = {
      success: true,
      message: `Connected successfully! Response: ${connTime}ms`,
      responseTime: connTime,
    };
  } catch (err: any) {
    const connTime = Math.round(performance.now() - connStart);
    const errMsg = err?.message || 'Unknown error';
    results.connectionTest = {
      success: false,
      message: errMsg.includes('timed out')
        ? `Connection timed out after ${connTime}ms — DNS/network issue`
        : `Connection failed: ${errMsg.substring(0, 200)}`,
      responseTime: connTime,
    };
  }

  // ── Data Access Test ──
  if (results.connectionTest?.success) {
    const dataStart = performance.now();
    try {
      const { getAllSiteData } = await import('@/lib/turso');
      const data = await getAllSiteData('turso');
      const dataTime = Math.round(performance.now() - dataStart);
      const keys = Object.keys(data);

      results.dataTest = {
        success: true,
        message: `Data read OK — ${keys.length} key(s) found: ${keys.join(', ')}`,
        keyCount: keys.length,
        keys,
        responseTime: dataTime,
      };
    } catch (err: any) {
      const dataTime = Math.round(performance.now() - dataStart);
      results.dataTest = {
        success: false,
        message: `Data read failed: ${err?.message?.substring(0, 200) || 'Unknown error'}`,
        responseTime: dataTime,
      };
    }
  }

  // ── Consistency Check ──
  if (results.connectionTest?.success) {
    try {
      const { verifyDataConsistency } = await import('@/lib/turso');
      const consistency = await verifyDataConsistency();
      results.consistencyCheck = {
        consistent: consistency.consistent,
        mismatches: consistency.mismatches.map(m => ({
          key: m.key,
          tursoLength: m.tursoLength,
          localLength: m.localLength,
        })),
      };
    } catch (err: any) {
      results.consistencyCheck = {
        consistent: false,
        mismatches: [],
      };
    }
  }

  // Overall result
  const connOk = results.connectionTest?.success ?? false;
  const dataOk = results.dataTest?.success ?? false;
  const consistent = results.consistencyCheck?.consistent ?? true;

  results.overallSuccess = connOk && dataOk;

  if (connOk && dataOk && consistent) {
    results.overallMessage = `✅ Turso connected! Connection: ${results.connectionTest?.responseTime}ms, Data: ${results.dataTest?.responseTime}ms, All ${results.dataTest?.keyCount} keys consistent.`;
  } else if (connOk && dataOk && !consistent) {
    const mismatchKeys = results.consistencyCheck?.mismatches.map(m => m.key).join(', ') || '';
    results.overallMessage = `⚠️ Turso connected but data mismatch in: ${mismatchKeys}. Consider force syncing.`;
  } else if (connOk) {
    results.overallMessage = '⚠️ Connected but failed to read data. Check table schema.';
  } else {
    results.overallMessage = '❌ Cannot connect to Turso. Check URL, auth token, and network.';
  }

  return NextResponse.json(results, { status: 200 });
}
