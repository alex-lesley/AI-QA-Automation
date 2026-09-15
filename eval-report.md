# Suite reliability report

**Maintained by:** `eval-report` skill — **mandatory** orchestrator close-out (see `.cursor/rules/qa-orchestrator.mdc` → Done).  
**Repo:** [alex-lesley/AI-QA-Automation](https://github.com/alex-lesley/AI-QA-Automation)  
**Generated:** 2026-09-15  
**Window:** last **15** `playwright.yml` CI runs (2026-08-11 → 2026-09-14), plus labeled generation PRs and `test-generation.yml` history through 2026-09-15.

Cursor has **no built-in telemetry** for flake, heal, generation-gate, or ask-vs-guess. Every number below was derived manually from GitHub Actions logs, PR/commit history, and this backlog session.

---

## 1. Flake rate

| | |
|--|--|
| **Number** | **1** flaky test result / **210** test results ≈ **0.48%** · **1 / 15** runs (6.7%) showed a retry-pass |
| **How measured** | `gh run list --workflow=playwright.yml --limit 15`, then `gh run view <id> --log` for Playwright summary lines (`N passed` / `N failed` / `N flaky`). Summed max `passed`/`failed`/`flaky` per run. Counted Playwright’s **flaky** (failed then passed on retry). Hard fails after retry do **not** count as flake. |
| **What it tells us** | Retry-passes remain rare; the only flake in this window was `ds4-delete-program` TC-005 (`expect(modal.root).toBeHidden`) in [run 31528544624](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/31528544624) (sanity job, 2026-08-11). All 14 other runs in the window were fully green. |

**Note:** CI slices (`@smoke` on PR, `@sanity` on push) mean ~10 or ~22 results per run — not the full 70 tagged tests. Flake rate is over **executed** CI results only.

---

## 2. Heal success rate

| | |
|--|--|
| **Number** | **0 / 0** clean heals (no drift-heal attempts in history) · **Masked regressions: 0** |
| **How measured** | Searched PRs for `heal` / locator-drift repairs (`gh pr list`, `gh search commits`). Only hit is infrastructure ([PR #4](https://github.com/alex-lesley/AI-QA-Automation/pull/4) — self-heal workflow + assertion hook), not a post-triage POM locator heal. No `heal/*` repair PRs found. Masked-regression count = heals that went green only by weakening assertions → **0** (none shipped). |
| **What it tells us** | Heal pipeline exists but is **unexercised** on real drift — success rate is undefined until the first classified drift run is healed and re-proven green with assertions unchanged. |

---

## 3. Generation-gate pass rate

| | |
|--|--|
| **Number** | **1 / 1** (100%) of `tests-generated` PRs met green + conforming + maps-to-AC on first open |
| **How measured** | PRs with label `tests-generated` → only [#5](https://github.com/alex-lesley/AI-QA-Automation/pull/5) (DS-4). Cross-checked generation job [28166814111](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/28166814111) summary (local `12 passed`), presence of `features/DS-4.feature.md` from AC, and post-merge Playwright run [28167017985](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/28167017985). Later generation crons (through [34904530858](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/34904530858)) opened **0** new `tests-generated` PRs — backlog blocked by Jira auth (see below). |
| **What it tells us** | The one generated delivery cleared the gate, but the sample is too small to trust; cron has not produced new gated PRs since 2026-06-25. |

---

## 4. Ask-vs-guess

| | |
|--|--|
| **Number** | **Not instrumented suite-wide.** This backlog session (2026-09-15): **asks = 0** blocking · **guesses = 0** material (did not invent ticket AC or queue keys) |
| **How measured** | No Cursor metric exists. Reviewed this run’s decisions: Atlassian MCP `needsAuth`; no `ATLASSIAN_*` env vars in pod; agent stopped ticket processing rather than inventing In Progress keys from local `features/DS-*.feature.md`. |
| **What it tells us** | Stopping on auth failure is correct ask-vs-guess behavior; without a durable ask-log, suite-wide ratio stays unavailable. |

---

## Top reliability risk

**Jira REST authentication is broken for the generation agent.** `ATLASSIAN_EMAIL` + `ATLASSIAN_API_TOKEN` against `ATLASSIAN_BASE_URL` yield **HTTP 401** on `/rest/api/3/myself` (confirmed in [test-generation run 34904530858](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/34904530858)). Misleadingly, `/rest/api/3/search/jql` can return `{"issues":[],"isLast":true}` without a valid session — empty backlog must not be trusted until `/myself` is 200. Atlassian MCP also `needsAuth` and cannot interactively auth in Cloud Agents. Result: **0 tickets processed** across repeated cron runs; open eval-only PRs (#19–#23) with no `tests-generated` work.

Secondary: default CI still runs only `@smoke` (PR) / `@sanity` (push) — **33 `@regression` + 3 `@e2e` + 4 `@destructive`** tests are not in the default gate.

## Next action

1. **Rotate / fix** the GitHub secret `ATLASSIAN_API_TOKEN` (pair with `ATLASSIAN_EMAIL`); confirm `GET /rest/api/3/myself` → **200** and `project = DS AND status = "In Progress" AND labels != tests-generated` returns real issues.  
2. Add the same `ATLASSIAN_*` secrets to the Cursor Cloud Agent environment and authenticate Atlassian MCP in Cursor Desktop.  
3. Re-run backlog automation and process up to 5 In Progress tickets lacking `tests-generated`.
