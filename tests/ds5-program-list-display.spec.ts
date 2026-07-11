import { type Page } from '@playwright/test';
import { test, expect } from '../fixtures';
import { baseUrl } from '../support/auth';
import {
  releaseTrackedProgramIds,
  trackCreatedProgramId,
} from '../support/created-program-cleanup';
import { ProgramsPage } from '../pages/programs.page';

function uniqueName(base: string): string {
  return `${base} ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function uniqueTag(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

type ApiProgram = { id: string; name: string; description: string | null };
type ApiHeaders = Record<string, string>;

async function gotoProgramsPage(page: Page): Promise<ProgramsPage> {
  const programs = new ProgramsPage(page);
  await programs.goto();
  await expect(programs.heading).toBeVisible();
  await expect(programs.newProgramButton).toBeVisible();
  return programs;
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
  const program = body.data as ApiProgram;
  trackCreatedProgramId(page, program.id);
  return program;
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
): Promise<ApiProgram[]> {
  const created: ApiProgram[] = [];
  const batchSize = 20;
  for (let index = 0; index < programs.length; index += batchSize) {
    const batch = programs.slice(index, index + batchSize);
    const batchCreated = await Promise.all(
      batch.map((program) =>
        createProgramViaApi(page, headers, program.name, program.description),
      ),
    );
    created.push(...batchCreated);
  }
  return created;
}

async function deleteProgramsBulkViaApi(
  page: Page,
  headers: ApiHeaders,
  programIds: string[],
): Promise<void> {
  const batchSize = 20;
  for (let index = 0; index < programIds.length; index += batchSize) {
    const batch = programIds.slice(index, index + batchSize);
    await Promise.all(batch.map((programId) => deleteProgramViaApi(page, headers, programId)));
  }
}

async function createProgramViaUi(
  page: Page,
  name: string,
  description: string,
): Promise<void> {
  const programs = new ProgramsPage(page);
  const modal = await programs.openNewProgram();
  await modal.fill({ name, description });
  await modal.submitCreate();
  await expect(modal.root).toBeHidden({ timeout: 15_000 });
  await expect(programs.row(name).root).toBeVisible();
}

async function assertProgramVisible(
  programs: ProgramsPage,
  name: string,
  description: string,
): Promise<void> {
  const row = programs.row(name);
  await expect(row.root).toBeVisible({ timeout: 30_000 });
  await expect(row.root).toContainText(name);
  await expect(row.root).toContainText(description);
}

async function assertEmptyStateVisible(programs: ProgramsPage): Promise<void> {
  await expect(programs.table).toHaveCount(0);
  await expect(programs.emptyStateMessage).toBeVisible();
  await expect(programs.createProgramButton).toBeVisible();
}

async function assertEmptyStateHidden(programs: ProgramsPage): Promise<void> {
  await expect(programs.emptyStateMessage).toHaveCount(0);
  await expect(programs.createProgramButton).toHaveCount(0);
}

test.describe('Didaxis Studio — program list display', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await gotoProgramsPage(page);
  });

  test('TC-002: Empty state message and create-first-program prompt are shown when no programs exist', { tag: '@destructive' }, async ({
    page,
  }) => {
    const programs = new ProgramsPage(page);
    const headers = await captureApiHeaders(page);
    await ensureNoProgramsViaApi(page, headers);

    await page.reload();
    await expect(programs.heading).toBeVisible();

    expect(await programs.countVisibleProgramRows()).toBe(0);
    await assertEmptyStateVisible(programs);
  });

  test('TC-005: Programs page does not show stale empty state after programs are created', { tag: '@destructive' }, async ({
    page,
  }) => {
    const programs = new ProgramsPage(page);
    const headers = await captureApiHeaders(page);
    await ensureNoProgramsViaApi(page, headers);

    await page.reload();
    await assertEmptyStateVisible(programs);

    const programName = uniqueName('Operations Excellence');
    const description = 'Process optimization and continuous improvement';
    await createProgramViaApi(page, headers, programName, description);

    await page.reload();
    await expect(programs.heading).toBeVisible();
    await assertEmptyStateHidden(programs);
    await assertProgramVisible(programs, programName, description);
  });

  test('TC-006: Programs page displays correctly when exactly one program exists', { tag: '@destructive' }, async ({
    page,
  }) => {
    const programs = new ProgramsPage(page);
    const headers = await captureApiHeaders(page);
    await ensureNoProgramsViaApi(page, headers);

    const programName = uniqueName('Finance Basics');
    const description = 'Core financial literacy for non-finance roles';
    await createProgramViaApi(page, headers, programName, description);

    await page.reload();
    await expect(programs.heading).toBeVisible();

    expect((await listProgramsViaApi(page, headers)).length).toBe(1);
    expect(await programs.countVisibleProgramRows()).toBe(1);
    await assertProgramVisible(programs, programName, description);
    await assertEmptyStateHidden(programs);
  });

  test('TC-009: Programs page transitions correctly from populated list to empty state when all programs are removed', { tag: '@destructive' }, async ({
    page,
  }) => {
    const programs = new ProgramsPage(page);
    const headers = await captureApiHeaders(page);
    await ensureNoProgramsViaApi(page, headers);

    const programList = [
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
      programList.map((program) =>
        createProgramViaApi(page, headers, program.name, program.description),
      ),
    );

    await page.reload();
    await expect(programs.table).toBeVisible();
    for (const program of programList) {
      await assertProgramVisible(programs, program.name, program.description);
    }

    await Promise.all(
      created.map((program) => deleteProgramViaApi(page, headers, program.id)),
    );
    releaseTrackedProgramIds(
      page,
      created.map((program) => program.id),
    );
    await ensureNoProgramsViaApi(page, headers);

    await page.reload();
    await expect(programs.heading).toBeVisible();
    await expect
      .poll(() => programs.countVisibleProgramRows(), { timeout: 15_000 })
      .toBe(0);
    await assertEmptyStateVisible(programs);
  });

  test('TC-001: Programs page displays list of existing programs with name and description', { tag: '@smoke' }, async ({
    page,
  }) => {
    const programs = await gotoProgramsPage(page);

    const leadershipName = uniqueName('Leadership 101');
    const salesName = uniqueName('Sales Onboarding');
    const leadershipDescription = 'Foundational leadership training for new managers';
    const salesDescription = 'Ramp-up curriculum for new sales representatives';

    await createProgramViaUi(page, leadershipName, leadershipDescription);
    await createProgramViaUi(page, salesName, salesDescription);

    await expect(programs.table).toBeVisible();
    await assertProgramVisible(programs, leadershipName, leadershipDescription);
    await assertProgramVisible(programs, salesName, salesDescription);
  });

  test('TC-003: Programs page does not show empty-state message when at least one program exists', { tag: '@sanity' }, async ({
    page,
  }) => {
    const programs = await gotoProgramsPage(page);

    const programName = uniqueName('Customer Success Bootcamp');
    const description = 'Training for new customer success managers';

    await createProgramViaUi(page, programName, description);

    await expect(programs.table).toBeVisible();
    await assertProgramVisible(programs, programName, description);
    await assertEmptyStateHidden(programs);
  });

  test('TC-004: Programs page does not hide valid program details when list is populated', { tag: '@sanity' }, async ({
    page,
  }) => {
    const programs = await gotoProgramsPage(page);

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
      const row = programs.row(name);
      await expect(row.root).toBeVisible();
      await expect(row.nameText()).toBeVisible();
      await expect(row.textExact(description)).toBeVisible();
    }
  });

  test('TC-007: Programs page displays complete list when a typical multi-item dataset exists', { tag: '@regression' }, async ({
    page,
  }) => {
    const programs = new ProgramsPage(page);
    const tag = uniqueTag();
    const headers = await captureApiHeaders(page);
    await ensureNoProgramsViaApi(page, headers);

    const programList = Array.from({ length: 25 }, (_, index) => {
      const number = String(index + 1).padStart(2, '0');
      return {
        name: `Program ${number} ${tag}`,
        description: `Description for Program ${number} ${tag}`,
      };
    });

    await createProgramsBulkViaApi(page, headers, programList);
    expect((await listProgramsViaApi(page, headers)).length).toBe(25);

    await page.reload();
    await expect(programs.table).toBeVisible();

    for (const sample of ['01', '13', '25']) {
      await assertProgramVisible(
        programs,
        `Program ${sample} ${tag}`,
        `Description for Program ${sample} ${tag}`,
      );
    }
    await assertEmptyStateHidden(programs);
  });

  test('TC-008: Programs page remains usable and accurate with a large program list', { tag: '@regression' }, async ({
    page,
  }) => {
    const largeListSize = 50;
    const programs = new ProgramsPage(page);
    const tag = uniqueTag();
    const headers = await captureApiHeaders(page);
    await ensureNoProgramsViaApi(page, headers);

    const programList = Array.from({ length: largeListSize }, (_, index) => {
      const number = String(index + 1).padStart(3, '0');
      return {
        name: `Program ${number} ${tag}`,
        description: `Description for Program ${number} ${tag}`,
      };
    });

    const created = await createProgramsBulkViaApi(page, headers, programList);
    const apiPrograms = await listProgramsViaApi(page, headers);
    expect(apiPrograms.length).toBe(largeListSize);

    await page.reload();
    await expect(programs.heading).toBeVisible();
    await expect(programs.table).toBeVisible();

    for (const sample of ['001', '025', '050']) {
      const name = `Program ${sample} ${tag}`;
      const description = `Description for Program ${sample} ${tag}`;
      const row = programs.row(name);
      await row.root.scrollIntoViewIfNeeded();
      await assertProgramVisible(programs, name, description);
    }

    await assertEmptyStateHidden(programs);
    await expect(programs.errorAlerts()).toHaveCount(0);

    const createdIds = created.map((program) => program.id);
    await deleteProgramsBulkViaApi(page, headers, createdIds);
    releaseTrackedProgramIds(page, createdIds);
  });
});
