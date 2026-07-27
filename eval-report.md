# Suite reliability report

**Maintained by:** `eval-report` skill — **mandatory** orchestrator close-out (see `.cursor/rules/qa-orchestrator.mdc` → Done).  
**Repo:** [alex-lesley/AI-QA-Automation](https://github.com/alex-lesley/AI-QA-Automation)  
**Generated:** 2026-07-27  
**Window:** last **15** `playwright.yml` CI runs (2026-06-22 → 2026-07-21), plus labeled generation PRs and this backlog session.

Cursor has **no built-in telemetry** for flake, heal, generation-gate, or ask-vs-guess. Every number below was derived manually from GitHub Actions logs, PR/commit history, and this session’s review.

---

## 1. Flake rate

| | |
|--|--|
| **Number** | **0** flaky test results / **716** test results ≈ **0%** · **0 / 15** runs showed a retry-pass |
| **How measured** | `gh run list --workflow=playwright.yml --limit 15`, then `gh run view <id> --log` scanned for Playwright `flaky` lines and summary totals (`N passed` / `N failed` / `N flaky`). Summed reported results across jobs (post-tag CI: smoke≈10 or sanity≈22; pre-tag full suite: 69, except [28123886190](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/28123886190) = 68 passed + 1 failed). Hard fails after retry do **not** count as flake. |
| **What it tells us** | No retry-passes in the current 15-run window. Historical note (outside window): [run 27791380766](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/27791380766) (2026-06-18) still shows `1 flaky` in logs. |

**Notable non-flake:** [run 28123886190](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/28123886190) — `1 failed` / `68 passed` (assertion), not a flake.

---

## 2. Heal success rate

| | |
|--|--|
| **Number** | **0 / 0** clean heals (no drift-heal attempts in history) · **Masked regressions: 0** |
| **How measured** | `gh pr list` / search for `heal/*` or post-triage locator repair PRs. Only related hit is infrastructure ([PR #4](https://github.com/alex-lesley/AI-QA-Automation/pull/4) — self-heal workflow + assertion hook), not a POM locator heal. No `heal/*` repair PRs. Masked-regression count = heals that went green only by weakening assertions → **0** (none shipped). |
| **What it tells us** | Heal pipeline remains **unexercised** on real drift — success rate stays undefined until the first classified drift run is healed and re-proven green with assertions unchanged. |

---

## 3. Generation-gate pass rate

| | |
|--|--|
| **Number** | **1 / 1** (100%) of `tests-generated` PRs met green + conforming + maps-to-AC on first open |
| **How measured** | PRs with label `tests-generated` → only [#5](https://github.com/alex-lesley/AI-QA-Automation/pull/5) (DS-4). Cross-checked generation job [28166814111](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/28166814111) (local green), `features/DS-4.feature.md`, and post-merge [28167017985](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/28167017985) (**69 passed**). Later `test-generation.yml` / backlog runs (incl. 2026-07-20/21 and this 2026-07-27 run) opened **0** new `tests-generated` PRs — Jira In Progress queue is empty after the `tests-generated` label filter (10 In Progress issues, all already labeled). |
| **What it tells us** | Sample remains n=1; gate looks healthy but not statistically meaningful. Empty labeled backlog means generation-gate stays frozen until new unlabeled In Progress stories appear. |

---

## 4. Ask-vs-guess

| | |
|--|--|
| **Number** | **Not instrumented suite-wide.** This backlog session: **asks = 0**, **guesses = 0** material invented values |
| **How measured** | No Cursor metric exists. Session used Jira REST (`ATLASSIAN_*` + `JIRA_PROJECT_KEY`) as instructed; backlog emptiness is from API results, not inference. No ticket AC was guessed because **0 tickets** were processed. |
| **What it tells us** | Empty-queue runs don’t stress ask-vs-guess. Without a deliberate ask-log on ticket work, the suite-wide ratio stays unmeasured. |

---

## Top reliability risk

**CI tag slices omit most of the suite.** [`.github/workflows/playwright.yml`](.github/workflows/playwright.yml) runs `npm run test:smoke` on PRs (~9–10 tests) and `npm run test:sanity` on push (~21–22 tests). Tags present in `tests/`: `@regression` **33**, `@e2e` **3**, `@destructive` **4**, `@api` **0** — those never run in current CI. False confidence on green smoke/sanity is worse than flake.

Secondary: heal path still unproven; generation-gate n=1; In Progress backlog fully labeled so automation cannot add coverage without new stories or label resets.

## Next action

1. **Extend CI** to run `test:regression` (and serial `test:destructive`) on push/main or a nightly `test:all` — keep smoke as the PR fast gate.  
2. **Unblock backlog** by moving unlabeled DS stories to In Progress (or clearing `tests-generated` only when AC changed and specs need regeneration).  
3. After CI covers regression, add a tiny log/JSON reporter parser so flake counts update without hand-grepping.
