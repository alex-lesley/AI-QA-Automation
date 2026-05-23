import { test, expect, type Locator, type Page } from '@playwright/test';

const EMAIL_PLACEHOLDER = '<EMAIL>';
const PASSWORD_PLACEHOLDER = '<PASSWORD>';

const baseUrl = process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio';
const loginUrl = `${baseUrl}/login`;
const programsUrl = `${baseUrl}/programs`;

type ApiProgram = { id: string; name: string; description: string | null };
type ApiHeaders = Record<string, string>;

function requireEnv(name: 'DIDAXIS_EMAIL' | 'DIDAXIS_PASSWORD'): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function uniqueName(base: string): string {
  return `${base} ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function uniqueTag(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function newProgramDialog(page: Page) {
  return page.getByRole('dialog', { name: 'New Program' });
}

function programRow(page: Page, programName: string) {
  return page.getByRole('row').filter({
    has: page.getByText(programName, { exact: true }),
  });
}

function emptyStateMessage(page: Page) {
  return page.getByText(/no programs yet|no programs have been created/i);
}

function createFirstProgramPrompt(page: Page) {
  return page.getByRole('button', { name: 'Create Program' });
}

function createFormFields(dialog: Locator) {
  return {
    programName: dialog.getByRole('textbox', { name: 'Program Name' }),
    description: dialog.getByRole('textbox', { name: 'Description' }),
    create: dialog.getByRole('button', { name: 'Create' }),
  };
}

async function setInputValue(locator: Locator, value: string): Promise<void> {
  await locator.evaluate((element, nextValue) => {
    const field = element as HTMLInputElement | HTMLTextAreaElement;
    const prototype =
      field instanceof HTMLTextAreaElement
        ? window.HTMLTextAreaElement.prototype
        : window.HTMLInputElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
    descriptor?.set?.call(field, nextValue);
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

async function fillFormField(locator: Locator, value: string): Promise<void> {
  await locator.fill(value);
}

async function login(page: Page, email: string, password: string): Promise<void> {
  await page.goto(loginUrl);

  const emailField = page.getByRole('textbox', { name: 'Email' });
  const passwordField = page.getByRole('textbox', { name: 'Password' });

  await test.step(`Enter ${EMAIL_PLACEHOLDER}`, async () => {
    await setInputValue(emailField, email);
  });
  await test.step(`Enter ${PASSWORD_PLACEHOLDER}`, async () => {
    await setInputValue(passwordField, password);
  });

  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible({ timeout: 30_000 });
}

async function loginAsAdmin(page: Page): Promise<void> {
  await login(page, requireEnv('DIDAXIS_EMAIL'), requireEnv('DIDAXIS_PASSWORD'));
}

async function gotoProgramsPage(page: Page): Promise<void> {
  await page.goto(programsUrl);
  await expect(page.getByRole('heading', { name: 'Programs', level: 2 })).toBeVisible();
  await expect(page.getByRole('button', { name: '+ New Program' })).toBeVisible();
}

async function captureApiHeaders(page: Page): Promise<ApiHeaders> {
  let authorization = '';
  const handler = (request: { url: () => string; headers: () => Record<string, string> }) => {
    const header = request.headers()['authorization'];
    if (header && request.url().includes('/api/')) {
      authorization = header;
    }
  };

  page.on('request', handler);
  await page.goto(programsUrl);
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

async function listProgramsViaApi(page: Page, headers: ApiHeaders): Promise<ApiProgram[]> {
  const response = await page.request.get(`${baseUrl}/api/programs`, { headers });
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  return body.data ?? [];
}

async function createProgramViaApi(
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
  return body.data;
}

async function deleteProgramViaApi(
  page: Page,
  headers: ApiHeaders,
  programId: string,
): Promise<void> {
  const response = await page.request.delete(`${baseUrl}/api/programs/${programId}`, { headers });
  expect(response.ok()).toBeTruthy();
}

async function ensureNoProgramsViaApi(page: Page, headers: ApiHeaders): Promise<void> {
  await expect
    .poll(
      async () => {
        const programs = await listProgramsViaApi(page, headers);
        if (programs.length === 0) {
          return 0;
        }
        await Promise.all(
          programs.map((program) => deleteProgramViaApi(page, headers, program.id)),
        );
        return (await listProgramsViaApi(page, headers)).length;
      },
      { timeout: 60_000 },
    )
    .toBe(0);
}

async function createProgramsBulkViaApi(
  page: Page,
  headers: ApiHeaders,
  programs: Array<{ name: string; description: string }>,
): Promise<void> {
  const batchSize = 20;
  for (let index = 0; index < programs.length; index += batchSize) {
    const batch = programs.slice(index, index + batchSize);
    await Promise.all(
      batch.map((program) =>
        createProgramViaApi(page, headers, program.name, program.description),
      ),
    );
  }
}

async function createProgramViaUi(
  page: Page,
  name: string,
  description: string,
): Promise<void> {
  await page.getByRole('button', { name: '+ New Program' }).click();
  const dialog = newProgramDialog(page);
  const fields = createFormFields(dialog);
  await fillFormField(fields.programName, name);
  await fillFormField(fields.description, description);
  await fields.create.click();
  await expect(dialog).toBeHidden({ timeout: 15_000 });
  await expect(programRow(page, name)).toBeVisible();
}

async function assertProgramVisible(
  page: Page,
  name: string,
  description: string,
): Promise<void> {
  const row = programRow(page, name);
  await expect(row).toBeVisible({ timeout: 30_000 });
  await expect(row).toContainText(name);
  await expect(row).toContainText(description);
}

async function assertEmptyStateVisible(page: Page): Promise<void> {
  await expect(page.getByRole('table')).toHaveCount(0);
  await expect(emptyStateMessage(page)).toBeVisible();
  await expect(createFirstProgramPrompt(page)).toBeVisible();
}

async function assertEmptyStateHidden(page: Page): Promise<void> {
  await expect(emptyStateMessage(page)).toHaveCount(0);
  await expect(createFirstProgramPrompt(page)).toHaveCount(0);
}

async function countVisibleProgramRows(page: Page): Promise<number> {
  const table = page.getByRole('table');
  if (!(await table.isVisible().catch(() => false))) {
    return 0;
  }
  return table.locator('tbody tr').count();
}

test.describe('Didaxis Studio — program list display', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('TC-002: Empty state message and create-first-program prompt are shown when no programs exist', async ({
    page,
  }) => {
    const headers = await captureApiHeaders(page);
    await ensureNoProgramsViaApi(page, headers);

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Programs', level: 2 })).toBeVisible();

    expect(await countVisibleProgramRows(page)).toBe(0);
    await assertEmptyStateVisible(page);
  });

  test('TC-005: Programs page does not show stale empty state after programs are created', async ({
    page,
  }) => {
    const headers = await captureApiHeaders(page);
    await ensureNoProgramsViaApi(page, headers);

    await page.reload();
    await assertEmptyStateVisible(page);

    const programName = uniqueName('Operations Excellence');
    const description = 'Process optimization and continuous improvement';
    await createProgramViaApi(page, headers, programName, description);

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Programs', level: 2 })).toBeVisible();
    await assertEmptyStateHidden(page);
    await assertProgramVisible(page, programName, description);
  });

  test('TC-006: Programs page displays correctly when exactly one program exists', async ({
    page,
  }) => {
    const headers = await captureApiHeaders(page);
    await ensureNoProgramsViaApi(page, headers);

    const programName = uniqueName('Finance Basics');
    const description = 'Core financial literacy for non-finance roles';
    await createProgramViaApi(page, headers, programName, description);

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Programs', level: 2 })).toBeVisible();

    expect((await listProgramsViaApi(page, headers)).length).toBe(1);
    expect(await countVisibleProgramRows(page)).toBe(1);
    await assertProgramVisible(page, programName, description);
    await assertEmptyStateHidden(page);
  });

  test('TC-009: Programs page transitions correctly from populated list to empty state when all programs are removed', async ({
    page,
  }) => {
    const headers = await captureApiHeaders(page);
    await ensureNoProgramsViaApi(page, headers);

    const programs = [
      {
        name: uniqueName('Engineering Onboarding'),
        description: 'Orientation for new engineers',
      },
      {
        name: uniqueName('Product Fundamentals'),
        description: 'Product lifecycle and discovery basics',
      },
      {
        name: uniqueName('Support Essentials'),
        description: 'Support workflows and tooling',
      },
    ];

    const created = await Promise.all(
      programs.map((program) =>
        createProgramViaApi(page, headers, program.name, program.description),
      ),
    );

    await page.reload();
    await expect(page.getByRole('table')).toBeVisible();
    for (const program of programs) {
      await assertProgramVisible(page, program.name, program.description);
    }

    await Promise.all(
      created.map((program) => deleteProgramViaApi(page, headers, program.id)),
    );

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Programs', level: 2 })).toBeVisible();
    expect(await countVisibleProgramRows(page)).toBe(0);
    await assertEmptyStateVisible(page);
  });

  test('TC-001: Programs page displays list of existing programs with name and description', async ({
    page,
  }) => {
    await gotoProgramsPage(page);

    const leadershipName = uniqueName('Leadership 101');
    const salesName = uniqueName('Sales Onboarding');
    const leadershipDescription = 'Foundational leadership training for new managers';
    const salesDescription = 'Ramp-up curriculum for new sales representatives';

    await createProgramViaUi(page, leadershipName, leadershipDescription);
    await createProgramViaUi(page, salesName, salesDescription);

    await expect(page.getByRole('table')).toBeVisible();
    await assertProgramVisible(page, leadershipName, leadershipDescription);
    await assertProgramVisible(page, salesName, salesDescription);
  });

  test('TC-003: Programs page does not show empty-state message when at least one program exists', async ({
    page,
  }) => {
    await gotoProgramsPage(page);

    const programName = uniqueName('Customer Success Bootcamp');
    const description = 'Training for new customer success managers';

    await createProgramViaUi(page, programName, description);

    await expect(page.getByRole('table')).toBeVisible();
    await assertProgramVisible(page, programName, description);
    await assertEmptyStateHidden(page);
  });

  test('TC-004: Programs page does not hide valid program details when list is populated', async ({
    page,
  }) => {
    await gotoProgramsPage(page);

    const dataFoundations = uniqueName('Data Foundations');
    const complianceAnnual = uniqueName('Compliance Annual');
    const dataDescription = 'Intro to business data and KPIs';
    const complianceDescription = 'Mandatory annual compliance review';

    await createProgramViaUi(page, dataFoundations, dataDescription);
    await createProgramViaUi(page, complianceAnnual, complianceDescription);

    for (const [name, description] of [
      [dataFoundations, dataDescription],
      [complianceAnnual, complianceDescription],
    ] as const) {
      const row = programRow(page, name);
      await expect(row).toBeVisible();
      await expect(row.getByText(name, { exact: true })).toBeVisible();
      await expect(row.getByText(description, { exact: true })).toBeVisible();
    }
  });

  test('TC-007: Programs page displays complete list when a typical multi-item dataset exists', async ({
    page,
  }) => {
    const tag = uniqueTag();
    const headers = await captureApiHeaders(page);
    await ensureNoProgramsViaApi(page, headers);

    const programs = Array.from({ length: 25 }, (_, index) => {
      const number = String(index + 1).padStart(2, '0');
      return {
        name: `Program ${number} ${tag}`,
        description: `Description for Program ${number} ${tag}`,
      };
    });

    await createProgramsBulkViaApi(page, headers, programs);
    expect((await listProgramsViaApi(page, headers)).length).toBe(25);

    await page.reload();
    await expect(page.getByRole('table')).toBeVisible();

    for (const sample of ['01', '13', '25']) {
      await assertProgramVisible(
        page,
        `Program ${sample} ${tag}`,
        `Description for Program ${sample} ${tag}`,
      );
    }
    await assertEmptyStateHidden(page);
  });

  test('TC-008: Programs page remains usable and accurate with a large program list', async ({
    page,
  }) => {
    test.setTimeout(300_000);

    const tag = uniqueTag();
    const headers = await captureApiHeaders(page);
    await ensureNoProgramsViaApi(page, headers);

    const programs = Array.from({ length: 500 }, (_, index) => {
      const number = String(index + 1).padStart(3, '0');
      return {
        name: `Program ${number} ${tag}`,
        description: `Description for Program ${number} ${tag}`,
      };
    });

    await createProgramsBulkViaApi(page, headers, programs);
    const apiPrograms = await listProgramsViaApi(page, headers);
    expect(apiPrograms.length).toBe(500);

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Programs', level: 2 })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();

    for (const sample of ['001', '250', '500']) {
      const name = `Program ${sample} ${tag}`;
      const description = `Description for Program ${sample} ${tag}`;
      const row = programRow(page, name);
      await row.scrollIntoViewIfNeeded();
      await assertProgramVisible(page, name, description);
    }

    await assertEmptyStateHidden(page);
    await expect(page.getByRole('alert').filter({ hasText: /error|failed|crash/i })).toHaveCount(0);
  });
});
