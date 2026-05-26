/**
 * Turso HTTP Client — Cloudflare Workers Compatible
 *
 * @libsql/client uses WebSockets / Node.js APIs and does NOT work in
 * Cloudflare Workers (silently fails via require('@libsql/client')).
 * This module uses Turso's HTTP API directly via fetch() — works in:
 *   - Node.js (local dev)
 *   - Cloudflare Workers
 *   - Vercel Edge / Lambda
 *   - Any environment with fetch()
 *
 * Turso HTTP API docs: https://docs.turso.tech/sdk/http/reference
 *
 * The libsql URL format `libsql://xxx.turso.io` is converted to
 * `https://xxx.turso.io/v2/pipeline` for the HTTP API.
 *
 * ⚠️ ADDED 2026-05-21 — fixes "Turso silently broken on Workers" bug.
 */

import { getEnv } from '@/lib/cf-env';

// ─── Types matching @libsql/client shape (backwards-compatible) ──────

export interface TursoRow {
  [column: string]: unknown;
}

export interface TursoResultSet {
  columns: string[];
  rows: TursoRow[];
  rowsAffected: number;
  lastInsertRowid?: string;
}

export interface TursoStatement {
  sql: string;
  args?: unknown[];
}

// ─── HTTP API request/response types ─────────────────────────────────

interface PipelineRequest {
  baton?: string | null;
  requests: Array<
    | { type: 'execute'; stmt: { sql: string; args?: ApiValue[] } }
    | { type: 'close' }
  >;
}

interface ApiValue {
  type: 'null' | 'integer' | 'float' | 'text' | 'blob';
  value?: string;
  base64?: string;
}

interface PipelineResponse {
  baton: string | null;
  base_url: string | null;
  results: Array<
    | { type: 'ok'; response: { type: 'execute'; result: ApiExecuteResult } | { type: 'close' } }
    | { type: 'error'; error: { message: string; code?: string } }
  >;
}

interface ApiExecuteResult {
  cols: Array<{ name: string; decltype: string | null }>;
  rows: ApiValue[][];
  affected_row_count: number;
  last_insert_rowid?: string;
  replication_index?: string;
}

// ─── Value conversion helpers ────────────────────────────────────────

function toApiValue(value: unknown): ApiValue {
  if (value === null || value === undefined) {
    return { type: 'null' };
  }
  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return { type: 'integer', value: String(value) };
    }
    return { type: 'float', value: String(value) };
  }
  if (typeof value === 'bigint') {
    return { type: 'integer', value: value.toString() };
  }
  if (typeof value === 'boolean') {
    return { type: 'integer', value: value ? '1' : '0' };
  }
  if (value instanceof Uint8Array) {
    let binary = '';
    for (let i = 0; i < value.length; i++) {
      binary += String.fromCharCode(value[i]);
    }
    const base64 =
      typeof btoa === 'function'
        ? btoa(binary)
        : Buffer.from(binary, 'binary').toString('base64');
    return { type: 'blob', base64 };
  }
  return { type: 'text', value: String(value) };
}

function fromApiValue(av: ApiValue): unknown {
  switch (av.type) {
    case 'null':
      return null;
    case 'integer': {
      if (av.value === undefined) return null;
      const n = Number(av.value);
      return Number.isSafeInteger(n) ? n : av.value;
    }
    case 'float':
      return av.value === undefined ? null : Number(av.value);
    case 'text':
      return av.value ?? null;
    case 'blob':
      return av.base64 ?? null;
    default:
      return null;
  }
}

// ─── HTTP URL builder ────────────────────────────────────────────────

