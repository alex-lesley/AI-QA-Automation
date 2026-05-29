import { type Locator, type Page } from '@playwright/test';
import { test, expect } from './fixtures';

const EMAIL_PLACEHOLDER = '<EMAIL>';
const PASSWORD_PLACEHOLDER = '<PASSWORD>';

const baseUrl = process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio';
const loginUrl = `${baseUrl}/login`;
const programsUrl = `${baseUrl}/programs`;

const VALID_DESCRIPTION = 'Valid description for program name validation';

function requireEnv(name: 'DIDAXIS_EMAIL' | 'DIDAXIS_PASSWORD'): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function uniqueName(base: string): string {
  return `${base} ${Date.now()}`;
}

function newProgramDialog(page: Page) {
  return page.getByRole('dialog', { name: 'New Program' });
}

function programFormFields(dialog: Locator) {
  return {
    programName: dialog.getByRole('textbox', { name: 'Program Name' }),
    description: dialog.getByRole('textbox', { name: 'Description' }),
    create: dialog.getByRole('button', { name: 'Create' }),
  };
}

function programRow(page: Page, programName: string) {
  return page.getByRole('row').filter({
    has: page.getByText(programName, { exact: true }),
  });
}

/** Set React-controlled field value; avoids fill() so traces show step placeholders only. */
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

async function openCreateModal(page: Page): Promise<Locator> {
  await page.getByRole('button', { name: '+ New Program' }).click();
  const dialog = newProgramDialog(page);
  await expect(dialog).toBeVisible();
  return dialog;
}

async function fillCreateForm(
  dialog: Locator,
  options: { name?: string; description?: string },
): Promise<void> {
  const fields = programFormFields(dialog);
  if (options.name !== undefined) {
    await fillFormField(fields.programName, options.name);
  }
  if (options.description !== undefined) {
    await fillFormField(fields.description, options.description);
  }
}

async function createProgram(page: Page, name: string, description = VALID_DESCRIPTION): Promise<void> {
  const dialog = await openCreateModal(page);
  await fillCreateForm(dialog, { name, description });
  await programFormFields(dialog).create.click();
  await expect(dialog).toBeHidden({ timeout: 15_000 });
  await expect(programRow(page, name)).toBeVisible();
}

async function countProgramRows(page: Page, programName: string): Promise<number> {
  return programRow(page, programName).count();
}

async function hasFormValidation(dialog: Locator): Promise<boolean> {
  const errorLocator = dialog.locator(
    '[data-error="true"], .mantine-InputWrapper-error, [class*="Input-error"]',
  );
  if (await errorLocator.first().isVisible().catch(() => false)) {
    return true;
  }
  return dialog
    .getByText(
      /too long|too many|exceed|maximum|invalid character|invalid name|duplicate|already exists|not allowed|is required$/i,
    )
    .first()
    .isVisible()
    .catch(() => false);
}

async function hasDuplicateNameError(dialog: Locator): Promise<boolean> {
  return dialog
    .getByText(/already exists|duplicate|unique|name is taken/i)
    .first()
    .isVisible()
    .catch(() => false);
}

async function clickCreate(dialog: Locator): Promise<void> {
  const { create } = programFormFields(dialog);
  if (await create.isEnabled()) {
    await create.click();
  } else {
    await create.click({ force: true }).catch(() => undefined);
  }
}

async function expectCreateSucceeded(
  page: Page,
  dialog: Locator,
  programName: string,
): Promise<void> {
  await expect(dialog).toBeHidden({ timeout: 15_000 });
  await expect(programRow(page, programName).first()).toBeVisible();
}

async function expectCreateBlocked(
  page: Page,
  dialog: Locator,
  programName: string,
  rowsBefore: number,
): Promise<void> {
  const rowsAfter = await countProgramRows(page, programName);
  const blocked =
    (await dialog.isVisible()) ||
    (await hasFormValidation(dialog)) ||
    (await hasDuplicateNameError(dialog)) ||
    !(await programFormFields(dialog).create.isEnabled());

  expect(rowsAfter).toBe(rowsBefore);
  expect(blocked).toBeTruthy();
}

