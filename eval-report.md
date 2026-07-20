# Suite reliability report

**Maintained by:** `eval-report` skill — **mandatory** orchestrator close-out (see `.cursor/rules/qa-orchestrator.mdc` → Done).  
**Repo:** [alex-lesley/AI-QA-Automation](https://github.com/alex-lesley/AI-QA-Automation)  
**Generated:** 2026-07-20  
**Window:** last **15** `playwright.yml` CI runs (2026-06-22 → 2026-07-14), plus labeled generation PRs and heal search through 2026-07-20.

Cursor has **no built-in telemetry** for flake, heal, generation-gate, or ask-vs-guess. Every number below was derived manually from GitHub Actions logs, PR/commit history, and this session’s transcript review.

**Backlog note (this run):** Jira REST `project = DS AND status = "In Progress"` returned **10** issues; **all** already carry label `tests-generated`. Eligible queue (`tests-generated` absent) = **0**. Budget unused.

---

## 1. Flake rate

| | |
|--|--|
| **Number** | **0** flaky test results / **~918** counted results ≈ **0%** · **0 / 15** runs showed a retry-pass |
| **How measured** | `gh run list --workflow=playwright.yml --limit 15`, then `gh run view <id> --log` scanned for Playwright `flaky` and summary lines (`N passed` / `N failed` / `N skipped`). Older jobs in the window ran full suite (~69 passed + 3 skipped ≈ 72/run × 12). Newer jobs run tag slices only (10 smoke + 22 sanity × 2 ≈ 54). Hard fails after retry do **not** count as flake. |
| **What it tells us** | No retry-passes in this window. Prior flake (`ds2` TC-003 in run 27791380766) aged out of the 15-run sample. |

**Notable non-flake:** [run 28123886190](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/28123886190) — 1 failed + 68 passed (assertion), not a flaky green.

---

## 2. Heal success rate

| | |
|--|--|
| **Number** | **0 / 0** clean heals (no post-triage drift-heal attempts) · **Masked regressions: 0** |
| **How measured** | `gh pr list` + `gh search commits` for `heal` / locator-drift repairs. Only hit is infrastructure [PR #4](https://github.com/alex-lesley/AI-QA-Automation/pull/4) (self-heal workflow + assertion hook) — not a POM locator heal after triage. No `heal/*` repair PRs. Masked-regression count = heals that went green only by weakening assertions → **0**. |
| **What it tells us** | Heal path remains **unexercised** on real drift; success rate stays undefined until the first classified drift is POM-healed and re-proven green with assertions unchanged. |

---

## 3. Generation-gate pass rate

| | |
|--|--|
| **Number** | **1 / 1** (100%) of GitHub PRs labeled `tests-generated` met green + conforming + maps-to-AC on first delivery |
| **How measured** | `gh pr list --label tests-generated` → only [#5](https://github.com/alex-lesley/AI-QA-Automation/pull/5) (DS-4). Cross-checked agent-local green on that PR era and post-merge [run 28167017985](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/28167017985) (**69 passed**). Jira tickets may also carry `tests-generated` without a matching labeled GitHub PR — those are **out of scope** for this PR-based gate. |
| **What it tells us** | Gate sample remains n=1. Specs for other DS stories exist on `main`, but without labeled generation PRs the gate cannot credit them. |

---

## 4. Ask-vs-guess

| | |
|--|--|
| **Number** | **Not instrumented suite-wide.** This backlog session: **asks = 0** blocking · **guesses = 0** material inventions |
| **How measured** | No Cursor metric exists. Session review: queried Jira via REST (`ATLASSIAN_*` + `JIRA_PROJECT_KEY`), confirmed empty eligible queue, did not invent tickets/AC or open red specs. Did not ask the human because evidence was sufficient to stop. |
| **What it tells us** | Empty-queue stop is the correct ask-vs-guess posture here; suite-wide ratio still needs a deliberate ask-log to be trustworthy. |

---

## Top reliability risk

**CI tag slicing leaves most of the suite unrun.** `.github/workflows/playwright.yml` runs `npm run test:smoke` on PRs (~10 tests) and `npm run test:sanity` on push (~22 tests). Tags are present on specs (~69 `test()` calls), but **`@regression` / `@e2e` / `@destructive` never execute in CI** — a false-green risk for the majority of coverage.

Secondary: heal path still unproven; generation-gate n=1; In Progress backlog fully labeled so automation has nothing left to generate until new unlabeled stories move to In Progress.

## Next action

1. **Add a scheduled or push job** that runs `npm run test:all` (or at least `@regression`) so CI covers more than smoke/sanity.  
2. **Require the `tests-generated` label** on every generation PR so the gate sample grows with real deliveries.  
3. Move new DS stories to In Progress **without** pre-applying `tests-generated` if the backlog runner should pick them up.
