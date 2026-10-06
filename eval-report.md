# Suite reliability report

**Maintained by:** `eval-report` skill — **mandatory** orchestrator close-out (see `.cursor/rules/qa-orchestrator.mdc` → Done).  
**Repo:** [alex-lesley/AI-QA-Automation](https://github.com/alex-lesley/AI-QA-Automation)  
**Generated:** 2026-10-06 (Cursor Automation cron 19:15 UTC)  
**Window:** last **15** `playwright.yml` runs (2026-09-01 → 2026-10-06), plus every PR labeled `tests-generated` and `test-generation.yml` history from `gh run list --limit 20`.

Cursor has **no built-in telemetry** for flake, heal, generation-gate, or ask-vs-guess. Every number below was taken from GitHub Actions logs, PR metadata, or this session. Nothing here is estimated.

---

## 1. Flake rate

| | |
|--|--|
| **Number** | **3** flaky test results / **207** test results ≈ **1.45%** · **2 / 15** runs showed a retry-pass |
| **How measured** | `gh run list --workflow=playwright.yml --limit 15`, then `gh run view <id> --log`. Summed Playwright summary lines per run: **205 passed**, **2 failed**, **3 flaky** (flaky counts are retry-passes, not additive to passed). Flaky runs: [37396401058](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/37396401058) (smoke, **2 flaky**, 8 passed), [35012658722](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/35012658722) (sanity, **1 flaky**, 21 passed). Hard fails after retry are not flake. |
| **What it tells us** | Flake frequency ticked up in the newest window entry (smoke `toBeHidden` on two tests). Retry-passes are still a minority of results but no longer negligible. |

**Notable non-flake:** [36618154369](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/36618154369) and [35772727596](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/35772727596) — `ds1-create-program` TC-008 failed on the attempt and on retry (`toHaveCount(1)`). Those sanity runs are red, not flaky green.

---

## 2. Heal success rate

| | |
|--|--|
| **Number** | **0 / 0** clean heals (no drift-heal attempts) · **Masked regressions: 0** |
| **How measured** | `gh pr list --state all --limit 100` and search for `heal/*` repair PRs. The only related hit is infrastructure [PR #4](https://github.com/alex-lesley/AI-QA-Automation/pull/4) (`chore/self-heal-hooks-orchestrator`). No post-triage POM locator heal. Masked regressions = heals that went green only by weakening `expect` → **0**. |
| **What it tells us** | The heal path is still unexercised on a classified locator drift. Success rate stays undefined until a triage-confirmed drift heal is re-run green with assertions unchanged. |

---

## 3. Generation-gate pass rate

| | |
|--|--|
| **Number** | **1 / 1** `tests-generated` PRs recorded a local green run, an AC feature map, and a conventions fix on the first PR |
| **How measured** | `gh pr list --label tests-generated --state all` returns only [#5](https://github.com/alex-lesley/AI-QA-Automation/pull/5) (DS-4, merged 2026-06-25). PR body states `npx playwright test tests/ds4-delete-program.spec.ts` — **12 passed**, links `features/DS-4.feature.md` to DS-4, and notes `waitForTimeout` replaced with `expect.poll`. `statusCheckRollup` on that PR is empty (no PR checks). `gh run list --workflow=test-generation.yml --limit 20`: latest completed run [37396040860](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/37396040860) (2026-10-06) succeeded but processed **0** tickets (Jira 401). No new `tests-generated` PR since #5. |
| **What it tells us** | The only labeled generation delivery still matches the gate on the evidence that remains, but n=1 and missing PR checks mean the rate is not a trend. Cron/backlog runs cannot add samples until Jira auth works. |

---

## 4. Ask-vs-guess

| | |
|--|--|
| **Number** | **This run: 0 blocking asks, 0 material guesses.** Suite-wide: **not instrumented**. |
| **How measured** | No Cursor metric exists. This session: Atlassian MCP returned `needsAuth` (interactive auth unavailable in Cloud Agent). No `ATLASSIAN_*` env vars in the pod. Did not treat GitHub Actions’ prior 401 on `GET /rest/api/3/myself` ([run 37396040860](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/37396040860)) as proof of an empty backlog. No ticket key, AC, locator, or credential was invented. Requested `add_secrets` for Jira via environment setup. |
| **What it tells us** | This run stopped instead of guessing the queue. Without a durable ask-log, a suite-wide ask-vs-guess ratio cannot be published. |

---

## Top reliability risk

**Jira credentials for backlog automation do not authenticate**, so the In Progress queue cannot be read, specs cannot be generated, and the `tests-generated` label cannot be applied from this agent. Atlassian MCP is `needsAuth` in Cloud Agent sessions; GitHub `didaxis_dev` secrets still yield **401** / `AUTHENTICATED_FAILED` on Jira `myself` ([Test Generation run 37396040860](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/37396040860)).

Secondary: smoke flake doubled in the latest CI window entry ([37396401058](https://github.com/alex-lesley/AI-QA-Automation/actions/runs/37396401058)); `@sanity` DS-1 TC-008 remains red on two runs in the window.

## Next action

1. Rotate `ATLASSIAN_API_TOKEN` and confirm `ATLASSIAN_EMAIL` / `ATLASSIAN_BASE_URL` in **both** GitHub environment `didaxis_dev` and the **Cursor Cloud Agent** environment until `GET https://api.atlassian.com/ex/jira/f72d2b24-8968-4705-8538-069e61d5ed43/rest/api/3/myself` returns **200**; authenticate Atlassian MCP in Cursor Desktop.  
2. Re-run this automation or `test-generation.yml` — budget **5** In Progress DS tickets without `tests-generated`.  
3. Triage DS-1 TC-008 and the new smoke `toBeHidden` flakes before treating CI as healthy. Do not weaken assertions.  
4. Keep masked-regression count at **0**: no heal until triage classifies a red run as locator drift.
