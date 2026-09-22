# Suite reliability report

**Maintained by:** `eval-report` skill — **mandatory** orchestrator close-out (see `.cursor/rules/qa-orchestrator.mdc` → Done).  
**Repo:** [alex-lesley/AI-QA-Automation](https://github.com/alex-lesley/AI-QA-Automation)  
**Generated:** 2026-09-22  
**Window:** last **15** `playwright.yml` CI runs (2026-08-18 → 2026-09-21), plus labeled generation PRs and `test-generation.yml` history through 2026-09-22.

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
| **How measured** | PRs with label `tests-generated` → only [#5](https://github.com/alex-lesley/AI-QA-Automation/pull/5) (DS-4). Still the sole labeled generation delivery. Subsequent `test-generation.yml` crons and Cursor Automation backlog runs (including this 2026-09-22 run) opened **0** ticket PRs — Atlassian MCP `needsAuth` in Cloud Agent pods; Jira REST with GH Actions secrets returns **HTTP 401** on `/rest/api/3/myself`, so the In Progress backlog cannot be read. |
| **What it tells us** | Gate sample size remains n=1; the generation path is stalled on Atlassian auth (Cloud MCP + GH Actions), not on Playwright quality. |

---

## 4. Ask-vs-guess

| | |
|--|--|
| **Number** | **Not instrumented suite-wide.** This backlog session: **asks = 0** blocking questions · **guesses = 0** invented ticket keys/AC (stopped on auth failure) |
| **How measured** | No Cursor metric exists. Reviewed this run’s decisions only: verified Atlassian MCP auth unavailable in Cloud Agent, did not invent DS tickets or acceptance criteria, proceeded to mandatory eval close-out. |
| **What it tells us** | Stopping without inventing backlog items is correct under “Never invent”; suite-wide ask-vs-guess still lacks a durable log. |

---

## Top reliability risk

**Jira access is broken for the generation agent in both Cloud and GH Actions.** Atlassian MCP returns `needsAuth` (interactive auth unavailable in Cloud Agent pods). GH Actions `test-generation.yml` run [35663469618](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/35663469618) confirms Jira REST `/myself` → HTTP 401 with stored secrets. Backlog mode cannot analyze AC, write specs, or apply `tests-generated` labels — repeated across open eval-only PRs #6–#25.

Secondary: default CI still only exercises `@smoke` (PRs) and `@sanity` (pushes); `@regression` / `@e2e` / `@destructive` / `@api` are not in `playwright.yml`, so flake=0 does not cover the bulk of the suite.

## Next action

1. **Fix Atlassian auth for Cloud Agents and GH Actions:** add `ATLASSIAN_API_TOKEN`, `ATLASSIAN_EMAIL`, and `ATLASSIAN_BASE_URL` to the Cursor Cloud Agent environment; authenticate Atlassian MCP in Cursor Desktop; rotate the token in GitHub `didaxis_dev` environment. Verify `curl -u "$ATLASSIAN_EMAIL:$ATLASSIAN_API_TOKEN" "$ATLASSIAN_BASE_URL/rest/api/3/myself"` returns 200.  
2. Re-run backlog mode once auth works; process In Progress tickets missing `tests-generated`.  
3. Optionally widen CI beyond smoke/sanity (or add a scheduled `test:regression` job) so flake measurement covers more than the gate slice.
