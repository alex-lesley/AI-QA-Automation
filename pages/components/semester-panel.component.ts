import type { Locator, Page } from '@playwright/test';

export class SemesterPanel {
  readonly root: Locator;
  readonly selectPrompt: Locator;
  readonly heading: Locator;
  readonly newSemesterButton: Locator;
  readonly manageCourses: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByText('Semesters & scheduling config');
    this.selectPrompt = page.getByText('Select a program to manage semesters');
    this.newSemesterButton = page.getByRole('button', { name: '+ Semester' });
    this.manageCourses = page.getByRole('button', { name: 'Manage Courses' });
    this.root = page.locator('main').filter({ has: this.heading }).filter({ has: this.newSemesterButton });
  }

  selectedProgramName(programName: string): Locator {
    return this.page.getByRole('heading', { name: programName, level: 4 });
  }
}
