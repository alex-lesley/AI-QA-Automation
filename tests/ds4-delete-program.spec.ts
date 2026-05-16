import { test, expect, type Locator, type Page } from '@playwright/test';

const EMAIL_PLACEHOLDER = '<EMAIL>';
const PASSWORD_PLACEHOLDER = '<PASSWORD>';

const baseUrl = process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio';
const loginUrl = `${baseUrl}/login`;
const programsUrl = `${baseUrl}/programs`;

const BASELINE_DESCRIPTION = 'Program created for delete confirmation tests';

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

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function newProgramDialog(page: Page) {
  return page.getByRole('dialog', { name: 'New Program' });
}

function programRow(page: Page, programName: string) {
  return page.getByRole('row').filter({
    has: page.getByText(programName, { exact: true }),
  });
}

function deleteButtonForProgram(page: Page, programName: string) {
  return programRow(page, programName)
    .getByRole('button')
    .filter({ hasText: '🗑' })
    .first();
}

function editButtonForProgram(page: Page, programName: string) {
  return programRow(page, programName).getByRole('button').filter({ hasText: '✏️' }).first();
}

function createFormFields(dialog: Locator) {
  return {
    programName: dialog.getByRole('textbox', { name: 'Program Name' }),
    description: dialog.getByRole('textbox', { name: 'Description' }),
    create: dialog.getByRole('button', { name: 'Create' }),
  };
}

