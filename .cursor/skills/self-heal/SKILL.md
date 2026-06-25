---
name: self-heal
description: >-
  Repairs Playwright locator drift after a UI change — patch the POM, re-run
  unchanged assertions, open a PR. Use when the build is red because a locator
  broke, fix the drifted selector, the test broke after a UI change, or heal
  the suite. Use ONLY after ci-failure-triage classifies the red run as a test
  issue (drift). Never use for a real app bug — route those to jira-bug-reporter.
---

# Self-Heal (Locator Drift Repair)

Repairs **test drift** — broken locators after a UI rename, restructure, or
accessible-name change — by re-discovering the element and patching the POM.
One failing locator per run; every heal ships as a PR.

## Prerequisites

- **Triage first.** Run [ci-failure-triage](../ci-failure-triage/SKILL.md) (or
  consume its diagnosis) before this skill.
- **Drift only.** Classification must be **test issue / locator drift**. If
  triage says **real app bug**, **stop** and route to
  [jira-bug-reporter](../jira-bug-reporter/SKILL.md). Do not patch locators to
  mask product defects.

## Steps

### 1. Require triage's drift classification

Confirm the diagnosis explicitly states **test issue (drift)** — e.g. the UI
control still exists but its accessible name, role, or hierarchy changed; the
assertion intent is still valid.

- **Missing or ambiguous classification → stop.** Run triage or ask for it.
- **Classified as app bug → stop.** Route to jira-bug-reporter; do not heal.

### 2. From the trace, find the failing locator and its POM

From the Playwright error, trace, and stack:

1. Note the **failing test**, **timeout/action line**, and **locator string**
   Playwright resolved.
2. Follow the stack into `pages/` — identify the **POM class**, **property or
   method**, and **file:line** that owns the locator.
3. Read the spec only to understand **user intent**; do not edit assertions
   in this skill.

Cross-reference [pom-conventions](../pom-conventions/SKILL.md) for project
locator style (`getByRole` first, scoped to dialog/row, etc.).

### 3. Re-discover the element via Playwright MCP a11y tree

Use **user-playwright** MCP (read tool schemas first):

1. `browser_navigate` to the route/state at failure (reuse auth:
   `playwright/.auth/user.json` or sign in via `.env` credentials).
2. Replay setup steps from the spec **only as far as needed** to expose the
   target control.
3. `browser_snapshot` — source of truth is the **accessibility tree**
   (role + accessible name), not screenshots or DOM guesses.
4. Find the element by **role + current accessible name** that matches the
   test's intent (e.g. button "Create Program" renamed to "+ New Program").
5. If no role/name match exists, **stop** — likely mis-triaged as drift; escalate
   to bug-reporter or re-triage.

### 4. Patch the locator in the POM (minimal role-based diff)

- Edit **only** the POM file(s) from step 2.
- Prefer `getByRole` / `getByLabel` / `getByText` with the **new** accessible
  name; keep scoping (dialog, row, page) unchanged unless the tree requires it.
- **Minimal diff** — change only the broken locator line(s); no refactors, no
  unrelated cleanup.
- **Never** edit the spec's `expect(...)` calls or weaken assertions to get green.

### 5. Re-run and prove green with assertions unchanged

```bash
npx playwright test <failing-spec-or-test> --project=chromium
```

- **Green with unchanged assertions** → proceed to step 6.
- **Still red** → do not broaden locators or relax expects; diagnose again
  (wrong element, wrong state, or app bug).
- **Green only after changing assertions** → **reject the heal.** That is a
  test bug, not a successful repair — escalate; do not open a PR.

### 6. Report old → new locator diff + green run; open a PR

Deliver:

| Field | Content |
|-------|---------|
| Failing test | Full title + spec path |
| POM file | Path and line(s) changed |
| Old locator | Exact previous `getByRole` / chain |
| New locator | Exact replacement |
| Evidence | CI run id, local re-run output, trace/snapshot if useful |
| Assertions | Explicit note: **unchanged** |

Then **open a PR** (one repair per run):

- Branch name: `heal/<short-description>` or `fix/locator-<pom>-<element>`.
- Title: e.g. `heal: update ProgramsPage New Program button locator`.
- Body: old → new diff table, triage classification link/quote, green re-run
  command + result.
- **Never merge automatically** — human review required.

## Rules

- **One repair per run.** Fix a single failing locator; additional failures need
  another triage → heal cycle.
- **Every heal becomes a PR.** No direct commits to main without review.
- **POM only.** Specs stay assertion-only; locators live in `pages/`.
- **No assertion weakening.** Green via a weakened assertion is a bug — escalate.
- **Drift only.** Real defects go to jira-bug-reporter, not locator patches.
