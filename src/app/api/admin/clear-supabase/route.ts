import { NextRequest, NextResponse } from 'next/server';
import { setSiteData } from '@/lib/turso';
import { DEFAULT_COMMUNITY } from '@/lib/voting';
import { d1ClearVotes, isD1Available } from '@/lib/d1';
import { getEnv } from '@/lib/cf-env';

const SUPABASE_URL = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const SUPABASE_SERVICE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');
const MATCH_ID = getEnv('NEXT_PUBLIC_MATCH_ID') || 'match_001';

// Simple cookie-based auth check (consistent with other admin routes)
function isAdminRequest(req: NextRequest): boolean {
  const sessionToken = req.cookies.get('next-auth.session-token')?.value;
  if (sessionToken) return true;
  if (process.env.NODE_ENV === 'development') return true;
  return false;
}

/**
 * DELETE /api/admin/clear-supabase
 *
 * Clears all match data from the Supabase match_live table.
 * Requires admin authentication. Uses service role key to bypass RLS.
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verify admin session (same pattern as other admin routes)
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    // Delete the match row from Supabase using REST API (service role key)
    const url = `${SUPABASE_URL}/rest/v1/match_live?match_id=eq.${MATCH_ID}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Supabase DELETE error:', response.status, errorText);
      return NextResponse.json(
        { error: `Failed to clear Supabase data: ${response.status}` },
        { status: 500 }
      );
    }

    const deletedRows = await response.json();

    return NextResponse.json({
      success: true,
      message: `Cleared Supabase data for match ${MATCH_ID}`,
      deletedCount: Array.isArray(deletedRows) ? deletedRows.length : 0,
    });
  } catch (error) {
    console.error('Clear Supabase API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/clear-supabase
 *
 * Updates the Supabase match_live row — used for offline toggle and data reset.
 * Body: { action: 'setOffline' | 'setOnline' }
 *   - setOffline: Sets isOffline=true and resets live_state to offline placeholder, clears innings data
 *   - setOnline: Sets isOffline=false (keeps existing data, allows live updates to resume)
 */
