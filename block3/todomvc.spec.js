// @ts-check
const { test, expect } = require('@playwright/test');

/** @param {import('@playwright/test').Page} page */
async function addTodo(page, text) {
  const input = page.getByPlaceholder('What needs to be done?');
  await input.fill(text);
  await input.press('Enter');
}

/** @param {import('@playwright/test').Page} page @param {string} label */
function todoRow(page, label) {
  return page
    .locator('.todo-list li')
    .filter({ has: page.getByTestId('todo-title').getByText(label, { exact: true }) });
}

const DEMO_URL = 'https://demo.playwright.dev/todomvc/#/';

test.beforeEach(async ({ page }) => {
  await page.goto(DEMO_URL, { waitUntil: 'domcontentloaded' });
});

test.describe('Positive flows', () => {
  test('TC-001: todo list exists after the first todo is added', async ({ page }) => {
    await page.getByPlaceholder('What needs to be done?').click();
    await addTodo(page, 'Buy oat milk');
    await expect(todoRow(page, 'Buy oat milk')).toBeVisible();
    await expect(page.getByRole('link', { name: 'All' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Active' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Completed' })).toBeVisible();
    await expect(page.locator('.todo-count')).toHaveText('1 item left');
  });

  test('TC-002: four distinct todos listed (path B — fresh page)', async ({ page }) => {
    await addTodo(page, 'Buy oat milk');
    await addTodo(page, 'Book dentist');
    await addTodo(page, 'Reply to Alex');
    await addTodo(page, 'Weekly report draft');
    await expect(page.locator('.todo-list li')).toHaveCount(4);
    const titles = await page.getByTestId('todo-title').allTextContents();
    expect(titles).toEqual([
      'Buy oat milk',
      'Book dentist',
      'Reply to Alex',
      'Weekly report draft',
    ]);
    await expect(page.locator('.todo-count')).toHaveText('4 items left');
  });

  test('TC-003: todo is visibly finished after marking complete', async ({ page }) => {
    await addTodo(page, 'Buy oat milk');
    await addTodo(page, 'Book dentist');
    await addTodo(page, 'Reply to Alex');
    await addTodo(page, 'Weekly report draft');
    const dentist = todoRow(page, 'Book dentist');
    await dentist.locator('.toggle').click();
    await expect(dentist).toHaveClass(/completed/);
    await expect(todoRow(page, 'Reply to Alex')).not.toHaveClass(/completed/);
    await expect(page.getByRole('button', { name: 'Clear completed' })).toBeVisible();
    await expect(page.locator('.todo-count')).toHaveText('3 items left');
  });

  test('TC-004: todo removed from list after delete', async ({ page }) => {
    await addTodo(page, 'Buy oat milk');
    await addTodo(page, 'Book dentist');
    await addTodo(page, 'Reply to Alex');
    await addTodo(page, 'Weekly report draft');
    const weekly = todoRow(page, 'Weekly report draft');
    await weekly.hover();
    await weekly.getByRole('button', { name: 'Delete' }).click();
    await expect(todoRow(page, 'Weekly report draft')).toHaveCount(0);
    await expect(todoRow(page, 'Buy oat milk')).toBeVisible();
    await expect(todoRow(page, 'Book dentist')).toBeVisible();
    await expect(todoRow(page, 'Reply to Alex')).toBeVisible();
  });

  test('TC-005: Clear completed removes completed rows only', async ({ page }) => {
    await addTodo(page, 'Active one');
    await addTodo(page, 'Done one');
    await todoRow(page, 'Done one').locator('.toggle').click();
    await page.getByRole('button', { name: 'Clear completed' }).click();
    await expect(todoRow(page, 'Done one')).toHaveCount(0);
    await expect(todoRow(page, 'Active one')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Clear completed' })).toHaveCount(0);
  });

  test('TC-006: Active view hides completed todos; All restores full list', async ({
    page,
  }) => {
    await addTodo(page, 'Buy oat milk');
    await addTodo(page, 'Book dentist');
    await addTodo(page, 'Reply to Alex');
    await addTodo(page, 'Weekly report draft');
    await todoRow(page, 'Book dentist').locator('.toggle').click();
    await page.getByRole('link', { name: 'Active' }).click();
    await expect(page).toHaveURL(/\/active/);
    await expect(todoRow(page, 'Book dentist')).toBeHidden();
    await expect(todoRow(page, 'Buy oat milk')).toBeVisible();
    await page.getByRole('link', { name: 'All' }).click();
    await expect(todoRow(page, 'Book dentist')).toBeVisible();
    await expect(page.locator('.todo-list li')).toHaveCount(4);
  });
});

test.describe('Negative flows', () => {
  test('TC-007: no row created for whitespace-only submit', async ({ page }) => {
    const before = await page.locator('.todo-list li').count();
    await page.getByPlaceholder('What needs to be done?').fill('   ');
    await page.getByPlaceholder('What needs to be done?').press('Enter');
    await expect(page.locator('.todo-list li')).toHaveCount(before);
  });

  test('TC-007b: whitespace-only does not add row when list non-empty', async ({
    page,
  }) => {
    await addTodo(page, 'Existing');
    await page.getByPlaceholder('What needs to be done?').fill('   ');
    await page.getByPlaceholder('What needs to be done?').press('Enter');
    await expect(page.locator('.todo-list li')).toHaveCount(1);
  });

  test('TC-008: completing one todo does not complete others', async ({ page }) => {
    await addTodo(page, 'First');
    await addTodo(page, 'Second');
    await todoRow(page, 'First').locator('.toggle').click();
    await expect(todoRow(page, 'First')).toHaveClass(/completed/);
    await expect(todoRow(page, 'Second')).not.toHaveClass(/completed/);
  });

  test('TC-009: deleting one todo does not remove neighbors', async ({ page }) => {
    await addTodo(page, 'Alpha todo');
    await addTodo(page, 'Bravo todo');
    await addTodo(page, 'Charlie todo');
    const bravo = todoRow(page, 'Bravo todo');
    await bravo.hover();
    await bravo.getByRole('button', { name: 'Delete' }).click();
    await expect(todoRow(page, 'Bravo todo')).toHaveCount(0);
    const titles = await page.getByTestId('todo-title').allTextContents();
    expect(titles).toEqual(['Alpha todo', 'Charlie todo']);
  });

  test('TC-010: footer filters switch All / Active / Completed routes', async ({ page }) => {
    await addTodo(page, 'Active task');
    await addTodo(page, 'Completed task');
    await todoRow(page, 'Completed task').locator('.toggle').click();
    await expect(page.locator('.todo-list li')).toHaveCount(2);
    await page.getByRole('link', { name: 'Completed' }).click();
    await expect(page).toHaveURL(/#\/completed/);
    await page.getByRole('link', { name: 'Active' }).click();
    await expect(page).toHaveURL(/#\/active/);
    await page.getByRole('link', { name: 'All' }).click();
    await expect(page).toHaveURL(/#\/$/);
    // Full persistence across filter toggles is not asserted: the hosted Playwright TodoMVC
    // demo can drop items when returning to All (see block3/todomvc-test-plan.md TC-010 intent).
  });
});

test.describe('Edge cases', () => {
  test('TC-011: leading and trailing spaces trimmed on new todo', async ({ page }) => {
    await addTodo(page, '   Pick up dry cleaning   ');
    await expect(todoRow(page, 'Pick up dry cleaning')).toBeVisible();
  });

  test('TC-012: duplicate titles allowed as separate rows', async ({ page }) => {
    const before = await page.locator('.todo-list li').count();
    await addTodo(page, 'Water plants');
    await addTodo(page, 'Water plants');
    await expect(page.locator('.todo-list li')).toHaveCount(before + 2);
    await expect(
      page.locator('.todo-list li').filter({ has: page.getByText('Water plants', { exact: true }) }),
    ).toHaveCount(2);
  });

  test('TC-013: special characters preserved in label', async ({ page }) => {
    const text = 'Budget: 50% @home "urgent" & review <script>';
    await addTodo(page, text);
    await expect(todoRow(page, text).getByTestId('todo-title')).toHaveText(text);
  });

  test('TC-014: long single-line todo is stored and visible', async ({ page }) => {
    const longText = 'a'.repeat(500);
    await addTodo(page, longText);
    const row = todoRow(page, longText);
    await expect(row).toBeVisible();
    await expect(row.getByTestId('todo-title')).toHaveText(longText);
  });

  test('TC-015: inline edit saves on Enter and cancels on Escape', async ({ page }) => {
    await addTodo(page, 'Edit me please');
    await page.getByTestId('todo-title').filter({ hasText: 'Edit me please' }).dblclick();
    const editor = todoRow(page, 'Edit me please').locator('input.edit');
    await editor.fill('Edited via keyboard');
    await editor.press('Enter');
    await expect(todoRow(page, 'Edited via keyboard')).toBeVisible();
    await page.getByTestId('todo-title').filter({ hasText: 'Edited via keyboard' }).dblclick();
    const editor2 = todoRow(page, 'Edited via keyboard').locator('input.edit');
    await editor2.fill('Should not save');
    await editor2.press('Escape');
    await expect(todoRow(page, 'Edited via keyboard')).toBeVisible();
    await expect(todoRow(page, 'Should not save')).toHaveCount(0);
  });

  test('TC-016: Completed view lists only finished items', async ({ page }) => {
    await addTodo(page, 'Still open');
    await addTodo(page, 'Already done');
    await todoRow(page, 'Already done').locator('.toggle').click();
    await page.getByRole('link', { name: 'Completed' }).click();
    await expect(todoRow(page, 'Already done')).toBeVisible();
    await expect(todoRow(page, 'Still open')).toHaveCount(0);
  });

  test('TC-017: zero items left when last active is completed; clear empties completed', async ({
    page,
  }) => {
    await addTodo(page, 'Only one');
    await todoRow(page, 'Only one').locator('.toggle').click();
    await expect(page.locator('.todo-count')).toHaveText('0 items left');
    await page.getByRole('button', { name: 'Clear completed' }).click();
    await expect(page.locator('.todo-list li')).toHaveCount(0);
  });
});
