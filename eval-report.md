# Suite reliability report

**Maintained by:** `eval-report` skill — **mandatory** orchestrator close-out (see `.cursor/rules/qa-orchestrator.mdc` → Done).  
**Repo:** [alex-lesley/AI-QA-Automation](https://github.com/alex-lesley/AI-QA-Automation)  
**Generated:** 2026-08-11  
**Window:** last **15** `playwright.yml` CI runs (2026-06-25 → 2026-08-10), plus labeled generation PRs and `test-generation.yml` history through 2026-08-10.

Cursor has **no built-in telemetry** for flake, heal, generation-gate, or ask-vs-guess. Every number below was derived manually from GitHub Actions logs, PR/commit history, and this session's transcript.

---

## 1. Flake rate

| | |
|--|--|
| **Number** | **0** flaky test results / **~280** test results ≈ **0%** · **0 / 15** runs showed a retry-pass |
| **How measured** | `gh run list --workflow=playwright.yml --limit 15`, then `gh run view <id> --log` for Playwright summary lines (`N passed` / `N failed` / `N flaky`). Recent runs are mostly smoke-only (10 passed each); two older full-suite runs (69 passed each) and one sanity run (22 passed) are included. |
| **What it tells us** | No retry-passes in the current 15-run window. The last known flake remains [run 27791380766](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/27791380766) (2026-06-18, `ds2-edit-program` TC-003) — outside this window. |

---

## 2. Heal success rate

| | |
|--|--|
| **Number** | **0 / 0** clean heals (no drift-heal attempts in history) · **Masked regressions: 0** |
| **How measured** | Searched PRs/commits for `heal` / locator-drift repairs (`gh pr list`, `gh search commits`). Only hits are infrastructure ([PR #4](https://github.com/alex-lesley/AI-QA-Automation/pull/4) — self-heal workflow + assertion hook), not a post-triage POM locator heal. No `heal/*` repair PRs found. Masked-regression count = heals that went green only by weakening assertions → **0** (none shipped). |
| **What it tells us** | Heal pipeline exists but is **unexercised** on real drift — success rate is undefined until the first classified drift run is healed and re-proven green with assertions unchanged. |

---

## 3. Generation-gate pass rate

| | |
|--|--|
| **Number** | **1 / 1** (100%) of `tests-generated` PRs met green + conforming + maps-to-AC on first open · **0** new generation PRs this run |
| **How measured** | PRs with label `tests-generated` → only [#5](https://github.com/alex-lesley/AI-QA-Automation/pull/5) (DS-4). Cross-checked generation job [28166814111](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/28166814111) summary (local `12 passed`), commit notes (`waitForTimeout` → `expect.poll`), presence of `features/DS-4.feature.md` from AC, and post-merge Playwright run [28167017985](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/28167017985) (**69 passed**). Latest [test-generation run 31427100935](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/31427100935) (2026-08-10): **0 tickets** — all 5 In Progress DS tickets already labeled `tests-generated`. |
| **What it tells us** | The one generated delivery cleared the gate, but the sample is too small to trust. Backlog has been empty since 2026-08-03; new coverage requires unlabeled In Progress intake. |

---

## 4. Ask-vs-guess

| | |
|--|--|
| **Number** | **Not instrumented suite-wide.** This session: **0 blocking asks**, **0 material guesses** — blocked on missing Jira auth instead of inventing a ticket queue |
| **How measured** | No Cursor metric exists. This backlog run attempted Atlassian MCP (status: `needsAuth`), confirmed no `ATLASSIAN_*` env vars in the cloud pod, referenced last verified queue from [test-generation run 31427100935](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/31427100935), and recorded `request-environment-setup-actions` for required secrets rather than guessing ticket keys. |
| **What it tells us** | Auth gaps are now escalated via environment setup actions; once Jira is reachable, ask-vs-guess should be re-measured on actual ticket analysis. |

---

## Top reliability risk

**Cloud automation cannot reach Jira.** Atlassian MCP reports `needsAuth` and this pod has no `ATLASSIAN_*` secrets — the cron automation cannot query the backlog, read AC, or apply `tests-generated`. The GitHub Actions `test-generation.yml` workflow has secrets and last confirmed an **empty queue** (2026-08-10), but cloud-agent and GH Actions paths are divergent.

Secondary: CI runs only `@smoke` (PR) and `@sanity` (push); ~40 `@regression` / `@e2e` / `@destructive` tests never run in `playwright.yml`.

## Next action

1. **Add Atlassian secrets** (`ATLASSIAN_API_TOKEN`, `ATLASSIAN_EMAIL`, `ATLASSIAN_BASE_URL`, `JIRA_PROJECT_KEY`) to the cloud-agent environment **and** authenticate Atlassian MCP in Cursor Settings.  
2. **Move unlabeled DS stories to In Progress** (or remove stale `tests-generated` labels when re-testing is needed) so the backlog has work.  
3. Extend CI for `@regression` (and isolated `@destructive`) so generated specs get post-merge signal beyond smoke/sanity.
