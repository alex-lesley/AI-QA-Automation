# Suite reliability report

**Maintained by:** `eval-report` skill — **mandatory** orchestrator close-out (see `.cursor/rules/qa-orchestrator.mdc` → Done).  
**Repo:** [alex-lesley/AI-QA-Automation](https://github.com/alex-lesley/AI-QA-Automation)  
**Generated:** 2026-08-25  
**Window:** last **15** `playwright.yml` CI runs (2026-07-21 → 2026-08-24), plus labeled generation PRs through 2026-06-25.

Cursor has **no built-in telemetry** for flake, heal, generation-gate, or ask-vs-guess. Every number below was derived manually from GitHub Actions logs, PR/commit history, and this backlog-run session review.

---

## 1. Flake rate

| | |
|--|--|
| **Number** | **1** flaky test result / **~198** test results ≈ **0.51%** · **1 / 15** runs (6.7%) showed a retry-pass |
| **How measured** | `gh run list --workflow=playwright.yml --limit 15`, then `gh run view <id> --log` for Playwright summary lines (`N passed` / `N failed` / `N flaky`). Counted Playwright's **flaky** (failed then passed on retry). Hard fails after retry do **not** count as flake. |
| **What it tells us** | Retry-passes remain rare; the one flake in this window was `ds4-delete-program` TC-005 (`createProgram` helper timeout) in [run 31528544624](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/31528544624). All other 14 runs in the window were clean. |

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
| **Number** | **1 / 1** (100%) of `tests-generated` PRs met green + conforming + maps-to-AC on first open |
| **How measured** | PRs with label `tests-generated` → only [#5](https://github.com/alex-lesley/AI-QA-Automation/pull/5) (DS-4). Cross-checked generation job [28166814111](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/28166814111) summary (local `12 passed`), commit notes (`waitForTimeout` → `expect.poll`), presence of `features/DS-4.feature.md` from AC, and post-merge Playwright run [28167017985](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/28167017985) (**69 passed**). No new `tests-generated` PRs since. |
| **What it tells us** | The one generated delivery cleared the gate, but the sample is too small to trust — and merge-without-PR-checks weakens the "first PR" signal. Backlog runs since then found **0** eligible In Progress tickets (all already labeled). |

---

## 4. Ask-vs-guess

| | |
|--|--|
| **Number** | **Not instrumented suite-wide.** This backlog run: **asks 0 blocking**, **guesses 0 material** (queue state from last verified GH Actions run, not live Jira) |
| **How measured** | No Cursor metric exists. Atlassian MCP returned `needsAuth`; no `ATLASSIAN_*` env vars in the Cloud Agent pod. Queue state inferred from [test-generation run 32770034572](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/32770034572) (2026-08-24), which queried Jira REST directly and found **0** eligible tickets — not re-verified live this run. |
| **What it tells us** | Cloud Agent cron remains blocked on Jira auth; until secrets + MCP auth land in the environment, backlog state is stale-proxy only. |

---

## Top reliability risk

**Cloud Agent Jira auth gap + stale backlog signal.** This cron run cannot query Jira or apply `tests-generated` labels (Atlassian MCP `needsAuth`; no `ATLASSIAN_*` secrets in pod). The last verified queue ([run 32770034572](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/32770034572), 2026-08-24) had **0** eligible tickets — all **11** In Progress DS tickets already carry `tests-generated` — yet those stories remain In Progress.

Secondary: `ds4-delete-program` TC-005 showed one retry-pass flake; heal path still unproven (0 attempts).

## Next action

1. **Add Jira secrets** (`ATLASSIAN_API_TOKEN`, `ATLASSIAN_EMAIL`, `ATLASSIAN_BASE_URL`, `JIRA_PROJECT_KEY`) to the Cloud Agent environment and authenticate Atlassian MCP so cron runs can query and label tickets directly.  
2. **Transition** In Progress DS tickets that already have generated tests (DS-1, DS-2, DS-3, DS-5, DS-119, DS-120, DS-129, DS-131, DS-213, DS-214, DS-215) so new stories enter the queue.  
3. Add a tiny CI log parser (or Playwright JSON reporter upload) so flake/heal/generation metrics update without hand-grepping logs.
