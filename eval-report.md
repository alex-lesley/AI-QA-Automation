# Suite reliability report

**Maintained by:** `eval-report` skill — **mandatory** orchestrator close-out (see `.cursor/rules/qa-orchestrator.mdc` → Done).  
**Repo:** [alex-lesley/AI-QA-Automation](https://github.com/alex-lesley/AI-QA-Automation)  
**Generated:** 2026-08-10  
**Window:** last **15** `playwright.yml` CI runs (2026-06-25 → 2026-08-04), plus labeled generation PRs and this backlog session.

Cursor has **no built-in telemetry** for flake, heal, generation-gate, or ask-vs-guess. Every number below was derived manually from GitHub Actions logs, PR history, and this session’s transcript.

---

## 1. Flake rate

| | |
|--|--|
| **Number** | **0** flaky / **387** counted results ≈ **0%** · **0 / 15** runs showed a retry-pass |
| **How measured** | `gh run list --workflow=playwright.yml --limit 15`, then `gh run view <id> --log` for Playwright duration summaries (`N passed (…)` / `N failed` / `N flaky`). Deduped `##[notice]` duplicate lines. Job mix in window: 7× PR `@smoke` (10 each), 5× push `@sanity` (22 each), 3× legacy full `test:e2e` (69 passed + 3 skipped each; skipped excluded from flake denominator). |
| **What it tells us** | No retry-passes in this window. Prior known flake ([run 27791380766](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/27791380766), ds2 TC-003) is **outside** the current 15-run window. |

---

## 2. Heal success rate

| | |
|--|--|
| **Number** | **0 / 0** clean heals (no drift-heal attempts in history) · **Masked regressions: 0** |
| **How measured** | `gh pr list` / branch search for `heal/*` post-triage POM repairs; only infrastructure hit remains [PR #4](https://github.com/alex-lesley/AI-QA-Automation/pull/4) (self-heal workflow + assertion guard), not a locator heal. Masked-regression count = heals that went green only by weakening assertions → **0** (none shipped). |
| **What it tells us** | Heal path is still **unexercised** on real drift; success rate stays undefined until the first classified drift run is healed with assertions unchanged and re-proven green. |

---

## 3. Generation-gate pass rate

| | |
|--|--|
| **Number** | **1 / 1** (100%) of `tests-generated` PRs met green + conforming + maps-to-AC on first open |
| **How measured** | `gh pr list --label tests-generated --state all` → only [#5](https://github.com/alex-lesley/AI-QA-Automation/pull/5) (DS-4). Cross-checked local generation notes + post-merge [run 28167017985](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/28167017985) (**69 passed**). This backlog run (2026-08-10) opened **0** new generation PRs — eligible In Progress queue was empty (all 5 In Progress issues already carry `tests-generated`). |
| **What it tells us** | Gate sample remains n=1; backlog automation is idle on already-labeled In Progress work, so the gate is not getting new evidence. |

---

## 4. Ask-vs-guess

| | |
|--|--|
| **Number** | **Not instrumented suite-wide.** This session: **asks = 0** blocking · **guesses = 0** material invented values |
| **How measured** | No Cursor metric exists. Reviewed this backlog transcript: Jira REST auth worked; queue filter `status = "In Progress"` ∧ label `tests-generated` absent returned **zero** keys; no AC/path/env invented because no ticket loop ran. |
| **What it tells us** | Empty-queue close-outs do not stress ask-vs-guess; the metric stays useful mainly on analyze/write loops. |

---

## Top reliability risk

**CI tag slices omit most of the suite.** `.github/workflows/playwright.yml` runs `@smoke` on PRs and `@sanity` on pushes only. Local tag census: **70** tagged tests (`smoke` 9 · `sanity` 21 · `regression` 33 · `e2e` 3 · `destructive` 4) with **0** untagged — so **~40** regression/e2e/destructive cases never execute in this workflow. False confidence on green PR/push checks is the dominant risk (prior “untagged + `test:e2e`” risk is resolved).

Secondary: heal path still unproven; generation-gate n=1; In Progress backlog fully labeled so orchestrator generates no new coverage.

## Next action

1. **Extend CI** to run `@regression` on a schedule or main push (and keep `@destructive` serial/isolated) so green checks cover more than smoke/sanity.  
2. **Feed the queue** — move unlabeled DS stories to In Progress (or clear stale `tests-generated` only when AC changed) so backlog runs process new work.  
3. Add a tiny CI log parser / Playwright JSON upload so flake counts update without hand-grepping logs.
