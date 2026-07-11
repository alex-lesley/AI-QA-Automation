# Suite reliability report

**Maintained by:** `eval-report` skill — **mandatory** orchestrator close-out (see `.cursor/rules/qa-orchestrator.mdc` → Done).  
**Repo:** [alex-lesley/AI-QA-Automation](https://github.com/alex-lesley/AI-QA-Automation)  
**Generated:** 2026-07-11  
**Window:** last **15** `playwright.yml` CI runs (2026-06-18 → 2026-06-25), plus labeled generation PRs and `test-generation.yml` history through 2026-07-06.

Cursor has **no built-in telemetry** for flake, heal, generation-gate, or ask-vs-guess. Every number below was derived manually from GitHub Actions logs, PR/commit history, and a light session-transcript review.

---

## 1. Flake rate

| | |
|--|--|
| **Number** | **1** flaky test result / **~1,031** test results ≈ **0.10%** · **1 / 15** runs (6.7%) showed a retry-pass |
| **How measured** | `gh run list --workflow=playwright.yml --limit 15`, then `gh run view <id> --log` for Playwright summary lines (`N passed` / `N failed` / `N flaky`). Counted Playwright’s **flaky** (failed then passed on retry). Hard fails after retry do **not** count as flake. |
| **What it tells us** | Retry-passes are rare in this window; the one flake was `ds2-edit-program` TC-003 (timeout on `locator.click`) in [run 27791380766](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/27791380766). |

**Notable non-flake:** [run 28123886190](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/28123886190) — TC-010 failed on attempt + Retry #1 (assertion), then fixed on main — real failure, not flaky green.

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
| **How measured** | PRs with label `tests-generated` → only [#5](https://github.com/alex-lesley/AI-QA-Automation/pull/5) (DS-4). Cross-checked generation job [28166814111](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/28166814111) summary (local `12 passed`), commit notes (`waitForTimeout` → `expect.poll`), presence of `features/DS-4.feature.md` from AC, and post-merge Playwright run [28167017985](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/28167017985) (**69 passed**). PR branch had **no** status checks before merge (fast-merge); gate used agent-local run + main CI. Later generation crons opened **0** PRs (empty backlog / no tickets). |
| **What it tells us** | The one generated delivery cleared the gate, but the sample is too small to trust — and merge-without-PR-checks weakens the “first PR” signal. |

---

## 4. Ask-vs-guess

| | |
|--|--|
| **Number** | **Not instrumented suite-wide.** Sample (this reliability + recent agent work): **asks ≈ 0 blocking**, **guesses ≈ 3–5** material inferences acted on without confirmation |
| **How measured** | No Cursor metric exists. Reviewed this session’s decisions (e.g. `test:e2e` → tag grep + `test:all`, factory shape, leaving `DIDAXIS_NON_ADMIN_*` vs documenting `ALT_*`) plus a noisy keyword scan of ~12 local agent transcripts (`could you` / `assuming` / etc.) — keyword hits are **not** reliable enough to publish as a ratio. |
| **What it tells us** | Agents currently prefer shipping over clarifying; without a deliberate ask-log, ask-vs-guess will stay anecdotal and optimism-biased. |

---

## Top reliability risk

**Untagged suite + `test:e2e` now means `--grep @e2e`.** Existing specs still have **no** `@smoke` / `@regression` / … tags, while [`.github/workflows/playwright.yml`](.github/workflows/playwright.yml) still runs `npm run test:e2e`. Once this lands on `main`, CI may run **zero** (or a tiny subset of) tests and report a false green — a worse failure mode than flake.

Secondary: heal path unproven; generation-gate n=1 with no required PR checks.

## Next action

1. **Fix CI entrypoint** to `npm run test:all` (or restore full-suite script name) before merging the tag-script change.  
2. **Backfill exactly one tag per existing `test()`**, then keep `test:smoke` / `test:destructive` as intentional slices.  
3. After that, add a tiny CI log parser (or Playwright JSON reporter upload) so flake/heal/generation metrics update without hand-grepping logs.
