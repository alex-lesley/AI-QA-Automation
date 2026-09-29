# Suite reliability report

**Maintained by:** `eval-report` skill — **mandatory** orchestrator close-out (see `.cursor/rules/qa-orchestrator.mdc` → Done).  
**Repo:** [alex-lesley/AI-QA-Automation](https://github.com/alex-lesley/AI-QA-Automation)  
**Generated:** 2026-09-29  
**Window:** last **15** `playwright.yml` runs (2026-08-25 → 2026-09-28). Generation-gate also checked `tests-generated` PRs and `test-generation.yml` through [run 36500017376](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/36500017376).

Cursor has **no built-in telemetry** for flake, heal, generation-gate, or ask-vs-guess. Every number below was derived from GitHub Actions logs, PR history, and this session. No counts were copied blindly from the prior report.

---

## 1. Flake rate

| | |
|--|--|
| **Number** | **1** flaky test result / **198** test results ≈ **0.51%** · **1 / 15** runs (6.7%) showed a retry-pass |
| **How measured** | `gh run list --workflow=playwright.yml --limit 15`, then `gh run view <id> --log` for Playwright summary lines (`N passed` / `N failed` / `N flaky`). Each run executes one slice (`test:smoke` on `pull_request`, `test:sanity` on `push`). Totals in this window: **11** smoke runs × 10 passed = 110; **4** sanity runs with 21+21+22+22 = 86 executed results (one run also had 1 hard fail). Counted Playwright’s **flaky** (failed then passed on retry). Hard fails after retry do **not** count as flake. |
| **What it tells us** | Retry-passes remain uncommon; the only flake is duplicate-name instability: `ds2-edit-program` TC-006 (`expect(rowsForOriginal).toBeGreaterThanOrEqual(1)` at `tests/ds2-edit-program.spec.ts:283`) in [run 35012658722](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/35012658722). |

**Notable non-flake:** [run 35772727596](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/35772727596) — sanity **1 failed** / **21 passed**. `ds1-create-program` TC-008 failed on attempt and retry (`expect(programs.row(programName).root).toHaveCount(1)` at `tests/ds1-create-program.spec.ts:215`). That is a real red result, not a flake.

---

## 2. Heal success rate

| | |
|--|--|
| **Number** | **0 / 0** clean heals (no drift-heal attempts in history) · **Masked regressions: 0** |
| **How measured** | `gh pr list` (all states) and `gh search commits` for heal / locator-drift repairs. The only heal-related change is infrastructure [PR #4](https://github.com/alex-lesley/AI-QA-Automation/pull/4) (self-heal workflow + assertion hook). No `heal/*` repair PRs. Masked-regression count = heals that went green only by weakening assertions → **0**. |
| **What it tells us** | The heal path is still unexercised. Success rate stays undefined until a classified drift run is healed and re-proven green with assertions unchanged. |

---

## 3. Generation-gate pass rate

| | |
|--|--|
| **Number** | **0** new `tests-generated` PRs in this window (nothing to score). All-time labeled set remains **1 / 1** — [PR #5](https://github.com/alex-lesley/AI-QA-Automation/pull/5) (DS-4, merged 2026-06-25), outside the window and not re-run here. |
| **How measured** | `gh pr list --label tests-generated` returns only #5. Scheduled [test-generation.yml run 36500017376](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/36500017376) (2026-09-28) and this Cloud Automation run both stopped at Jira auth — **0 / 5** tickets processed, no spec PR, no `tests-generated` Jira label applied. |
| **What it tells us** | The gate has no new sample. Backlog automation cannot ship tests until Jira credentials authenticate. |

---

## 4. Ask-vs-guess

| | |
|--|--|
| **Number** | **Not instrumented suite-wide.** This session: **0** blocking asks, **0** material guesses. |
| **How measured** | No Cursor metric exists. This run stopped when Atlassian MCP reported `needsAuth` (interactive auth unavailable in Cloud Agent) and the pod had no `ATLASSIAN_*` env vars. GitHub Actions confirms the same failure mode (`AUTHENTICATED_FAILED` on site REST in run 36500017376). No ticket key, acceptance criterion, locator, or message was invented. |
| **What it tells us** | The agent did not paper over the auth failure with a guessed backlog. Ask-vs-guess stays anecdotal until a real ask-log exists. |

---

## Top reliability risk

**Jira credentials do not authenticate**, so the DS In Progress backlog cannot be read and no specs can be generated. Atlassian MCP is blocked in Cloud Agent pods; GitHub `didaxis_dev` secrets still return 401 on `/rest/api/3/myself` (see test-generation run 36500017376). Open eval-only PRs (#6–#27) were never merged, so `main` still carries the stale 2026-07-11 report until a refresh lands.

Secondary suite risk: duplicate-name row checks are unstable — TC-006 flaked on 2026-09-15 and TC-008 stayed red after retry on 2026-09-22. Do not weaken those assertions.

## Next action

1. Replace `ATLASSIAN_EMAIL` / `ATLASSIAN_API_TOKEN` (and confirm `ATLASSIAN_BASE_URL` + `JIRA_PROJECT_KEY`) in Cursor Cloud Agent secrets **and** GitHub `didaxis_dev` until `GET /rest/api/3/myself` returns 200; authenticate Atlassian MCP in Cursor Desktop.
2. Re-run this automation or Test Generation to process up to **5** In Progress DS tickets missing `tests-generated`.
3. Triage [run 35772727596](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/35772727596) TC-008 (`toHaveCount(1)` on the duplicate-name row) as app bug vs test drift before any heal. Leave the assertion intact.
4. Merge or close stacked eval-only PRs so close-out updates one branch instead of opening another unread report.
