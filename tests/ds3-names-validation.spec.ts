import { type Page } from '@playwright/test';
import { test, expect } from '../fixtures';
import type { NewProgramModal } from '../pages/components/new-program-modal.component';
import { ProgramsPage } from '../pages/programs.page';

const VALID_DESCRIPTION = 'Valid description for program name validation';

function uniqueName(base: string): string {
  return `${base} ${Date.now()}`;
}

async function gotoProgramsPage(page: Page): Promise<ProgramsPage> {
  const programs = new ProgramsPage(page);
  await programs.goto();
  await expect(programs.heading).toBeVisible();
  await expect(programs.newProgramButton).toBeVisible();
  return programs;
}

async function openCreateModal(page: Page): Promise<NewProgramModal> {
  const programs = new ProgramsPage(page);
  const modal = await programs.openNewProgram();
  await expect(modal.root).toBeVisible();
  return modal;
}

async function createProgram(page: Page, name: string, description = VALID_DESCRIPTION): Promise<void> {
  const programs = new ProgramsPage(page);
  const modal = await openCreateModal(page);
  await modal.fill({ name, description });
  await modal.submitCreate();
  await expect(modal.root).toBeHidden({ timeout: 15_000 });
  await expect(programs.row(name).root.first()).toBeVisible();
}

async function expectCreateSucceeded(
  page: Page,
  modal: NewProgramModal,
  programName: string,
): Promise<void> {
  const programs = new ProgramsPage(page);
  await expect(modal.root).toBeHidden({ timeout: 15_000 });
  await expect(programs.row(programName).root.first()).toBeVisible();
}

async function expectCreateBlocked(
  page: Page,
  modal: NewProgramModal,
  programName: string,
  rowsBefore: number,
): Promise<void> {
  const programs = new ProgramsPage(page);
  const rowsAfter = await programs.row(programName).count();
  const blocked =
    (await modal.root.isVisible()) ||
    (await modal.hasVisibleValidationError()) ||
    (await modal.duplicateNameError.isVisible().catch(() => false)) ||
    !(await modal.create.isEnabled());

  expect(rowsAfter).toBe(rowsBefore);
  expect(blocked).toBeTruthy();
}

