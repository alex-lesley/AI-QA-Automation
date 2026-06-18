import { expect, type Page } from '@playwright/test';
import { baseUrl } from './auth';
import { trackCreatedProgramId } from './created-program-cleanup';

export type ApiProgram = { id: string; name: string; description: string | null };
export type ApiHeaders = Record<string, string>;

/** Reads the bearer token from in-flight browser API calls (storageState session). */
export async function captureApiHeaders(page: Page): Promise<ApiHeaders> {
  let authorization = '';
  const handler = (request: { url: () => string; headers: () => Record<string, string> }) => {
    const header = request.headers()['authorization'];
    if (header && request.url().includes('/api/')) {
      authorization = header;
    }
  };

  page.on('request', handler);
  await page.goto(`${baseUrl}/programs`);
  await page.waitForResponse(
    (response) =>
      response.url().includes('/api/programs') &&
      response.request().method() === 'GET' &&
      response.ok(),
  );
  page.off('request', handler);

  if (!authorization) {
    throw new Error('Could not capture authorization header from API requests');
  }

  return { authorization, 'content-type': 'application/json' };
}

export async function createProgramViaApi(
  page: Page,
  headers: ApiHeaders,
  name: string,
  description: string,
): Promise<ApiProgram> {
  const response = await page.request.post(`${baseUrl}/api/programs`, {
    headers,
    data: { name, description },
  });
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  const program = body.data as ApiProgram;
  trackCreatedProgramId(page, program.id);
  return program;
}
