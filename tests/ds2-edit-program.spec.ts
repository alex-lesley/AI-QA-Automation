import { type Page } from '@playwright/test';

import { test, expect } from '../fixtures';

import { AUTH_STORAGE_PATH } from '../support/auth';

import {

  attachCreatedProgramTracker,

  detachAndCleanupCreatedPrograms,

} from '../support/created-program-cleanup';

import type { EditProgramModal } from '../pages/components/edit-program-modal.component';

import { ProgramsPage } from '../pages/programs.page';



const BASELINE_DESCRIPTION = 'Full-stack web development bootcamp for 2026 intake';



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



async function openEditModal(page: Page, programName: string): Promise<EditProgramModal> {

  const programs = new ProgramsPage(page);

  const modal = await programs.row(programName).openEdit();

  await expect(modal.root).toBeVisible();

  return modal;

}



test.describe('Didaxis Studio — edit program', () => {

  test.beforeEach(async ({ page }) => {

    await gotoProgramsPage(page);

  });



  test('TC-001: Edit form opens with existing program data pre-populated', { tag: '@smoke' }, async ({ page }) => {

    const programName = uniqueName('Web Development 2026');

    await createProgram(page, programName, BASELINE_DESCRIPTION);



    const modal = await openEditModal(page, programName);



    await expect(modal.programName).toHaveValue(programName);

    await expect(modal.description).toHaveValue(BASELINE_DESCRIPTION);

    await expect(modal.save).toBeVisible();

    await expect(modal.cancel).toBeVisible();

  });



  test('TC-002: Valid name update is saved and reflected immediately in list', { tag: '@smoke' }, async ({ page }) => {

    const programs = new ProgramsPage(page);

    const programName = uniqueName('Web Development 2026');

    const updatedName = `${programName} - Updated`;

    await createProgram(page, programName, BASELINE_DESCRIPTION);



    const modal = await openEditModal(page, programName);

    await modal.fillField(modal.programName, updatedName);

    await modal.submitSave();



    await expect(modal.root).toBeHidden();

    await expect(programs.row(updatedName).root).toBeVisible();

    await expect(programs.row(programName).root).toHaveCount(0);

  });



  test('TC-003: Editing only Description preserves all other fields', { tag: '@sanity' }, async ({ page }) => {

    const programName = uniqueName('Web Development 2026');

    const updatedDescription =

      'Full-stack web development bootcamp with updated module sequence';

    await createProgram(page, programName, BASELINE_DESCRIPTION);



    const modal = await openEditModal(page, programName);

    await modal.fillField(modal.description, updatedDescription);

    await expect(modal.programName).toHaveValue(programName);

    await modal.submitSave();

    await expect(modal.root).toBeHidden();



    const modal2 = await openEditModal(page, programName);

    await expect(modal2.description).toHaveValue(updatedDescription);

    await expect(modal2.programName).toHaveValue(programName);

  });



  test('TC-004: Multiple valid field updates save together correctly', { tag: '@sanity' }, async ({ page }) => {

    const programs = new ProgramsPage(page);

    const programName = uniqueName('Web Development 2026');

    const cohortName = `${programName} - Cohort A`;

    const cohortDescription = 'Cohort A schedule and curriculum';

    await createProgram(page, programName, BASELINE_DESCRIPTION);



    const modal = await openEditModal(page, programName);

    await modal.fill({ name: cohortName, description: cohortDescription });

    await modal.submitSave();

    await expect(modal.root).toBeHidden();



    await expect(programs.row(cohortName).root).toBeVisible();



    const modal2 = await openEditModal(page, cohortName);

    await expect(modal2.programName).toHaveValue(cohortName);

    await expect(modal2.description).toHaveValue(cohortDescription);

  });



  test('TC-005: Save is blocked when Name is cleared', { tag: '@sanity' }, async ({ page }) => {

    const programs = new ProgramsPage(page);

    const programName = uniqueName('Web Development 2026');

    await createProgram(page, programName, BASELINE_DESCRIPTION);



    const modal = await openEditModal(page, programName);

    await modal.fillField(modal.programName, '');



    await expect(modal.save).toBeDisabled();

    await modal.submitSaveForced();

    await expect(modal.root).toBeVisible();

    await expect(programs.row(programName).root).toBeVisible();

  });



  test('TC-006: Duplicate program name is rejected', { tag: '@sanity' }, async ({ page }) => {

    const programs = new ProgramsPage(page);

    const programName = uniqueName('Web Development 2026');

    const duplicateName = uniqueName('Data Science 2026');

    await createProgram(page, programName, BASELINE_DESCRIPTION);

    await createProgram(page, duplicateName, 'Data science curriculum');



    const modal = await openEditModal(page, programName);

    await modal.fillField(modal.programName, duplicateName);

    await modal.submitSave();



    const rowsForOriginal = await programs.row(programName).count();

    const duplicateBlocked =

      (await modal.root.isVisible()) || (await modal.hasVisibleValidationError());



    expect(rowsForOriginal).toBeGreaterThanOrEqual(1);

    expect(duplicateBlocked).toBeTruthy();

  });



  test('TC-007: Invalid over-limit Name input is not accepted', { tag: '@regression' }, async ({ page }) => {

    const programs = new ProgramsPage(page);

    const programName = uniqueName('Web Development 2026');

    const suffix = String(Date.now()).slice(-8);

    const overMaxName = `${'a'.repeat(256 - suffix.length)}${suffix}`;

    await createProgram(page, programName, BASELINE_DESCRIPTION);



    const modal = await openEditModal(page, programName);

    await modal.fillField(modal.programName, overMaxName);

    await modal.submitSave();



    const blocked =

      (await modal.root.isVisible()) || (await modal.hasVisibleValidationError());

    expect(blocked).toBeTruthy();

    await expect(programs.row(programName).root).toBeVisible();

    await expect(programs.row(overMaxName).root).toHaveCount(0);

  });



  test('TC-008: Canceling edit does not persist unsaved changes', { tag: '@sanity' }, async ({ page }) => {

    const programs = new ProgramsPage(page);

    const programName = uniqueName('Web Development 2026');

    const tempName = `${programName} - Temp`;

    await createProgram(page, programName, BASELINE_DESCRIPTION);



    const modal = await openEditModal(page, programName);

    await modal.fillField(modal.programName, tempName);

    await modal.cancelModal();

    await expect(modal.root).toBeHidden();

    await expect(programs.row(tempName).root).toHaveCount(0);



    const modal2 = await openEditModal(page, programName);

    await expect(modal2.programName).toHaveValue(programName);

  });



  test('TC-009: Name with leading/trailing spaces is handled consistently', { tag: '@regression' }, async ({ page }) => {

    const programs = new ProgramsPage(page);

    const programName = uniqueName('Web Development 2026');

    const trimmedName = `${programName} - Updated`;

    const paddedName = `  ${trimmedName}  `;

    await createProgram(page, programName, BASELINE_DESCRIPTION);



    const modal = await openEditModal(page, programName);

    await modal.fillField(modal.programName, paddedName);

    await modal.submitSave();

    await expect(modal.root).toBeHidden();



    const trimmedVisible = await programs.row(trimmedName).root.isVisible();

    const paddedVisible = await programs.row(paddedName).root.isVisible();

    expect(trimmedVisible || !paddedVisible).toBeTruthy();

    if (trimmedVisible) {

      await expect(programs.row(trimmedName).root).toBeVisible();

    }

  });



  test('TC-010: Name supports valid special characters', { tag: '@regression' }, async ({ page }) => {

    const programs = new ProgramsPage(page);

    const programName = uniqueName('Web Development 2026');

    const specialName = uniqueName('Web Development 2026: Front-End & Back-End');

    await createProgram(page, programName, BASELINE_DESCRIPTION);



    const modal = await openEditModal(page, programName);

    await modal.fillField(modal.programName, specialName);

    await modal.submitSave();

    await expect(modal.root).toBeHidden();



    const row = programs.row(specialName).root.first();

    await expect(row).toBeVisible();

    await expect(row).toContainText(specialName);

    await expect(programs.row(specialName).embeddedScripts()).toHaveCount(0);

  });



  test('TC-011: Description supports max-length boundary value', { tag: '@regression' }, async ({ page }) => {

    const programName = uniqueName('Web Development 2026');

    const maxDescription = 'd'.repeat(1000);

    await createProgram(page, programName, BASELINE_DESCRIPTION);



    const modal = await openEditModal(page, programName);

    await modal.fillField(modal.description, maxDescription);

    await modal.submitSave();



    if (await modal.root.isHidden({ timeout: 15_000 }).catch(() => false)) {

      const modal2 = await openEditModal(page, programName);

      await expect(modal2.description).toHaveValue(maxDescription);

    } else {

      expect(await modal.hasVisibleValidationError()).toBeTruthy();

    }

  });



  test('TC-012: Rapid repeated Save clicks do not create inconsistent updates', { tag: '@regression' }, async ({

    page,

  }) => {

    const programs = new ProgramsPage(page);

    const programName = uniqueName('Web Development 2026');

    const updatedName = `${programName} - Updated`;

    await createProgram(page, programName, BASELINE_DESCRIPTION);



    const modal = await openEditModal(page, programName);

    await modal.fillField(modal.programName, updatedName);

    await modal.doubleClickSave();



    await expect(modal.root).toBeHidden({ timeout: 15_000 });

    await expect

      .poll(() => programs.row(updatedName).count(), { timeout: 15_000 })

      .toBe(1);

    await expect(programs.row(programName).root).toHaveCount(0);

  });



  test('TC-013: Concurrent update conflict is handled safely', { tag: '@e2e' }, async ({ browser }) => {

    const programName = uniqueName('Web Development 2026');

    const nameFromB = `${programName} - Session B`;

    const descriptionFromA = 'Description saved from session A after B updated name';



    const contextA = await browser.newContext({ storageState: AUTH_STORAGE_PATH });

    const contextB = await browser.newContext({ storageState: AUTH_STORAGE_PATH });

    const pageA = await contextA.newPage();

    const pageB = await contextB.newPage();

    attachCreatedProgramTracker(pageA);



    try {

      await gotoProgramsPage(pageA);

      await createProgram(pageA, programName, BASELINE_DESCRIPTION);

      await gotoProgramsPage(pageB);



      const programsA = new ProgramsPage(pageA);

      const programsB = new ProgramsPage(pageB);



      const modalA = await programsA.row(programName).openEdit();

      const modalB = await programsB.row(programName).openEdit();



      await modalB.fillField(modalB.programName, nameFromB);

      await modalB.submitSave();

      await expect(modalB.root).toBeHidden();

      await expect(programsB.row(nameFromB).root).toBeVisible();



      await modalA.fillField(modalA.description, descriptionFromA);

      await modalA.submitSave();



      const dialogStillOpen = await modalA.root.isVisible();

      if (dialogStillOpen) {

        expect(await modalA.hasVisibleValidationError()).toBeTruthy();

        return;

      }



      await pageA.reload();

      await gotoProgramsPage(pageA);



      const nameBCount = await programsA.row(nameFromB).count();

      const staleOverwrite =

        nameBCount === 0 && (await programsA.row(programName).count()) > 0;



      expect(nameBCount).toBeGreaterThan(0);

      if (nameBCount > 0) {

        await expect(programsA.row(nameFromB).root.first()).toContainText(descriptionFromA);

      }

      expect(staleOverwrite).toBeFalsy();

    } finally {

      await detachAndCleanupCreatedPrograms(pageA);

      await contextA.close();

      await contextB.close();

    }

  });



  test('TC-014: Empty Description behavior follows validation rules', { tag: '@regression' }, async ({ page }) => {

    const programName = uniqueName('Web Development 2026');

    await createProgram(page, programName, BASELINE_DESCRIPTION);



    const modal = await openEditModal(page, programName);

    await modal.fillField(modal.description, '');

    await modal.submitSave();



    const saved = await modal.root.isHidden({ timeout: 15_000 }).catch(() => false);

    if (saved) {

      const modal2 = await openEditModal(page, programName);

      await expect(modal2.description).toHaveValue('');

      await expect(modal2.programName).toHaveValue(programName);

    } else {

      expect(await modal.hasVisibleValidationError()).toBeTruthy();

      await expect(modal.programName).toHaveValue(programName);

    }

  });

});

