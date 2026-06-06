// @ts-check
/// <reference types="node" />
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '.env');
const envResult = dotenv.config({ path: envPath, quiet: !!process.env.CI });
if (envResult.error && !process.env.CI) {
  console.warn(`[playwright] Could not load ${envPath}:`, envResult.error.message);
}

const { defineConfig, devices } = require('@playwright/test');

const testResultsDir = path.resolve(__dirname, 'test-results');
const authFile = path.join(__dirname, 'playwright', '.auth', 'admin.json');

module.exports = defineConfig({
  outputDir: testResultsDir,
  testDir: path.join(__dirname, 'tests'),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'html',
  timeout: 60_000,
  use: {
    baseURL: process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio',
    trace: process.env.CI ? 'retain-on-failure' : 'on',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      timeout: 120_000,
    },
    {
      name: 'chromium',
      testMatch: '**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        storageState: authFile,
      },
      dependencies: ['setup'],
    },
  ],
});
