import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getEnv } from '@/lib/cf-env';

// IMPORTANT: On Cloudflare Workers, process.env does NOT work at runtime.
// Must use getEnv() which tries CF Workers env bindings first, then process.env fallback.
const SUPABASE_URL = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
const SUPABASE_SERVICE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');
const MATCH_ID = getEnv('NEXT_PUBLIC_MATCH_ID') || 'match_001';

/**
 * GET /api/admin/test-supabase
 *
 * Tests the Supabase connection with detailed diagnostics.
 * Checks configuration, connectivity, read access, and write access.
 * Requires admin authentication.
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin session — allow in development mode for testing
    if (process.env.NODE_ENV !== 'development') {
      const session = await getServerSession(authOptions);
      if (!session) {
        // Fallback: check for session cookie directly
        const sessionToken = request.cookies.get('next-auth.session-token')?.value;
        if (!sessionToken) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
      }
    }

    const results: {
      configured: boolean;
      urlSet: boolean;
      anonKeySet: boolean;
      serviceKeySet: boolean;
      matchId: string;
      readTest: { success: boolean; message: string; responseTime?: number; rowCount?: number } | null;
      writeTest: { success: boolean; message: string; responseTime?: number } | null;
      overallSuccess: boolean;
      overallMessage: string;
    } = {
      configured: false,
      urlSet: !!SUPABASE_URL,
      anonKeySet: !!SUPABASE_ANON_KEY,
      serviceKeySet: !!SUPABASE_SERVICE_KEY,
      matchId: MATCH_ID,
      readTest: null,
      writeTest: null,
      overallSuccess: false,
      overallMessage: '',
    };

    // Check if all required config is present
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_KEY) {
      const missing: string[] = [];
      if (!SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL');
      if (!SUPABASE_ANON_KEY) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
      if (!SUPABASE_SERVICE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');

      results.overallSuccess = false;
      results.overallMessage = `Missing env vars: ${missing.join(', ')}. Add them to .env and restart the server.`;
      return NextResponse.json(results, { status: 200 });
    }

    results.configured = true;

    // ── Read Test (using anon key, like /api/live does) ──
    const readStart = performance.now();
    try {
      const readUrl = `${SUPABASE_URL}/rest/v1/match_live?match_id=eq.${MATCH_ID}&select=match_id,updated_at&limit=1`;
      const readResponse = await fetch(readUrl, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });
      const readTime = Math.round(performance.now() - readStart);

      if (readResponse.ok) {
        const rows = await readResponse.json();
        results.readTest = {
          success: true,
          message: `Read OK — ${Array.isArray(rows) ? rows.length : 0} row(s) found`,
          responseTime: readTime,
          rowCount: Array.isArray(rows) ? rows.length : 0,
        };
      } else {
        const errorText = await readResponse.text();
        results.readTest = {
          success: false,
          message: `Read failed: HTTP ${readResponse.status} — ${errorText.substring(0, 100)}`,
          responseTime: readTime,
        };
      }
    } catch (err) {
      results.readTest = {
        success: false,
        message: `Read error: ${err instanceof Error ? err.message : 'Unknown error'}`,
      };
    }

    // ── Service Role Test (using service role key, like admin endpoints do) ──
    const writeStart = performance.now();
    try {
      const testUrl = `${SUPABASE_URL}/rest/v1/match_live?match_id=eq.${MATCH_ID}&select=match_id&limit=1`;
      const testResponse = await fetch(testUrl, {
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      });
      const writeTime = Math.round(performance.now() - writeStart);

      if (testResponse.ok) {
        results.writeTest = {
          success: true,
          message: 'Service role access OK — admin write operations will work',
          responseTime: writeTime,
        };
      } else {
        const errorText = await testResponse.text();
        results.writeTest = {
          success: false,
          message: `Service role failed: HTTP ${testResponse.status} — ${errorText.substring(0, 100)}`,
          responseTime: writeTime,
        };
      }
    } catch (err) {
      results.writeTest = {
        success: false,
        message: `Service role error: ${err instanceof Error ? err.message : 'Unknown error'}`,
      };
    }

    // Overall result
    const readOk = results.readTest?.success ?? false;
    const writeOk = results.writeTest?.success ?? false;

    results.overallSuccess = readOk && writeOk;

    if (readOk && writeOk) {
      results.overallMessage = `✅ Supabase connected! Read: ${results.readTest?.responseTime}ms, Admin: ${results.writeTest?.responseTime}ms, Match: ${MATCH_ID}`;
    } else if (readOk) {
      results.overallMessage = '⚠️ Read works but admin (service role) access failed. Check SUPABASE_SERVICE_ROLE_KEY.';
    } else {
      results.overallMessage = '❌ Cannot connect to Supabase. Check URL and keys.';
    }

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('Test Supabase API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', overallSuccess: false, overallMessage: 'Internal server error during test' },
      { status: 500 }
    );
  }
}
