# Suite reliability report

**Maintained by:** `eval-report` skill — **mandatory** orchestrator close-out (see `.cursor/rules/qa-orchestrator.mdc` → Done).  
**Repo:** [alex-lesley/AI-QA-Automation](https://github.com/alex-lesley/AI-QA-Automation)  
**Generated:** 2026-08-04  
**Window:** last **15** `playwright.yml` CI runs (2026-06-24 → 2026-08-03), plus labeled generation PRs through 2026-08-04.  
**Backlog run note:** **Blocked** — Atlassian MCP `needsAuth`; no `ATLASSIAN_*` env vars in this cloud pod. Could not query Jira for the live queue. Last verified state from [test-generation run 30851279532](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/30851279532) (2026-08-03): **0** eligible tickets (10 In Progress DS issues; all already have `tests-generated`). No ticket specs written this run.

Cursor has **no built-in telemetry** for flake, heal, generation-gate, or ask-vs-guess. Every number below was derived manually from GitHub Actions logs, PR/commit history, and this session’s transcript review.

---

## 1. Flake rate

| | |
|--|--|
| **Number** | **0** flaky test results / **~562** test results ≈ **0%** · **0 / 15** runs showed a retry-pass |
| **How measured** | `gh run list --workflow=playwright.yml --limit 15`, then `gh run view <id> --log` for Playwright summary lines (`N passed` / `N failed` / `N flaky`). Counted Playwright’s **flaky** (failed then passed on retry). Hard fails after retry do **not** count as flake. Denominator ≈ sum of reported results in-window (smoke×10, sanity×22, full-suite×69 depending on workflow job). |
| **What it tells us** | No retry-passes in this window. The older flake (`ds2-edit-program` TC-003 in [run 27791380766](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/27791380766), 2026-06-18) is **outside** the last-15 window. |

**Notable non-flake:** [run 28123886190](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/28123886190) — 1 failed / 68 passed (assertion), not a flaky green.

---

## 2. Heal success rate

| | |
|--|--|
| **Number** | **0 / 0** clean heals (no drift-heal attempts in history) · **Masked regressions: 0** |
| **How measured** | Searched PRs for heal/locator-drift repairs (`gh pr list`, search `heal` in title). Only related hit is infrastructure [PR #4](https://github.com/alex-lesley/AI-QA-Automation/pull/4) (self-heal workflow + assertion hook), not a post-triage POM locator heal. No `heal/*` repair PRs. Masked-regression count = heals that went green only by weakening assertions → **0** (none shipped). |
| **What it tells us** | Heal pipeline exists but remains **unexercised** on real drift — success rate undefined until the first classified drift run is healed and re-proven green with assertions unchanged. |

---

## 3. Generation-gate pass rate

| | |
|--|--|
| **Number** | **1 / 1** (100%) of `tests-generated` PRs met green + conforming + maps-to-AC on first open · **+0** this backlog run |
| **How measured** | PRs with label `tests-generated` → only [#5](https://github.com/alex-lesley/AI-QA-Automation/pull/5) (DS-4). Cross-checked generation job summaries historically and post-merge Playwright [run 28167017985](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/28167017985) (**69 passed**). This run: Jira unreachable; last verified queue (2026-08-03) had **0** items without `tests-generated` — no new generation PR. |
| **What it tells us** | Gate sample stays n=1. Cloud automation cannot label tickets or confirm queue freshness without Atlassian credentials; GH Actions cron (with secrets) remains the authoritative backlog probe. |

---

## 4. Ask-vs-guess

| | |
|--|--|
| **Number** | **This session:** **asks = 0** blocking · **material guesses = 0** (used only `gh` CI/PR evidence and prior verified Jira summary from run 30851279532; did not invent ticket keys or AC). **Suite-wide:** still **not instrumented**. |
| **How measured** | Session review of this backlog run (2026-08-04): confirmed Atlassian MCP auth failure and absent env vars; measured CI/PR evidence via `gh`; cited last verified Jira state from GH Actions logs rather than guessing current queue. No Cursor suite-wide ask/guess telemetry exists. |
| **What it tells us** | Auth-blocked runs correctly defer to last verified evidence instead of inventing backlog items, but live queue state may drift until Atlassian MCP is authenticated for the automation owner. |

---

## Top reliability risk

**Cloud automation Jira auth gap.** Cursor Automation pods boot without `ATLASSIAN_*` secrets and Atlassian MCP reports `needsAuth`, so the orchestrator cannot query the live backlog, add `tests-generated` labels, or confirm queue freshness — even when GH Actions (with secrets) reports an empty queue.

Secondary: **CI coverage slice is narrow vs the full tagged suite.** `.github/workflows/playwright.yml` runs `npm run test:smoke` on PRs (~10 tests) and `npm run test:sanity` on pushes (~22 tests). Regression / `@e2e` / `@destructive` paths are not in the default jobs.

---

## Next action

1. **Authenticate Atlassian MCP** for the automation owner (or inject `ATLASSIAN_EMAIL`, `ATLASSIAN_API_TOKEN`, `ATLASSIAN_BASE_URL` into the Cursor Cloud environment) so cloud backlog runs can query Jira and apply labels.  
2. **Intake path:** move eligible To Do stories into In Progress *without* `tests-generated`, or extend the backlog JQL, so the next authenticated run has tickets to process.  
3. **Widen CI** to include `test:regression` (or `test:all`) on `main` pushes / nightly so non-smoke failures surface.
