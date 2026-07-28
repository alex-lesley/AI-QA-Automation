# Suite reliability report

**Maintained by:** `eval-report` skill — **mandatory** orchestrator close-out (see `.cursor/rules/qa-orchestrator.mdc` → Done).  
**Repo:** [alex-lesley/AI-QA-Automation](https://github.com/alex-lesley/AI-QA-Automation)  
**Generated:** 2026-07-28  
**Window:** last **15** `playwright.yml` CI runs (2026-06-22 → 2026-07-27), plus labeled generation PRs and `test-generation.yml` history through 2026-07-28.

Cursor has **no built-in telemetry** for flake, heal, generation-gate, or ask-vs-guess. Every number below was derived manually from GitHub Actions logs, PR/commit history, and a light session-transcript review.

---

## 1. Flake rate

| | |
|--|--|
| **Number** | **0** flaky test results / **~657** test results ≈ **0%** · **0 / 15** runs showed a retry-pass |
| **How measured** | `gh run list --workflow=playwright.yml --limit 15`, then `gh run view <id> --log` for Playwright summary lines (`N passed` / `N failed` / `N flaky`). Counted Playwright’s **flaky** (failed then passed on retry). Hard fails after retry do **not** count as flake. |
| **What it tells us** | No retry-passes in this window. Recent runs execute only `@smoke` (10 tests) or `@sanity` (22 tests) slices; full-suite runs (69 tests) are older. One hard fail remains in [run 28123886190](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/28123886190) (TC-010 assertion, fixed on main — not flake). |

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
| **How measured** | PRs with label `tests-generated` → only [#5](https://github.com/alex-lesley/AI-QA-Automation/pull/5) (DS-4). Cross-checked generation job [28166814111](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/28166814111) summary (local `12 passed`), commit notes (`waitForTimeout` → `expect.poll`), presence of `features/DS-4.feature.md` from AC, and post-merge Playwright run [28167017985](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/28167017985) (**69 passed**). Subsequent generation/backlog crons (2026-07-20, 2026-07-27, 2026-07-28) opened **0** ticket PRs — empty backlog. |
| **What it tells us** | The one generated delivery cleared the gate, but the sample is too small to trust — and merge-without-PR-checks weakens the “first PR” signal. Backlog is currently exhausted. |

---

## 4. Ask-vs-guess

| | |
|--|--|
| **Number** | **Not instrumented suite-wide.** This backlog run (2026-07-28): **asks 0 / guesses 0** material inferences |
| **How measured** | No Cursor metric exists. This session blocked on Jira auth and did not invent ticket ACs or specs; relied on prior verified GH Actions backlog query (2026-07-27) for queue state. |
| **What it tells us** | Cloud automation runs without Atlassian MCP auth cannot independently verify the backlog — must attach Cursor environment with Jira secrets or authenticate MCP for the automation owner. |

---

## Top reliability risk

**Cloud backlog automation cannot reach Jira.** Atlassian MCP reports `needsAuth` and the cloud pod has no `ATLASSIAN_*` env vars, so ticket discovery, labeling, and AC reads are blocked. The last **verified** queue state (2026-07-27 [test-generation run 30303836746](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/30303836746)) shows **0** unlabeled In Progress tickets — all 10 In Progress DS tickets already have `tests-generated`.

Secondary: CI only runs `@smoke` (PRs) and `@sanity` (pushes); **33 `@regression` + 3 `@e2e` + 4 `@destructive`** never run in current `playwright.yml`.

## Next action

1. **Authenticate Atlassian MCP** (or attach Cursor environment with `ATLASSIAN_BASE_URL`, `ATLASSIAN_EMAIL`, `ATLASSIAN_API_TOKEN`) for the automation owner so cloud runs can query Jira and add `tests-generated` labels.  
2. **Refill the backlog** — move new unlabeled DS stories to In Progress when test generation is needed.  
3. **Extend CI** with regression (and serial destructive) or nightly `test:all` so non-smoke tags get exercised.
