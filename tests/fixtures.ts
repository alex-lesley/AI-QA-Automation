import { test as base, expect } from '@playwright/test';
import {
  attachCreatedProgramTracker,
  cleanupRemainingCreatedPrograms,
  detachAndCleanupCreatedPrograms,
} from './support/created-program-cleanup';

type WorkerFixtures = {
  _workerCreatedProgramCleanup: void;
};

export const test = base.extend<object, WorkerFixtures>({
  _workerCreatedProgramCleanup: [
    async ({}, use) => {
      await use();
      await cleanupRemainingCreatedPrograms();
    },
    { scope: 'worker', auto: true },
  ],

  page: async ({ page }, use) => {
    attachCreatedProgramTracker(page);
    await use(page);
    await detachAndCleanupCreatedPrograms(page);
  },
});

export { expect };
