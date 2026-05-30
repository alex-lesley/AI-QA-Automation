import { expect, type Locator, type Page } from '@playwright/test';
import path from 'path';

export const AUTH_STORAGE_PATH = path.join(__dirname, '../playwright/.auth/admin.json');

export const baseUrl = process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio';
export const loginUrl = `${baseUrl}/login`;

export function requireEnv(
  name: 'DIDAXIS_EMAIL' | 'DIDAXIS_PASSWORD' | 'DIDAXIS_NON_ADMIN_EMAIL' | 'DIDAXIS_NON_ADMIN_PASSWORD',
): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function setInputValue(locator: Locator, value: string): Promise<void> {
  await locator.evaluate((element, nextValue) => {
    const field = element as HTMLInputElement | HTMLTextAreaElement;
    const prototype =
      field instanceof HTMLTextAreaElement
        ? window.HTMLTextAreaElement.prototype
        : window.HTMLInputElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
    descriptor?.set?.call(field, nextValue);
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

export async function login(page: Page, email: string, password: string): Promise<void> {
  await page.goto(loginUrl);

  const emailField = page.getByRole('textbox', { name: 'Email' });
  const passwordField = page.getByRole('textbox', { name: 'Password' });

  await setInputValue(emailField, email);
  await setInputValue(passwordField, password);

  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible({ timeout: 30_000 });
}

export async function loginAsAdmin(page: Page): Promise<void> {
  await login(page, requireEnv('DIDAXIS_EMAIL'), requireEnv('DIDAXIS_PASSWORD'));
}
