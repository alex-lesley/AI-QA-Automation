# Suite reliability report

**Maintained by:** `eval-report` skill — **mandatory** orchestrator close-out (see `.cursor/rules/qa-orchestrator.mdc` → Done).  
**Repo:** [alex-lesley/AI-QA-Automation](https://github.com/alex-lesley/AI-QA-Automation)  
**Generated:** 2026-08-17  
**Window:** last **15** `playwright.yml` CI runs (2026-07-11 → 2026-08-11), plus labeled generation PRs and `test-generation.yml` history through 2026-08-17.

Cursor has **no built-in telemetry** for flake, heal, generation-gate, or ask-vs-guess. Every number below was derived manually from GitHub Actions logs, PR/commit history, Jira REST (`project = DS AND status = "In Progress"`), and this session’s transcript.

---

## 1. Flake rate

| | |
|--|--|
| **Number** | **1** flaky test result / **222** test results ≈ **0.45%** · **1 / 15** runs (6.7%) showed a retry-pass |
| **How measured** | `gh run list --workflow=playwright.yml --limit 15`, then `gh run view <id> --log` for Playwright summary lines (`N passed` / `N failed` / `N flaky`). Counted Playwright’s **flaky** (failed then passed on retry). Hard fails after retry do **not** count as flake. Window mix: **9** PR jobs (`npm run test:smoke`, 10 passed each = **90**) + **6** push jobs (`npm run test:sanity`, 22 results each = **132**). |
| **What it tells us** | Retry-passes are uncommon, but not gone: [run 31528544624](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/31528544624) (2026-08-11, sanity) reported **1 flaky** + **21 passed** — `ds4-delete-program` TC-005 (`expect(modal.root).toBeHidden()` timed out on `New Program` dialog, then passed on retry). |

---

## 2. Heal success rate

| | |
|--|--|
| **Number** | **0 / 0** clean heals (no drift-heal attempts in history) · **Masked regressions: 0** |
| **How measured** | Searched PRs/commits for `heal` / locator-drift repairs (`gh pr list`, `git log --grep=heal`). Only hits are infrastructure ([PR #4](https://github.com/alex-lesley/AI-QA-Automation/pull/4) — self-heal workflow + assertion hook) and eval-report backlog PRs whose titles match `heal` as a substring of “refresh”. No `heal/*` repair PRs found. Masked-regression count = heals that went green only by weakening assertions → **0** (none shipped). |
| **What it tells us** | Heal pipeline exists but is **unexercised** on real drift — success rate is undefined until the first classified drift run is healed and re-proven green with assertions unchanged. |

---

## 3. Generation-gate pass rate

| | |
|--|--|
| **Number** | **1 / 1** (100%) of `tests-generated` PRs met green + conforming + maps-to-AC on first open · **0** new generation PRs this run |
| **How measured** | `gh pr list --state all --label tests-generated` → only [#5](https://github.com/alex-lesley/AI-QA-Automation/pull/5) (DS-4). Cross-checked generation job [28166814111](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/28166814111) summary (local `12 passed`), commit notes (`waitForTimeout` → `expect.poll`), presence of `features/DS-4.feature.md` from AC, and post-merge Playwright run [28167017985](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/28167017985) (**69 passed**). This run (2026-08-17): Jira REST returned **9** In Progress DS issues, **all** labeled `tests-generated` → queue size **0**; no spec/PR opened. |
| **What it tells us** | The one generated delivery cleared the gate, but n=1 is too small to trust. The skip-label is now the bottleneck: several In Progress tickets (DS-119, DS-120, DS-213, DS-214, DS-215) carry `tests-generated` with **no** matching spec under `tests/` on `main`. |

---

## 4. Ask-vs-guess

| | |
|--|--|
| **Number** | **Not instrumented suite-wide.** This session: **0 blocking asks**, **0 material guesses** of AC, locators, or env names |
| **How measured** | No Cursor metric exists. This backlog run queried Jira REST with `ATLASSIAN_*` + `JIRA_PROJECT_KEY` (reachable), applied the orchestrator filter `status = "In Progress"` and `tests-generated` absent, and stopped without inventing ticket keys or UI copy. Did **not** ask a human whether stale `tests-generated` labels should be stripped — followed the skip rule as written. |
| **What it tells us** | Empty-queue runs stay honest on ask-vs-guess; the metric will only become meaningful once unlabeled tickets are analyzed into Gherkin. |

---

## Top reliability risk

**`tests-generated` on Jira is skipping work that never landed in git.** All **9** In Progress DS tickets are labeled, so the orchestrator queue is empty, but `main` still has only program-CRUD specs (DS-1…DS-6). Dashboard (DS-119/DS-120) and Settings user-add (DS-213/DS-214/DS-215) have no `tests/` coverage.

Secondary: `playwright.yml` still runs only `@smoke` on pull_request and `@sanity` on push — `@regression` / `@e2e` / `@destructive` never execute in CI. Eval-report PRs #6–#14 remain open, so `main` still publishes the 2026-07-11 metrics until a human merges.

## Next action

1. **Audit Jira `tests-generated` labels** against merged specs; remove the label from DS-119, DS-213, DS-214, DS-215 (and similar) so they re-queue.  
2. **Merge one eval-report PR** (this one or an earlier open refresh) so `main` is not stuck on 2026-07-11 numbers.  
3. **Extend CI** to `npm run test:regression` (and isolated `@destructive`) so generated specs get post-merge signal beyond smoke/sanity.
