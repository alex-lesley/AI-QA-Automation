# Suite reliability report

**Maintained by:** `eval-report` skill — **mandatory** orchestrator close-out (see `.cursor/rules/qa-orchestrator.mdc` → Done).  
**Repo:** [alex-lesley/AI-QA-Automation](https://github.com/alex-lesley/AI-QA-Automation)  
**Generated:** 2026-11-10  
**Window:** last **15** `playwright.yml` CI runs (2026-10-06 → 2026-11-03), plus labeled generation PRs through this backlog run.

Cursor has **no built-in telemetry** for flake, heal, generation-gate, or ask-vs-guess. Every number below was derived manually from GitHub Actions logs, PR/commit history, and this session’s transcript review.

---

## 1. Flake rate

| | |
|--|--|
| **Number** | **8** flaky test results / **210** test results ≈ **3.81%** · **5 / 15** runs (33.3%) showed a retry-pass |
| **How measured** | `gh run list --workflow=playwright.yml --limit 15`, then `gh run view <id> --log` for Playwright summary / `##[notice]` lines (`N passed` / `N failed` / `N flaky`) per job. Counted Playwright’s **flaky** (failed then passed on retry). Hard fails after retry do **not** count as flake. |
| **What it tells us** | Flake is materially higher than the June window (~0.1%). Recent hits concentrate in smoke/sanity jobs on backlog eval branches (e.g. [run 37396401058](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/37396401058) — **2 flaky**; [run 38453638194](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/38453638194) — **3 flaky**). |

---

## 2. Heal success rate

| | |
|--|--|
| **Number** | **0 / 0** clean heals (no drift-heal attempts in history) · **Masked regressions: 0** |
| **How measured** | Searched PRs/commits for `heal` / locator-drift repairs (`gh pr list`, `gh search commits`, `head:heal/`). Only hits are infrastructure ([PR #4](https://github.com/alex-lesley/AI-QA-Automation/pull/4) — self-heal workflow + assertion hook), not a post-triage POM locator heal. No `heal/*` repair PRs found. Masked-regression count = heals that went green only by weakening assertions → **0** (none shipped). |
| **What it tells us** | Heal pipeline exists but is **unexercised** on real drift — success rate is undefined until the first classified drift run is healed and re-proven green with assertions unchanged. |

---

## 3. Generation-gate pass rate

| | |
|--|--|
| **Number** | **1 / 1** (100%) of `tests-generated` PRs met green + conforming + maps-to-AC on first open |
| **How measured** | PRs with label `tests-generated` → only [#5](https://github.com/alex-lesley/AI-QA-Automation/pull/5) (DS-4). Still the sole labeled generation delivery; this backlog run opened **0** ticket PRs (Jira REST auth **401**). Cross-check from prior report: generation job local green + `features/DS-4.feature.md` AC map remains the gate evidence for #5. |
| **What it tells us** | Gate sample stays n=1; backlog automation cannot grow it while Atlassian credentials fail. |

---

## 4. Ask-vs-guess

| | |
|--|--|
| **Number** | **Not instrumented suite-wide.** This backlog session: **asks = 0** blocking · **guesses = 0** material inventions (stopped on auth; did not invent ticket keys/AC) |
| **How measured** | No Cursor metric exists. Reviewed this run’s decisions: Jira `GET /rest/api/3/myself` → **401** with `ATLASSIAN_EMAIL` + `ATLASSIAN_API_TOKEN`; Atlassian MCP `needsAuth` and interactive auth unavailable in this environment. Queue left unread rather than guessed. |
| **What it tells us** | Correct stop on missing access; without a durable ask-log, suite-wide ask-vs-guess remains anecdotal. |

---

## Top reliability risk

**Broken Jira API authentication blocks the entire backlog loop.** `ATLASSIAN_EMAIL` + `ATLASSIAN_API_TOKEN` against `ATLASSIAN_BASE_URL` return **401** on `/rest/api/3/myself`; project `DS` is unreachable. Dozens of open eval-only PRs (#8–#37 pattern) show this has been failing for months — no new `tests-generated` deliveries can land until secrets work.

Secondary: elevated flake (~3.8% of results; 33% of recent runs) in smoke/sanity CI; heal path still unproven (0/0).

## Next action

1. **Rotate/fix `ATLASSIAN_API_TOKEN`** (and confirm email matches the token owner) until `GET /rest/api/3/myself` returns 200; then re-run backlog mode.  
2. **Triage recent flaky smoke/sanity failures** (modal `toBeHidden` retries) once ticket generation resumes.  
3. Optionally add a CI log parser / Playwright JSON reporter upload so flake metrics do not require hand-grepping.
