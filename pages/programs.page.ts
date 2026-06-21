import type { Locator, Page } from '@playwright/test';
import { baseUrl } from '../support/auth';
import { EditProgramModal } from './components/edit-program-modal.component';
import { NewProgramModal } from './components/new-program-modal.component';
import { ProgramRow } from './components/program-row.component';
import { SemesterPanel } from './components/semester-panel.component';

export class ProgramsPage {
  readonly heading: Locator;
  readonly newProgramButton: Locator;
  readonly table: Locator;
  readonly alert: Locator;
  readonly emptyStateMessage: Locator;
  readonly createProgramButton: Locator;
  readonly duplicateNameHint: Locator;
  readonly errorHint: Locator;
  readonly unauthorizedHint: Locator;
  readonly deleteSuccessHint: Locator;
  readonly newProgramModal: NewProgramModal;
  readonly editProgramModal: EditProgramModal;
  readonly semesterPanel: SemesterPanel;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Programs', level: 2 });
    this.newProgramButton = page.getByRole('button', { name: '+ New Program' });
    this.table = page.getByRole('table');
    this.alert = page.getByRole('alert');
    this.emptyStateMessage = page.getByText(/no programs yet|no programs have been created/i);
    this.createProgramButton = page.getByRole('button', { name: 'Create Program' });
    this.duplicateNameHint = page.getByText(/duplicate|already exists|unique/i);
    this.errorHint = page.getByText(/error|failed|try again|network/i);
    this.unauthorizedHint = page.getByText(/unauthorized|permission|forbidden|not allowed/i);
    this.deleteSuccessHint = page.getByText(/deleted successfully|program deleted/i);
    this.newProgramModal = new NewProgramModal(page);
    this.editProgramModal = new EditProgramModal(page);
    this.semesterPanel = new SemesterPanel(page);
  }

  async goto(): Promise<void> {
    await this.page.goto(`${baseUrl}/programs`);
  }

  async openNewProgram(): Promise<NewProgramModal> {
    await this.newProgramButton.click();
    return this.newProgramModal;
  }

  row(programName: string): ProgramRow {
    return new ProgramRow(this.page, programName);
  }

  rowsWithText(text: string): Locator {
    return this.page.getByRole('row').filter({ hasText: text });
  }

  async countVisibleProgramRows(): Promise<number> {
    if (!(await this.table.isVisible().catch(() => false))) {
      return 0;
    }
    return this.table.locator('tbody tr').count();
  }

  errorAlerts(): Locator {
    return this.alert.filter({ hasText: /error|failed|unable|crash/i });
  }
}
