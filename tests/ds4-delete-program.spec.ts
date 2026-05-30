import { type Page } from '@playwright/test';
import { test, expect } from '../fixtures';
import { baseUrl } from '../support/auth';
import { ProgramsPage } from '../pages/programs.page';

const BASELINE_DESCRIPTION = 'Program created for delete confirmation tests';

function uniqueName(base: string): string {
  return `${base} ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Native confirm shown when deleting from the programs list. */
function expectedDeleteMessagePattern(programName: string): RegExp {
  const escaped = escapeRegExp(programName);
  return new RegExp(
    `Delete program ["']${escaped}["']\\?.*cannot be undone`,
    'is',
  );
}

async function gotoProgramsPage(page: Page): Promise<ProgramsPage> {
  const programs = new ProgramsPage(page);
  await programs.goto();
  await expect(programs.heading).toBeVisible();
  await expect(programs.newProgramButton).toBeVisible();
  return programs;
}

async function createProgram(
  page: Page,
  name: string,
  description: string = BASELINE_DESCRIPTION,
): Promise<void> {
  const programs = new ProgramsPage(page);
  const modal = await programs.openNewProgram();
  await modal.fill({ name, description });
  await modal.submitCreate();
  await expect(modal.root).toBeHidden({ timeout: 15_000 });
  await expect(programs.row(name).root).toBeVisible();
}

async function handleDeleteDialog(
  page: Page,
  programName: string,
  action: 'accept' | 'dismiss',
): Promise<string> {
  const programs = new ProgramsPage(page);
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
    programs.row(programName).clickDelete(),
  ]);
  return message;
}

async function confirmDelete(page: Page, programName: string): Promise<string> {
  const programs = new ProgramsPage(page);
  const message = await handleDeleteDialog(page, programName, 'accept');
  await expect(programs.row(programName).root).toHaveCount(0, { timeout: 15_000 });
  return message;
}

async function cancelDelete(page: Page, programName: string): Promise<string> {
  const programs = new ProgramsPage(page);
  const message = await handleDeleteDialog(page, programName, 'dismiss');
  await expect(programs.row(programName).root).toBeVisible();
  return message;
}

