// @ts-check
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({
  path: path.resolve(__dirname, '.env'),
  quiet: !!process.env.CI,
});

const { defineConfig, devices } = require('@playwright/test');

const testResultsDir = path.resolve(__dirname, 'test-results');

module.exports = defineConfig({
  outputDir: testResultsDir,
  testDir: path.join(__dirname, 'tests'),
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 60_000,
  use: {
    ...devices['Desktop Chrome'],
    trace: 'on',
  },
});
