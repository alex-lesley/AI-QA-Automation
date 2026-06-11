/**
 * Generic Playwright fixtures template for API cleanup.
 * Copy to fixtures/index.ts and wire to your support module exports.
 */
import { test as base, expect } from '@playwright/test';
import {
  attachResourceTracker,
  cleanupRemainingResources,
  detachAndCleanupResources,
} from '../support/RESOURCE-cleanup';

type WorkerFixtures = {
  _workerResourceCleanup: void;
};

export const test = base.extend<object, WorkerFixtures>({
  _workerResourceCleanup: [
    async ({}, use) => {
      await use();
      await cleanupRemainingResources();
    },
    { scope: 'worker', auto: true },
  ],

  page: async ({ page }, use) => {
    attachResourceTracker(page);
    await use(page);
    await detachAndCleanupResources(page);
  },
});

export { expect };
