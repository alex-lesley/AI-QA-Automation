import { type Locator, type Page } from '@playwright/test';
import { test, expect } from '../fixtures';
import { LoginPage } from '../pages/login.page';
import { ProgramsPage } from '../pages/programs.page';
import type { NewProgramModal } from '../pages/components/new-program-modal.component';
import { captureApiHeaders, createProgramViaApi } from '../support/programs-api';

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

async function expectDuplicateSaveBlocked(modal: NewProgramModal): Promise<void> {
  await expect(modal.root).toBeVisible({ timeout: 15_000 });
  await expect
    .poll(async () => {
      if (await modal.duplicateNameError.isVisible().catch(() => false)) {
        return true;
      }
      return modal.hasVisibleValidationError();
    }, { timeout: 15_000 })
    .toBeTruthy();
}

async function expectSaveSucceededOrValidationFeedback(
  programs: ProgramsPage,
  modal: NewProgramModal,
  programName: string,
): Promise<void> {
  await expect
    .poll(
      async () => {
        if ((await programs.row(programName).count()) === 1) {
          return 'saved';
        }
        if (await modal.root.isVisible()) {
          return (await modal.hasVisibleValidationError()) ? 'rejected' : null;
        }
        return null;
      },
      { timeout: 15_000 },
    )
    .toMatch(/saved|rejected/);
}

async function expectOverMaxInputBlocked(
  programs: ProgramsPage,
  modal: NewProgramModal,
  programName: string,
): Promise<void> {
  await expect(programs.row(programName).root).toHaveCount(0);
  await expect
    .poll(async () => {
      if (await modal.root.isVisible()) {
        return true;
      }
      return modal.hasVisibleValidationError();
    }, { timeout: 15_000 })
    .toBeTruthy();
}