export async function PATCH(request: NextRequest) {
  try {
    // Verify admin session (same pattern as other admin routes)
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { action } = body;

    if (action !== 'setOffline' && action !== 'setOnline' && action !== 'setWin' && action !== 'clearWin' && action !== 'resetMatch' && action !== 'clearVotes') {
      return NextResponse.json({ error: 'Invalid action. Use "setOffline", "setOnline", "setWin", "clearWin", "resetMatch", or "clearVotes"' }, { status: 400 });
    }

    const url = `${SUPABASE_URL}/rest/v1/match_live?match_id=eq.${MATCH_ID}`;

    if (action === 'setOffline') {
      // Write a COMPLETE offline live_state in a single atomic PATCH.
      // This is more reliable than read-then-write (no race condition, no parse errors).
      // IMPORTANT: We do NOT destroy innings_1/innings_2 data — only replace live_state.
      // The client hook checks isOffline=true and renders offline placeholders.
      // Real innings data is preserved so setOnline can restore instantly.
      const offlineLiveState = {
        currentOver: 0,
        currentBall: 0,
        overDisplay: '0.0',
        score: '0/0',
        battingTeam: "St.Thomas' College Matale",
        target: 0,
        need: 0,
        ballsLeft: 0,
        currentBatsmen: [
          { name: 'Batsman 1', shortName: 'B. 1', initials: 'B1', runs: 0, balls: 0, fours: 0, sixes: 0, sr: 0, isStriking: true, photoUrl: '' },
          { name: 'Batsman 2', shortName: 'B. 2', initials: 'B2', runs: 0, balls: 0, fours: 0, sixes: 0, sr: 0, isStriking: false, photoUrl: '' },
        ],
        currentBowler: 'Bowler',
        currentOverBalls: [],
        partnership: { runs: 0, balls: 0, bat1Runs: 0, bat2Runs: 0, bat1Name: 'Batsman 1', bat2Name: 'Batsman 2' },
        isLive: true,
        isOffline: true,
        crr: 0,
        rrr: 0,
      };

      const updatePayload = {
        live_state: JSON.stringify(offlineLiveState),
      };

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Supabase PATCH (setOffline) error:', response.status, errorText);
        return NextResponse.json(
          { error: `Failed to update Supabase data: ${response.status}` },
          { status: 500 }
        );
      }

      const patchedRows = await response.json();
      // If PATCH matched 0 rows, the match row doesn't exist — create it
      if (!patchedRows || patchedRows.length === 0) {
        const freshInnings = {
          battingTeam: "St.Thomas' College Matale",
          bowlingTeam: 'Govt. Science College Matale',
          totalRuns: 0,
          totalWkts: 0,
          totalOvers: '0.0',
          maxOvers: 0,
          extras: { total: 0, wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0 },
          batting: [],
          bowling: [],
          fallOfWickets: [],
          overByOver: [],
          partnerships: [],
        };

        const insertPayload = {
          match_id: MATCH_ID,
          live_state: JSON.stringify(offlineLiveState),
          innings_1: JSON.stringify(freshInnings),
          innings_2: JSON.stringify({ ...freshInnings, battingTeam: 'Govt. Science College Matale', bowlingTeam: "St.Thomas' College Matale" }),
        };

        const insertUrl = `${SUPABASE_URL}/rest/v1/match_live`;
        const insertResponse = await fetch(insertUrl, {
          method: 'POST',
          headers: {
            apikey: SUPABASE_SERVICE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify(insertPayload),
        });

        if (!insertResponse.ok) {
          const errorText = await insertResponse.text();
          console.error('Supabase POST (setOffline insert) error:', insertResponse.status, errorText);
          return NextResponse.json(
            { error: `Failed to create Supabase data: ${insertResponse.status}` },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Match row created in OFFLINE mode.',
          isOffline: true,
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Match data set to OFFLINE mode. Live data hidden, showing placeholder state.',
        isOffline: true,
      });
    }

    if (action === 'setOnline') {
      // Fetch current live_state to toggle isOffline off
      const fetchUrl = `${SUPABASE_URL}/rest/v1/match_live?match_id=eq.${MATCH_ID}&select=live_state`;
      const fetchResponse = await fetch(fetchUrl, {
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      });

      if (!fetchResponse.ok) {
        const errorText = await fetchResponse.text();
        console.error('Supabase GET error:', fetchResponse.status, errorText);
        return NextResponse.json(
          { error: `Failed to fetch current Supabase data: ${fetchResponse.status}` },
          { status: 500 }
        );
      }

      const rows = await fetchResponse.json();

      if (!rows || rows.length === 0) {
        // No match row exists — create one with isOffline=false (online mode)
        const onlineLiveState = {
          currentOver: 0,
          currentBall: 0,
          overDisplay: '0.0',
          score: '0/0',
          battingTeam: "St.Thomas' College Matale",
          target: 0,
          need: 0,
          ballsLeft: 0,
          currentBatsmen: [],
          currentBowler: '',
          currentOverBalls: [],
          partnership: { runs: 0, balls: 0, bat1Runs: 0, bat2Runs: 0, bat1Name: '', bat2Name: '' },
          isLive: true,
          isOffline: false,
          crr: 0,
          rrr: 0,
        };

        const freshInnings = {
          battingTeam: "St.Thomas' College Matale",
          bowlingTeam: 'Govt. Science College Matale',
          totalRuns: 0,
          totalWkts: 0,
          totalOvers: '0.0',
          maxOvers: 0,
          extras: { total: 0, wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0 },
          batting: [],
          bowling: [],
          fallOfWickets: [],
          overByOver: [],
          partnerships: [],
        };

        const insertPayload = {
          match_id: MATCH_ID,
          live_state: JSON.stringify(onlineLiveState),
          innings_1: JSON.stringify(freshInnings),
          innings_2: JSON.stringify({ ...freshInnings, battingTeam: 'Govt. Science College Matale', bowlingTeam: "St.Thomas' College Matale" }),
        };

        const insertUrl = `${SUPABASE_URL}/rest/v1/match_live`;
        const insertResponse = await fetch(insertUrl, {
          method: 'POST',
          headers: {
            apikey: SUPABASE_SERVICE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify(insertPayload),
        });

        if (!insertResponse.ok) {
          const errorText = await insertResponse.text();
          console.error('Supabase POST (setOnline insert) error:', insertResponse.status, errorText);
          return NextResponse.json(
            { error: `Failed to create Supabase data: ${insertResponse.status}` },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Match row created in ONLINE mode.',
          isOffline: false,
        });
      }

      // Match row exists — just toggle isOffline=false in live_state (preserve all other data!)
      const currentLiveState = typeof rows[0].live_state === 'string'
        ? JSON.parse(rows[0].live_state)
        : rows[0].live_state;

      // Set isOffline to false, keep everything else (including innings data)
      const updatedLiveState = { ...currentLiveState, isOffline: false };

      const updatePayload = {
        live_state: JSON.stringify(updatedLiveState),
      };

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Supabase PATCH (setOnline) error:', response.status, errorText);
        return NextResponse.json(
          { error: `Failed to update Supabase data: ${response.status}` },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Match data set to ONLINE mode. Real-time data will be displayed.',
        isOffline: false,
      });
    }

    // ── Win Signal ──
    if (action === 'setWin') {
      const { result } = body;
      if (!result || typeof result !== 'string') {
        return NextResponse.json({ error: 'Missing "result" field for setWin action' }, { status: 400 });
      }

      // Fetch current match_info and live_state
      const fetchUrl = `${SUPABASE_URL}/rest/v1/match_live?match_id=eq.${MATCH_ID}&select=match_info,live_state`;
      const fetchResponse = await fetch(fetchUrl, {
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      });

      let currentMatchInfo: Record<string, unknown> = {};
      let currentLiveState: Record<string, unknown> = {};

      if (fetchResponse.ok) {
        const rows = await fetchResponse.json();
        if (rows && rows.length > 0) {
          if (rows[0].match_info) {
            currentMatchInfo = typeof rows[0].match_info === 'string' ? JSON.parse(rows[0].match_info) : rows[0].match_info;
          }
          if (rows[0].live_state) {
            currentLiveState = typeof rows[0].live_state === 'string' ? JSON.parse(rows[0].live_state) : rows[0].live_state;
          }
        }
      }

      // Update match_info.result and set isLive=false in live_state
      const updatedMatchInfo = { ...currentMatchInfo, result: result.trim() };
      const updatedLiveState = { ...currentLiveState, isLive: false, isOffline: false };

      const updatePayload = {
        match_info: JSON.stringify(updatedMatchInfo),
        live_state: JSON.stringify(updatedLiveState),
      };

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Supabase PATCH (setWin) error:', response.status, errorText);
        return NextResponse.json({ error: `Failed to send win signal: ${response.status}` }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Win signal sent: "${result.trim()}"`,
      });
    }

    if (action === 'clearWin') {
      // Fetch current match_info and live_state
      const fetchUrl = `${SUPABASE_URL}/rest/v1/match_live?match_id=eq.${MATCH_ID}&select=match_info,live_state`;
      const fetchResponse = await fetch(fetchUrl, {
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      });

      let currentMatchInfo: Record<string, unknown> = {};
      let currentLiveState: Record<string, unknown> = {};

      if (fetchResponse.ok) {
        const rows = await fetchResponse.json();
        if (rows && rows.length > 0) {
          if (rows[0].match_info) {
            currentMatchInfo = typeof rows[0].match_info === 'string' ? JSON.parse(rows[0].match_info) : rows[0].match_info;
          }
          if (rows[0].live_state) {
            currentLiveState = typeof rows[0].live_state === 'string' ? JSON.parse(rows[0].live_state) : rows[0].live_state;
          }
        }
      }

      const updatedMatchInfo = { ...currentMatchInfo, result: 'Match in progress' };
      const updatedLiveState = { ...currentLiveState, isLive: true, isOffline: false };

      const updatePayload = {
        match_info: JSON.stringify(updatedMatchInfo),
        live_state: JSON.stringify(updatedLiveState),
      };

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Supabase PATCH (clearWin) error:', response.status, errorText);
        return NextResponse.json({ error: `Failed to clear win signal: ${response.status}` }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Win signal cleared. Match set back to in progress.',
      });
    }

    // ── Reset Match Data (zeros out all scores, like a new match) ──
    if (action === 'resetMatch') {
      const resetLiveState = {
        currentOver: 0,
        currentBall: 0,
        overDisplay: '0.0',
        score: '0/0',
        battingTeam: "St.Thomas' College Matale",
        target: 0,
        need: 0,
        ballsLeft: 0,
        currentBatsmen: [],
        currentBowler: '',
        currentOverBalls: [],
        partnership: { runs: 0, balls: 0, bat1Runs: 0, bat2Runs: 0, bat1Name: '', bat2Name: '' },
        isLive: true,
        isOffline: false,
        crr: 0,
        rrr: 0,
      };

      const resetMatchInfo = {
        id: MATCH_ID,
        team1: {
          name: "St.Thomas' College Matale",
          shortName: 'STC',
          flagEmoji: '🦁',
          color: '#FFC300',
        },
        team2: {
          name: 'Govt. Science College Matale',
          shortName: 'GSC',
          flagEmoji: '🔬',
          color: '#E63946',
        },
        venue: 'Bernard Aluwihare Ground Matale',
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        result: '',
        toss: '',
        playerOfMatch: '',
        umpires: [],
        matchReferee: '',
        matchTitle: 'Battle of the Golds',
        series: '24th Big Match',
      };

      const resetInnings = {
        battingTeam: "St.Thomas' College Matale",
        bowlingTeam: 'Govt. Science College Matale',
        totalRuns: 0,
        totalWkts: 0,
        totalOvers: '0.0',
        maxOvers: 0,
        extras: { total: 0, wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0 },
        batting: [],
        bowling: [],
        fallOfWickets: [],
        overByOver: [],
        partnerships: [],
      };

      const resetMomentum: unknown[] = [];

      const updatePayload = {
        live_state: JSON.stringify(resetLiveState),
        match_info: JSON.stringify(resetMatchInfo),
        innings_1: JSON.stringify(resetInnings),
        innings_2: JSON.stringify({ ...resetInnings, battingTeam: 'Govt. Science College Matale', bowlingTeam: "St.Thomas' College Matale" }),
        momentum: JSON.stringify(resetMomentum),
      };

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Supabase PATCH (resetMatch) error:', response.status, errorText);
        return NextResponse.json(
          { error: `Failed to reset match data: ${response.status}` },
          { status: 500 }
        );
      }

      // Also reset vote data (D1 + Turso)
      if (isD1Available()) {
        try { await d1ClearVotes(); } catch (err) {
          console.warn('[resetMatch] Failed to clear D1 votes:', err);
        }
      }
      try {
        await setSiteData('community', { ...DEFAULT_COMMUNITY });
        await setSiteData('vote_fingerprints', {});
      } catch (err) {
        console.warn('[resetMatch] Failed to reset Turso community:', err);
      }

      return NextResponse.json({
        success: true,
        message: 'Match data reset to defaults. All scores cleared, like a new match.',
      });
    }

    // ── Clear Vote Data (resets D1 + Turso community & fingerprints) ──
    if (action === 'clearVotes') {
      // Clear D1 vote data (primary voting database)
      if (isD1Available()) {
        try {
          await d1ClearVotes();
        } catch (err) {
          console.error('[clearVotes] Failed to clear D1 vote data:', err);
        }
      }

      // Also clear Turso community and fingerprints (fallback database)
      try {
        await setSiteData('community', { ...DEFAULT_COMMUNITY });
        await setSiteData('vote_fingerprints', {});
      } catch (err) {
        console.error('[clearVotes] Failed to reset Turso vote data:', err);
        return NextResponse.json(
          { error: 'Failed to clear vote data' },
          { status: 500 }
        );
      }

      const storageNote = isD1Available()
        ? 'D1 + Turso'
        : 'Turso';

      return NextResponse.json({
        success: true,
        message: `All vote data cleared from ${storageNote}. Community counts reset to zero.`,
      });
    }

    return NextResponse.json({ error: 'Unhandled action' }, { status: 400 });
  } catch (error) {
    console.error('Patch Supabase API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
