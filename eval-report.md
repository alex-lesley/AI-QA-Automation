# Suite reliability report

**Maintained by:** `eval-report` skill — **mandatory** orchestrator close-out (see `.cursor/rules/qa-orchestrator.mdc` → Done).  
**Repo:** [alex-lesley/AI-QA-Automation](https://github.com/alex-lesley/AI-QA-Automation)  
**Generated:** 2026-10-13  
**Window:** last **15** `playwright.yml` runs (2026-09-07 → 2026-10-06). Generation-gate also uses every PR labeled `tests-generated` (only [#5](https://github.com/alex-lesley/AI-QA-Automation/pull/5), merged 2026-06-25).

Cursor has **no built-in telemetry** for flake, heal, generation-gate, or ask-vs-guess. Every number below was derived from GitHub Actions logs, PR history, and this run’s session notes.

This backlog run processed **0** tickets. `GET /rest/api/3/myself` with `ATLASSIAN_EMAIL` + `ATLASSIAN_API_TOKEN` returned **401**. Anonymous `search/jql` returned `200` with an empty issue list; that is not an empty In Progress queue. Atlassian MCP is `needsAuth`, and interactive MCP login is unavailable in this agent environment.

---

## 1. Flake rate

| | |
|--|--|
| **Number** | **4** flaky test results / **210** test results ≈ **1.90%** · **3 / 15** runs showed a retry-pass |
| **How measured** | `gh run list --workflow=playwright.yml --limit 15`, then `gh run view <id> --log`. Counted Playwright summary lines (`N flaky`, `N passed`, `N failed`). A result is flaky only when Playwright reported it as flaky (failed, then passed on retry). Hard fails after retry are excluded. Totals: 202 passed + 4 flaky + 4 failed = 210. CI in this window runs `npm run test:smoke` on `pull_request` (10 tests) and `npm run test:sanity` on `push` (22 tests). |
| **What it tells us** | Retry-passes are concentrated, not scattered noise. The four flakes are [run 35012658722](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/35012658722) `ds2` TC-006 (duplicate name rejected), [run 37396401058](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/37396401058) `ds1` TC-002 and `ds2` TC-002 (`toBeHidden`), and [run 37517886559](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/37517886559) `ds1` TC-002 again. |

**Notable non-flake (hard fails, not in the 1.90%):**

- [run 35772727596](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/35772727596) and [run 36618154369](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/36618154369) — 1 failed each: `ds1` TC-008 duplicate name, `expect(locator).toHaveCount`.
- [run 37517871975](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/37517871975) — 2 failed: `ds1` TC-008 and `ds2` TC-006, both `toHaveCount`, still red on Retry #1.

---

## 2. Heal success rate

| | |
|--|--|
| **Number** | **0 / 0** clean heals (no drift-heal attempts) · **Masked regressions: 0** |
| **How measured** | `gh pr list` filtered for head branches matching heal/locator/drift, plus `gh search commits` for `heal`. The only hit is infrastructure [PR #4](https://github.com/alex-lesley/AI-QA-Automation/pull/4) (`chore/self-heal-hooks-orchestrator`), not a post-triage POM locator repair. No `heal/*` repair PRs. Masked regressions = heals that went green only by weakening `expect` → **0**. |
| **What it tells us** | The heal pipeline is still unexercised on real drift. The rate stays undefined until a classified drift failure is repaired in the POM only and re-proven green with assertions unchanged. |

---

## 3. Generation-gate pass rate

| | |
|--|--|
| **Number** | **1 / 1** (100%) of `tests-generated` PRs met green + conforming + maps-to-AC on first open · **0** new `tests-generated` PRs in the 2026-09-07 → 2026-10-13 generation window |
| **How measured** | `gh pr list --label tests-generated --state all` returns only [#5](https://github.com/alex-lesley/AI-QA-Automation/pull/5) (DS-4). PR body records local `npx playwright test tests/ds4-delete-program.spec.ts` **12 passed**, links `features/DS-4.feature.md` to the ticket AC, and notes the `waitForTimeout` → `expect.poll` fix. `gh pr checks 5` reports no checks on that branch. Post-merge [run 28167017985](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/28167017985) concluded **success** (job `Didaxis E2E`). Later Test Generation runs (through [37396040860](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/37396040860) on 2026-10-06) opened eval-only PRs and did not add `tests-generated`. |
| **What it tells us** | The single generated delivery still clears the historical gate, but the sample has not grown because Jira auth blocks the backlog. Merge-without-PR-checks still weakens the “first PR” signal. |

---

## 4. Ask-vs-guess

| | |
|--|--|
| **Number** | **This run: 0 blocking asks, 0 material guesses.** Suite-wide ratio **not instrumented**. |
| **How measured** | No Cursor metric exists. This session stopped when Jira returned 401 and did not invent ticket keys, acceptance criteria, locators, or credentials. Local `features/DS-*.feature.md` files were not treated as the live queue. Keyword scans of other transcripts were not used as a count. |
| **What it tells us** | This run did not paper over the auth gap. Without a durable ask-log, older sessions remain anecdotal. |

---

## Top reliability risk

**Jira basic auth is rejected (401), so the In Progress backlog cannot be read and no specs are generated.** Repeated eval-only PRs do not restore coverage. Secondary: duplicate-name checks (`ds1` TC-008, `ds2` TC-006) and create/update hide assertions (`ds1`/`ds2` TC-002) either flake or stay red after retry inside the smoke/sanity slices CI actually runs.

## Next action

1. Replace `ATLASSIAN_API_TOKEN` with a token owned by `ATLASSIAN_EMAIL` and confirm `GET /rest/api/3/myself` returns **200** before the next Test Generation run.  
2. Re-query `project = DS AND status = "In Progress"` and process up to 5 tickets that lack `tests-generated`.  
3. Triage the duplicate-name `toHaveCount` hard fails and the `toBeHidden` flakes before treating smoke/sanity green as stable.
