import type { Locator, Page } from '@playwright/test';
import { EditProgramModal } from './edit-program-modal.component';

export class ProgramRow {
  readonly root: Locator;
  readonly edit: Locator;
  readonly delete: Locator;

  constructor(
    private readonly page: Page,
    private readonly programName: string,
  ) {
    this.root = page.getByRole('row').filter({
      has: page.getByText(programName, { exact: true }),
    });
    this.edit = this.root.getByRole('button', { name: `Edit ${programName}` });
    this.delete = this.root.getByRole('button', { name: `Delete ${programName}` });
  }

  nameText(): Locator {
    return this.root.getByText(this.programName, { exact: true });
  }

  textExact(value: string): Locator {
    return this.root.getByText(value, { exact: true });
  }

  /** Guards against HTML injection rendering executable markup in a row. */
  embeddedScripts(): Locator {
    return this.root.locator('script');
  }

  async select(): Promise<void> {
    await this.nameText().click();
  }

  async openEdit(): Promise<EditProgramModal> {
    await this.edit.click();
    return new EditProgramModal(this.page);
  }

  async clickDelete(): Promise<void> {
    await this.delete.click();
  }

  async clickDeleteAndAccept(): Promise<string> {
    let message = '';
    await Promise.all([
      this.page.waitForEvent('dialog').then(async (dialog) => {
        message = dialog.message();
        await dialog.accept();
      }),
      this.delete.click(),
    ]);
    return message;
  }

  async clickDeleteAndDismiss(): Promise<string> {
    let message = '';
    await Promise.all([
      this.page.waitForEvent('dialog').then(async (dialog) => {
        message = dialog.message();
        await dialog.dismiss();
      }),
      this.delete.click(),
    ]);
    return message;
  }

  async count(): Promise<number> {
    return this.root.count();
  }
}
