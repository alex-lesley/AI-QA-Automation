import type { Locator, Page } from '@playwright/test';

export class EditProgramModal {
  readonly root: Locator;
  readonly programName: Locator;
  readonly description: Locator;
  readonly save: Locator;
  readonly cancel: Locator;
  readonly close: Locator;

  constructor(private readonly page: Page) {
    this.root = page.getByRole('dialog', { name: 'Edit Program' });
    this.programName = this.root.getByRole('textbox', { name: 'Program Name' });
    this.description = this.root.getByRole('textbox', { name: 'Description' });
    this.save = this.root.getByRole('button', { name: 'Save' });
    this.cancel = this.root.getByRole('button', { name: 'Cancel' });
    this.close = this.root.getByRole('banner').getByRole('button');
  }

  async fill(options: { name?: string; description?: string }): Promise<void> {
    if (options.name !== undefined) {
      await this.programName.fill(options.name);
    }
    if (options.description !== undefined) {
      await this.description.fill(options.description);
    }
  }

  async fillField(locator: Locator, value: string): Promise<void> {
    await locator.fill(value);
  }

  async submitSave(): Promise<void> {
    await this.save.click();
  }

  async submitSaveForced(): Promise<void> {
    await this.save.click({ force: true }).catch(() => undefined);
  }

  async doubleClickSave(): Promise<void> {
    await this.save.dblclick();
  }

  async cancelModal(): Promise<void> {
    await this.cancel.click();
  }

  /** Mantine error styling when no accessible validation message exists. */
  async hasVisibleValidationError(): Promise<boolean> {
    const errorLocator = this.root.locator(
      '[data-error="true"], .mantine-InputWrapper-error, [class*="Input-error"]',
    );
    if (await errorLocator.first().isVisible().catch(() => false)) {
      return true;
    }
    return this.root
      .getByText(
        /too long|too many|exceed|maximum|invalid|required|duplicate|already exists/i,
      )
      .first()
      .isVisible()
      .catch(() => false);
  }
}
