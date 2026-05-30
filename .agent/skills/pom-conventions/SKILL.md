---
name: pom-conventions
description: Page Object Model conventions for Playwright tests in this project. Apply whenever generating, refactoring, or reviewing any Playwright test that interacts with the Didaxis UI — even if the user doesn't say "POM". Tests should never contain inline locators.
---

You are the Page Object Model specialist for Didaxis Studio Playwright tests.

All UI interactions go through Page Objects in `pages/`. Tests describe intent; POMs handle mechanics.

## Before You Code

1. **Explore the live UI** with Playwright MCP when structure is unclear:
   - Navigate to `https://test.didaxis.studio/login` (or `DIDAXIS_URL` from `.env`).
   - Capture `browser_snapshot` after login and on each major route.
   - Note accessible names for `getByRole` / `getByLabel` / `getByText` — never guess from markup alone.
2. **Read existing specs** in `tests/` for flows not yet covered by POMs.
3. **Reuse auth** — admin tests use `storageState` from `tests/auth.setup.ts`; only `LoginPage` performs UI login (setup + non-admin cases).

## Didaxis UI Map (current)

| Route / surface | Page Object | Notes |
|-----------------|-------------|--------|
| `/login` | `LoginPage` | Email & Password textboxes, **Sign In**; after login, **Sign out** visible in shell |
| `/programs` | `ProgramsPage` | Heading **Programs** (level 2), **+ New Program**, program **table**, empty-state copy |
| Modal **New Program** | `NewProgramModal` | **Program Name**, **Description**, **Create**, **Cancel**, header close |
| Modal **Edit Program** | `EditProgramModal` | Same fields; **Save** instead of **Create** |
| Table row (by name) | `ProgramRow` | Row with exact name text; buttons **Edit {name}**, **Delete {name}** |
| Native confirm on delete | `ProgramRow` methods | `window.confirm` — not a DOM dialog; use `page.waitForEvent('dialog')` in POM action methods only (no `expect` inside) |
| Empty list | `ProgramsPage` | Text like “no programs yet”; **Create Program** CTA |
| Toasts / errors | `ProgramsPage` | `getByRole('alert')` on page scope |

**Composition:** `ProgramsPage` owns `readonly newProgramModal` and `readonly editProgramModal` instances. Row actions return `ProgramRow` via `programsPage.row(programName)`.

## Steps

1. **One Page Object class per page or distinct component.**
   Examples: `LoginPage`, `ProgramsPage`, `NewProgramModal`, `EditProgramModal`, `ProgramRow`.

2. **Define locators as `readonly` properties in the constructor**, using `getByRole`, `getByLabel`, or `getByText` — never CSS selectors for primary UI.
   - Scoped locators live on the dialog/root passed in (e.g. modal constructor receives `page.getByRole('dialog', { name: 'New Program' })`).
   - Dynamic row/button names use a method: `row(programName: string): ProgramRow`.

3. **Provide methods for user actions:** `goto`, `openNewProgram`, `fillProgramName`, `clickCreate`, `clickDeleteAndConfirm`, etc.
   - Methods perform actions only; they do not call `expect`.
   - Action methods may return locators or sub-components the test will assert on.

4. **No assertions inside Page Objects.** All `expect(...)` calls live in `tests/*.spec.ts`.

5. **Compose POMs** when a page contains distinct components — e.g. `ProgramsPage` holds `newProgramModal` and `editProgramModal`; `ProgramRow` is constructed from the page + program name.

6. **Import POMs at the top of each spec;** instantiate with `new XxxPage(page)` (or receive `page` in `beforeEach`).

7. **Remove inline locators from specs.** After extraction, specs contain only: imports, test data helpers (`uniqueName`), `expect`, and POM method calls.

8. **Shared non-UI helpers stay out of `pages/`** — auth (`support/auth.ts`), API cleanup (`support/created-program-cleanup.ts`), fixtures (`fixtures/index.ts`).

## File Layout

```
pages/
  login.page.ts
  programs.page.ts
  components/
    new-program-modal.component.ts
    edit-program-modal.component.ts
    program-row.component.ts
```

Use `.page.ts` for full routes and `.component.ts` for modals and row fragments.

## Locator Reference (Didaxis — prefer these)

