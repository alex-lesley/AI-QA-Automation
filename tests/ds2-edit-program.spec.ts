import { test, expect, type Locator, type Page } from '@playwright/test';

const EMAIL_PLACEHOLDER = '<EMAIL>';
const PASSWORD_PLACEHOLDER = '<PASSWORD>';

const baseUrl = process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio';
const loginUrl = `${baseUrl}/login`;
const programsUrl = `${baseUrl}/programs`;

const BASELINE_DESCRIPTION = 'Full-stack web development bootcamp for 2026 intake';

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

function editProgramDialog(page: Page) {
  return page.getByRole('dialog', { name: 'Edit Program' });
}

function programRow(page: Page, programName: string) {
  return page.getByRole('row').filter({
    has: page.getByText(programName, { exact: true }),
  });
}

function editButtonForProgram(page: Page, programName: string) {
  return programRow(page, programName).getByRole('button', { name: `Edit ${programName}` });
}

function createFormFields(dialog: Locator) {
  return {
    programName: dialog.getByRole('textbox', { name: 'Program Name' }),
    description: dialog.getByRole('textbox', { name: 'Description' }),
    create: dialog.getByRole('button', { name: 'Create' }),
  };
}

function editFormFields(dialog: Locator) {
  return {
    programName: dialog.getByRole('textbox', { name: 'Program Name' }),
    description: dialog.getByRole('textbox', { name: 'Description' }),
    save: dialog.getByRole('button', { name: 'Save' }),
    cancel: dialog.getByRole('button', { name: 'Cancel' }),
    close: dialog.getByRole('banner').getByRole('button'),
  };
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

async function openEditModal(page: Page, programName: string): Promise<Locator> {
  await editButtonForProgram(page, programName).click();
  const dialog = editProgramDialog(page);
  await expect(dialog).toBeVisible();
  return dialog;
}

async function hasFormValidation(dialog: Locator): Promise<boolean> {
  const errorLocator = dialog.locator(
    '[data-error="true"], .mantine-InputWrapper-error, [class*="Input-error"]',
  );
  if (await errorLocator.first().isVisible().catch(() => false)) {
    return true;
  }
  return dialog
    .getByText(/too long|too many|exceed|maximum|invalid|required|duplicate|already exists/i)
    .first()
    .isVisible()
    .catch(() => false);
}

test.describe('Didaxis Studio — edit program', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await gotoProgramsPage(page);
  });

  test('TC-001: Edit form opens with existing program data pre-populated', async ({ page }) => {
    const programName = uniqueName('Web Development 2026');
    await createProgram(page, programName, BASELINE_DESCRIPTION);

    const dialog = await openEditModal(page, programName);
    const { programName: nameField, description } = editFormFields(dialog);

    await expect(nameField).toHaveValue(programName);
    await expect(description).toHaveValue(BASELINE_DESCRIPTION);
    await expect(editFormFields(dialog).save).toBeVisible();
    await expect(editFormFields(dialog).cancel).toBeVisible();
  });

  test('TC-002: Valid name update is saved and reflected immediately in list', async ({ page }) => {
    const programName = uniqueName('Web Development 2026');
    const updatedName = `${programName} - Updated`;
    await createProgram(page, programName, BASELINE_DESCRIPTION);

    const dialog = await openEditModal(page, programName);
    await fillFormField(editFormFields(dialog).programName, updatedName);
    await editFormFields(dialog).save.click();

    await expect(dialog).toBeHidden();
    await expect(programRow(page, updatedName)).toBeVisible();
    await expect(programRow(page, programName)).toHaveCount(0);
  });

  test('TC-003: Editing only Description preserves all other fields', async ({ page }) => {
    const programName = uniqueName('Web Development 2026');
    const updatedDescription =
      'Full-stack web development bootcamp with updated module sequence';
    await createProgram(page, programName, BASELINE_DESCRIPTION);

    const dialog = await openEditModal(page, programName);
    const fields = editFormFields(dialog);
    await fillFormField(fields.description, updatedDescription);
    await expect(fields.programName).toHaveValue(programName);
    await fields.save.click();
    await expect(dialog).toBeHidden();

    const dialog2 = await openEditModal(page, programName);
    const fields2 = editFormFields(dialog2);
    await expect(fields2.description).toHaveValue(updatedDescription);
    await expect(fields2.programName).toHaveValue(programName);
  });

  test('TC-004: Multiple valid field updates save together correctly', async ({ page }) => {
    const programName = uniqueName('Web Development 2026');
    const cohortName = `${programName} - Cohort A`;
    const cohortDescription = 'Cohort A schedule and curriculum';
    await createProgram(page, programName, BASELINE_DESCRIPTION);

    const dialog = await openEditModal(page, programName);
    const fields = editFormFields(dialog);
    await fillFormField(fields.programName, cohortName);
    await fillFormField(fields.description, cohortDescription);
    await fields.save.click();
    await expect(dialog).toBeHidden();

    await expect(programRow(page, cohortName)).toBeVisible();

    const dialog2 = await openEditModal(page, cohortName);
    const fields2 = editFormFields(dialog2);
    await expect(fields2.programName).toHaveValue(cohortName);
    await expect(fields2.description).toHaveValue(cohortDescription);
  });

  test('TC-005: Save is blocked when Name is cleared', async ({ page }) => {
    const programName = uniqueName('Web Development 2026');
    await createProgram(page, programName, BASELINE_DESCRIPTION);

    const dialog = await openEditModal(page, programName);
    const fields = editFormFields(dialog);
    await fillFormField(fields.programName, '');

    await expect(fields.save).toBeDisabled();
    await fields.save.click({ force: true }).catch(() => undefined);
    await expect(dialog).toBeVisible();
    await expect(programRow(page, programName)).toBeVisible();
  });

  test('TC-006: Duplicate program name is rejected', async ({ page }) => {
    const programName = uniqueName('Web Development 2026');
    const duplicateName = uniqueName('Data Science 2026');
    await createProgram(page, programName, BASELINE_DESCRIPTION);
    await createProgram(page, duplicateName, 'Data science curriculum');

    const dialog = await openEditModal(page, programName);
    await fillFormField(editFormFields(dialog).programName, duplicateName);
    await editFormFields(dialog).save.click();

    const rowsForOriginal = await programRow(page, programName).count();
    const duplicateBlocked =
      (await dialog.isVisible()) || (await hasFormValidation(dialog));

    expect(rowsForOriginal).toBeGreaterThanOrEqual(1);
    expect(duplicateBlocked).toBeTruthy();
  });

  test('TC-007: Invalid over-limit Name input is not accepted', async ({ page }) => {
    const programName = uniqueName('Web Development 2026');
    const suffix = String(Date.now()).slice(-8);
    const overMaxName = `${'a'.repeat(256 - suffix.length)}${suffix}`;
    await createProgram(page, programName, BASELINE_DESCRIPTION);

    const dialog = await openEditModal(page, programName);
    await fillFormField(editFormFields(dialog).programName, overMaxName);
    await editFormFields(dialog).save.click();

    const blocked =
      (await dialog.isVisible()) || (await hasFormValidation(dialog));
    expect(blocked).toBeTruthy();
    await expect(programRow(page, programName)).toBeVisible();
    await expect(programRow(page, overMaxName)).toHaveCount(0);
  });

  test('TC-008: Canceling edit does not persist unsaved changes', async ({ page }) => {
    const programName = uniqueName('Web Development 2026');
    const tempName = `${programName} - Temp`;
    await createProgram(page, programName, BASELINE_DESCRIPTION);

    const dialog = await openEditModal(page, programName);
    await fillFormField(editFormFields(dialog).programName, tempName);
    await editFormFields(dialog).cancel.click();
    await expect(dialog).toBeHidden();
    await expect(programRow(page, tempName)).toHaveCount(0);

    const dialog2 = await openEditModal(page, programName);
    await expect(editFormFields(dialog2).programName).toHaveValue(programName);
  });

  test('TC-009: Name with leading/trailing spaces is handled consistently', async ({ page }) => {
    const programName = uniqueName('Web Development 2026');
    const trimmedName = `${programName} - Updated`;
    const paddedName = `  ${trimmedName}  `;
    await createProgram(page, programName, BASELINE_DESCRIPTION);

    const dialog = await openEditModal(page, programName);
    await fillFormField(editFormFields(dialog).programName, paddedName);
    await editFormFields(dialog).save.click();
    await expect(dialog).toBeHidden();

    const trimmedVisible = await programRow(page, trimmedName).isVisible();
    const paddedVisible = await programRow(page, paddedName).isVisible();
    expect(trimmedVisible || !paddedVisible).toBeTruthy();
    if (trimmedVisible) {
      await expect(programRow(page, trimmedName)).toBeVisible();
    }
  });

  test('TC-010: Name supports valid special characters', async ({ page }) => {
    const programName = uniqueName('Web Development 2026');
    const specialName = uniqueName('Web Development 2026: Front-End & Back-End');
    await createProgram(page, programName, BASELINE_DESCRIPTION);

    const dialog = await openEditModal(page, programName);
    await fillFormField(editFormFields(dialog).programName, specialName);
    await editFormFields(dialog).save.click();
    await expect(dialog).toBeHidden();

    const row = programRow(page, specialName).first();
    await expect(row).toBeVisible();
    await expect(row).toContainText(specialName);
    await expect(row.locator('script')).toHaveCount(0);
  });

  test('TC-011: Description supports max-length boundary value', async ({ page }) => {
    const programName = uniqueName('Web Development 2026');
    const maxDescription = 'd'.repeat(1000);
    await createProgram(page, programName, BASELINE_DESCRIPTION);

    const dialog = await openEditModal(page, programName);
    await fillFormField(editFormFields(dialog).description, maxDescription);
    await editFormFields(dialog).save.click();

    if (await dialog.isHidden({ timeout: 15_000 }).catch(() => false)) {
      const dialog2 = await openEditModal(page, programName);
      await expect(editFormFields(dialog2).description).toHaveValue(maxDescription);
    } else {
      expect(await hasFormValidation(dialog)).toBeTruthy();
    }
  });

  test('TC-012: Rapid repeated Save clicks do not create inconsistent updates', async ({
    page,
  }) => {
    const programName = uniqueName('Web Development 2026');
    const updatedName = `${programName} - Updated`;
    await createProgram(page, programName, BASELINE_DESCRIPTION);

    const dialog = await openEditModal(page, programName);
    await fillFormField(editFormFields(dialog).programName, updatedName);
    const { save } = editFormFields(dialog);
    await save.dblclick();

    await expect(dialog).toBeHidden({ timeout: 15_000 });
    await expect
      .poll(() => programRow(page, updatedName).count(), { timeout: 15_000 })
      .toBe(1);
    await expect(programRow(page, programName)).toHaveCount(0);
  });

  test('TC-013: Concurrent update conflict is handled safely', async ({ browser }) => {
    const programName = uniqueName('Web Development 2026');
    const nameFromB = `${programName} - Session B`;
    const descriptionFromA = 'Description saved from session A after B updated name';

    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    try {
      await loginAsAdmin(pageA);
      await loginAsAdmin(pageB);
      await gotoProgramsPage(pageA);
      await createProgram(pageA, programName, BASELINE_DESCRIPTION);
      await gotoProgramsPage(pageB);

      const dialogA = await openEditModal(pageA, programName);
      const dialogB = await openEditModal(pageB, programName);

      await fillFormField(editFormFields(dialogB).programName, nameFromB);
      await editFormFields(dialogB).save.click();
      await expect(dialogB).toBeHidden();
      await expect(programRow(pageB, nameFromB)).toBeVisible();

      await fillFormField(editFormFields(dialogA).description, descriptionFromA);
      await editFormFields(dialogA).save.click();

      const dialogStillOpen = await dialogA.isVisible();
      if (dialogStillOpen) {
        expect(await hasFormValidation(dialogA)).toBeTruthy();
        return;
      }

      await pageA.reload();
      await gotoProgramsPage(pageA);

      const nameBCount = await programRow(pageA, nameFromB).count();
      const staleOverwrite = nameBCount === 0 && (await programRow(pageA, programName).count()) > 0;

      expect(nameBCount).toBeGreaterThan(0);
      if (nameBCount > 0) {
        await expect(programRow(pageA, nameFromB).first()).toContainText(descriptionFromA);
      }
      expect(staleOverwrite).toBeFalsy();
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });

  test('TC-014: Empty Description behavior follows validation rules', async ({ page }) => {
    const programName = uniqueName('Web Development 2026');
    await createProgram(page, programName, BASELINE_DESCRIPTION);

    const dialog = await openEditModal(page, programName);
    const fields = editFormFields(dialog);
    await fillFormField(fields.description, '');
    await fields.save.click();

    const saved = await dialog.isHidden({ timeout: 15_000 }).catch(() => false);
    if (saved) {
      const dialog2 = await openEditModal(page, programName);
      await expect(editFormFields(dialog2).description).toHaveValue('');
      await expect(editFormFields(dialog2).programName).toHaveValue(programName);
    } else {
      expect(await hasFormValidation(dialog)).toBeTruthy();
      await expect(fields.programName).toHaveValue(programName);
    }
  });
});
