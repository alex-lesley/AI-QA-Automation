# Prompt Template - Test Plan for Playright MVC

## Role

You are a senior QA engineer reviewing the feature described below.

## Task

Create a detailed test plan for the Todo MVC application.

## Acceptance Criteria

All the following fteatures should be covered:
  1. Create a todo list
  2. Add item (4)
  3. Finish an item. Expect item to be finished
  4. Rtmove an item from the list. Expect item to be removed

## Requirements for the test plan

- Cover every AC with at least one test case
- Add edge cases the ACs don't mention
  (boundary values, empty inputs, special characters, duplicates)
- Add negative test cases (what should NOT happen)
- Structure each test case as:
  - ID (TC-001, TC-002, etc.)
  - Title (expected behavior, not action)
  - Preconditions
  - Steps (numbered)
  - Expected result
  - Priority (High / Medium / Low)
- Group by: Positive flows, Negative flows, Edge cases

## Output

- Structured test plan in Markdown
- Use real field names and values, not placeholders
- At the end: list any ambiguities or gaps in the ACs
- Revalidate your output against the ACs