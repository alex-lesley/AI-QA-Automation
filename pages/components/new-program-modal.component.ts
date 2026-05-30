import type { Locator, Page } from '@playwright/test';

export class NewProgramModal {
  readonly root: Locator;
  readonly programName: Locator;
  readonly description: Locator;
  readonly create: Locator;
  readonly cancel: Locator;
  readonly close: Locator;
  readonly duplicateNameError: Locator;

  constructor(private readonly page: Page) {
    this.root = page.getByRole('dialog', { name: 'New Program' });
    this.programName = this.root.getByRole('textbox', { name: 'Program Name' });
    this.description = this.root.getByRole('textbox', { name: 'Description' });
    this.create = this.root.getByRole('button', { name: 'Create' });
    this.cancel = this.root.getByRole('button', { name: 'Cancel' });
    this.close = this.root.getByRole('banner').getByRole('button');
    this.duplicateNameError = this.root.getByText(
      /already exists|duplicate|unique|name is taken/i,
    );
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

  async submitCreate(): Promise<void> {
    await this.create.click();
  }

  async submitCreateForced(): Promise<void> {
    if (await this.create.isEnabled()) {
      await this.create.click();
    } else {
      await this.create.click({ force: true }).catch(() => undefined);
    }
  }

  async doubleClickCreate(): Promise<void> {
    await this.create.dblclick();
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
        /too long|too many|exceed|maximum|invalid character|invalid name|duplicate|already exists|not allowed|is required$|invalid|required/i,
      )
      .first()
      .isVisible()
      .catch(() => false);
  }
}