| Element | Locator |
|---------|---------|
| Email | `page.getByRole('textbox', { name: 'Email' })` |
| Password | `page.getByRole('textbox', { name: 'Password' })` |
| Sign In | `page.getByRole('button', { name: 'Sign In' })` |
| Sign out | `page.getByRole('button', { name: 'Sign out' })` |
| Programs heading | `page.getByRole('heading', { name: 'Programs', level: 2 })` |
| New program | `page.getByRole('button', { name: '+ New Program' })` |
| New Program dialog | `page.getByRole('dialog', { name: 'New Program' })` |
| Edit Program dialog | `page.getByRole('dialog', { name: 'Edit Program' })` |
| Program Name field | `dialog.getByRole('textbox', { name: 'Program Name' })` |
| Description field | `dialog.getByRole('textbox', { name: 'Description' })` |
| Create | `dialog.getByRole('button', { name: 'Create' })` |
| Save | `dialog.getByRole('button', { name: 'Save' })` |
| Cancel | `dialog.getByRole('button', { name: 'Cancel' })` |
| Modal close | `dialog.getByRole('banner').getByRole('button')` |
| Program row | `page.getByRole('row').filter({ has: page.getByText(name, { exact: true }) })` |
| Edit row action | `row.getByRole('button', { name: \`Edit ${name}\` })` |
| Delete row action | `row.getByRole('button', { name: \`Delete ${name}\` })` |
| Empty state | `page.getByText(/no programs yet\|no programs have been created/i)` |
| Create Program (empty) | `page.getByRole('button', { name: 'Create Program' })` |

**Validation messages:** prefer `dialog.getByText(/duplicate|already exists|required|…/i)`. Avoid Mantine/CSS selectors unless no accessible alternative exists; if used, isolate in one POM helper (e.g. `hasVisibleValidationError(): Promise<boolean>`) and document why.

## Example

### `pages/components/new-program-modal.component.ts`

```typescript
import type { Locator, Page } from '@playwright/test';

export class NewProgramModal {
  readonly root: Locator;
  readonly programName: Locator;
  readonly description: Locator;
  readonly create: Locator;
  readonly cancel: Locator;
  readonly close: Locator;

  constructor(private readonly page: Page) {
    this.root = page.getByRole('dialog', { name: 'New Program' });
    this.programName = this.root.getByRole('textbox', { name: 'Program Name' });
    this.description = this.root.getByRole('textbox', { name: 'Description' });
    this.create = this.root.getByRole('button', { name: 'Create' });
    this.cancel = this.root.getByRole('button', { name: 'Cancel' });
    this.close = this.root.getByRole('banner').getByRole('button');
  }

  async fill(options: { name?: string; description?: string }): Promise<void> {
    if (options.name !== undefined) await this.programName.fill(options.name);
    if (options.description !== undefined) await this.description.fill(options.description);
  }

  async submitCreate(): Promise<void> {
    await this.create.click();
  }
}
```

### `pages/programs.page.ts`

```typescript
import type { Page } from '@playwright/test';
import { baseUrl } from '../support/auth';
import { NewProgramModal } from './components/new-program-modal.component';
import { ProgramRow } from './components/program-row.component';

export class ProgramsPage {
  readonly newProgramModal: NewProgramModal;

  constructor(private readonly page: Page) {
    this.newProgramModal = new NewProgramModal(page);
  }

  async goto(): Promise<void> {
    await this.page.goto(`${baseUrl}/programs`);
  }

  async openNewProgram(): Promise<NewProgramModal> {
    await this.page.getByRole('button', { name: '+ New Program' }).click();
    return this.newProgramModal;
  }

  row(programName: string): ProgramRow {
    return new ProgramRow(this.page, programName);
  }
}
```

### Spec usage

```typescript
import { test, expect } from '../fixtures';
import { ProgramsPage } from '../pages/programs.page';

test('TC-001: form opens with required fields', async ({ page }) => {
  const programs = new ProgramsPage(page);
  await programs.goto();

  const modal = await programs.openNewProgram();

  await expect(modal.root).toBeVisible();
  await expect(modal.programName).toBeVisible();
  await expect(modal.create).toBeVisible();
});
```

## Rules

- **Never** put `page.getByRole(...)` (or any locator) directly in a spec file.
- **Never** put `expect(...)` inside `pages/`.
- Prefer **role-based** locators; `getByTestId` only if the app exposes stable test ids.
- POM **action** methods do not assert; tests assert using **exposed readonly locators** from the POM.
- Use **`storageState`** for admin; call `LoginPage` only in `auth.setup.ts` or tests that override auth (e.g. non-admin).
- When refactoring a spec, delete duplicated helper functions (`gotoProgramsPage`, `programRow`, etc.) from the spec after moving them to POMs.
- Keep test-only utilities (`uniqueName`, API helpers) in the spec or `support/`, not in POMs.

## Output

- New or updated files under `pages/` (and `pages/components/`).
- Updated `tests/*.spec.ts` files that import POMs and contain no inline locators.
- No changes to assertion semantics — behavior must match pre-refactor tests.
