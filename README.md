# AI QA Automation

Playwright end-to-end tests for the Didaxis app, plus Cursor agents/skills that turn Jira tickets into specs and triage CI failures.

## Prerequisites

- Node.js 20+
- Access to the Didaxis test environment
- A Didaxis API token for cleanup / setup helpers

## Setup

```bash
git clone https://github.com/alex-lesley/AI-QA-Automation.git
cd AI-QA-Automation
npm ci
npx playwright install chromium
cp .env.example .env
```

Edit `.env` with real values. See [`.env.example`](.env.example) for required vs agent/CI variables. Never commit `.env`.

## Run tests

```bash
# Full suite (auth setup + chromium specs)
npx playwright test
# or
npm run test:all

# Tagged slices (exactly one tag per test — see playwright-conventions)
npm run test:smoke        # CI: every pull_request
npm run test:sanity       # CI: every push
npm run test:regression
npm run test:api
npm run test:e2e
npm run test:destructive   # --workers=1; shared/global state only

# UI mode / HTML report
npm run test:e2e:ui
npm run test:e2e:report
```

### Tagged slice (grep)

```bash
npx playwright test --grep @smoke
npx playwright test tests/ds1-create-program.spec.ts --grep @smoke
```

Tags: `@smoke` · `@sanity` · `@regression` · `@api` · `@e2e` · `@destructive`  
(`@destructive` = shared/global mutation only; own-data cleanup keeps an importance tag.)

### Single ticket / file

```bash
npx playwright test tests/ds2-edit-program.spec.ts
```

## Environment variables

| Section | When you need it |
|---------|------------------|
| **Run tests** | Required to clone and run `npx playwright test` |
| **Agent / CI setup** | Headless Cursor agent in `.github/workflows/test-generation.yml`, and Atlassian/GitHub MCP in Cursor settings — not needed for local Playwright alone |

Details and placeholders live in [`.env.example`](.env.example).

## Cursor agents & skills

This repo’s `.cursor/` layout drives ticket → plan → spec → triage:

| Path | Role |
|------|------|
| `.cursor/rules/constitution.mdc` | Always-on MUST / SHOULD / WON'T |
| `.cursor/rules/playwright-conventions.mdc` | Locator, wait, auth, assertion detail |
| `.cursor/rules/qa-orchestrator.mdc` | Coordinator — delegate, don’t write specs yourself |
| `.cursor/agents/` | `triage`, `test-writer`, `bug-reporter` |
| `.cursor/skills/` | `jira-ticket-analyzer`, `exploratory-charter`, `pom-conventions`, `api-cleanup`, `ci-failure-triage`, `self-heal`, … |
| `.cursor/hooks/` | Blocks constitution WON'T edits under `tests/` and `pages/` |

**Local agent use:** open the repo in Cursor, enable Atlassian (and GitHub) MCP with tokens from Cursor settings / env, then ask the orchestrator for a ticket (e.g. `DS-3`) or a red CI run.

**CI agent:** `.github/workflows/test-generation.yml` runs a headless Cursor agent against the In Progress backlog; it needs `CURSOR_API_KEY` and Atlassian secrets in the GitHub environment — see the Agent / CI section of `.env.example`.