function getPipelineUrl(rawUrl: string): string {
  if (!rawUrl) throw new Error('TURSO_DATABASE_URL is empty');
  const cleanUrl = rawUrl.split('?')[0];
  const httpsUrl = cleanUrl.replace(/^libsql:\/\//i, 'https://');
  const base = httpsUrl.replace(/\/$/, '');
  return `${base}/v2/pipeline`;
}

// ─── Pipeline executor ───────────────────────────────────────────────

async function executePipeline(
  statements: TursoStatement[],
  options: { timeoutMs?: number } = {}
): Promise<TursoResultSet[]> {
  const url = getEnv('TURSO_DATABASE_URL');
  const token = getEnv('TURSO_AUTH_TOKEN');

  if (!url || !token) {
    throw new Error('Turso not configured: TURSO_DATABASE_URL or TURSO_AUTH_TOKEN missing');
  }

  const pipelineUrl = getPipelineUrl(url);

  const body: PipelineRequest = {
    requests: [
      ...statements.map((s) => ({
        type: 'execute' as const,
        stmt: {
          sql: s.sql,
          args: (s.args ?? []).map(toApiValue),
        },
      })),
      { type: 'close' as const },
    ],
  };

  const timeoutMs = options.timeoutMs ?? 8000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(pipelineUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const e = err as { name?: string; message?: string };
    if (e?.name === 'AbortError') {
      throw new Error(`Turso HTTP request timed out after ${timeoutMs}ms`);
    }
    throw new Error(`Turso HTTP fetch failed: ${e?.message || String(err)}`);
  }
  clearTimeout(timeoutId);

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Turso HTTP ${response.status}: ${errText.slice(0, 300)}`);
  }

  const json = (await response.json()) as PipelineResponse;

  if (!json?.results || !Array.isArray(json.results)) {
    throw new Error('Turso HTTP: invalid response shape');
  }

  const resultSets: TursoResultSet[] = [];
  for (let i = 0; i < statements.length; i++) {
    const res = json.results[i];
    if (!res) {
      throw new Error(`Turso HTTP: missing result for statement ${i}`);
    }
    if (res.type === 'error') {
      throw new Error(`Turso SQL error: ${res.error?.message || 'unknown'}`);
    }
    if (res.response?.type !== 'execute') {
      throw new Error(`Turso HTTP: unexpected response type for statement ${i}`);
    }
    const exec = res.response.result;
    const columns = exec.cols.map((c) => c.name);
    const rows: TursoRow[] = exec.rows.map((row) => {
      const obj: TursoRow = {};
      for (let j = 0; j < columns.length; j++) {
        obj[columns[j]] = fromApiValue(row[j]);
      }
      return obj;
    });
    resultSets.push({
      columns,
      rows,
      rowsAffected: exec.affected_row_count ?? 0,
      lastInsertRowid: exec.last_insert_rowid,
    });
  }

  return resultSets;
}

// ─── Backwards-compatible client (matches @libsql/client shape) ──────

export interface TursoHttpClient {
  execute(
    statement: string | TursoStatement,
    options?: { timeoutMs?: number }
  ): Promise<TursoResultSet>;
  batch(
    statements: Array<string | TursoStatement>,
    options?: { timeoutMs?: number }
  ): Promise<TursoResultSet[]>;
}

function normalizeStmt(s: string | TursoStatement): TursoStatement {
  return typeof s === 'string' ? { sql: s, args: [] } : { sql: s.sql, args: s.args ?? [] };
}

/**
 * Create a Turso HTTP client. No connection state — each call is a
 * stateless HTTPS request. Safe to call on every request without
 * reusing instances.
 */
export function createTursoHttpClient(): TursoHttpClient {
  return {
    async execute(statement, options) {
      const stmt = normalizeStmt(statement);
      const results = await executePipeline([stmt], options);
      return results[0];
    },
    async batch(statements, options) {
      const stmts = statements.map(normalizeStmt);
      const results = await executePipeline(stmts, options);
      return results;
    },
  };
}

/**
 * Returns true if Turso is configured (both URL and token present).
 */
export function isTursoHttpConfigured(): boolean {
  return !!(getEnv('TURSO_DATABASE_URL') && getEnv('TURSO_AUTH_TOKEN'));
}
