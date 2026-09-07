# Suite reliability report

**Maintained by:** `eval-report` skill — **mandatory** orchestrator close-out (see `.cursor/rules/qa-orchestrator.mdc` → Done).  
**Repo:** [alex-lesley/AI-QA-Automation](https://github.com/alex-lesley/AI-QA-Automation)  
**Generated:** 2026-09-07  
**Window:** last **15** `playwright.yml` CI runs (2026-08-03 → 2026-09-01), plus labeled generation PRs and `test-generation.yml` history through 2026-09-07.

Cursor has **no built-in telemetry** for flake, heal, generation-gate, or ask-vs-guess. Every number below was derived manually from GitHub Actions logs, PR/commit history, and a light session-transcript review.

---

## 1. Flake rate

| | |
|--|--|
| **Number** | **1** flaky test result / **~209** test results ≈ **0.48%** · **1 / 15** runs (6.7%) showed a retry-pass |
| **How measured** | `gh run list --workflow=playwright.yml --limit 15`, then `gh run view <id> --log` for Playwright summary lines (`N passed` / `N failed` / `N flaky`). Counted Playwright’s **flaky** (failed then passed on retry). Hard fails after retry do **not** count as flake. Sum of max `passed` per run ≈ 209. |
| **What it tells us** | Retry-passes remain rare; the one flake was in the Sanity (`@sanity`) job of [run 31528544624](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/31528544624) (2026-08-11). All 15 runs in the window concluded **success**. |

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
| **How measured** | PRs with label `tests-generated` → only [#5](https://github.com/alex-lesley/AI-QA-Automation/pull/5) (DS-4). Cross-checked generation job [28166814111](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/28166814111) summary (local `12 passed`), presence of `features/DS-4.feature.md` from AC, and post-merge Playwright run [28167017985](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/28167017985) (**69 passed**). No new `tests-generated` PRs opened since 2026-06-25; backlog runs since then processed **0** tickets (Jira token 401 / empty DS search). |
| **What it tells us** | The one generated delivery cleared the gate, but the sample is too small to trust — and repeated backlog runs cannot add tickets while Jira REST auth fails. |

---

## 4. Ask-vs-guess

| | |
|--|--|
| **Number** | **Not instrumented suite-wide.** This backlog run (2026-09-07): **asks 0 blocking**, **guesses 0 material** (stopped before inventing ticket data) |
| **How measured** | No Cursor metric exists. Reviewed this session: Atlassian MCP `needsAuth` (interactive auth unavailable in this agent environment); REST `/rest/api/3/myself` returned **HTTP 401** with `ATLASSIAN_EMAIL` + `ATLASSIAN_API_TOKEN`; `project = DS` JQL returned **0 issues**. Agent did not invent tickets or acceptance criteria. |
| **What it tells us** | Correct stop on auth failure avoids inventing tickets; ask-vs-guess remains anecdotal without a deliberate ask-log. |

---

## Top reliability risk

**Jira API token cannot authenticate for work item read.** `ATLASSIAN_*` / `JIRA_PROJECT_KEY` are present in the agent environment, but `/rest/api/3/myself` returns HTTP 401 and DS JQL returns an empty issue list. Atlassian MCP also cannot be used here (interactive `mcp_auth` is desktop-only). Backlog processing cannot proceed until a token with `read:jira-work` (and ideally `write:jira-work`) successfully returns DS issues for `status = "In Progress"` without `tests-generated`.

Secondary: heal path unproven; generation-gate n=1 with no new deliveries since June.

## Next action

1. **Re-issue / re-scope `ATLASSIAN_API_TOKEN`** (Atlassian account API token or scoped app) so `/rest/api/3/myself` returns 200 and `project = DS AND status = "In Progress"` returns real issues.  
2. **Authenticate Atlassian MCP** in Cursor desktop IDE (Settings → MCP → Atlassian) for interactive runs.  
3. **Verify** the same secrets in GH Actions `didaxis_dev` / Cursor Cloud before the next `test-generation.yml` cron.  
4. After auth is restored, re-run backlog orchestrator (budget 5) to process queued tickets.
