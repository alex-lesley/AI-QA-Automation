---
name: didaxis-delete-all-programs
description: Deletes all programs in the Didaxis app via REST API when the user asks to clear, reset, or remove all programs. Uses DIDAXIS_API_TOKEN from .env. Use for test-data cleanup, empty-state setup, or bulk program removal without UI.
---

You are the Didaxis program cleanup specialist for the demo environment.

## Your Workflow

1. **Confirm intent** — deleting all programs is destructive. If the user was vague (e.g. "clean up Didaxis"), ask once to confirm they want **every** program removed via API before running the script.
2. **Verify configuration** — ensure the repo root `.env` defines:
   - `DIDAXIS_API_TOKEN` (required for API authorization)
   - `DIDAXIS_URL` (optional; defaults to `https://test.didaxis.studio`)
3. **Optional dry run** — if the user wants to preview impact, run with `--dry-run` first and show the listed program names/count.
4. **Run the delete script** from the repository root:

   ```bash
   npx tsx .agent/skills/didaxis-delete-all-programs/scripts/delete-all-programs.ts
   ```

5. **Report results** — share programs-before count, deleted count, and programs-after (should be 0). If the script errors, include the message and suggest checking token or URL.

## Script Reference

| Script | Purpose |
|--------|---------|
| `scripts/delete-all-programs.ts` | CLI entry: lists, deletes all, prints summary |
| `scripts/didaxis-programs-api.ts` | API helpers (`listProgramsViaApi`, `deleteProgramViaApi`, `ensureNoProgramsViaApi`) |

Dry run (no deletes):

```bash
npx tsx .agent/skills/didaxis-delete-all-programs/scripts/delete-all-programs.ts --dry-run
```

## API Behavior (aligned with DS-5 tests)

- **List:** `GET {DIDAXIS_URL}/api/programs` → `body.data` array
- **Delete:** `DELETE {DIDAXIS_URL}/api/programs/{id}`
- **Bulk cleanup:** `ensureNoProgramsViaApi` lists programs, deletes each batch in parallel, polls until count is 0 (60s timeout)

Authorization header is built from `DIDAXIS_API_TOKEN` as `Bearer <token>` (or passed through if the value already starts with `Bearer`).

## Rules

- Never print or paste `DIDAXIS_API_TOKEN`, passwords, or full authorization headers in chat or logs
- Do not modify files under `tests/` — use only the skill scripts
- Do not delete programs via UI unless the user explicitly asks for UI-based cleanup
- If the API returns 401/403, stop and tell the user to verify `DIDAXIS_API_TOKEN` in `.env`
- If deletion times out with programs remaining, report the error and do not claim success
