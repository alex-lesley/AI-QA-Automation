# Suite reliability report

**Maintained by:** `eval-report` skill — **mandatory** orchestrator close-out (see `.cursor/rules/qa-orchestrator.mdc` → Done).  
**Repo:** [alex-lesley/AI-QA-Automation](https://github.com/alex-lesley/AI-QA-Automation)  
**Generated:** 2026-10-26  
**Window:** last **15** `playwright.yml` CI runs (2026-09-21 → 2026-10-20), plus labeled generation PRs and this backlog session.

Cursor has **no built-in telemetry** for flake, heal, generation-gate, or ask-vs-guess. Every number below was derived manually from GitHub Actions logs, PR history, and this session’s review. **Do not invent counts.**

---

## 1. Flake rate

| | |
|--|--|
| **Number** | **7** flaky test results / **210** test results ≈ **3.3%** · **4 / 15** runs (26.7%) showed a retry-pass |
| **How measured** | `gh run list --workflow=playwright.yml --limit 15`, then `gh run view <id> --log`. Counted Playwright summary lines (`N passed (duration)` / `N failed` / `N flaky`) on timestamped log rows only (deduped untimestamped echoes). Hard fails after retry are **not** flake. |
| **What it tells us** | Flake is materially higher than the prior 2026-06 window (~0.10%). Retry-passes cluster on smoke/sanity jobs in backlog eval branches (e.g. [37517886559](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/37517886559) 1 flaky; [37396401058](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/37396401058) 2 flaky; [38453638194](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/38453638194) 3 flaky + hard fails). |

---

## 2. Heal success rate

| | |
|--|--|
| **Number** | **0 / 0** clean heals (no drift-heal attempts in history) · **Masked regressions: 0** |
| **How measured** | `gh pr list` / title+branch search for `heal` / locator-drift repairs. Only infrastructure hit: [PR #4](https://github.com/alex-lesley/AI-QA-Automation/pull/4) (self-heal workflow + assertion hook) — not a post-triage POM locator heal. No `heal/*` repair PRs. Masked-regression count = heals green only by weakened assertions → **0**. |
| **What it tells us** | Heal pipeline remains **unexercised** on real drift; success rate stays undefined until a classified drift run is healed and re-proven green with assertions unchanged. |

---

## 3. Generation-gate pass rate

| | |
|--|--|
| **Number** | **1 / 1** (100%) of `tests-generated` PRs met green + conforming + maps-to-AC on first open |
| **How measured** | PRs with label `tests-generated` → only [#5](https://github.com/alex-lesley/AI-QA-Automation/pull/5) (DS-4). Cross-checked generation job [28166814111](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/28166814111) (local `12 passed`), `features/DS-4.feature.md`, post-merge Playwright [28167017985](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/28167017985) (**69 passed**). Later backlog/generation crons opened **0** ticket specs (Jira auth blocked / empty processable queue). |
| **What it tells us** | Gate sample remains n=1; backlog cannot grow the denominator while Jira credentials return **401**. |

---

## 4. Ask-vs-guess

| | |
|--|--|
| **Number** | **Not instrumented suite-wide.** This backlog session: **asks = 0** (no human available in headless run) · **guesses = 0** material ticket/AC inventions — queue work **stopped** on auth failure instead of fabricating tickets |
| **How measured** | Session review only (no Cursor telemetry). Confirmed `ATLASSIAN_EMAIL` + `ATLASSIAN_API_TOKEN` present but `GET /rest/api/3/myself` → **401**; Atlassian MCP `needsAuth` and interactive `mcp_auth` unavailable in this agent environment. Did **not** invent In Progress keys or acceptance criteria from stale `features/*.feature.md`. |
| **What it tells us** | Preferring stop-over-guess is correct here; without a valid Jira token the orchestrator cannot honestly process the backlog. |

---

## Top reliability risk

**Jira API auth is broken (`401 Unauthorized` for `legion.jira@proton.me` @ `legionqaschool.atlassian.net`).** Every recent backlog cron (including this 2026-10-26 run) cannot list In Progress DS tickets, so generation stalls and open “eval-report only” PRs accumulate. Secondary: elevated flake (~3.3% in the last 15 `playwright.yml` runs) on shared smoke/sanity paths.

## Next action

1. **Rotate/fix `ATLASSIAN_API_TOKEN`** (and confirm email) in the GitHub environment / runner secrets; verify `GET {ATLASSIAN_BASE_URL}/rest/api/3/myself` returns **200**.  
2. Re-run backlog mode so In Progress DS tickets without `tests-generated` can be analyzed → specs → PRs.  
3. Triage recurring smoke/sanity flakes (hidden-modal / visibility timeouts) after Jira access is restored — do not weaken assertions.