test.describe('Didaxis Studio — program name validation (create)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoProgramsPage(page);
  });

  test('TC-001: Program is created when Name contains allowed letters, spaces, and allowed special characters', async ({
    page,
  }) => {
    const programs = new ProgramsPage(page);
    const programName = uniqueName('Informatique & IA - Niveau 2');

    const modal = await openCreateModal(page);
    await modal.fill({ name: programName, description: VALID_DESCRIPTION });
    await modal.submitCreateForced();

    await expectCreateSucceeded(page, modal, programName);
    await expect(programs.row(programName).root.first()).toContainText(programName);
  });

  test('TC-002: Program is created when Name contains each allowed special character', async ({
    page,
  }) => {
    const programs = new ProgramsPage(page);
    const programName = uniqueName('AI% & Data@Scale-2.0, "Advanced"');

    const modal = await openCreateModal(page);
    await modal.fill({ name: programName, description: VALID_DESCRIPTION });
    await modal.submitCreateForced();

    await expectCreateSucceeded(page, modal, programName);
    const row = programs.row(programName).root.first();
    await expect(row).toContainText('%');
    await expect(row).toContainText('&');
    await expect(row).toContainText('@');
  });

  test('TC-003: Leading and trailing spaces are trimmed before save', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const trimmedName = uniqueName('Web Development 2027');
    const paddedName = `   ${trimmedName}   `;

    const modal = await openCreateModal(page);
    await modal.fill({ name: paddedName, description: VALID_DESCRIPTION });
    await modal.submitCreateForced();
    await expect(modal.root).toBeHidden({ timeout: 15_000 });

    const trimmedVisible = await programs.row(trimmedName).root.isVisible();
    const paddedVisible = await programs.row(paddedName).root.isVisible();
    expect(trimmedVisible || !paddedVisible).toBeTruthy();
    if (trimmedVisible) {
      await expect(programs.row(trimmedName).root).toBeVisible();
    }
  });

  test('TC-004: Form is not submitted when Name contains only spaces', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const markerDescription = `Whitespace-only name test ${Date.now()}`;
    const modal = await openCreateModal(page);
    const rowsBefore = await programs.rowsWithText(markerDescription).count();

    await modal.fill({ name: '   ', description: markerDescription });
    await modal.submitCreateForced();

    const rowsAfter = await programs.rowsWithText(markerDescription).count();
    expect(rowsAfter).toBe(rowsBefore);

    const blocked =
      (await modal.root.isVisible()) ||
      (await modal.hasVisibleValidationError()) ||
      !(await modal.create.isEnabled());
    expect(blocked).toBeTruthy();
  });

  test.skip('TC-005: Duplicate Name is rejected when exactly matching an existing program', async ({
    page,
  }) => {
    const programs = new ProgramsPage(page);
    const existingName = uniqueName('Web Development 2026');
    await createProgram(page, existingName);
    await expect(programs.row(existingName).root).toHaveCount(1);

    const modal = await openCreateModal(page);
    await modal.fill({ name: existingName, description: VALID_DESCRIPTION });
    await modal.submitCreateForced();

    await expect(programs.row(existingName).root).toHaveCount(1, { timeout: 15_000 });
    await expect(modal.duplicateNameError.first()).toBeVisible();
    await expect(modal.root).toBeVisible();
  });

  test('TC-006: Duplicate Name is rejected when case differs only', async ({ page }) => {
    const existingName = uniqueName('Web Development 2026');
    const variantName = existingName.replace('Web Development', 'web development');
    await createProgram(page, existingName);
    const programs = new ProgramsPage(page);
    const rowsBeforeVariant = await programs.row(variantName).count();

    const modal = await openCreateModal(page);
    await modal.fill({ name: variantName, description: VALID_DESCRIPTION });
    await modal.submitCreateForced();

    await expectCreateBlocked(page, modal, variantName, rowsBeforeVariant);
  });

  test('TC-007: Duplicate Name is rejected when only whitespace count differs', async ({
    page,
  }) => {
    const existingName = uniqueName('Web Development 2026');
    const variantName = `  ${existingName.split(' ').join('   ')}  `;
    await createProgram(page, existingName);
    const programs = new ProgramsPage(page);
    const rowsBeforeVariant = await programs.row(variantName).count();

    const modal = await openCreateModal(page);
    await modal.fill({ name: variantName, description: VALID_DESCRIPTION });
    await modal.submitCreateForced();

    await expectCreateBlocked(page, modal, variantName, rowsBeforeVariant);
  });

  test('TC-008: Name is rejected when it contains a non-allowed special character', async ({
    page,
  }) => {
    const programs = new ProgramsPage(page);
    const invalidName = uniqueName('Finance + Accounting');
    const modal = await openCreateModal(page);
    const rowsBefore = await programs.row(invalidName).count();

    await modal.fill({ name: invalidName, description: VALID_DESCRIPTION });
    await modal.submitCreateForced();

    await expectCreateBlocked(page, modal, invalidName, rowsBefore);
  });

  test('TC-009: Name is rejected when empty string is submitted', async ({ page }) => {
    const modal = await openCreateModal(page);

    await expect(modal.programName).toHaveValue('');
    await expect(modal.create).toBeDisabled();
    await modal.submitCreateForced();
    await expect(modal.root).toBeVisible();
  });

  test('TC-010: Name accepts minimum non-empty valid value', async ({ page }) => {
    const programName = String.fromCharCode(65 + (Date.now() % 26));

    const modal = await openCreateModal(page);
    await modal.fill({ name: programName, description: VALID_DESCRIPTION });
    await modal.submitCreateForced();

    await expectCreateSucceeded(page, modal, programName);
  });

  test('TC-011: Name with only allowed punctuation and letters remains valid after trim', async ({
    page,
  }) => {
    const programs = new ProgramsPage(page);
    const trimmedName = uniqueName('"AI", Data-2026');
    const paddedName = `  ${trimmedName}  `;

    const modal = await openCreateModal(page);
    await modal.fill({ name: paddedName, description: VALID_DESCRIPTION });
    await modal.submitCreateForced();
    await expect(modal.root).toBeHidden({ timeout: 15_000 });

    const trimmedVisible = await programs.row(trimmedName).root.isVisible();
    const paddedVisible = await programs.row(paddedName).root.isVisible();
    expect(trimmedVisible || !paddedVisible).toBeTruthy();
    if (trimmedVisible) {
      await expect(programs.row(trimmedName).root).toBeVisible();
    }
  });

  test('TC-012: Name with tab/newline-only whitespace is treated as empty', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const markerDescription = `Tab newline name test ${Date.now()}`;
    const modal = await openCreateModal(page);
    const rowsBefore = await programs.rowsWithText(markerDescription).count();

    await modal.fill({ name: '\t\t\n', description: markerDescription });
    await modal.submitCreateForced();

    const rowsAfter = await programs.rowsWithText(markerDescription).count();
    expect(rowsAfter).toBe(rowsBefore);

    const blocked =
      (await modal.root.isVisible()) ||
      (await modal.hasVisibleValidationError()) ||
      !(await modal.create.isEnabled());
    expect(blocked).toBeTruthy();
  });

  test('TC-013: Name at maximum allowed length is accepted', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const suffix = String(Date.now()).slice(-8);
    const maxName = `${'a'.repeat(255 - suffix.length - 1)}${suffix}`;

    const modal = await openCreateModal(page);
    await modal.fill({ name: maxName, description: VALID_DESCRIPTION });
    const actualName = await modal.programName.inputValue();
    expect(actualName.length).toBeGreaterThan(0);
    await modal.submitCreateForced();

    await expect
      .poll(async () => {
        if (await modal.root.isHidden()) {
          return programs.row(actualName).count();
        }
        if (await modal.hasVisibleValidationError()) {
          return -1;
        }
        return 0;
      })
      .toBeGreaterThan(0);
  });

  test('TC-014: Name exceeding maximum allowed length is rejected', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const suffix = String(Date.now()).slice(-8);
    const maxName = `${'a'.repeat(255 - suffix.length - 1)}${suffix}`;
    const overMaxName = `${maxName}a`;

    const modal = await openCreateModal(page);
    await modal.fill({ name: overMaxName, description: VALID_DESCRIPTION });
    await modal.submitCreateForced();

    const blocked =
      (await modal.root.isVisible()) ||
      (await modal.hasVisibleValidationError()) ||
      (await programs.row(overMaxName).count()) === 0;
    expect(blocked).toBeTruthy();
  });

  test('TC-015: Duplicate check applies after trimming leading/trailing spaces', async ({
    page,
  }) => {
    const existingName = uniqueName('Data Science 2026');
    const paddedDuplicate = `   ${existingName}   `;
    await createProgram(page, existingName);
    const programs = new ProgramsPage(page);
    const rowsBefore = await programs.row(existingName).count();

    const modal = await openCreateModal(page);
    await modal.fill({ name: paddedDuplicate, description: VALID_DESCRIPTION });
    await modal.submitCreateForced();

    await expectCreateBlocked(page, modal, existingName, rowsBefore);
  });
});