test.describe('Didaxis Studio — delete program with confirmation', () => {
  test.beforeEach(async ({ page }) => {
    await gotoProgramsPage(page);
  });

  test('TC-001: Deleting Test Program after confirmation removes it from the program list', async ({
    page,
  }) => {
    const programs = new ProgramsPage(page);
    const testProgram = uniqueName('Test Program');
    const otherProgram = uniqueName('Retention Pilot 2026');
    await createProgram(page, testProgram);
    await createProgram(page, otherProgram);

    const message = await confirmDelete(page, testProgram);

    expect(message).toMatch(expectedDeleteMessagePattern(testProgram));
    await expect(programs.row(testProgram).root).toHaveCount(0);
    await expect(programs.row(otherProgram).root).toBeVisible();
    await expect(programs.errorAlerts()).toHaveCount(0);
  });

  test('TC-002: Canceling deletion leaves Test Program in the program list', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const testProgram = uniqueName('Test Program');
    await createProgram(page, testProgram);

    const message = await cancelDelete(page, testProgram);

    expect(message).toMatch(expectedDeleteMessagePattern(testProgram));
    await expect(programs.row(testProgram).root).toBeVisible();
    await expect(programs.deleteSuccessHint).toHaveCount(0);
  });

  test('TC-003: Confirmation dialog shows the correct program name when several programs exist', async ({
    page,
  }) => {
    const programs = new ProgramsPage(page);
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
    await expect(programs.row(alphaSchedule).root).toBeVisible();
  });

  test('TC-004: Program is not removed when the user only opens the dialog and does not confirm', async ({
    page,
  }) => {
    const programs = new ProgramsPage(page);
    const testProgram = uniqueName('Test Program');
    await createProgram(page, testProgram);

    await cancelDelete(page, testProgram);
    await expect(programs.row(testProgram).root).toBeVisible();

    await page.reload();
    await gotoProgramsPage(page);

    await expect(programs.row(testProgram).root).toBeVisible();
    await expect(programs.row(testProgram).root).toHaveCount(1);
  });

  test('TC-005: Deleting Test Program does not remove a different program from the list', async ({
    page,
  }) => {
    const programs = new ProgramsPage(page);
    const testProgram = uniqueName('Test Program');
    const retentionPilot = uniqueName('Retention Pilot 2026');
    await createProgram(page, testProgram);
    await createProgram(page, retentionPilot);

    const message = await confirmDelete(page, testProgram);

    expect(message).toMatch(expectedDeleteMessagePattern(testProgram));
    await expect(programs.row(testProgram).root).toHaveCount(0);
    await expect(programs.row(retentionPilot).root).toBeVisible();
  });

  test('TC-006: No duplicate or silent delete occurs when Confirm is clicked once', async ({
    page,
  }) => {
    const programs = new ProgramsPage(page);
    const testProgram = uniqueName('Test Program');
    const sibling = uniqueName('Sibling Program');
    await createProgram(page, testProgram);
    await createProgram(page, sibling);

    let dialogOpens = 0;

    await Promise.all([
      programs.row(testProgram).clickDelete(),
      page.waitForEvent('dialog').then(async (d) => {
        dialogOpens += 1;
        expect(d.type()).toBe('confirm');
        await d.accept();
      }),
    ]);
    await expect(programs.row(testProgram).root).toHaveCount(0, { timeout: 15_000 });
    await expect(programs.row(testProgram).root).toHaveCount(0);
    expect(dialogOpens).toBe(1);
    await expect(programs.row(sibling).root).toBeVisible();
    await expect(programs.row(sibling).root).toHaveCount(1);
  });

  test('TC-007: Cancel does not partially delete or mark the program as deleted in the UI', async ({
    page,
  }) => {
    const programs = new ProgramsPage(page);
    const testProgram = uniqueName('Test Program');
    await createProgram(page, testProgram);

    await cancelDelete(page, testProgram);
    await expect(programs.row(testProgram).root).toBeVisible();

    const editModal = await programs.row(testProgram).openEdit();
    await expect(editModal.root).toBeVisible();
    await expect(editModal.programName).toHaveValue(testProgram);
    await editModal.cancelModal();
  });

  test('TC-008: Dialog message remains correct for a long program name', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const longName = uniqueName(
      'North Region Holiday Overtime Program Q1-Q2 2026 Extended Pilot',
    );
    await createProgram(page, longName);

    const message = await handleDeleteDialog(page, longName, 'dismiss');

    expect(message).toMatch(expectedDeleteMessagePattern(longName));
    expect(message).toContain(longName);
    await expect(programs.row(longName).root).toBeVisible();
  });

  test('TC-009: Program name with special characters appears verbatim in the dialog', async ({
    page,
  }) => {
    const programs = new ProgramsPage(page);
    const specialName = uniqueName('Test Program & Co. (2026) – #1');
    await createProgram(page, specialName);

    const message = await handleDeleteDialog(page, specialName, 'dismiss');

    expect(message).toContain(specialName);
    expect(message).toMatch(expectedDeleteMessagePattern(specialName));
  });

  test('TC-010: Only one confirmation dialog opens per delete icon click', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const testProgram = uniqueName('Test Program');
    await createProgram(page, testProgram);

    let dialogCount = 0;
    await Promise.all([
      programs.row(testProgram).clickDelete(),
      page.waitForEvent('dialog').then(async (dialog) => {
        dialogCount += 1;
        await dialog.dismiss();
      }),
    ]);
    await page.waitForTimeout(300);

    expect(dialogCount).toBe(1);
    await expect(programs.row(testProgram).root).toBeVisible();
    page.removeAllListeners('dialog');
  });

  test('TC-011: Program remains when delete dialog is dismissed before returning to the list', async ({
    page,
  }) => {
    const programs = new ProgramsPage(page);
    const testProgram = uniqueName('Test Program');
    await createProgram(page, testProgram);

    await handleDeleteDialog(page, testProgram, 'dismiss');

    await page.goto(`${baseUrl}/`);
    await gotoProgramsPage(page);

    await expect(programs.row(testProgram).root).toBeVisible();
    await expect(programs.row(testProgram).root).toHaveCount(1);
  });
});
