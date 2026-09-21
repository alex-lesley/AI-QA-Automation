# Suite reliability report

**Maintained by:** `eval-report` skill — **mandatory** orchestrator close-out (see `.cursor/rules/qa-orchestrator.mdc` → Done).  
**Repo:** [alex-lesley/AI-QA-Automation](https://github.com/alex-lesley/AI-QA-Automation)  
**Generated:** 2026-09-21  
**Window:** last **15** `playwright.yml` CI runs (2026-08-17 → 2026-09-15), plus labeled generation PRs and `test-generation.yml` history through 2026-09-21.

Cursor has **no built-in telemetry** for flake, heal, generation-gate, or ask-vs-guess. Every number below was derived manually from GitHub Actions logs, PR/commit history, and this session’s decisions.

---

## 1. Flake rate

| | |
|--|--|
| **Number** | **0** flaky test results / **~418** counted Playwright summary pass lines ≈ **0.00%** · **0 / 15** runs showed a retry-pass |
| **How measured** | `gh run list --workflow=playwright.yml --limit 15`, then `gh run view <id> --log` for Playwright end summaries (`N passed` / `N failed` / `N flaky`). Counted Playwright’s **flaky** (failed then passed on retry). Hard fails after retry do **not** count as flake. Jobs in this window are PR `@smoke` and push `@sanity` only (see `playwright.yml`). |
| **What it tells us** | No retry-passes in the current smoke/sanity CI slice; flake signal is healthy for what CI actually runs, but regression/`@e2e`/`@destructive` are outside this window. |

---

## 2. Heal success rate

| | |
|--|--|
| **Number** | **0 / 0** clean heals (no drift-heal attempts in history) · **Masked regressions: 0** |
| **How measured** | `gh pr list` / title+branch scan for `heal/` or post-triage locator repairs. Only related history is infrastructure ([PR #4](https://github.com/alex-lesley/AI-QA-Automation/pull/4) — self-heal workflow + assertion hook), not a classified drift heal. No `heal/*` repair PRs. Masked-regression count = heals that went green only by weakening assertions → **0**. |
| **What it tells us** | Heal pipeline remains **unexercised** on real locator drift — success rate stays undefined until the first triage→POM-only heal proves green with assertions unchanged. |

---

## 3. Generation-gate pass rate

| | |
|--|--|
| **Number** | **1 / 1** (100%) of `tests-generated` PRs met green + conforming + maps-to-AC on first open |
| **How measured** | PRs with label `tests-generated` → only [#5](https://github.com/alex-lesley/AI-QA-Automation/pull/5) (DS-4). Still the sole labeled generation delivery. Subsequent `test-generation.yml` crons (including this 2026-09-21 run) opened **0** ticket PRs — Jira REST `/myself` returns **HTTP 401** with `ATLASSIAN_EMAIL` + `ATLASSIAN_API_TOKEN`, so the In Progress backlog cannot be read. |
| **What it tells us** | Gate sample size remains n=1; the generation path is stalled on Atlassian auth, not on Playwright quality. |

---

## 4. Ask-vs-guess

| | |
|--|--|
| **Number** | **Not instrumented suite-wide.** This backlog session: **asks = 0** blocking questions · **guesses = 0** invented ticket keys/AC (stopped on auth failure) |
| **How measured** | No Cursor metric exists. Reviewed this run’s decisions only: verified Jira 401, did not invent DS tickets or acceptance criteria, proceeded to mandatory eval close-out. |
| **What it tells us** | Stopping without inventing backlog items is correct under “Never invent”; suite-wide ask-vs-guess still lacks a durable log. |

---

## Top reliability risk

**Jira API auth is broken for the generation agent** (`ATLASSIAN_EMAIL` + `ATLASSIAN_API_TOKEN` → HTTP 401 on `/rest/api/3/myself`; project `DS` and issue reads return empty/404). Backlog mode cannot analyze AC or open `tests-generated` PRs — repeated across open eval-only PRs #6–#24.

Secondary: default CI still only exercises `@smoke` (PRs) and `@sanity` (pushes); `@regression` / `@e2e` / `@destructive` / `@api` are not in `playwright.yml`, so flake=0 does not cover the bulk of the suite.

## Next action

1. **Fix Atlassian secrets** for the `didaxis_dev` (or generation) environment: recreate an API token for the account that owns `legionqaschool.atlassian.net`, confirm `ATLASSIAN_EMAIL` matches that Atlassian account, and verify `curl -u "$ATLASSIAN_EMAIL:$ATLASSIAN_API_TOKEN" "$ATLASSIAN_BASE_URL/rest/api/3/myself"` returns 200.  
2. Re-run backlog mode once auth works; process In Progress tickets missing `tests-generated`.  
3. Optionally widen CI beyond smoke/sanity (or add a scheduled `test:regression` job) so flake measurement covers more than the gate slice.
