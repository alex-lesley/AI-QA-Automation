# Suite reliability report

**Maintained by:** `eval-report` skill — **mandatory** orchestrator close-out (see `.cursor/rules/qa-orchestrator.mdc` → Done).  
**Repo:** [alex-lesley/AI-QA-Automation](https://github.com/alex-lesley/AI-QA-Automation)  
**Generated:** 2026-08-18  
**Window:** last **15** `playwright.yml` CI runs (2026-07-11 → 2026-08-17), plus labeled generation PRs and `test-generation.yml` history through 2026-08-18.

Cursor has **no built-in telemetry** for flake, heal, generation-gate, or ask-vs-guess. Every number below was derived manually from GitHub Actions logs, PR/commit history, and this session’s transcript. Jira queue status for this run is **inferred** from [test-generation run 32061893447](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/32061893447) (2026-08-17) because Atlassian MCP and `ATLASSIAN_*` env vars are unavailable in this cloud pod.

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
| **How measured** | `gh pr list --state all --label tests-generated` → only [#5](https://github.com/alex-lesley/AI-QA-Automation/pull/5) (DS-4). Cross-checked generation job [28166814111](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/28166814111) summary (local `12 passed`), commit notes (`waitForTimeout` → `expect.poll`), presence of `features/DS-4.feature.md` from AC, and post-merge Playwright run [28167017985](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/28167017985) (**69 passed**). This run (2026-08-18): live Jira query **blocked** (Atlassian MCP `needsAuth`; no `ATLASSIAN_*` in pod). Last verified queue ([run 32061893447](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/32061893447), 2026-08-17): **9** In Progress DS issues, **all** labeled `tests-generated` → queue size **0**. |
| **What it tells us** | The one generated delivery cleared the gate, but n=1 is too small to trust. The skip-label is the bottleneck: several In Progress tickets (DS-119, DS-120, DS-213, DS-214, DS-215) carry `tests-generated` with **no** matching spec under `tests/` on `main`. |

---

## 4. Ask-vs-guess

| | |
|--|--|
| **Number** | **Not instrumented suite-wide.** This session: **0 blocking asks**, **0 material guesses** of AC, locators, or env names |
| **How measured** | No Cursor metric exists. This backlog run attempted Atlassian MCP (auth blocked), confirmed no `ATLASSIAN_*` env vars, and used the last GH Actions Jira REST summary instead of inventing ticket keys or UI copy. Did **not** ask a human whether stale `tests-generated` labels should be stripped — followed the skip rule as written. |
| **What it tells us** | Empty-queue runs stay honest on ask-vs-guess; the metric will only become meaningful once unlabeled tickets are analyzed into Gherkin. |

---

## Top reliability risk

**Cloud automation cannot reach Jira**, so the Cursor cron cannot query the backlog or apply `tests-generated` labels. GH Actions (`test-generation.yml`) still has Jira credentials and confirmed an empty queue on 2026-08-17, but the two runners diverge.

Secondary: **`tests-generated` on Jira is skipping work that never landed in git.** All **9** In Progress DS tickets were labeled at last check, but `main` still has only program-CRUD specs (DS-1…DS-6). Dashboard (DS-119/DS-120) and Settings user-add (DS-213/DS-214/DS-215) have no `tests/` coverage.

---

## Next action

1. **Add `ATLASSIAN_*` secrets** to the Cursor Cloud Agent environment and authenticate Atlassian MCP so cron runs can query Jira and apply labels.  
2. **Audit Jira `tests-generated` labels** against merged specs; remove the label from DS-119, DS-213, DS-214, DS-215 (and similar) so they re-queue.  
3. **Merge one eval-report PR** (#15 or this run) so `main` is not stuck on 2026-07-11 numbers.
