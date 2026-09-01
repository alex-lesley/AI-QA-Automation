# Suite reliability report

**Maintained by:** `eval-report` skill — **mandatory** orchestrator close-out (see `.cursor/rules/qa-orchestrator.mdc` → Done).  
**Repo:** [alex-lesley/AI-QA-Automation](https://github.com/alex-lesley/AI-QA-Automation)  
**Generated:** 2026-09-01  
**Window:** last **15** `playwright.yml` CI runs (2026-07-27 → 2026-08-31), plus labeled generation PRs and `test-generation.yml` history through 2026-09-01.

Cursor has **no built-in telemetry** for flake, heal, generation-gate, or ask-vs-guess. Every number below was derived manually from GitHub Actions logs, PR/commit history, and a light session-transcript review.

---

## 1. Flake rate

| | |
|--|--|
| **Number** | **1** flaky test result / **~210** test results ≈ **0.48%** · **1 / 15** runs (6.7%) showed a retry-pass |
| **How measured** | `gh run list --workflow=playwright.yml --limit 15`, then `gh run view <id> --log` for Playwright summary lines (`N passed` / `N failed` / `N flaky`). Counted Playwright's **flaky** (failed then passed on retry). Hard fails after retry do **not** count as flake. |
| **What it tells us** | Retry-passes remain rare; the one flake was a `toBeHidden()` assertion failure in the Sanity (@sanity) job of [run 31528544624](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/31528544624) (2026-08-11). All 15 runs in the window concluded **success**. |

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
| **How measured** | PRs with label `tests-generated` → only [#5](https://github.com/alex-lesley/AI-QA-Automation/pull/5) (DS-4). Cross-checked generation job [28166814111](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/28166814111) summary (local `12 passed`), commit notes (`waitForTimeout` → `expect.poll`), presence of `features/DS-4.feature.md` from AC, and post-merge Playwright run [28167017985](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/28167017985) (**69 passed**). No new `tests-generated` PRs opened since 2026-06-25; backlog runs since then processed **0** tickets (Jira auth blocked in Cursor Cloud + insufficient token scope in GH Actions). |
| **What it tells us** | The one generated delivery cleared the gate, but the sample is too small to trust — and repeated backlog runs cannot add tickets while Jira access is blocked in both agent environments. |

---

## 4. Ask-vs-guess

| | |
|--|--|
| **Number** | **Not instrumented suite-wide.** This backlog run (2026-09-01): **asks 0 blocking**, **guesses 0 material** (stopped before inventing ticket data) |
| **How measured** | No Cursor metric exists. Reviewed this session: Atlassian MCP returned `needsAuth` (interactive auth unavailable in cloud agent); no `ATLASSIAN_*` env vars present in the pod. Agent did not proceed with ticket work without verified acceptance criteria from Jira. |
| **What it tells us** | Correct stop on auth failure avoids inventing tickets; ask-vs-guess remains anecdotal without a deliberate ask-log. |

---

## Top reliability risk

**Jira access blocked in Cursor Cloud Agent environment.** Atlassian MCP requires desktop IDE authentication (unavailable in cloud pods), and no `ATLASSIAN_*` secrets are configured in the Cursor Cloud environment. The parallel `test-generation.yml` cron has credentials but the token lacks read scope (HTTP 401 on `/myself`, empty JQL results). Backlog processing cannot proceed until both environments can query `project = DS AND status = "In Progress" AND labels != tests-generated`.

Secondary: heal path unproven; generation-gate n=1 with no new deliveries since June.

## Next action

1. **Add Jira secrets to Cursor Cloud Agent environment:** `ATLASSIAN_API_TOKEN` (with `read:jira-work` + `write:jira-work`), `ATLASSIAN_EMAIL`, `ATLASSIAN_BASE_URL`, `JIRA_PROJECT_KEY`.  
2. **Authenticate Atlassian MCP** in Cursor desktop IDE (Settings → MCP → Atlassian).  
3. **Re-issue GH Actions `ATLASSIAN_API_TOKEN`** with read scopes and verify JQL returns issues before the next cron.  
4. After auth is restored, re-run backlog orchestrator (budget 5) to process queued tickets.
