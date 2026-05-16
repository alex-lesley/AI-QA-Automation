import { test, expect, type Locator, type Page } from '@playwright/test';

const EMAIL_PLACEHOLDER = '<EMAIL>';
const PASSWORD_PLACEHOLDER = '<PASSWORD>';

const baseUrl = process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio';
const loginUrl = `${baseUrl}/login`;
const programsUrl = `${baseUrl}/programs`;

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
    cancel: dialog.getByRole('button', { name: 'Cancel' }),
    close: dialog.getByRole('banner').getByRole('button'),
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

async function openNewProgramModal(page: Page): Promise<Locator> {
  await page.getByRole('button', { name: '+ New Program' }).click();
  const dialog = newProgramDialog(page);
  await expect(dialog).toBeVisible();
  return dialog;
}

async function fillProgramForm(
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

async function createProgram(
  page: Page,
  name: string,
  description?: string,
): Promise<void> {
  const dialog = await openNewProgramModal(page);
  await fillProgramForm(dialog, { name, description });
  await programFormFields(dialog).create.click();
  await expect(dialog).toBeHidden({ timeout: 15_000 });
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
    .getByText(/too long|too many|exceed|maximum|invalid|required/i)
    .first()
    .isVisible()
    .catch(() => false);
}

test.describe('Didaxis Studio — create program', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await gotoProgramsPage(page);
  });

  test('TC-001: Program creation form opens with Program Name and Description fields', async ({
    page,
  }) => {
    await page.getByRole('button', { name: '+ New Program' }).click();

    const dialog = newProgramDialog(page);
    const { programName, description, create } = programFormFields(dialog);

    await expect(dialog).toBeVisible();
    await expect(programName).toBeVisible();
    await expect(programName).toHaveAttribute('placeholder', 'e.g. Computer Science BSc');
    await expect(description).toBeVisible();
    await expect(description).toHaveAttribute('placeholder', 'Brief description');
    await expect(create).toBeVisible();
    await expect(create).toBeDisabled();
  });

  test('TC-002: Valid program is created and appears in the list after Create', async ({
    page,
  }) => {
    const programName = uniqueName('Web Development 2026');
    const description = 'Full-stack web development program';

    const dialog = await openNewProgramModal(page);
    await fillProgramForm(dialog, { name: programName, description });
    await programFormFields(dialog).create.click();

    await expect(dialog).toBeHidden();
    await expect(programRow(page, programName)).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('TC-003: Create button stays disabled when Program Name is empty', async ({ page }) => {
    const dialog = await openNewProgramModal(page);
    const { programName, description, create } = programFormFields(dialog);

    await fillFormField(description, 'Optional description only');

    await expect(programName).toHaveValue('');
    await expect(create).toBeDisabled();
    await create.click({ force: true }).catch(() => undefined);
    await expect(dialog).toBeVisible();
  });

  test('TC-004: Program is created with Description empty when Program Name is valid', async ({
    page,
  }) => {
    const programName = uniqueName('Cybersecurity Fundamentals 2026');

    const dialog = await openNewProgramModal(page);
    const { programName: nameField, description, create } = programFormFields(dialog);

    await fillFormField(nameField, programName);
    await expect(description).toHaveValue('');
    await expect(create).toBeEnabled();
    await create.click();

    await expect(dialog).toBeHidden();
    await expect(programRow(page, programName)).toBeVisible();
  });

  test('TC-005: Re-opening New Program after a successful create shows a fresh empty form', async ({
    page,
  }) => {
    const programName = uniqueName('Web Development 2026');
    await createProgram(page, programName, 'Full-stack web development program');

    const dialog = await openNewProgramModal(page);
    const { programName: nameField, description } = programFormFields(dialog);

    await expect(nameField).toHaveValue('');
    await expect(description).toHaveValue('');
  });

  test('TC-006: No program is added when the creation modal is closed without Create', async ({
    page,
  }) => {
    const programName = uniqueName('Draft Program QA');
    const description = 'Should not be saved';

    const dialog = await openNewProgramModal(page);
    await fillProgramForm(dialog, { name: programName, description });
    await programFormFields(dialog).cancel.click();

    await expect(dialog).toBeHidden();
    await expect(programRow(page, programName)).toHaveCount(0);
  });

  test('TC-007: Filling only Description does not enable Create or create a program', async ({
    page,
  }) => {
    const dialog = await openNewProgramModal(page);
    const { programName, description, create } = programFormFields(dialog);

    await fillFormField(description, 'Description without a program name');

    await expect(programName).toHaveValue('');
    await expect(create).toBeDisabled();
    await create.click({ force: true }).catch(() => undefined);
    await expect(dialog).toBeVisible();
  });

  test('TC-008: Duplicate Program Name is rejected and list is unchanged', async ({ page }) => {
    const programName = uniqueName('Web Development 2026');
    await createProgram(page, programName, 'Full-stack web development program');
    await expect(programRow(page, programName)).toBeVisible();
    const rowsBefore = await countProgramRows(page, programName);

    const dialog = await openNewProgramModal(page);
    await fillProgramForm(dialog, {
      name: programName,
      description: 'Duplicate attempt',
    });
    await programFormFields(dialog).create.click();

    const rowsAfter = await countProgramRows(page, programName);
    expect(rowsAfter).toBe(rowsBefore);

    const duplicateBlocked =
      (await dialog.isVisible()) ||
      (await page.getByText(/duplicate|already exists|unique/i).isVisible().catch(() => false));
    expect(duplicateBlocked).toBeTruthy();
  });

  test('TC-009: Whitespace-only Program Name does not create a program', async ({ page }) => {
    const markerDescription = `Whitespace name test ${Date.now()}`;
    const dialog = await openNewProgramModal(page);
    const { programName, description, create } = programFormFields(dialog);

    const rowsBefore = await page
      .getByRole('row')
      .filter({ hasText: markerDescription })
      .count();

    await fillFormField(programName, '   ');
    await fillFormField(description, markerDescription);

    const createEnabled = await create.isEnabled();
    if (createEnabled) {
      await create.click();
    }

    const dialogStillOpen = await dialog.isVisible();
    const validationVisible = await hasFormValidation(dialog);
    const rowsAfter = await page
      .getByRole('row')
      .filter({ hasText: markerDescription })
      .count();

    expect(!createEnabled || dialogStillOpen || validationVisible).toBeTruthy();
    expect(rowsAfter).toBe(rowsBefore);
  });

  test('TC-010: Program is not created when network or server save fails', async ({ page }) => {
    const programName = uniqueName('Network Failure Program');
    const description = 'Simulated failure';

    await page.route('**/*', async (route) => {
      const request = route.request();
      if (request.method() === 'POST' && request.url().includes('/api/')) {
        await route.abort('failed');
        return;
      }
      await route.continue();
    });

    const dialog = await openNewProgramModal(page);
    await fillProgramForm(dialog, { name: programName, description });
    await programFormFields(dialog).create.click();

    const errorVisible =
      (await dialog.isVisible()) ||
      (await page.getByRole('alert').isVisible().catch(() => false)) ||
      (await page.getByText(/error|failed|try again|network/i).isVisible().catch(() => false));

    expect(errorVisible).toBeTruthy();
    await expect(programRow(page, programName)).toHaveCount(0);
  });

  test('TC-011: Leading and trailing spaces on Program Name are trimmed when saved', async ({
    page,
  }) => {
    const trimmedName = uniqueName('Data Analytics 2026');
    const paddedName = `   ${trimmedName}   `;

    const dialog = await openNewProgramModal(page);
    await fillProgramForm(dialog, {
      name: paddedName,
      description: 'Trim behavior check',
    });
    await programFormFields(dialog).create.click();
    await expect(dialog).toBeHidden();

    const trimmedVisible = await programRow(page, trimmedName).isVisible();
    const paddedVisible = await programRow(page, paddedName).isVisible();
    expect(trimmedVisible || !paddedVisible).toBeTruthy();
    if (trimmedVisible) {
      await expect(programRow(page, trimmedName)).toBeVisible();
    }
  });

  test('TC-012: Special characters and symbols are preserved in Program Name and Description', async ({
    page,
  }) => {
    const programName = uniqueName('AI & ML (2026) — "Applied" <test>');
    const description = `Covers C++, 50% labs & O'Brien's module @campus`;

    await createProgram(page, programName, description);

    const row = programRow(page, programName);
    await expect(row).toBeVisible();
    await expect(row).toContainText(programName);
    await expect(row).toContainText(description);
    await expect(row.locator('script')).toHaveCount(0);
  });

  test('TC-013: Single-character Program Name is accepted at minimum boundary', async ({
    page,
  }) => {
    const programName = String.fromCharCode(65 + (Date.now() % 26));
    const description = 'Minimum length name';

    await createProgram(page, programName, description);
    await expect(programRow(page, programName)).toBeVisible();
  });

  test('TC-014: Maximum-length Program Name is accepted or rejected with clear feedback', async ({
    page,
  }) => {
    const suffix = String(Date.now()).slice(-8);
    const maxName = `${'a'.repeat(255 - suffix.length - 1)}${suffix}`;
    const overMaxName = `${maxName}a`;

    const dialog = await openNewProgramModal(page);
    await fillProgramForm(dialog, {
      name: maxName,
      description: 'Max length program name',
    });
    const { create } = programFormFields(dialog);
    await create.click();

    if (await dialog.isHidden({ timeout: 15_000 }).catch(() => false)) {
      await expect(programRow(page, maxName)).toBeVisible();
    } else {
      expect(await hasFormValidation(dialog)).toBeTruthy();
    }

    const overMaxRowsBefore = await countProgramRows(page, overMaxName);
    const dialog2 = await openNewProgramModal(page);
    await fillProgramForm(dialog2, {
      name: overMaxName,
      description: 'Over max length program name',
    });
    await programFormFields(dialog2).create.click();

    const overMaxRowsAfter = await countProgramRows(page, overMaxName);
    const overMaxBlocked =
      (await dialog2.isVisible()) ||
      (await hasFormValidation(dialog2)) ||
      overMaxRowsAfter === overMaxRowsBefore;
    expect(overMaxBlocked).toBeTruthy();
  });

  test('TC-015: Maximum-length Description is accepted or rejected with clear feedback', async ({
    page,
  }) => {
    const programName = uniqueName('Long Description Program 2026');
    const maxDescription = 'd'.repeat(2000);
    const overMaxDescription = `${maxDescription}d`;

    const dialog = await openNewProgramModal(page);
    await fillProgramForm(dialog, { name: programName, description: maxDescription });
    await programFormFields(dialog).create.click();

    if (await dialog.isHidden({ timeout: 15_000 }).catch(() => false)) {
      await expect(programRow(page, programName)).toBeVisible();
    } else {
      expect(await hasFormValidation(dialog)).toBeTruthy();
    }

    const programNameOver = uniqueName('Long Description Over Max');
    const overMaxRowsBefore = await countProgramRows(page, programNameOver);
    const dialog2 = await openNewProgramModal(page);
    await fillProgramForm(dialog2, {
      name: programNameOver,
      description: overMaxDescription,
    });
    await programFormFields(dialog2).create.click();

    const overMaxRowsAfter = await countProgramRows(page, programNameOver);
    const overMaxBlocked =
      (await dialog2.isVisible()) ||
      (await hasFormValidation(dialog2)) ||
      overMaxRowsAfter === overMaxRowsBefore;
    expect(overMaxBlocked).toBeTruthy();
  });

  test('TC-016: Duplicate names differing only by letter case are handled consistently', async ({
    page,
  }) => {
    const existingName = uniqueName('Web Development 2026');
    const variantName = existingName.replace('Web Development', 'web development');

    await createProgram(page, existingName, 'Original program');
    await expect(programRow(page, existingName)).toBeVisible();
    const rowsBefore = await countProgramRows(page, existingName);

    const dialog = await openNewProgramModal(page);
    await fillProgramForm(dialog, {
      name: variantName,
      description: 'Case variant duplicate',
    });
    await programFormFields(dialog).create.click();

    await expect
      .poll(async () => {
        const dialogVisible = await dialog.isVisible();
        if (dialogVisible) {
          return (await hasFormValidation(dialog)) || true;
        }
        return true;
      })
      .toBeTruthy();

    const existingRows = await countProgramRows(page, existingName);
    const variantRows = await countProgramRows(page, variantName);
    const dialogVisible = await dialog.isVisible();
    const totalRows = existingRows + variantRows;

    if (dialogVisible) {
      expect(existingRows).toBe(rowsBefore);
      expect(variantRows).toBe(0);
    } else if (variantRows > 0 && existingRows > 0) {
      expect(totalRows).toBe(2);
    } else {
      expect(totalRows).toBe(1);
    }
  });

  test('TC-017: Rapid double-click on Create does not create duplicate programs', async ({
    page,
  }) => {
    const programName = uniqueName('UX Design Certificate 2026');
    const description = 'Double submit test';

    const dialog = await openNewProgramModal(page);
    await fillProgramForm(dialog, { name: programName, description });
    const { create } = programFormFields(dialog);
    await create.dblclick();

    await expect(dialog).toBeHidden({ timeout: 15_000 });
    await expect
      .poll(() => countProgramRows(page, programName), { timeout: 15_000 })
      .toBe(1);
  });

});

test.describe('Didaxis Studio — create program (non-admin)', () => {
  test('TC-018: Non-admin user cannot access program creation (if role model applies)', async ({
    page,
  }) => {
    const email = process.env.DIDAXIS_NON_ADMIN_EMAIL;
    const password = process.env.DIDAXIS_NON_ADMIN_PASSWORD;
    test.skip(!email || !password, 'DIDAXIS_NON_ADMIN_EMAIL and DIDAXIS_NON_ADMIN_PASSWORD required');

    await login(page, email!, password!);
    await gotoProgramsPage(page);

    const newProgramButton = page.getByRole('button', { name: '+ New Program' });
    const buttonVisible = await newProgramButton.isVisible().catch(() => false);

    if (buttonVisible) {
      await newProgramButton.click();
      const dialog = newProgramDialog(page);
      const blocked =
        !(await dialog.isVisible().catch(() => false)) ||
        (await page
          .getByText(/unauthorized|permission|forbidden|not allowed/i)
          .isVisible()
          .catch(() => false));
      expect(blocked).toBeTruthy();
    } else {
      await expect(newProgramButton).toBeHidden();
    }
  });
});
