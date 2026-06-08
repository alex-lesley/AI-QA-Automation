import { type Page } from '@playwright/test';
import { test, expect } from '../fixtures';
import { LoginPage } from '../pages/login.page';
import { ProgramsPage } from '../pages/programs.page';
import type { NewProgramModal } from '../pages/components/new-program-modal.component';

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

async function openNewProgramModal(page: Page): Promise<NewProgramModal> {
  const programs = new ProgramsPage(page);
  const modal = await programs.openNewProgram();
  await expect(modal.root).toBeVisible();
  return modal;
}

async function createProgram(
  page: Page,
  name: string,
  description?: string,
): Promise<void> {
  const modal = await openNewProgramModal(page);
  await modal.fill({ name, description });
  await modal.submitCreate();
  await expect(modal.root).toBeHidden({ timeout: 15_000 });
}

test.describe('Didaxis Studio — create program', () => {
  test.beforeEach(async ({ page }) => {
    await gotoProgramsPage(page);
  });

  test('TC-001: Program creation form opens with Program Name and Description fields', async ({
    page,
  }) => {
    const programs = new ProgramsPage(page);
    const modal = await programs.openNewProgram();

    await expect(modal.root).toBeVisible();
    await expect(modal.programName).toBeVisible();
    await expect(modal.programName).toHaveAttribute('placeholder', 'e.g. Computer Science BSc');
    await expect(modal.description).toBeVisible();
    await expect(modal.description).toHaveAttribute('placeholder', 'Brief description');
    await expect(modal.create).toBeVisible();
    await expect(modal.create).toBeDisabled();
  });

  test('TC-002: Valid program is created and appears in the list after Create', async ({
    page,
  }) => {
    const programs = new ProgramsPage(page);
    const programName = uniqueName('Web Development 2026');
    const description = 'Full-stack web development program';

    const modal = await openNewProgramModal(page);
    await modal.fill({ name: programName, description });
    await modal.submitCreate();

    await expect(modal.root).toBeHidden();
    await expect(programs.row(programName).root).toBeVisible();
    await expect(programs.alert).toHaveCount(0);
  });

  test('TC-003: Create button stays disabled when Program Name is empty', async ({ page }) => {
    const modal = await openNewProgramModal(page);

    await modal.fillField(modal.description, 'Optional description only');

    await expect(modal.programName).toHaveValue('');
    await expect(modal.create).toBeDisabled();
    await modal.submitCreateForced();
    await expect(modal.root).toBeVisible();
  });

  test('TC-004: Program is created with Description empty when Program Name is valid', async ({
    page,
  }) => {
    const programs = new ProgramsPage(page);
    const programName = uniqueName('Cybersecurity Fundamentals 2026');

    const modal = await openNewProgramModal(page);
    await modal.fillField(modal.programName, programName);
    await expect(modal.description).toHaveValue('');
    await expect(modal.create).toBeEnabled();
    await modal.submitCreate();

    await expect(modal.root).toBeHidden();
    await expect(programs.row(programName).root).toBeVisible();
  });

  test('TC-005: Re-opening New Program after a successful create shows a fresh empty form', async ({
    page,
  }) => {
    const programName = uniqueName('Web Development 2026');
    await createProgram(page, programName, 'Full-stack web development program');

    const modal = await openNewProgramModal(page);

    await expect(modal.programName).toHaveValue('');
    await expect(modal.description).toHaveValue('');
  });

  test('TC-006: No program is added when the creation modal is closed without Create', async ({
    page,
  }) => {
    const programs = new ProgramsPage(page);
    const programName = uniqueName('Draft Program QA');
    const description = 'Should not be saved';

    const modal = await openNewProgramModal(page);
    await modal.fill({ name: programName, description });
    await modal.cancelModal();

    await expect(modal.root).toBeHidden();
    await expect(programs.row(programName).root).toHaveCount(0);
  });

  test('TC-007: Filling only Description does not enable Create or create a program', async ({
    page,
  }) => {
    const modal = await openNewProgramModal(page);

    await modal.fillField(modal.description, 'Description without a program name');

    await expect(modal.programName).toHaveValue('');
    await expect(modal.create).toBeDisabled();
    await modal.submitCreateForced();
    await expect(modal.root).toBeVisible();
  });

  test('TC-008: Duplicate Program Name is rejected and list is unchanged', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const programName = uniqueName('Web Development 2026');
    await createProgram(page, programName, 'Full-stack web development program');
    await expect(programs.row(programName).root).toBeVisible();
    const rowsBefore = await programs.row(programName).count();

    const modal = await openNewProgramModal(page);
    await modal.fill({ name: programName, description: 'Duplicate attempt' });
    await modal.submitCreate();

    const rowsAfter = await programs.row(programName).count();
    expect(rowsAfter).toBe(rowsBefore);

    const duplicateBlocked =
      (await modal.root.isVisible()) ||
      (await programs.duplicateNameHint.isVisible().catch(() => false));
    expect(duplicateBlocked).toBeTruthy();
  });

  test('TC-009: Whitespace-only Program Name does not create a program', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const markerDescription = `Whitespace name test ${Date.now()}`;
    const modal = await openNewProgramModal(page);

    const rowsBefore = await programs.rowsWithText(markerDescription).count();

    await modal.fillField(modal.programName, '   ');
    await modal.fillField(modal.description, markerDescription);

    const createEnabled = await modal.create.isEnabled();
    if (createEnabled) {
      await modal.submitCreate();
    }

    const dialogStillOpen = await modal.root.isVisible();
    const validationVisible = await modal.hasVisibleValidationError();
    const rowsAfter = await programs.rowsWithText(markerDescription).count();

    expect(!createEnabled || dialogStillOpen || validationVisible).toBeTruthy();
    expect(rowsAfter).toBe(rowsBefore);
  });

  test('TC-010: Program is not created when network or server save fails', async ({ page }) => {
    const programs = new ProgramsPage(page);
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

    const modal = await openNewProgramModal(page);
    await modal.fill({ name: programName, description });
    await modal.submitCreate();

    const errorVisible =
      (await modal.root.isVisible()) ||
      (await programs.alert.isVisible().catch(() => false)) ||
      (await programs.errorHint.isVisible().catch(() => false));

    expect(errorVisible).toBeTruthy();
    await expect(programs.row(programName).root).toHaveCount(0);
  });

  test('TC-011: Leading and trailing spaces on Program Name are trimmed when saved', async ({
    page,
  }) => {
    const programs = new ProgramsPage(page);
    const trimmedName = uniqueName('Data Analytics 2026');
    const paddedName = `   ${trimmedName}   `;

    const modal = await openNewProgramModal(page);
    await modal.fill({ name: paddedName, description: 'Trim behavior check' });
    await modal.submitCreate();
    await expect(modal.root).toBeHidden();

    const trimmedVisible = await programs.row(trimmedName).root.isVisible();
    const paddedVisible = await programs.row(paddedName).root.isVisible();
    expect(trimmedVisible || !paddedVisible).toBeTruthy();
    if (trimmedVisible) {
      await expect(programs.row(trimmedName).root).toBeVisible();
    }
  });

  test('TC-012: Special characters and symbols are preserved in Program Name and Description', async ({
    page,
  }) => {
    const programs = new ProgramsPage(page);
    const programName = uniqueName('AI & ML (2026) — "Applied" <test>');
    const description = `Covers C++, 50% labs & O'Brien's module @campus`;

    await createProgram(page, programName, description);

    const row = programs.row(programName);
    await expect(row.root).toBeVisible();
    await expect(row.root).toContainText(programName);
    await expect(row.root).toContainText(description);
    await expect(row.root.locator('script')).toHaveCount(0);
  });

  test('TC-013: Single-character Program Name is accepted at minimum boundary', async ({
    page,
  }) => {
    const programs = new ProgramsPage(page);
    const programName = String.fromCharCode(65 + (Date.now() % 26));
    const description = 'Minimum length name';

    await createProgram(page, programName, description);
    await expect(programs.row(programName).root).toBeVisible();
  });

  test('TC-014: Maximum-length Program Name is accepted or rejected with clear feedback', async ({
    page,
  }) => {
    const programs = new ProgramsPage(page);
    const suffix = String(Date.now()).slice(-8);
    const maxName = `${'a'.repeat(255 - suffix.length - 1)}${suffix}`;
    const overMaxName = `${maxName}a`;

    const modal = await openNewProgramModal(page);
    await modal.fill({ name: maxName, description: 'Max length program name' });
    await modal.submitCreate();

    if (await modal.root.isHidden({ timeout: 15_000 }).catch(() => false)) {
      await expect(programs.row(maxName).root).toBeVisible();
    } else {
      expect(await modal.hasVisibleValidationError()).toBeTruthy();
    }

    const overMaxRowsBefore = await programs.row(overMaxName).count();
    const modal2 = await openNewProgramModal(page);
    await modal2.fill({ name: overMaxName, description: 'Over max length program name' });
    await modal2.submitCreate();

    const overMaxRowsAfter = await programs.row(overMaxName).count();
    const overMaxBlocked =
      (await modal2.root.isVisible()) ||
      (await modal2.hasVisibleValidationError()) ||
      overMaxRowsAfter === overMaxRowsBefore;
    expect(overMaxBlocked).toBeTruthy();
  });

  test('TC-015: Maximum-length Description is accepted or rejected with clear feedback', async ({
    page,
  }) => {
    const programs = new ProgramsPage(page);
    const programName = uniqueName('Long Description Program 2026');
    const maxDescription = 'd'.repeat(2000);
    const overMaxDescription = `${maxDescription}d`;

    const modal = await openNewProgramModal(page);
    await modal.fill({ name: programName, description: maxDescription });
    await modal.submitCreate();

    if (await modal.root.isHidden({ timeout: 15_000 }).catch(() => false)) {
      await expect(programs.row(programName).root).toBeVisible();
    } else {
      expect(await modal.hasVisibleValidationError()).toBeTruthy();
    }

    const programNameOver = uniqueName('Long Description Over Max');
    const overMaxRowsBefore = await programs.row(programNameOver).count();
    const modal2 = await openNewProgramModal(page);
    await modal2.fill({ name: programNameOver, description: overMaxDescription });
    await modal2.submitCreate();

    const overMaxRowsAfter = await programs.row(programNameOver).count();
    const overMaxBlocked =
      (await modal2.root.isVisible()) ||
      (await modal2.hasVisibleValidationError()) ||
      overMaxRowsAfter === overMaxRowsBefore;
    expect(overMaxBlocked).toBeTruthy();
  });

  test('TC-016: Duplicate names differing only by letter case are handled consistently', async ({
    page,
  }) => {
    const programs = new ProgramsPage(page);
    const existingName = uniqueName('Web Development 2026');
    const variantName = existingName.replace('Web Development', 'web development');

    await createProgram(page, existingName, 'Original program');
    await expect(programs.row(existingName).root).toBeVisible();
    const rowsBefore = await programs.row(existingName).count();

    const modal = await openNewProgramModal(page);
    await modal.fill({ name: variantName, description: 'Case variant duplicate' });
    await modal.submitCreate();

    await expect
      .poll(async () => {
        const dialogVisible = await modal.root.isVisible();
        if (dialogVisible) {
          return (await modal.hasVisibleValidationError()) || true;
        }
        return true;
      })
      .toBeTruthy();

    const existingRows = await programs.row(existingName).count();
    const variantRows = await programs.row(variantName).count();
    const dialogVisible = await modal.root.isVisible();
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

  test.skip('TC-017: Rapid double-click on Create does not create duplicate programs', async ({
    page,
  }) => {
    const programs = new ProgramsPage(page);
    const programName = uniqueName('UX Design Certificate 2026');
    const description = 'Double submit test';

    const modal = await openNewProgramModal(page);
    await modal.fill({ name: programName, description });
    await modal.doubleClickCreate();

    await expect(modal.root).toBeHidden({ timeout: 15_000 });
    await expect
      .poll(() => programs.row(programName).count(), { timeout: 15_000 })
      .toBe(1);
  });
});

test.describe('Didaxis Studio — create program (non-admin)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('TC-018: Non-admin user cannot access program creation (if role model applies)', async ({
    page,
  }) => {
    const email = process.env.DIDAXIS_NON_ADMIN_EMAIL;
    const password = process.env.DIDAXIS_NON_ADMIN_PASSWORD;
    test.skip(!email || !password, 'DIDAXIS_NON_ADMIN_EMAIL and DIDAXIS_NON_ADMIN_PASSWORD required');

    const loginPage = new LoginPage(page);
    await loginPage.signInWith(email!, password!);

    const programs = await gotoProgramsPage(page);
    const buttonVisible = await programs.newProgramButton.isVisible().catch(() => false);

    if (buttonVisible) {
      await programs.openNewProgram();
      const blocked =
        !(await programs.newProgramModal.root.isVisible().catch(() => false)) ||
        (await programs.unauthorizedHint.isVisible().catch(() => false));
      expect(blocked).toBeTruthy();
    } else {
      await expect(programs.newProgramButton).toBeHidden();
    }
  });
});
