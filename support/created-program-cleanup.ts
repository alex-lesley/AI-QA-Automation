import type { Page } from '@playwright/test';
import {
  buildApiHeaders,
  deleteProgramViaApi,
  getBaseUrl,
  requireApiToken,
} from '../.agent/skills/didaxis-delete-all-programs/scripts/didaxis-programs-api';

class CreatedProgramTracker {
  private readonly ids = new Set<string>();

  track(programId: string): void {
    this.ids.add(programId);
    globalCreatedProgramIds.add(programId);
  }

  startListening(page: Page): () => void {
    const handler = async (response: {
      url: () => string;
      request: () => { method: () => string };
      ok: () => boolean;
      json: () => Promise<unknown>;
    }) => {
      if (
        !response.url().includes('/api/programs') ||
        response.request().method() !== 'POST' ||
        !response.ok()
      ) {
        return;
      }

      pendingResponseHandlers += 1;
      try {
        const body = (await response.json().catch(() => null)) as {
          data?: { id?: string };
        } | null;
        const programId = body?.data?.id;
        if (programId) {
          this.track(programId);
        }
      } finally {
        pendingResponseHandlers -= 1;
      }
    };

    page.on('response', handler);
    return () => page.off('response', handler);
  }

  releaseIds(programIds: string[]): void {
    for (const programId of programIds) {
      this.ids.delete(programId);
      globalCreatedProgramIds.delete(programId);
    }
  }

  async cleanup(): Promise<void> {
    if (this.ids.size === 0) {
      return;
    }

    const programIds = [...this.ids];
    this.ids.clear();
    await deleteTrackedPrograms(programIds);
  }
}

/** Program IDs created during this worker run; afterAll removes any left after failed tests. */
const globalCreatedProgramIds = new Set<string>();
const trackerByPage = new WeakMap<Page, CreatedProgramTracker>();
const stopListeningByPage = new WeakMap<Page, () => void>();
let pendingResponseHandlers = 0;

async function waitForPendingTracks(timeoutMs = 10_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (pendingResponseHandlers > 0 && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  await new Promise((resolve) => setTimeout(resolve, 100));
}

const DELETE_BATCH_SIZE = 20;

async function deleteTrackedPrograms(programIds: string[]): Promise<void> {
  if (programIds.length === 0) {
    return;
  }

  const baseUrl = getBaseUrl();
  const headers = buildApiHeaders(requireApiToken());

  for (let index = 0; index < programIds.length; index += DELETE_BATCH_SIZE) {
    const batch = programIds.slice(index, index + DELETE_BATCH_SIZE);
    await Promise.all(
      batch.map(async (programId) => {
        try {
          await deleteProgramViaApi(baseUrl, headers, programId);
          globalCreatedProgramIds.delete(programId);
        } catch {
          // Keep in globalCreatedProgramIds for worker teardown retry.
        }
      }),
    );
  }
}

export function trackCreatedProgramId(page: Page, programId: string): void {
  const tracker = trackerByPage.get(page);
  if (tracker) {
    tracker.track(programId);
  } else {
    globalCreatedProgramIds.add(programId);
  }
}

/** Remove IDs already deleted during the test so fixture teardown skips them. */
export function releaseTrackedProgramIds(page: Page, programIds: string[]): void {
  if (programIds.length === 0) {
    return;
  }

  const tracker = trackerByPage.get(page);
  if (tracker) {
    tracker.releaseIds(programIds);
    return;
  }

  for (const programId of programIds) {
    globalCreatedProgramIds.delete(programId);
  }
}

export function attachCreatedProgramTracker(page: Page): void {
  const tracker = new CreatedProgramTracker();
  trackerByPage.set(page, tracker);
  stopListeningByPage.set(page, tracker.startListening(page));
}

export async function detachAndCleanupCreatedPrograms(page: Page): Promise<void> {
  const tracker = trackerByPage.get(page);

  await waitForPendingTracks();
  await tracker?.cleanup();

  await waitForPendingTracks(2_000);
  await tracker?.cleanup();

  stopListeningByPage.get(page)?.();
  stopListeningByPage.delete(page);
  trackerByPage.delete(page);
}

export async function cleanupRemainingCreatedPrograms(): Promise<void> {
  await waitForPendingTracks();
  if (globalCreatedProgramIds.size === 0) {
    return;
  }

  const programIds = [...globalCreatedProgramIds];
  await deleteTrackedPrograms(programIds);
}
