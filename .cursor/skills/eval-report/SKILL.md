---
name: eval-report
description: >-
  Refreshes eval-report.md with flake rate, heal success (incl. masked-regression
  count), generation-gate pass rate, and ask-vs-guess. Use as the mandatory
  close-out step when a QA orchestrator task or backlog run finishes (green
  spec, heal PR, filed bug, or backlog summary). Also use when the user asks
  for a reliability report, suite eval, or to update eval metrics. Cursor has
  no built-in telemetry — measure from CI logs, PR history, and session review
  only; never invent numbers.
---

# Eval Report (mandatory close-out)

Update `eval-report.md` before declaring a QA task or backlog run **done**.
The report is the suite reliability checkpoint; skipping it is not allowed on
orchestrator exit paths.

## When (mandatory)

Apply at the end of **any** of these:

- Single-ticket loop finished (green, stop, or bug filed)
- Heal-on-red finished (repair PR opened or escalated)
- Backlog mode run finished (after the last ticket / run summary)
- User asks to refresh reliability / eval metrics

Do **not** run mid-delegation or after trivial edits unrelated to a completed task.

## Metrics (all four required)

| Metric | Definition |
|--------|------------|
| **Flake rate** | Tests that passed only on retry (`N flaky` in Playwright CI logs) over last **N** `playwright.yml` runs (default N=15) |
| **Heal success rate** | Clean drift heals (POM-only, assertions unchanged, re-run green) / total heal attempts · **Masked regressions must be 0** (green only by weakened `expect`) |
| **Generation-gate pass rate** | `tests-generated` PRs that were green + conforming + mapped to AC on first PR / total such PRs in window |
| **Ask-vs-guess** | Times the agent asked the human vs invented a material value (session review; no Cursor telemetry) |

## Steps

1. **Measure** with `gh` (and local session notes). Do not invent counts.
   - Flake: `gh run list --workflow=playwright.yml --limit 15` → `gh run view <id> --log` → count `flaky` vs total results.
   - Heal: PRs/commits matching real drift heals (`heal/…`, locator repair after triage) — not infrastructure-only PRs. Count masked regressions separately; must remain **0**.
   - Generation-gate: PRs labeled `tests-generated` + generation workflow summaries + first-PR CI/local green + AC/feature map + conventions.
   - Ask-vs-guess: review this task’s transcript for blocking questions vs silent assumptions; say **not instrumented** if you cannot count honestly.
2. **Rewrite** `eval-report.md` in place — keep the four sections + **Top reliability risk** + **Next action**.
3. Each section must include: the **number**, **how measured**, **one line on what it tells us**.
4. Surface the top risk + next action in the orchestrator run summary / final reply.
5. If `gh` or logs are unavailable, still update the file: mark the metric **unavailable**, state why, and list the next action to restore measurement — do not skip the step.

## Guardrails

- Never fabricate flake/heal/generation numbers.
- Masked-regression count **must be 0**; if a heal weakened assertions, record it and escalate (failed heal).
- Do not block merging on eval freshness alone — the human merges; the eval is the mandatory **record**.
