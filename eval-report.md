# Suite reliability report

**Maintained by:** `eval-report` skill — **mandatory** orchestrator close-out (see `.cursor/rules/qa-orchestrator.mdc` → Done).  
**Repo:** [alex-lesley/AI-QA-Automation](https://github.com/alex-lesley/AI-QA-Automation)  
**Generated:** 2026-07-21  
**Window:** last **15** `playwright.yml` CI runs (2026-06-22 → 2026-07-20), plus labeled generation PRs and backlog automation runs through 2026-07-21.

Cursor has **no built-in telemetry** for flake, heal, generation-gate, or ask-vs-guess. Every number below was derived manually from GitHub Actions logs, PR/commit history, and this session's transcript.

---

## 1. Flake rate

| | |
|--|--|
| **Number** | **0** flaky test results / **~753** test results ≈ **0%** · **0 / 15** runs showed a retry-pass |
| **How measured** | `gh run list --workflow=playwright.yml --limit 15`, then `gh run view <id> --log` for Playwright summary lines (`N passed` / `N failed` / `N flaky`). Recent runs use tagged slices (`@smoke` 10 passed, `@sanity` 22 passed); older runs ran full E2E (69 passed). Counted Playwright's **flaky** (failed then passed on retry). Hard fails after retry do **not** count as flake. |
| **What it tells us** | No retry-passes in the current 15-run window. The prior window's one flake (`ds2-edit-program` TC-003 in [run 27791380766](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/27791380766)) has aged out of this slice. |

**Notable non-flake:** [run 28123886190](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/28123886190) — TC-010 failed on attempt + Retry #1 (assertion), then fixed on main — real failure, not flaky green.

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
| **How measured** | PRs with label `tests-generated` → only [#5](https://github.com/alex-lesley/AI-QA-Automation/pull/5) (DS-4). Cross-checked generation job [28166814111](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/28166814111) summary (local `12 passed`), commit notes (`waitForTimeout` → `expect.poll`), presence of `features/DS-4.feature.md` from AC, and post-merge Playwright run [28167017985](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/28167017985) (**69 passed**). Later backlog runs (2026-07-14, 2026-07-20, 2026-07-21) processed **0** eligible tickets — queue empty or auth-blocked. |
| **What it tells us** | The one generated delivery cleared the gate, but the sample is too small to trust — and recent backlog runs have not exercised generation at all. |

---

## 4. Ask-vs-guess

| | |
|--|--|
| **Number** | **Not instrumented suite-wide.** This run: **asks = 0 blocking**, **guesses = 0 material** (run stopped at Jira auth blocker before analyze/write) |
| **How measured** | No Cursor metric exists. This backlog run attempted Atlassian MCP auth (failed — cloud agent cannot interactively authenticate), confirmed no `ATLASSIAN_*` env vars in pod (`cursor-cloud environment-info`: `environment: null`), and did not invent ticket keys or AC. Prior verified backlog state from [test-generation run 29777177355](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/29777177355): 10 In Progress DS tickets, all already labeled `tests-generated`. |
| **What it tells us** | Agents correctly stop rather than guess ticket content when Jira is unreachable; automation reliability depends on MCP auth or attached environment secrets. |

---

## Top reliability risk

**Cursor Automation cron lacks Jira access.** Atlassian MCP reports `needsAuth`; interactive auth is unavailable in cloud agents; no `ATLASSIAN_*` secrets are attached to this run's environment. The backlog runner cannot query, label, or link tickets — blocking the entire analyze → write → run → PR loop.

Secondary: even when Jira is reachable (GitHub Actions `test-generation.yml` with secrets), the eligible backlog was **empty** on 2026-07-20 — all In Progress DS tickets already carry `tests-generated`.

## Next action

1. **Authenticate Atlassian MCP** for the automation owner in Cursor Desktop, **or** attach a Cursor environment (`didaxis_dev` or equivalent) with `ATLASSIAN_API_TOKEN`, `ATLASSIAN_EMAIL`, and `ATLASSIAN_BASE_URL` to this automation.  
2. **Seed the backlog:** move new DS stories to In Progress **without** pre-labeling `tests-generated` so the runner can pick them up.  
3. Keep `eval-report.md` refreshed on every backlog exit (including auth-blocked runs) so reliability metrics stay current.
