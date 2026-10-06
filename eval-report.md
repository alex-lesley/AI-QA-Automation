# Suite reliability report

**Maintained by:** `eval-report` skill — **mandatory** orchestrator close-out (see `.cursor/rules/qa-orchestrator.mdc` → Done).  
**Repo:** [alex-lesley/AI-QA-Automation](https://github.com/alex-lesley/AI-QA-Automation)  
**Generated:** 2026-10-06  
**Window:** last **15** `playwright.yml` runs (2026-08-31 → 2026-09-29), plus every PR labeled `tests-generated` and `test-generation.yml` history returned by `gh run list --limit 20`.

Cursor has **no built-in telemetry** for flake, heal, generation-gate, or ask-vs-guess. Every number below was taken from GitHub Actions logs, PR metadata, or this session. Nothing here is estimated.

---

## 1. Flake rate

| | |
|--|--|
| **Number** | **1** flaky test result / **210** test results ≈ **0.48%** · **1 / 15** runs showed a retry-pass |
| **How measured** | `gh run list --workflow=playwright.yml --limit 15`, then `gh run view <id> --log`. Counted the Playwright summary once per run (`##[notice]` lines): **207 passed**, **2 failed**, **1 flaky**. Flaky means failed then passed on retry. Hard fails after retry are not flake. |
| **What it tells us** | Retry-passes are still rare. The one flake was `ds2-edit-program` TC-006 (`expect(rowsForOriginal).toBeGreaterThanOrEqual(1)`) in [run 35012658722](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/35012658722). |

**Notable non-flake:** [run 36618154369](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/36618154369) and [run 35772727596](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/35772727596) — `ds1-create-program` TC-008 failed on the attempt and on retry (`toHaveCount(1)` at `tests/ds1-create-program.spec.ts:215`). Those two sanity runs are red, not flaky green. The other 13 runs in the window completed with no failed and no flaky results (10 smoke runs × 10 passed; two sanity runs at 22 passed).

---

## 2. Heal success rate

| | |
|--|--|
| **Number** | **0 / 0** clean heals (no drift-heal attempts) · **Masked regressions: 0** |
| **How measured** | `gh pr list --state all --limit 100` and `gh search prs` / `gh search commits` for `heal`. The only hit is infrastructure [PR #4](https://github.com/alex-lesley/AI-QA-Automation/pull/4) (`chore/self-heal-hooks-orchestrator`). No `heal/*` repair PR. Masked regressions = heals that went green only by weakening `expect` → **0**. |
| **What it tells us** | The heal path is still unexercised on a classified locator drift. Success rate stays undefined until a triage-confirmed drift heal is re-run green with assertions unchanged. |

---

## 3. Generation-gate pass rate

| | |
|--|--|
| **Number** | **1 / 1** `tests-generated` PRs recorded a local green run, an AC feature map, and a conventions fix on the first PR |
| **How measured** | `gh pr list --label tests-generated --state all` returns only [#5](https://github.com/alex-lesley/AI-QA-Automation/pull/5) (DS-4, merged 2026-06-25). PR body states `npx playwright test tests/ds4-delete-program.spec.ts` — **12 passed**, links `features/DS-4.feature.md` to DS-4, and notes `waitForTimeout` replaced with `expect.poll`. `statusCheckRollup` on that PR is empty (no PR checks). Merge-commit workflow [run 28167017985](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/28167017985) **conclusion: success**; the Playwright summary line is no longer in retained logs, so a pass count for that run is not restated. `gh run list --workflow=test-generation.yml --limit 20` returned **17** runs: **16 success**, **1 in progress** (this run, [37396040860](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/37396040860)). None of those later runs added another `tests-generated` PR. |
| **What it tells us** | The only labeled generation delivery still matches the gate on the evidence that remains, but n=1 and missing PR checks mean the rate is not a trend. Later cron runs succeeded without generating tests because Jira auth blocked the queue. |

---

## 4. Ask-vs-guess

| | |
|--|--|
| **Number** | **This run: 0 blocking asks, 0 material guesses.** Suite-wide: **not instrumented**. |
| **How measured** | No Cursor metric exists. This session reviewed its own decisions: Jira `GET /rest/api/3/myself` and the `api.atlassian.com` gateway both returned **401** (`X-Seraph-Loginreason: AUTHENTICATED_FAILED` on the site). The unauthenticated search body was an empty issue list and was **not** treated as an empty backlog. No ticket key, acceptance criterion, locator, or credential was invented. |
| **What it tells us** | This run stopped instead of guessing the queue. Without a durable ask-log, a suite-wide ask-vs-guess ratio cannot be published. |

---

## Top reliability risk

**Jira credentials for this automation do not authenticate**, so the In Progress backlog cannot be read and no spec is generated. Site basic auth (`/rest/api/3/myself`) returns 401 with `AUTHENTICATED_FAILED`. The same token against `https://api.atlassian.com/ex/jira/f72d2b24-8968-4705-8538-069e61d5ed43/rest/api/3/myself` (cloud id from `/_edge/tenant_info`) also returns 401. Atlassian MCP is `needsAuth` in this session.

Secondary: the `@sanity` slice is not stable. DS-1 TC-008 failed after retry on two of the five sanity runs in this window.

## Next action

1. Replace `ATLASSIAN_API_TOKEN` (and confirm `ATLASSIAN_EMAIL`) so `GET https://api.atlassian.com/ex/jira/f72d2b24-8968-4705-8538-069e61d5ed43/rest/api/3/myself` returns 200, then re-run Test Generation.  
2. Triage DS-1 TC-008 (`toHaveCount(1)` on the duplicate-name row) before treating sanity CI as healthy. Do not weaken that assertion.  
3. Keep masked-regression count at 0: no heal until triage classifies a red run as locator drift.