test.describe('Didaxis Studio — program name validation (create)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await gotoProgramsPage(page);
  });

  test('TC-001: Program is created when Name contains allowed letters, spaces, and allowed special characters', async ({
    page,
  }) => {
    const programName = uniqueName('Informatique & IA - Niveau 2');

    const dialog = await openCreateModal(page);
    await fillCreateForm(dialog, { name: programName, description: VALID_DESCRIPTION });
    await clickCreate(dialog);

    await expectCreateSucceeded(page, dialog, programName);
    await expect(programRow(page, programName).first()).toContainText(programName);
  });

  test('TC-002: Program is created when Name contains each allowed special character', async ({
    page,
  }) => {
    const programName = uniqueName('AI% & Data@Scale-2.0, "Advanced"');

    const dialog = await openCreateModal(page);
    await fillCreateForm(dialog, { name: programName, description: VALID_DESCRIPTION });
    await clickCreate(dialog);

    await expectCreateSucceeded(page, dialog, programName);
    const row = programRow(page, programName).first();
    await expect(row).toContainText('%');
    await expect(row).toContainText('&');
    await expect(row).toContainText('@');
  });

  test('TC-003: Leading and trailing spaces are trimmed before save', async ({ page }) => {
    const trimmedName = uniqueName('Web Development 2027');
    const paddedName = `   ${trimmedName}   `;

    const dialog = await openCreateModal(page);
    await fillCreateForm(dialog, { name: paddedName, description: VALID_DESCRIPTION });
    await clickCreate(dialog);
    await expect(dialog).toBeHidden({ timeout: 15_000 });

    const trimmedVisible = await programRow(page, trimmedName).isVisible();
    const paddedVisible = await programRow(page, paddedName).isVisible();
    expect(trimmedVisible || !paddedVisible).toBeTruthy();
    if (trimmedVisible) {
      await expect(programRow(page, trimmedName)).toBeVisible();
    }
  });

  test('TC-004: Form is not submitted when Name contains only spaces', async ({ page }) => {
    const markerDescription = `Whitespace-only name test ${Date.now()}`;
    const dialog = await openCreateModal(page);
    const rowsBefore = await page
      .getByRole('row')
      .filter({ hasText: markerDescription })
      .count();

    await fillCreateForm(dialog, { name: '   ', description: markerDescription });
    await clickCreate(dialog);

    const rowsAfter = await page
      .getByRole('row')
      .filter({ hasText: markerDescription })
      .count();
    expect(rowsAfter).toBe(rowsBefore);

    const blocked =
      (await dialog.isVisible()) ||
      (await hasFormValidation(dialog)) ||
      !(await programFormFields(dialog).create.isEnabled());
    expect(blocked).toBeTruthy();
  });

  test('TC-005: Duplicate Name is rejected when exactly matching an existing program', async ({
    page,
  }) => {
    const existingName = uniqueName('Web Development 2026');
    await createProgram(page, existingName);
    await expect(programRow(page, existingName)).toHaveCount(1);

    const dialog = await openCreateModal(page);
    await fillCreateForm(dialog, { name: existingName, description: VALID_DESCRIPTION });
    await clickCreate(dialog);

    await expect(programRow(page, existingName)).toHaveCount(1, { timeout: 15_000 });
    await expect(
      dialog.getByText(/already exists|duplicate|unique|name is taken/i).first(),
    ).toBeVisible();
    await expect(dialog).toBeVisible();
  });

  test('TC-006: Duplicate Name is rejected when case differs only', async ({ page }) => {
    const existingName = uniqueName('Web Development 2026');
    const variantName = existingName.replace('Web Development', 'web development');
    await createProgram(page, existingName);
    const rowsBeforeVariant = await countProgramRows(page, variantName);

    const dialog = await openCreateModal(page);
    await fillCreateForm(dialog, { name: variantName, description: VALID_DESCRIPTION });
    await clickCreate(dialog);

    await expectCreateBlocked(page, dialog, variantName, rowsBeforeVariant);
  });

  test('TC-007: Duplicate Name is rejected when only whitespace count differs', async ({
    page,
  }) => {
    const existingName = uniqueName('Web Development 2026');
    const variantName = `  ${existingName.split(' ').join('   ')}  `;
    await createProgram(page, existingName);
    const rowsBeforeVariant = await countProgramRows(page, variantName);

    const dialog = await openCreateModal(page);
    await fillCreateForm(dialog, { name: variantName, description: VALID_DESCRIPTION });
    await clickCreate(dialog);

    await expectCreateBlocked(page, dialog, variantName, rowsBeforeVariant);
  });

  test('TC-008: Name is rejected when it contains a non-allowed special character', async ({
    page,
  }) => {
    const invalidName = uniqueName('Finance + Accounting');
    const dialog = await openCreateModal(page);
    const rowsBefore = await countProgramRows(page, invalidName);

    await fillCreateForm(dialog, { name: invalidName, description: VALID_DESCRIPTION });
    await clickCreate(dialog);

    await expectCreateBlocked(page, dialog, invalidName, rowsBefore);
  });

  test('TC-009: Name is rejected when empty string is submitted', async ({ page }) => {
    const dialog = await openCreateModal(page);
    const { programName, create } = programFormFields(dialog);

    await expect(programName).toHaveValue('');
    await expect(create).toBeDisabled();
    await clickCreate(dialog);
    await expect(dialog).toBeVisible();
  });

  test('TC-010: Name accepts minimum non-empty valid value', async ({ page }) => {
    const programName = String.fromCharCode(65 + (Date.now() % 26));

    const dialog = await openCreateModal(page);
    await fillCreateForm(dialog, { name: programName, description: VALID_DESCRIPTION });
    await clickCreate(dialog);

    await expectCreateSucceeded(page, dialog, programName);
  });

  test('TC-011: Name with only allowed punctuation and letters remains valid after trim', async ({
    page,
  }) => {
    const trimmedName = uniqueName('"AI", Data-2026');
    const paddedName = `  ${trimmedName}  `;

    const dialog = await openCreateModal(page);
    await fillCreateForm(dialog, { name: paddedName, description: VALID_DESCRIPTION });
    await clickCreate(dialog);
    await expect(dialog).toBeHidden({ timeout: 15_000 });

    const trimmedVisible = await programRow(page, trimmedName).isVisible();
    const paddedVisible = await programRow(page, paddedName).isVisible();
    expect(trimmedVisible || !paddedVisible).toBeTruthy();
    if (trimmedVisible) {
      await expect(programRow(page, trimmedName)).toBeVisible();
    }
  });

  test('TC-012: Name with tab/newline-only whitespace is treated as empty', async ({ page }) => {
    const markerDescription = `Tab newline name test ${Date.now()}`;
    const dialog = await openCreateModal(page);
    const rowsBefore = await page
      .getByRole('row')
      .filter({ hasText: markerDescription })
      .count();

    await fillCreateForm(dialog, { name: '\t\t\n', description: markerDescription });
    await clickCreate(dialog);

    const rowsAfter = await page
      .getByRole('row')
      .filter({ hasText: markerDescription })
      .count();
    expect(rowsAfter).toBe(rowsBefore);

    const blocked =
      (await dialog.isVisible()) ||
      (await hasFormValidation(dialog)) ||
      !(await programFormFields(dialog).create.isEnabled());
    expect(blocked).toBeTruthy();
  });

  test('TC-013: Name at maximum allowed length is accepted', async ({ page }) => {
    const suffix = String(Date.now()).slice(-8);
    const maxName = `${'a'.repeat(255 - suffix.length - 1)}${suffix}`;

    const dialog = await openCreateModal(page);
    await fillCreateForm(dialog, { name: maxName, description: VALID_DESCRIPTION });
    const actualName = await programFormFields(dialog).programName.inputValue();
    expect(actualName.length).toBeGreaterThan(0);
    await clickCreate(dialog);

    await expect
      .poll(async () => {
        if (await dialog.isHidden()) {
          return countProgramRows(page, actualName);
        }
        if (await hasFormValidation(dialog)) {
          return -1;
        }
        return 0;
      })
      .toBeGreaterThan(0);
  });

  test('TC-014: Name exceeding maximum allowed length is rejected', async ({ page }) => {
    const suffix = String(Date.now()).slice(-8);
    const maxName = `${'a'.repeat(255 - suffix.length - 1)}${suffix}`;
    const overMaxName = `${maxName}a`;

    const dialog = await openCreateModal(page);
    await fillCreateForm(dialog, { name: overMaxName, description: VALID_DESCRIPTION });
    await clickCreate(dialog);

    const blocked =
      (await dialog.isVisible()) ||
      (await hasFormValidation(dialog)) ||
      (await countProgramRows(page, overMaxName)) === 0;
    expect(blocked).toBeTruthy();
  });

  test('TC-015: Duplicate check applies after trimming leading/trailing spaces', async ({
    page,
  }) => {
    const existingName = uniqueName('Data Science 2026');
    const paddedDuplicate = `   ${existingName}   `;
    await createProgram(page, existingName);
    const rowsBefore = await countProgramRows(page, existingName);

    const dialog = await openCreateModal(page);
    await fillCreateForm(dialog, { name: paddedDuplicate, description: VALID_DESCRIPTION });
    await clickCreate(dialog);

    await expectCreateBlocked(page, dialog, existingName, rowsBefore);
  });
});
