import path from 'path';
import { config as loadDotenv } from 'dotenv';

export type ApiProgram = { id: string; name: string; description: string | null };
export type ApiHeaders = Record<string, string>;

const REPO_ROOT = path.resolve(__dirname, '../../../..');

loadDotenv({ path: path.join(REPO_ROOT, '.env'), quiet: true });

export function getBaseUrl(): string {
  return process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio';
}

export function requireApiToken(): string {
  const token = process.env.DIDAXIS_API_TOKEN?.trim();
  if (!token) {
    throw new Error('Missing required environment variable: DIDAXIS_API_TOKEN');
  }
  return token;
}

export function buildApiHeaders(apiToken: string): ApiHeaders {
  const trimmed = apiToken.trim();
  const authorization = /^bearer\s+/i.test(trimmed) ? trimmed : `Bearer ${trimmed}`;
  return { authorization, 'content-type': 'application/json' };
}

async function parseJsonBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function apiError(method: string, url: string, response: Response, body: unknown): Error {
  return new Error(
    `${method} ${url} failed: ${response.status} ${response.statusText}${
      body ? ` — ${JSON.stringify(body)}` : ''
    }`,
  );
}

export async function listProgramsViaApi(
  baseUrl: string,
  headers: ApiHeaders,
): Promise<ApiProgram[]> {
  const url = `${baseUrl}/api/programs`;
  const response = await fetch(url, { method: 'GET', headers });
  const body = await parseJsonBody(response);
  if (!response.ok) {
    throw apiError('GET', url, response, body);
  }
  const data = (body as { data?: ApiProgram[] } | null)?.data;
  return data ?? [];
}

export async function deleteProgramViaApi(
  baseUrl: string,
  headers: ApiHeaders,
  programId: string,
): Promise<void> {
  const url = `${baseUrl}/api/programs/${programId}`;
  const response = await fetch(url, { method: 'DELETE', headers });
  const body = await parseJsonBody(response);
  if (!response.ok) {
    throw apiError('DELETE', url, response, body);
  }
}

export type EnsureNoProgramsResult = {
  deletedCount: number;
  finalCount: number;
};

/** Deletes all programs, polling until the list is empty (mirrors test helper). */
export async function ensureNoProgramsViaApi(
  baseUrl: string,
  headers: ApiHeaders,
  options: { timeoutMs?: number; pollIntervalMs?: number } = {},
): Promise<EnsureNoProgramsResult> {
  const timeoutMs = options.timeoutMs ?? 60_000;
  const pollIntervalMs = options.pollIntervalMs ?? 250;
  const deadline = Date.now() + timeoutMs;
  let deletedCount = 0;

  while (Date.now() < deadline) {
    const programs = await listProgramsViaApi(baseUrl, headers);
    if (programs.length === 0) {
      return { deletedCount, finalCount: 0 };
    }

    await Promise.all(
      programs.map((program) => deleteProgramViaApi(baseUrl, headers, program.id)),
    );
    deletedCount += programs.length;

    const remaining = (await listProgramsViaApi(baseUrl, headers)).length;
    if (remaining === 0) {
      return { deletedCount, finalCount: 0 };
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  const finalCount = (await listProgramsViaApi(baseUrl, headers)).length;
  if (finalCount > 0) {
    throw new Error(
      `Timed out after ${timeoutMs}ms with ${finalCount} program(s) still present`,
    );
  }

  return { deletedCount, finalCount: 0 };
}
