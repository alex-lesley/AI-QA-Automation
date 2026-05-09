// @ts-check
const path = require('path');
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  outputDir: path.join(__dirname, 'test-results'),
  testDir: '.',
  testMatch: '**/todomvc.spec.js',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    ...devices['Desktop Chrome'],
    trace: 'on',
  },
});
