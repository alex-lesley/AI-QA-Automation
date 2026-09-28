# Suite reliability report

**Maintained by:** `eval-report` skill — **mandatory** orchestrator close-out (see `.cursor/rules/qa-orchestrator.mdc` → Done).  
**Repo:** [alex-lesley/AI-QA-Automation](https://github.com/alex-lesley/AI-QA-Automation)  
**Generated:** 2026-09-28  
**Window:** last **15** `playwright.yml` runs (2026-08-24 → 2026-09-22). Generation-gate also checked `tests-generated` PRs and `test-generation.yml` history through this run.

Cursor has **no built-in telemetry** for flake, heal, generation-gate, or ask-vs-guess. Every number below was derived from GitHub Actions logs, PR history, and this session. No counts were filled in from the previous report.

---

## 1. Flake rate

| | |
|--|--|
| **Number** | **1** flaky test result / **210** test results ≈ **0.48%** · **1 / 15** runs (6.7%) showed a retry-pass |
| **How measured** | `gh run list --workflow=playwright.yml --limit 15`, then `gh run view <id> --log` for Playwright summary lines (`N passed` / `N failed` / `N flaky`). Each run executes one slice (`test:smoke` on `pull_request`, `test:sanity` on `push`). Totals: 10 smoke runs × 10 passed = 100; 5 sanity runs × 22 results = 110. Counted Playwright’s **flaky** (failed then passed on retry). Hard fails after retry do **not** count as flake. |
| **What it tells us** | Retry-passes are uncommon, but the one flake is a duplicate-name assertion, not a locator timeout: `ds2-edit-program` TC-006 (`expect(rowsForOriginal).toBeGreaterThanOrEqual(1)` at `tests/ds2-edit-program.spec.ts:283`) in [run 35012658722](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/35012658722). |

**Notable non-flake:** [run 35772727596](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/35772727596) — sanity **1 failed** / **21 passed**. `ds1-create-program` TC-008 failed on attempt and retry (`expect(programs.row(programName).root).toHaveCount(1)` at `tests/ds1-create-program.spec.ts:215`). That is a real red result, not a flake.

---

## 2. Heal success rate

| | |
|--|--|
| **Number** | **0 / 0** clean heals (no drift-heal attempts in history) · **Masked regressions: 0** |
| **How measured** | `gh pr list` (all states) and `gh search commits` for heal / locator-drift repairs. The only heal-related change is infrastructure [PR #4](https://github.com/alex-lesley/AI-QA-Automation/pull/4) (self-heal workflow + assertion hook). No `heal/*` repair PRs. Keyword hits on open “eval-report” PRs are report text, not locator patches. Masked-regression count = heals that went green only by weakening assertions → **0**. |
| **What it tells us** | The heal path is still unexercised. Success rate stays undefined until a classified drift run is healed and re-proven green with assertions unchanged. |

---

## 3. Generation-gate pass rate

| | |
|--|--|
| **Number** | **0** new `tests-generated` PRs in this window (nothing to score). All-time labeled set remains **1 / 1** — [PR #5](https://github.com/alex-lesley/AI-QA-Automation/pull/5) (DS-4, merged 2026-06-25), outside the window and not re-run here. |
| **How measured** | `gh pr list --label tests-generated` returns only #5. `gh run list --workflow=test-generation.yml --limit 10` (2026-07-27 → 2026-09-21, all `success`) plus this scheduled run. Those jobs opened eval-only PRs (no `tests-generated` label) because Jira auth failed or the visible queue was empty. This session did not open a spec PR. |
| **What it tells us** | The gate has no new sample. Weekly generation is completing without shipping tests, so the 1/1 historical pass rate does not describe current delivery. |

---

## 4. Ask-vs-guess

| | |
|--|--|
| **Number** | **Not instrumented suite-wide.** This session: **0** blocking asks, **0** material guesses. |
| **How measured** | No Cursor metric exists. This run stopped when Jira auth failed (`X-Seraph-Loginreason: AUTHENTICATED_FAILED` on site REST; `401` on `api.atlassian.com` for cloud `f72d2b24-8968-4705-8538-069e61d5ed43`). No ticket key, acceptance criterion, locator, or message was invented. |
| **What it tells us** | The agent did not paper over the auth failure with a guessed backlog. Ask-vs-guess stays anecdotal until a real ask-log exists. |

---

## Top reliability risk

**Jira credentials do not authenticate**, so the DS In Progress backlog cannot be read and no specs can be generated. Site calls return `AUTHENTICATED_FAILED` (`/rest/api/3/myself` is 401; project search is empty for an anonymous caller). The same block has repeated on scheduled `test-generation.yml` runs; open eval-only PRs #6–#26 were never merged, so `main` still carried the 2026-07-11 report until this refresh.

Secondary suite risk: duplicate-name row checks are unstable — TC-006 flaked on 2026-09-15 and TC-008 stayed red after retry on 2026-09-22. Do not weaken those assertions.

## Next action

1. Replace `ATLASSIAN_EMAIL` / `ATLASSIAN_API_TOKEN` (and confirm `ATLASSIAN_BASE_URL` + `JIRA_PROJECT_KEY`) so `GET /rest/api/3/myself` returns 200, then re-run Test Generation.
2. Triage [run 35772727596](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/35772727596) TC-008 (`toHaveCount(1)` on the duplicate-name row) as app bug vs test drift before any heal. Leave the assertion intact.
3. Merge or close the stacked eval-only PRs so the next close-out updates one branch instead of opening another unread report.
