# Suite reliability report

**Maintained by:** `eval-report` skill — **mandatory** orchestrator close-out (see `.cursor/rules/qa-orchestrator.mdc` → Done).  
**Repo:** [alex-lesley/AI-QA-Automation](https://github.com/alex-lesley/AI-QA-Automation)  
**Generated:** 2026-10-13 (Cursor Automation cron 19:15 UTC)  
**Window:** last **15** `playwright.yml` runs (2026-09-08 → 2026-10-13). Generation-gate also uses every PR labeled `tests-generated` (only [#5](https://github.com/alex-lesley/AI-QA-Automation/pull/5), merged 2026-06-25).

Cursor has **no built-in telemetry** for flake, heal, generation-gate, or ask-vs-guess. Every number below was derived from GitHub Actions logs, PR history, and this run’s session notes.

This backlog run processed **0 / 5** tickets. **Atlassian MCP** is `needsAuth` (interactive auth unavailable in Cloud Agents). Pod env has no `ATLASSIAN_*` variables. GitHub Test Generation [38331844467](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/38331844467) (same day) reported `GET /rest/api/3/myself` → **401** with stored secrets; anonymous JQL is not a trustworthy empty queue.

---

## 1. Flake rate

| | |
|--|--|
| **Number** | **4** flaky test results / **~220** test results ≈ **1.82%** · **3 / 15** runs showed a retry-pass |
| **How measured** | `gh run list --workflow=playwright.yml --limit 15`, then `gh run view <id> --log`. Counted Playwright summary lines (`N flaky`, `N passed`, `N failed`). Flaky = failed then passed on retry only. CI runs `npm run test:smoke` on `pull_request` (10 tests) and `npm run test:sanity` on `push` (22 tests). |
| **What it tells us** | Retry-passes remain concentrated. Flakes: [35012658722](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/35012658722) `ds2` TC-006; [37396401058](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/37396401058) `ds1`/`ds2` TC-002 `toBeHidden`; [37517886559](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/37517886559) `ds1` TC-002 again. |

**Notable non-flake (hard fails):**

- [38332257367](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/38332257367) — smoke **1 failed** (`toBeHidden`), 9 passed (PR [#31](https://github.com/alex-lesley/AI-QA-Automation/pull/31) eval refresh).
- [37517871975](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/37517871975) — sanity **2 failed** (`ds1` TC-008, `ds2` TC-006 `toHaveCount`).
- [36618154369](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/36618154369) — sanity **1 failed** (`ds1` TC-008).
- [35772727596](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/35772727596) — sanity **1 failed** (`ds1` TC-008).

---

## 2. Heal success rate

| | |
|--|--|
| **Number** | **0 / 0** clean heals · **Masked regressions: 0** |
| **How measured** | `gh pr list` / `gh search commits` for post-triage `heal/*` POM repairs. Only infrastructure [PR #4](https://github.com/alex-lesley/AI-QA-Automation/pull/4). Masked regressions = green only by weakened `expect` → **0**. |
| **What it tells us** | Heal path still unexercised on real drift. |

---

## 3. Generation-gate pass rate

| | |
|--|--|
| **Number** | **1 / 1** (100%) historical · **0** new `tests-generated` PRs in 2026-09-08 → 2026-10-13 window |
| **How measured** | `gh pr list --label tests-generated --state all` → only [#5](https://github.com/alex-lesley/AI-QA-Automation/pull/5) (DS-4). Test Generation crons through [38331844467](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/38331844467) opened eval-only PRs; no new specs. |
| **What it tells us** | Gate sample unchanged; Jira 401 blocks backlog processing in both Cloud Automation and GH Actions. |

---

## 4. Ask-vs-guess

| | |
|--|--|
| **Number** | **This run: 0 blocking asks, 0 material guesses.** Suite-wide **not instrumented**. |
| **How measured** | Stopped at Jira auth failure; did not invent ticket keys, AC, or credentials. Did not treat local `features/DS-*.feature.md` as the live queue. |
| **What it tells us** | Auth gap was not papered over; backlog remains unread until credentials work. |

---

## Top reliability risk

**Jira authentication is broken for automation** (MCP `needsAuth` in Cloud Agents; GH `ATLASSIAN_API_TOKEN` → 401 on `/myself`). The In Progress queue cannot be queried and no specs are generated. Secondary: `toBeHidden` / duplicate-name assertions (`ds1`/`ds2` TC-002, TC-006, TC-008) flake or hard-fail in smoke/sanity CI.

## Next action

1. Mint a Jira API token for `ATLASSIAN_EMAIL`, update GitHub `didaxis_dev` secrets **and** Cloud Agent environment secrets; confirm `GET /rest/api/3/myself` → **200**. Authenticate Atlassian MCP in Cursor desktop for Cloud Agents.  
2. Re-run backlog: `project = DS AND status = "In Progress" AND labels != tests-generated` (max 5 tickets).  
3. Triage duplicate-name and modal-hide failures before trusting smoke green.