/** Native confirm shown when deleting from the programs list. */
function expectedDeleteMessagePattern(programName: string): RegExp {
  const escaped = escapeRegExp(programName);
  return new RegExp(
    `Delete program ["']${escaped}["']\\?.*cannot be undone`,
    'is',
  );
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

async function createProgram(
  page: Page,
  name: string,
  description: string = BASELINE_DESCRIPTION,
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

async function assertNoDeleteError(page: Page): Promise<void> {
  await expect(
    page.getByRole('alert').filter({ hasText: /error|failed|unable/i }),
  ).toHaveCount(0);
}

async function handleDeleteDialog(
  page: Page,
  programName: string,
  action: 'accept' | 'dismiss',
): Promise<string> {
  let message = '';
  await Promise.all([
    page.waitForEvent('dialog').then(async (dialog) => {
      message = dialog.message();
      expect(dialog.type()).toBe('confirm');
      expect(message).toMatch(expectedDeleteMessagePattern(programName));
      if (action === 'accept') {
        await dialog.accept();
      } else {
        await dialog.dismiss();
      }
    }),
    deleteButtonForProgram(page, programName).click(),
  ]);
  return message;
}

async function confirmDelete(page: Page, programName: string): Promise<string> {
  const message = await handleDeleteDialog(page, programName, 'accept');
  await expect(programRow(page, programName)).toHaveCount(0, { timeout: 15_000 });
  return message;
}

async function cancelDelete(page: Page, programName: string): Promise<string> {
  const message = await handleDeleteDialog(page, programName, 'dismiss');
  await expect(programRow(page, programName)).toBeVisible();
  return message;
}

test.describe('Didaxis Studio — delete program with confirmation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await gotoProgramsPage(page);
  });

  test('TC-001: Deleting Test Program after confirmation removes it from the program list', async ({
    page,
  }) => {
    const testProgram = uniqueName('Test Program');
    const otherProgram = uniqueName('Retention Pilot 2026');
    await createProgram(page, testProgram);
    await createProgram(page, otherProgram);

    const message = await confirmDelete(page, testProgram);

    expect(message).toMatch(expectedDeleteMessagePattern(testProgram));
    await expect(programRow(page, testProgram)).toHaveCount(0);
    await expect(programRow(page, otherProgram)).toBeVisible();
    await assertNoDeleteError(page);
  });

  test('TC-002: Canceling deletion leaves Test Program in the program list', async ({ page }) => {
    const testProgram = uniqueName('Test Program');
    await createProgram(page, testProgram);

    const message = await cancelDelete(page, testProgram);

    expect(message).toMatch(expectedDeleteMessagePattern(testProgram));
    await expect(programRow(page, testProgram)).toBeVisible();
    await expect(
      page.getByText(/deleted successfully|program deleted/i),
    ).toHaveCount(0);
  });

  test('TC-003: Confirmation dialog shows the correct program name when several programs exist', async ({
    page,
  }) => {
    const testProgram = uniqueName('Test Program');
    const alphaSchedule = uniqueName('Alpha Schedule');
    const betaSchedule = uniqueName('Beta Schedule');
    await createProgram(page, testProgram);
    await createProgram(page, alphaSchedule);
    await createProgram(page, betaSchedule);

    const message = await handleDeleteDialog(page, alphaSchedule, 'dismiss');

    expect(message).toMatch(expectedDeleteMessagePattern(alphaSchedule));
    expect(message).not.toContain(testProgram);
    expect(message).not.toContain(betaSchedule);
    await expect(programRow(page, alphaSchedule)).toBeVisible();
  });

  test('TC-004: Program is not removed when the user only opens the dialog and does not confirm', async ({
    page,
  }) => {
    const testProgram = uniqueName('Test Program');
    await createProgram(page, testProgram);

    await cancelDelete(page, testProgram);
    await expect(programRow(page, testProgram)).toBeVisible();

    await page.reload();
    await gotoProgramsPage(page);

    await expect(programRow(page, testProgram)).toBeVisible();
    await expect(programRow(page, testProgram)).toHaveCount(1);
  });

  test('TC-005: Deleting Test Program does not remove a different program from the list', async ({
    page,
  }) => {
    const testProgram = uniqueName('Test Program');
    const retentionPilot = uniqueName('Retention Pilot 2026');
    await createProgram(page, testProgram);
    await createProgram(page, retentionPilot);

    const message = await confirmDelete(page, testProgram);

    expect(message).toMatch(expectedDeleteMessagePattern(testProgram));
    await expect(programRow(page, testProgram)).toHaveCount(0);
    await expect(programRow(page, retentionPilot)).toBeVisible();
  });

  test('TC-006: No duplicate or silent delete occurs when Confirm is clicked once', async ({
    page,
  }) => {
    const testProgram = uniqueName('Test Program');
    const sibling = uniqueName('Sibling Program');
    await createProgram(page, testProgram);
    await createProgram(page, sibling);

    let dialogOpens = 0;

    await Promise.all([
      deleteButtonForProgram(page, testProgram).click(),
      page.waitForEvent('dialog').then(async (d) => {
        dialogOpens += 1;
        expect(d.type()).toBe('confirm');
        await d.accept();
      }),
    ]);
    await expect(programRow(page, testProgram)).toHaveCount(0, { timeout: 15_000 });
    await expect(programRow(page, testProgram)).toHaveCount(0);
    expect(dialogOpens).toBe(1);
    await expect(programRow(page, sibling)).toBeVisible();
    await expect(programRow(page, sibling)).toHaveCount(1);
  });

  test('TC-007: Cancel does not partially delete or mark the program as deleted in the UI', async ({
    page,
  }) => {
    const testProgram = uniqueName('Test Program');
    await createProgram(page, testProgram);

    await cancelDelete(page, testProgram);
    await expect(programRow(page, testProgram)).toBeVisible();

    await editButtonForProgram(page, testProgram).click();
    const editDialog = page.getByRole('dialog', { name: 'Edit Program' });
    await expect(editDialog).toBeVisible();
    await expect(editDialog.getByRole('textbox', { name: 'Program Name' })).toHaveValue(
      testProgram,
    );
    await editDialog.getByRole('button', { name: 'Cancel' }).click();
  });

  test('TC-008: Dialog message remains correct for a long program name', async ({ page }) => {
    const longName = uniqueName(
      'North Region Holiday Overtime Program Q1-Q2 2026 Extended Pilot',
    );
    await createProgram(page, longName);

    const message = await handleDeleteDialog(page, longName, 'dismiss');

    expect(message).toMatch(expectedDeleteMessagePattern(longName));
    expect(message).toContain(longName);
    await expect(programRow(page, longName)).toBeVisible();
  });

  test('TC-009: Program name with special characters appears verbatim in the dialog', async ({
    page,
  }) => {
    const specialName = uniqueName('Test Program & Co. (2026) – #1');
    await createProgram(page, specialName);

    const message = await handleDeleteDialog(page, specialName, 'dismiss');

    expect(message).toContain(specialName);
    expect(message).toMatch(expectedDeleteMessagePattern(specialName));
  });

  test('TC-010: Only one confirmation dialog opens per delete icon click', async ({ page }) => {
    const testProgram = uniqueName('Test Program');
    await createProgram(page, testProgram);

    let dialogCount = 0;
    await Promise.all([
      deleteButtonForProgram(page, testProgram).click(),
      page.waitForEvent('dialog').then(async (dialog) => {
        dialogCount += 1;
        await dialog.dismiss();
      }),
    ]);
    await page.waitForTimeout(300);

    expect(dialogCount).toBe(1);
    await expect(programRow(page, testProgram)).toBeVisible();
    page.removeAllListeners('dialog');
  });

  test('TC-011: Program remains when delete dialog is dismissed before returning to the list', async ({
    page,
  }) => {
    const testProgram = uniqueName('Test Program');
    await createProgram(page, testProgram);

    await handleDeleteDialog(page, testProgram, 'dismiss');

    await page.goto(`${baseUrl}/`);
    await gotoProgramsPage(page);

    await expect(programRow(page, testProgram)).toBeVisible();
    await expect(programRow(page, testProgram)).toHaveCount(1);
  });
});
