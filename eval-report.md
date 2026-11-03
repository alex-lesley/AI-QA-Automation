# Suite reliability report

**Maintained by:** `eval-report` skill — **mandatory** orchestrator close-out (see `.cursor/rules/qa-orchestrator.mdc` → Done).  
**Repo:** [alex-lesley/AI-QA-Automation](https://github.com/alex-lesley/AI-QA-Automation)  
**Generated:** 2026-11-03  
**Window:** last **15** `playwright.yml` CI runs (2026-09-28 → 2026-10-27), plus labeled generation PRs and `test-generation.yml` history through 2026-11-03.

Cursor has **no built-in telemetry** for flake, heal, generation-gate, or ask-vs-guess. Every number below was derived manually from GitHub Actions logs, PR history, and this session’s transcript.

---

## 1. Flake rate

| | |
|--|--|
| **Number** | **7** flaky test results / **220** test results ≈ **3.2%** · **4 / 15** runs (26.7%) showed ≥1 retry-pass |
| **How measured** | `gh run list --workflow=playwright.yml --limit 15`, then `gh run view <id> --log` for Playwright summary lines (`N passed` / `N failed` / `N flaky`). Counted Playwright’s **flaky** (failed then passed on retry). Hard fails after retry do **not** count as flake. |
| **What it tells us** | Retry-passes are concentrated in create/edit happy paths and duplicate-name flows — e.g. `ds1` TC-002 / TC-004, `ds2` TC-002 / TC-006, `ds3` TC-006, `ds5` TC-003 across runs [37396401058](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/37396401058), [37517886559](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/37517886559), [38453638194](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/38453638194), [39482025408](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/39482025408). |

**Notable non-flake:** Same window still has hard fails after retry on duplicate-name sanity (e.g. `ds1` TC-008, `ds2` TC-006) — real reds, not flaky greens.

---

## 2. Heal success rate

| | |
|--|--|
| **Number** | **0 / 0** clean heals (no drift-heal attempts in history) · **Masked regressions: 0** |
| **How measured** | Searched PRs/commits for `heal` / locator-drift repairs (`gh pr list`, title/`heal/*` branch scan). Only hit is infrastructure ([PR #4](https://github.com/alex-lesley/AI-QA-Automation/pull/4) — self-heal workflow + assertion hook), not a post-triage POM locator heal. No `heal/*` repair PRs found. Masked-regression count = heals that went green only by weakening assertions → **0** (none shipped). |
| **What it tells us** | Heal pipeline exists but is **unexercised** on real drift — success rate is undefined until the first classified drift run is healed and re-proven green with assertions unchanged. |

---

## 3. Generation-gate pass rate

| | |
|--|--|
| **Number** | **1 / 1** (100%) of `tests-generated` PRs met green + conforming + maps-to-AC on first open |
| **How measured** | PRs with label `tests-generated` → only [#5](https://github.com/alex-lesley/AI-QA-Automation/pull/5) (DS-4). Cross-checked presence of `features/DS-4.feature.md`, conventions, and merge history. Subsequent `test-generation.yml` crons (through [41560750830](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/41560750830) on 2026-11-03) open **eval-only** PRs titled “Jira auth blocked” — **0** new `tests-generated` deliveries in this window. |
| **What it tells us** | The one generated delivery cleared the gate, but the sample stays n=1; backlog automation has not produced another gated PR while Jira credentials fail. |

---

## 4. Ask-vs-guess

| | |
|--|--|
| **Number** | **Not instrumented suite-wide.** This backlog session: **asks = 0** blocking questions to a human · **guesses = 0** invented ticket keys / AC / env names (stopped on measured Jira **401**) |
| **How measured** | No Cursor metric exists. Reviewed this run’s decisions: REST `/rest/api/3/myself` → **401** with `ATLASSIAN_EMAIL` + `ATLASSIAN_API_TOKEN`; did **not** fabricate an In Progress queue from `features/*.feature.md`. |
| **What it tells us** | Stopping on auth failure is correct ask-vs-guess behavior; without a durable ask-log, suite-wide ratio remains unmeasured. |

---

## Top reliability risk

**Jira API auth is broken for backlog automation.** `GET /rest/api/3/myself` returns **401** with the configured `ATLASSIAN_EMAIL` / `ATLASSIAN_API_TOKEN` against `ATLASSIAN_BASE_URL` (site `legionqaschool.atlassian.net` is reachable; project `DS` cannot be listed). Cron has repeated this since at least 2026-08 (open PRs #18–#36), so **no ticket specs can be generated or labeled**.

Secondary: ~3.2% flake on smoke/sanity slices plus recurring hard fails on duplicate-name cases — worth triage after auth is restored.

## Next action

1. **Rotate/fix `ATLASSIAN_API_TOKEN`** (and confirm `ATLASSIAN_EMAIL` holds a DS project role) in GitHub Actions secrets / runner env; re-run `GET /rest/api/3/myself` until **200**.  
2. Re-run backlog mode; process In Progress tickets missing `tests-generated`.  
3. After tickets flow again, triage duplicate-name / create-modal flake with `ci-failure-triage` (do not weaken assertions).
