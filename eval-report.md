# Suite reliability report

**Maintained by:** `eval-report` skill — **mandatory** orchestrator close-out (see `.cursor/rules/qa-orchestrator.mdc` → Done).  
**Repo:** [alex-lesley/AI-QA-Automation](https://github.com/alex-lesley/AI-QA-Automation)  
**Generated:** 2026-10-20  
**Window:** last **15** `playwright.yml` runs (2026-09-14 → 2026-10-19). Generation notes use labeled PRs and `test-generation.yml` through [run 39338126737](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/39338126737) (2026-10-19).

Cursor has **no built-in telemetry** for flake, heal, generation-gate, or ask-vs-guess. Every number below was derived from GitHub Actions logs, PR history, and this session. Nothing here is estimated.

---

## 1. Flake rate

| | |
|--|--|
| **Number** | **7** flaky test results / **210** test results ≈ **3.3%** · **4 / 15** runs (26.7%) contained at least one retry-pass |
| **How measured** | `gh run list --workflow=playwright.yml --limit 15`, then `gh run view <id> --log` for the Playwright summary (`N failed` / `N flaky` / `N passed`). Flaky counts are Playwright’s retry-pass bucket and are **not** included in `passed`. Hard fails after retry are excluded from the flake numerator. Per-run totals: ten smoke slices of 10 tests (100) and five sanity slices of 22 tests (110). |
| **What it tells us** | Retry-passes are concentrated, not uniform. The 7 flakes are ds1 TC-002 (create appears in the list) twice on smoke, ds2 TC-002 (name update) once on smoke, ds1 TC-004 (empty description) once on sanity, ds2 TC-006 (duplicate name) twice on sanity, and ds3 TC-006 (case-only duplicate) once on sanity. |

**Runs with flakes:** [37517886559](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/37517886559) (1), [37396401058](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/37396401058) (2), [35012658722](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/35012658722) (1), [38453638194](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/38453638194) (3).

**Hard fails in the same window (not flake):** 6 test results stayed red after retry, across 5 runs. ds1 TC-008 (duplicate name rejected, list unchanged) failed on sanity pushes [38453638194](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/38453638194), [37517871975](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/37517871975), [36618154369](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/36618154369), and [35772727596](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/35772727596). ds1 TC-002 stayed red on smoke [38332257367](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/38332257367). ds2 TC-006 stayed red on [37517871975](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/37517871975).

---

## 2. Heal success rate

| | |
|--|--|
| **Number** | **0 / 0** clean heals (no drift-heal attempts) · **Masked regressions: 0** |
| **How measured** | `gh pr list` (all states, limit 100) and `gh search` for heal/locator-repair work. The only heal-related PR is [#4](https://github.com/alex-lesley/AI-QA-Automation/pull/4) (`chore/self-heal-hooks-orchestrator`), which adds the heal workflow and assertion hook. No `heal/*` repair PR and no post-triage POM locator patch. Masked regressions = heals that went green only by weakening `expect` → **0**. |
| **What it tells us** | The heal path is still unexercised. The red sanity results above were not classified or healed in this run, so they stay evidence rather than a repaired locator. |

---

## 3. Generation-gate pass rate

| | |
|--|--|
| **Number** | **Rate unavailable this session.** Labeled `tests-generated` PRs: **1** ([#5](https://github.com/alex-lesley/AI-QA-Automation/pull/5), DS-4, merged 2026-06-25). New labeled PRs from recent generation runs: **0**. |
| **How measured** | `gh pr list` filtered on label `tests-generated` → only #5. `gh pr view 5` `statusCheckRollup` is empty (no PR checks recorded). Post-merge `playwright.yml` [28167017985](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/28167017985) conclusion is **success**; log no longer exposes a Playwright pass count for re-measurement. Completed `test-generation.yml` runs on 2026-07-13 → 2026-10-19 (including [39338126737](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/39338126737)) concluded success but opened **0** `tests-generated` PRs because Jira auth failed before any ticket was read. |
| **What it tells us** | The gate has a single historical labeled PR and no fresh sample. Both GitHub Actions generation and this Cloud Automation cron are blocked at Jira before specs are written. |

---

## 4. Ask-vs-guess

| | |
|--|--|
| **Number** | **This session: 0 blocking asks, 0 material guesses.** Suite-wide ratio: **not instrumented**. |
| **How measured** | Session review of the 2026-10-20 backlog cron only. Atlassian MCP status is `needsAuth` (interactive auth unavailable in Cloud Agents). The pod has no `ATLASSIAN_*` environment variables. GitHub `didaxis_dev` generation run [39338126737](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/39338126737) logged `GET /rest/api/3/myself` → **401** (`AUTHENTICATED_FAILED`). No ticket key, acceptance criterion, locator, or user-facing message was invented. Budget used: **0 / 5** tickets. |
| **What it tells us** | This run stopped at the auth boundary instead of writing specs from assumed tickets. Older sessions still have no reliable ask/guess counter. |

---

## Top reliability risk

**Jira credentials block the entire generation loop** (Cloud MCP + GitHub `ATLASSIAN_API_TOKEN` both fail `/myself`). Until that is fixed, In Progress DS tickets cannot be queried and no new conforming specs ship. Secondary: **ds1 TC-008** stays red after retry on repeated sanity pushes, and create/duplicate-name tests account for every flake in the Playwright window — that cluster can mask a real duplicate-name defect behind retries.

## Next action

1. Replace `ATLASSIAN_API_TOKEN` with a token for `ATLASSIAN_EMAIL`; confirm `GET /rest/api/3/myself` returns **200** (scoped tokens via `https://api.atlassian.com/ex/jira/{cloudId}/...`). Authenticate Atlassian MCP in Cursor desktop for Cloud Agents, or inject `ATLASSIAN_*` into the agent environment.  
2. Re-run the In Progress backlog (budget 5).  
3. Triage ds1 TC-008 hard fails (runs listed above) before any locator heal. Do not weaken assertions.  
4. A human merges; this close-out does not merge anything.
