import { type Page } from '@playwright/test';
import { test, expect } from '../fixtures';
import { ProgramsPage } from '../pages/programs.page';

const BASELINE_DESCRIPTION = 'Program created for semester panel selection tests';

function uniqueName(base: string): string {
  return `${base} ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

test.describe('Didaxis Studio — program semester panel selection', () => {
  test.beforeEach(async ({ page }) => {
    await gotoProgramsPage(page);
  });

  test('TC-001: Selecting a program reveals the semester management panel', { tag: '@smoke' }, async ({ page }) => {
    const programs = new ProgramsPage(page);
    const programName = uniqueName('Semester Panel Alpha');
    await createProgram(page, programName);

    await expect(programs.semesterPanel.newSemesterButton).toHaveCount(0);
    await expect(programs.semesterPanel.heading).toHaveCount(0);

    await programs.row(programName).select();

    await expect(programs.semesterPanel.selectPrompt).toHaveCount(0);
    await expect(programs.semesterPanel.heading).toBeVisible();
    await expect(programs.semesterPanel.newSemesterButton).toBeVisible();
    await expect(programs.semesterPanel.manageCourses).toBeVisible();
    await expect(programs.semesterPanel.selectedProgramName(programName)).toBeVisible();
  });

  test('TC-002: Switching selection updates the semester panel context', { tag: '@sanity' }, async ({ page }) => {
    const programs = new ProgramsPage(page);
    const alphaName = uniqueName('Semester Panel Alpha');
    const betaName = uniqueName('Semester Panel Beta');

    await createProgram(page, alphaName, 'First program for panel switching');
    await createProgram(page, betaName, 'Second program for panel switching');

    await programs.row(alphaName).select();
    await expect(programs.semesterPanel.selectedProgramName(alphaName)).toBeVisible();
    await expect(programs.semesterPanel.selectedProgramName(betaName)).toHaveCount(0);

    await programs.row(betaName).select();
    await expect(programs.semesterPanel.selectedProgramName(betaName)).toBeVisible();
    await expect(programs.semesterPanel.selectedProgramName(alphaName)).toHaveCount(0);
    await expect(programs.semesterPanel.heading).toBeVisible();
    await expect(programs.semesterPanel.newSemesterButton).toBeVisible();
  });
});