async function tabUntilFocused(page: Page, locator: Locator): Promise<void> {
  for (let index = 0; index < 25; index += 1) {
    if (await locator.evaluate((element) => element === document.activeElement)) {
      return;
    }
    await page.keyboard.press('Tab');
  }
  await expect(locator).toBeFocused();
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

    await expect.soft(modal.root).toBeVisible();
    await expect.soft(modal.programName).toBeVisible();
    await expect
      .soft(modal.programName)
      .toHaveAttribute('placeholder', 'e.g. Computer Science BSc');
    await expect.soft(modal.description).toBeVisible();
    await expect.soft(modal.description).toHaveAttribute('placeholder', 'Brief description');
    await expect.soft(modal.create).toBeVisible();
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
    const headers = await captureApiHeaders(page);
    await createProgramViaApi(page, headers, programName, 'Full-stack web development program');
    await page.reload();
    await expect(programs.heading).toBeVisible();
    await expect(programs.row(programName).root).toHaveCount(1);

    const modal = await openNewProgramModal(page);
    await modal.fill({ name: programName, description: 'Duplicate attempt' });
    await modal.submitCreate();

    await expect(programs.row(programName).root).toHaveCount(1);
    await expectDuplicateSaveBlocked(modal);
  });

  test('TC-009: Whitespace-only Program Name does not create a program', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const markerDescription = `Whitespace name test ${Date.now()}`;
    const modal = await openNewProgramModal(page);
    const markerRows = programs.rowsWithText(markerDescription);

    await modal.fillField(modal.programName, '   ');
    await modal.fillField(modal.description, markerDescription);

    if (await modal.create.isEnabled()) {
      await modal.submitCreate();
      await expect(markerRows).toHaveCount(0);
      await expect(modal.root).toBeVisible();
    } else {
      await expect(modal.create).toBeDisabled();
      await expect(markerRows).toHaveCount(0);
    }
  });

  test('TC-010: Program is not created when network or server save fails', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const programName = uniqueName('Network Failure Program');
    const description = 'Simulated failure';

    await page.route('**/api/programs', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Service Unavailable' }),
        });
        return;
      }
      await route.continue();
    });

    const modal = await openNewProgramModal(page);
    await modal.fill({ name: programName, description });
    await modal.submitCreate();

    await expect(
      modal.root.or(programs.alert).or(programs.errorHint),
    ).toBeVisible({ timeout: 15_000 });
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

    await expect
      .poll(
        async () => {
          const trimmedCount = await programs.row(trimmedName).count();
          const paddedCount = await programs.row(paddedName).count();
          if (trimmedCount === 1 && paddedCount === 0) {
            return 'trimmed';
          }
          if (await modal.root.isVisible()) {
            return (await modal.hasVisibleValidationError()) ? 'rejected' : null;
          }
          return null;
        },
        { timeout: 15_000 },
      )
      .toMatch(/trimmed|rejected/);
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
    await expect(row.embeddedScripts()).toHaveCount(0);
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
    await expectSaveSucceededOrValidationFeedback(programs, modal, maxName);

    const modal2 = await openNewProgramModal(page);
    await modal2.fill({ name: overMaxName, description: 'Over max length program name' });
    await modal2.submitCreate();
    await expectOverMaxInputBlocked(programs, modal2, overMaxName);
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
    await expectSaveSucceededOrValidationFeedback(programs, modal, programName);

    const programNameOver = uniqueName('Long Description Over Max');
    const modal2 = await openNewProgramModal(page);
    await modal2.fill({ name: programNameOver, description: overMaxDescription });
    await modal2.submitCreate();
    await expectOverMaxInputBlocked(programs, modal2, programNameOver);
  });

  test('TC-016: Duplicate names differing only by letter case are handled consistently', async ({
    page,
  }) => {
    const programs = new ProgramsPage(page);
    const existingName = uniqueName('Web Development 2026');
    const variantName = existingName.replace('Web Development', 'web development');
    const headers = await captureApiHeaders(page);
    await createProgramViaApi(page, headers, existingName, 'Original program');
    await page.reload();
    await expect(programs.row(existingName).root).toHaveCount(1);

    const modal = await openNewProgramModal(page);
    await modal.fill({ name: variantName, description: 'Case variant duplicate' });
    await modal.submitCreate();

    await expect
      .poll(
        async () => {
          const existingRows = await programs.row(existingName).count();
          const variantRows = await programs.row(variantName).count();
          const dialogVisible = await modal.root.isVisible();

          if (variantRows === 0 && existingRows === 1 && dialogVisible) {
            return 'rejected';
          }
          if (variantRows === 1 && existingRows === 1 && !dialogVisible) {
            return 'allowed';
          }
          if (variantRows === 0 && existingRows === 1 && !dialogVisible) {
            return (await modal.hasVisibleValidationError()) ||
              (await programs.duplicateNameHint.isVisible().catch(() => false))
              ? 'rejected'
              : null;
          }
          return null;
        },
        { timeout: 15_000 },
      )
      .toMatch(/rejected|allowed/);
  });

  test.fixme(
    'TC-017: Rapid double-click on Create does not create duplicate programs',
    async ({ page }) => {
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
    },
  );

  test('TC-019: New Program modal exposes accessible names for primary controls', async ({
    page,
  }) => {
    const programs = await gotoProgramsPage(page);
    const modal = await programs.openNewProgram();

    await expect.soft(modal.root).toBeVisible();
    await expect.soft(modal.programName).toHaveAccessibleName('Program Name');
    await expect.soft(modal.description).toHaveAccessibleName('Description');
    await expect.soft(modal.create).toHaveAccessibleName('Create');
    await expect(modal.cancel).toHaveAccessibleName('Cancel');
  });

  test('TC-020: New Program flow is keyboard operable', async ({ page }) => {
    const programs = await gotoProgramsPage(page);
    await tabUntilFocused(page, programs.newProgramButton);
    await page.keyboard.press('Enter');

    const modal = programs.newProgramModal;
    await expect(modal.root).toBeVisible();
    await tabUntilFocused(page, modal.programName);
    await expect(modal.programName).toBeFocused();
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
    const button = programs.newProgramButton;

    if (await button.isVisible()) {
      await programs.openNewProgram();
      await expect
        .poll(async () => {
          const modalOpen = await programs.newProgramModal.root.isVisible();
          const unauthorized = await programs.unauthorizedHint.isVisible().catch(() => false);
          return !modalOpen || unauthorized;
        }, { timeout: 15_000 })
        .toBeTruthy();
    } else {
      await expect(button).toBeHidden();
    }
  });
});
