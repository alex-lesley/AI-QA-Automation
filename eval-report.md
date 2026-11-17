# Suite reliability report

**Maintained by:** `eval-report` skill — **mandatory** orchestrator close-out (see `.cursor/rules/qa-orchestrator.mdc` → Done).  
**Repo:** [alex-lesley/AI-QA-Automation](https://github.com/alex-lesley/AI-QA-Automation)  
**Generated:** 2026-11-17 (last refresh: Tue **19:19 UTC** Cursor Automation cron)  
**Window:** last **15** `playwright.yml` CI runs (through 2026-11-17), plus labeled generation PRs and `test-generation.yml` through this backlog run.

Cursor has **no built-in telemetry** for flake, heal, generation-gate, or ask-vs-guess. Every number below was derived manually from GitHub Actions logs, PR/commit history, and this session’s transcript review.

---

## 1. Flake rate

| | |
|--|--|
| **Number** | **6** flaky test results / **~197** passed-result lines ≈ **3.05%** · **4 / 15** runs (26.7%) showed a retry-pass |
| **How measured** | `gh run list --workflow=playwright.yml --limit 15`, then `gh run view <id> --log` for Playwright summary / `N flaky` lines. Summed `N flaky` across runs; summed trailing `N passed` lines per run for a coarse denominator (same method as prior backlog refreshes). |
| **What it tells us** | Flake remains elevated vs the June baseline (~0.1%); concentration is still on backlog eval-branch smoke/sanity jobs rather than new ticket specs. |

---

## 2. Heal success rate

| | |
|--|--|
| **Number** | **0 / 0** clean heals (no drift-heal attempts in history) · **Masked regressions: 0** |
| **How measured** | Searched PRs/commits for `heal` / locator-drift repairs (`gh pr list`, `head:heal/`). Only infrastructure hits ([PR #4](https://github.com/alex-lesley/AI-QA-Automation/pull/4)); no post-triage POM locator heal PRs. Masked-regression count → **0**. |
| **What it tells us** | Heal pipeline is still **unexercised** on real drift. |

---

## 3. Generation-gate pass rate

| | |
|--|--|
| **Number** | **1 / 1** (100%) of `tests-generated` PRs met green + conforming + maps-to-AC on first open |
| **How measured** | PRs with label `tests-generated` → only [#5](https://github.com/alex-lesley/AI-QA-Automation/pull/5) (DS-4). This backlog run opened **0** ticket PRs (Jira unreachable). Prior evidence for #5 unchanged. |
| **What it tells us** | Gate sample stays **n=1**; backlog cannot extend it without Jira read access. |

---

## 4. Ask-vs-guess

| | |
|--|--|
| **Number** | **Not instrumented suite-wide.** This backlog session: **asks = 0** blocking · **guesses = 0** material inventions (stopped on auth; did not invent ticket keys/AC) |
| **How measured** | Atlassian MCP `needsAuth` (interactive OAuth unavailable in cloud agent); VM has **no** `ATLASSIAN_*` env; pod app secrets list empty until user binds values. Prior GH `test-generation` run [42740810530](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/42740810530) documented Jira REST **401**; latest scheduled run [44003269814](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/44003269814) failed earlier on Playwright **ubuntu 26.04** browser install (never reached Jira). |
| **What it tells us** | Correct stop on missing access; no ticket queue was fabricated. |

---

## Top reliability risk

**No Jira read path from Cloud Agent backlog cron.** Atlassian MCP requires desktop OAuth; this pod has no `ATLASSIAN_*` secrets. Until `GET /rest/api/3/myself` succeeds (secrets + valid token) or MCP OAuth is completed, **0 / 5** tickets per run is expected.

Secondary: **`test-generation.yml` on `ubuntu-latest` (26.04)** — [run 44003269814](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/44003269814) fails at `npx playwright install --with-deps chromium` because Playwright 1.59.1 does not support ubuntu26.04; pin `runs-on` to 22.04/24.04 or use the `mcr.microsoft.com/playwright` container like `playwright.yml`.

Tertiary: elevated flake (~3% of results; ~27% of recent runs); heal path unproven (0/0).

## Next action

1. **Bind Cloud Agent secrets** `ATLASSIAN_BASE_URL`, `ATLASSIAN_EMAIL`, `ATLASSIAN_API_TOKEN`, `JIRA_PROJECT_KEY` (and authenticate Atlassian MCP in Cursor desktop).  
2. **Fix GH `test-generation.yml` runner** — use `ubuntu-22.04` or Playwright container so generation cron can run again.  
3. **Rotate/validate Jira token** in `didaxis_dev` until `/rest/api/3/myself` returns 200, then re-run backlog mode.

---

## Backlog run log (2026-11-17)

| Trigger | Time (UTC) | Tickets | Outcome |
|---------|------------|---------|---------|
| Cursor Automation cron (`15 19 * * 2`) | 19:19 | **0 / 5** | Jira blocked (MCP `needsAuth`, no pod secrets); eval refresh only — no `tests-generated` labels |

**Previously completed (per automation memory):** DS-1, DS-2, DS-3, DS-4, DS-5, DS-119, DS-120, DS-129, DS-131, DS-177 (`tests-generated` on Jira when auth worked).