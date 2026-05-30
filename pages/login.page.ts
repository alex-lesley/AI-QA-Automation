import type { Locator, Page } from '@playwright/test';
import { loginUrl } from '../support/auth';

export class LoginPage {
  readonly email: Locator;
  readonly password: Locator;
  readonly signIn: Locator;
  readonly signOut: Locator;

  constructor(private readonly page: Page) {
    this.email = page.getByRole('textbox', { name: 'Email' });
    this.password = page.getByRole('textbox', { name: 'Password' });
    this.signIn = page.getByRole('button', { name: 'Sign In' });
    this.signOut = page.getByRole('button', { name: 'Sign out' });
  }

  async goto(): Promise<void> {
    await this.page.goto(loginUrl);
  }

  async signInWith(email: string, password: string): Promise<void> {
    await this.goto();
    await this.email.fill(email);
    await this.password.fill(password);
    await this.signIn.click();
  }
}
