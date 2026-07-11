---
name: exploratory-charter
description: >-
  Turns a feature plus a risk into a short exploratory testing charter and a
  findings template. Use when the user asks for an exploratory charter, session
  charter, SBTM charter, risk-based exploration, or a findings log for manual
  exploration. The human does the thinking and the exploring; this skill only
  keeps the format. Do NOT use for Gherkin plans (jira-ticket-analyzer /
  explore-and-generate) or for writing Playwright specs (test-writer).
---

# Exploratory Charter

Format only. You fill structure; the tester chooses risk, mission, and notes.

## Guardrails

- **Do not invent the exploration.** Ask for (or take) a **feature** and a **risk**; do not invent product risks or pretend to have explored.
- **No specs.** Do not write Playwright tests or Gherkin from this skill.
- **Keep it tiny.** One charter + one findings shell. No multi-page strategy docs.

## Steps

1. Confirm inputs: **feature** (what area) and **risk** (what could go wrong / why it matters). Optional: time box, constraints, build/env.
2. Emit the **Charter** using the template below — fill blanks from the human; leave `TBD` only if they did not provide a field.
3. Emit the empty **Findings** template for them to fill during/after the session.
4. Stop. Do not run the session, file bugs, or expand into a test plan unless they ask.

## Charter template

```markdown
# Charter: <short title>

| Field | Value |
|-------|-------|
| Feature | <area / surface under exploration> |
| Risk | <why this session — failure mode, harm, or uncertainty> |
| Mission | Explore <feature> with respect to <risk> to discover information that matters. |
| Time box | <e.g. 45–90 min> |
| Build / env | <URL, build id, or TBD> |
| Constraints | <accounts, data rules, out of scope — or none> |
| Oracles | <how you’ll recognize a problem: requirements, consistency, user expectation, …> |
| Notes / setup | <seeds, flags, starting state — or none> |
```

## Findings template

```markdown
# Findings: <same title as charter>

| Field | Value |
|-------|-------|
| Charter | <title or link> |
| Tester | <name> |
| Started | <timestamp> |
| Ended | <timestamp> |
| Time spent | <minutes> |
| Coverage (areas touched) | <list> |
| Debrief | <1–3 sentences: did the risk hold? what next?> |

## Bugs
- 

## Questions / uncertainties
- 

## Ideas (coverage, automation, follow-ups)
- 

## Notes
- 
```

## Example (abbreviated)

**Inputs:** feature = Program create modal; risk = duplicate names accepted under race / trim quirks.

**Charter mission line:** Explore Program create modal with respect to duplicate-name and trim edge cases to discover information that matters.

Findings stay blank until the human runs the session.
