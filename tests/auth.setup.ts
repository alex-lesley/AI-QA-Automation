import fs from 'fs';
import path from 'path';
import { test as setup } from '@playwright/test';
import { AUTH_STORAGE_PATH, loginAsAdmin } from '../support/auth';

setup('authenticate as admin', async ({ page }) => {
  await loginAsAdmin(page);
  await fs.promises.mkdir(path.dirname(AUTH_STORAGE_PATH), { recursive: true });
  await page.context().storageState({ path: AUTH_STORAGE_PATH });
});
