---
name: api-cleanup
description: Creates Playwright fixture-based API cleanup that tracks resources created during UI tests and deletes them after each test, leaving other users' data intact. Use when tests create entities via UI, need teardown fixtures, per-test or worker-scoped cleanup, or targeted delete instead of bulk delete-all.
---

You are the API cleanup fixture specialist for Playwright E2E tests.

## Your Workflow

1. **Confirm scope** — cleanup must delete only resources **created by the test run**, not all tenant data. If the user asked for full reset, use a bulk-delete skill/script instead.
2. **Identify the create API** — find the endpoint the UI calls on create:
   - Method (usually `POST`)
   - URL pattern (e.g. `/api/programs`)
   - Response shape for the resource ID (e.g. `body.data.id`)
3. **Identify the delete API** — find the matching delete endpoint (e.g. `DELETE /api/{resource}/{id}`) and auth requirements (token env var, session header, etc.).
4. **Create the support module** at `support/{resource}-cleanup.ts`:
   - Start from [scripts/api-cleanup-template.ts](scripts/api-cleanup-template.ts)
   - Or copy the reference implementation at `support/created-program-cleanup.ts`
   - Export: `attach*Tracker`, `detachAndCleanup*`, `cleanupRemaining*`
5. **Wire fixtures** in `fixtures/index.ts`:
   - Start from [scripts/fixtures-template.ts](scripts/fixtures-template.ts)
   - Or copy the reference implementation at `fixtures/index.ts`
   - Override `page` for per-test setup/teardown
   - Add a worker-scoped auto fixture for global fallback cleanup
6. **Update spec imports** — specs that create resources:
   ```typescript
   import { type Locator, type Page } from '@playwright/test';
   import { test, expect } from '../fixtures';
   ```
   Specs without cleanup needs may keep importing from `@playwright/test` directly.
7. **Handle extra pages** — for manually created pages (multi-context tests), call `attach*Tracker(page)` in setup and `detachAndCleanup*(page)` in `finally`. The default `page` fixture does not cover extra contexts.

## Cleanup Fixture Template

Two files work together: a **support module** (tracker logic) and a **fixtures file** (Playwright wiring).

### File 1: `support/{resource}-cleanup.ts`

Tracker listens for successful create responses and stores IDs. Key exports:

| Export | Purpose |
|--------|---------|
| `attach*Tracker(page)` | Start listening on a page |
| `detachAndCleanup*(page)` | Wait for pending handlers, delete tracked IDs, stop listener |
| `cleanupRemaining*()` | Worker teardown fallback for failed/late-tracked resources |

Lifecycle:

```
page fixture setup    → attach response listener on page
UI creates resource   → POST response captured → ID stored (local + global set)
page fixture teardown → wait for async handlers → DELETE each tracked ID via API
worker teardown       → DELETE any IDs still in global set (failed-test safety net)
```

Required implementation details:

- Track only successful creates (ignore non-OK POST responses)
- Wait for async `page.on('response')` handlers before cleanup — they finish after the test body
- Use `WeakMap<Page, Tracker>` for per-page isolation in parallel workers
- Keep a worker-scoped global `Set<string>` retried in worker fixture teardown
- Delete only explicitly tracked IDs — never list-all or delete by name
- Swallow 404 on already-deleted resources; keep ID in global set if delete fails for retry

### File 2: `fixtures/index.ts`

```typescript
import { test as base, expect } from '@playwright/test';
import {
  attachCreatedProgramTracker,
  cleanupRemainingCreatedPrograms,
  detachAndCleanupCreatedPrograms,
} from '../support/created-program-cleanup';

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
```

### Spec import pattern

```typescript
import { type Locator, type Page } from '@playwright/test';
import { test, expect } from '../fixtures';
```

### Extra page pattern (multi-context tests)

```typescript
test('concurrent sessions', async ({ browser }) => {
  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();
  attachCreatedProgramTracker(pageA);

  try {
    // test steps that create resources on pageA
  } finally {
    await detachAndCleanupCreatedPrograms(pageA);
    await contextA.close();
  }
});
```

## Script Reference

| Script / File | Purpose |
|---------------|---------|
| `scripts/api-cleanup-template.ts` | Generic tracker support module to adapt for any resource |
| `scripts/fixtures-template.ts` | Generic fixtures wiring template |
| `support/created-program-cleanup.ts` | Didaxis programs reference tracker |
| `fixtures/index.ts` | Didaxis programs reference fixtures |

## Rules

- Delete only **tracked IDs** from the current test run — never bulk-delete all resources unless explicitly requested
- Wire cleanup via **fixtures** (`page` override + worker-scoped auto fixture), not `beforeEach`/`afterEach`/`afterAll` hooks
- Never print or paste API tokens, passwords, or authorization headers in chat or logs
- Read auth from `.env` or existing API helper modules; do not hardcode secrets
- Always use API cleanup, not UI delete — faster, more reliable, works even when the test fails mid-assertion
- Do not require test authors to manually pass IDs — capture from POST responses automatically
- Handle extra browser contexts explicitly — the default `page` fixture does not cover manually created pages
- If cleanup leaves resources behind, fix the async-handler race before adding name-based fallback deletes
- Verify cleanup on the firts run after implementation: run the affected specs and confirm API list count matches baseline
