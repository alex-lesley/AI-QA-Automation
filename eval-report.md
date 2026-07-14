# Suite reliability report

**Maintained by:** `eval-report` skill — **mandatory** orchestrator close-out (see `.cursor/rules/qa-orchestrator.mdc` → Done).  
**Repo:** [alex-lesley/AI-QA-Automation](https://github.com/alex-lesley/AI-QA-Automation)  
**Generated:** 2026-07-14  
**Window:** last **15** `playwright.yml` CI runs (2026-06-18 → 2026-07-11), plus labeled generation PRs and `test-generation.yml` history through 2026-07-13.

Cursor has **no built-in telemetry** for flake, heal, generation-gate, or ask-vs-guess. Every number below was derived manually from GitHub Actions logs, PR/commit history, and session review.

---

## 1. Flake rate

| | |
|--|--|
| **Number** | **0** flaky test results / **~1,024** test results ≈ **0%** · **0 / 15** runs showed a retry-pass in this window |
| **How measured** | `gh run list --workflow=playwright.yml --limit 15`, then `gh run view <id> --log` for Playwright summary lines (`N passed` / `N failed` / `N flaky`). Latest run [29165341100](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/29165341100) (2026-07-11) ran the `@sanity` slice only (**22 passed**). Prior full-suite runs still show **69 passed** with no `flaky` line. |
| **What it tells us** | No retry-pass flake observed in the refreshed 15-run window. The historical `ds2-edit-program` flake (run 27791380766, outside this window) remains the only known instance. |

**Notable non-flake:** [run 28123886190](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/28123886190) — TC-010 failed on attempt + Retry #1 (assertion), then fixed on main — real failure, not flaky green.

---

## 2. Heal success rate

| | |
|--|--|
| **Number** | **0 / 0** clean heals (no drift-heal attempts in history) · **Masked regressions: 0** |
| **How measured** | Searched PRs/commits for `heal` / locator-drift repairs (`gh pr list`, `gh search commits`). Only hits are infrastructure ([PR #4](https://github.com/alex-lesley/AI-QA-Automation/pull/4) — self-heal workflow + assertion hook), not a post-triage POM locator heal. No `heal/*` repair PRs found. |
| **What it tells us** | Heal pipeline exists but is **unexercised** on real drift — success rate is undefined until the first classified drift run is healed and re-proven green with assertions unchanged. |

---

## 3. Generation-gate pass rate

| | |
|--|--|
| **Number** | **1 / 1** (100%) of `tests-generated` PRs met green + conforming + maps-to-AC on first open |
| **How measured** | PRs with label `tests-generated` → only [#5](https://github.com/alex-lesley/AI-QA-Automation/pull/5) (DS-4). Cross-checked generation job [28166814111](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/28166814111) summary (local `12 passed`), commit notes (`waitForTimeout` → `expect.poll`), presence of `features/DS-4.feature.md` from AC, and post-merge Playwright run [28167017985](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/28167017985) (**69 passed**). Later generation crons [28823029244](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/28823029244), [29282969693](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/29282969693) completed in ~1–2 min with **0 PRs** (empty backlog / no eligible tickets). |
| **What it tells us** | The one generated delivery cleared the gate, but the sample is too small to trust — and merge-without-PR-checks weakens the “first PR” signal. Backlog automation runs since 2026-07-06 have found no work. |

---

## 4. Ask-vs-guess

| | |
|--|--|
| **Number** | **Not instrumented suite-wide.** This backlog run (2026-07-14): **0 blocking asks**, **1 material inference** (prior run’s empty-backlog result treated as best available signal when Jira MCP auth blocked) |
| **How measured** | No Cursor metric exists. Reviewed this session: Atlassian MCP returned `needsAuth`; cloud environment has no `ATLASSIAN_*` env vars; prior authenticated run (2026-07-07) returned 0 eligible tickets via JQL `project = DS AND status = "In Progress" AND labels != tests-generated`. |
| **What it tells us** | Cloud automation runs cannot query Jira without MCP auth or env secrets — backlog state is unverified this run. |

---

## Top reliability risk

**Atlassian MCP auth gap in cloud agents.** The DS backlog automation depends on Jira read/write (query In Progress tickets, add `tests-generated` label). Cloud runs with `environment: null` and `Atlassian` MCP `needsAuth` cannot execute the per-ticket loop — even when the backlog may be empty.

Secondary: heal path unproven; generation-gate n=1; CI now runs `@sanity` slice (22 tests) on PRs while full suite is 69 tests.

## Next action

1. **Configure Jira access for cloud automation:** authenticate Atlassian MCP in Cursor desktop for the automation owner **or** attach a Cursor environment with `ATLASSIAN_EMAIL`, `ATLASSIAN_API_TOKEN`, `ATLASSIAN_BASE_URL`, and `JIRA_PROJECT_KEY` (matching `.github/workflows/test-generation.yml`).  
2. Re-run backlog automation; confirm JQL returns expected tickets before generating specs.  
3. After auth is restored, verify whether DS-6+ tickets need `tests-generated` labels (repo has `ds6-program-semester-panel.spec.ts` from explore-and-generate, not from a Jira ticket plan).
