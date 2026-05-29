/**
 * Generic Playwright API cleanup template.
 * Copy tracker logic to tests/support/{resource}-cleanup.ts,
 * then wire it in tests/fixtures.ts (see api-cleanup skill).
 */
import type { Page } from '@playwright/test';

/** Adapt these values for your resource. */
const CONFIG = {
  /** Substring matched in create response URL (e.g. '/api/programs'). */
  createUrlIncludes: '/api/RESOURCE',
  createMethod: 'POST' as const,
  /** JSON path to resource ID in create response body (e.g. body.data.id). */
  extractId: (body: unknown): string | undefined => {
    const data = (body as { data?: { id?: string } } | null)?.data;
    return data?.id;
  },
};

class ResourceTracker {
  private readonly ids = new Set<string>();

  track(id: string): void {
    this.ids.add(id);
    globalTrackedIds.add(id);
  }

  startListening(page: Page): () => void {
    const handler = async (response: {
      url: () => string;
      request: () => { method: () => string };
      ok: () => boolean;
      json: () => Promise<unknown>;
    }) => {
      if (
        !response.url().includes(CONFIG.createUrlIncludes) ||
        response.request().method() !== CONFIG.createMethod ||
        !response.ok()
      ) {
        return;
      }

      pendingResponseHandlers += 1;
      try {
        const body = await response.json().catch(() => null);
        const id = CONFIG.extractId(body);
        if (id) {
          this.track(id);
        }
      } finally {
        pendingResponseHandlers -= 1;
      }
    };

    page.on('response', handler);
    return () => page.off('response', handler);
  }

  async cleanup(): Promise<void> {
    if (this.ids.size === 0) {
      return;
    }

    const ids = [...this.ids];
    this.ids.clear();
    await deleteTrackedResources(ids);
  }
}

const globalTrackedIds = new Set<string>();
const trackerByPage = new WeakMap<Page, ResourceTracker>();
const stopListeningByPage = new WeakMap<Page, () => void>();
let pendingResponseHandlers = 0;

async function waitForPendingTracks(timeoutMs = 10_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (pendingResponseHandlers > 0 && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  await new Promise((resolve) => setTimeout(resolve, 100));
}

/** Implement using your API client (fetch, page.request, or shared helper module). */
async function deleteResourceViaApi(id: string): Promise<void> {
  // Example:
  // await deleteProgramViaApi(getBaseUrl(), buildApiHeaders(requireApiToken()), id);
  throw new Error(`deleteResourceViaApi not implemented for id: ${id}`);
}

async function deleteTrackedResources(ids: string[]): Promise<void> {
  if (ids.length === 0) {
    return;
  }

  await Promise.all(
    ids.map(async (id) => {
      try {
        await deleteResourceViaApi(id);
        globalTrackedIds.delete(id);
      } catch {
        // Keep in globalTrackedIds for worker teardown retry.
      }
    }),
  );
}

export function attachResourceTracker(page: Page): void {
  const tracker = new ResourceTracker();
  trackerByPage.set(page, tracker);
  stopListeningByPage.set(page, tracker.startListening(page));
}

export async function detachAndCleanupResources(page: Page): Promise<void> {
  const tracker = trackerByPage.get(page);

  await waitForPendingTracks();
  await tracker?.cleanup();

  await waitForPendingTracks(2_000);
  await tracker?.cleanup();

  stopListeningByPage.get(page)?.();
  stopListeningByPage.delete(page);
  trackerByPage.delete(page);
}

export async function cleanupRemainingResources(): Promise<void> {
  await waitForPendingTracks();
  if (globalTrackedIds.size === 0) {
    return;
  }

  const ids = [...globalTrackedIds];
  await deleteTrackedResources(ids);
}
