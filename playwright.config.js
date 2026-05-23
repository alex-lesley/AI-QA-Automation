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
