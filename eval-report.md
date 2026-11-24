# Suite reliability report

**Maintained by:** `eval-report` skill — **mandatory** orchestrator close-out (see `.cursor/rules/qa-orchestrator.mdc` → Done).  
**Repo:** [alex-lesley/AI-QA-Automation](https://github.com/alex-lesley/AI-QA-Automation)  
**Generated:** 2026-11-24  
**Window:** last **15** `playwright.yml` CI runs (through 2026-11-17), labeled generation PRs, and `test-generation.yml` through [run 45325357410](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/45325357410).

Cursor has **no built-in telemetry** for flake, heal, generation-gate, or ask-vs-guess. Every number below was derived from GitHub Actions logs, PR/commit history, and this backlog session (no Jira queue executed).

---

## Backlog cron (2026-11-24T19:16Z)

| | |
|--|--|
| **Tickets attempted** | **0 / 5** (budget unused) |
| **Outcome** | Blocked before Jira query — Atlassian MCP `needsAuth` (desktop OAuth unavailable in cloud agent); no `ATLASSIAN_*` / `JIRA_PROJECT_KEY` in pod; `bind-app-secrets` recorded missing secrets |
| **PRs opened** | Eval close-out only (this branch) |
| **Labels applied** | None |

---

## 1. Flake rate

| | |
|--|--|
| **Number** | **6** flaky test results across **4 / 15** runs (26.7% of runs showed ≥1 flaky); sanity job dominated |
| **How measured** | `gh run list --workflow=playwright.yml --limit 15` → per-run `gh run view <id> --log` → summed Playwright summary `N flaky` lines |
| **What it tells us** | Flake is intermittent but recurring on `@sanity` / smoke slices — not rare enough to ignore; worth watching `ds2-edit-program` and sanity timing. |

---

## 2. Heal success rate

| | |
|--|--|
| **Number** | **0 / 0** clean drift heals · **Masked regressions: 0** |
| **How measured** | Open PR search: no `heal/*` repair PRs; backlog runs stopped at Jira auth before triage/heal paths |
| **What it tells us** | Heal pipeline still **unexercised** on real classified drift in the automation window. |

---

## 3. Generation-gate pass rate

| | |
|--|--|
| **Number** | **1 / 1** historic (100%) on merged [#5](https://github.com/alex-lesley/AI-QA-Automation/pull/5) (DS-4) · **0** new `tests-generated` PRs since repeated Jira auth failures |
| **How measured** | `gh pr list --label tests-generated`; `test-generation.yml` [45325357410](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/45325357410) failed on Playwright **ubuntu 26.04** browser install (before agent step) |
| **What it tells us** | Generation gate cannot run in CI until runner OS / Playwright browser matrix is fixed **and** cloud automation can reach Jira. |

---

## 4. Ask-vs-guess

| | |
|--|--|
| **Number** | **Not instrumented suite-wide.** This run: **0 blocking asks**, **0 material guesses** (stopped at auth; no ticket AC invented) |
| **How measured** | Session review of this cron — no fabricated ticket keys or env values |
| **What it tells us** | Backlog stops cleanly when Jira is unreachable; risk shifts to **silent queue starvation** if eval-only PRs stack without merging or fixing env. |

---

## Top reliability risk

**Jira unreachable from cloud backlog automation** — without MCP OAuth or bound `ATLASSIAN_*` secrets, every Tue cron processes **0 tickets** while In Progress work may pile up unseen.

Secondary: **`test-generation.yml`** fails on `npx playwright install` with *Playwright does not support chromium on ubuntu26.04-x64* ([45325357410](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/45325357410)), so GitHub’s parallel generation path is also down.

Tertiary: **stacked eval-only PRs** ([#31](https://github.com/alex-lesley/AI-QA-Automation/pull/31)–[#39](https://github.com/alex-lesley/AI-QA-Automation/pull/39)) leave `main`’s `eval-report.md` stale until one merges.

## Next action

1. Add **Cloud Agent / environment secrets** (`ATLASSIAN_API_TOKEN`, `ATLASSIAN_BASE_URL`, `ATLASSIAN_EMAIL`, `JIRA_PROJECT_KEY`) and optionally authenticate **Atlassian MCP** on desktop.  
2. Pin **test-generation** to `ubuntu-22.04` (or a Playwright-supported image) until ubuntu 26.04 is supported.  
3. Merge or consolidate the backlog **eval-report** PR chain so `main` reflects the latest metrics.