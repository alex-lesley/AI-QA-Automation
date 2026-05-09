## Test Plan: Playwright React TodoMVC Demo

### Scope

This plan covers the public demo at [https://demo.playwright.dev/todomvc/#/](https://demo.playwright.dev/todomvc/#/): creating and managing todos via the main input, list checkboxes, inline edit, delete control, footer filters, and the **Clear completed** action.

**In scope:** behaviors aligned with acceptance criteria (create list, add multiple items including four items, mark complete, delete).  
**Out of scope:** persistence after full page reload, backend/API contracts, performance, and accessibility audits (not requested in ACs).

**Primary UI references (verified on the live demo):**

| Element | How it appears / behaves |
|--------|---------------------------|
| Page title (header) | `todos` |
| New todo field | Placeholder **What needs to be done?**; commit with **Enter** |
| Todo row | Checkbox (complete), label text, **Delete** button (`aria-label="Delete"`) |
| Edit | Double-click label per footer hint **Double-click to edit a todo** |
| Footer (with ≥1 todo) | **All**, **Active**, **Completed**; counter e.g. **1 item left** / **N items left** |
| Completed todos | Row has class `completed`; **Clear completed** appears when at least one todo is completed |

---

## Positive flows

### TC-001

- **Title:** Todo list exists after the first todo is added (acceptance criterion: create a todo list).
- **Preconditions:**
  - Browser open at `https://demo.playwright.dev/todomvc/#/`.
  - No todos in the list (fresh load or list cleared).
- **Steps:**
  1. Click the field with placeholder **What needs to be done?**.
  2. Type `Buy oat milk`.
  3. Press **Enter**.
- **Expected result:**
  - A row appears under the list with label **Buy oat milk**.
  - Footer shows filter links **All**, **Active**, **Completed** and counter **1 item left**.
- **Priority:** High

### TC-002

- **Title:** Four distinct todos are listed after adding them one by one (acceptance criterion: add item (4)).
- **Preconditions:**
  - **Path A:** Exactly one todo **Buy oat milk** already exists (e.g. after TC-001).
  - **Path B:** Empty list after a fresh load of the demo URL.
- **Steps:**
  - **Path A:**
    1. In **What needs to be done?**, type `Book dentist`, press **Enter**.
    2. Type `Reply to Alex`, press **Enter**.
    3. Type `Weekly report draft`, press **Enter**.
  - **Path B:**
    1. Add `Buy oat milk`, **Enter**.
    2. Add `Book dentist`, **Enter**.
    3. Add `Reply to Alex`, **Enter**.
    4. Add `Weekly report draft`, **Enter**.
- **Expected result:**
  - Exactly four todos are visible: **Buy oat milk**, **Book dentist**, **Reply to Alex**, **Weekly report draft** (top-to-bottom in that order).
  - Counter reads **4 items left** (assuming none are completed).
- **Priority:** High

### TC-003

- **Title:** A todo is visibly finished after marking it complete (acceptance criterion: finish an item).
- **Preconditions:**
  - At least two active todos exist, including **Book dentist** and **Reply to Alex**.
- **Steps:**
  1. Locate the row whose label is **Book dentist**.
  2. Click that row’s round **checkbox** (complete toggle).
- **Expected result:**
  - The **Book dentist** row shows completed styling (e.g. strikethrough; row has class `completed`).
  - **Reply to Alex** remains active (not completed).
  - Footer shows **Clear completed** and the “items left” count decreases by one (e.g. from **4 items left** to **3 items left** if one of four was completed).
- **Priority:** High

### TC-004

- **Title:** A todo is removed from the list after delete (acceptance criterion: remove an item).
- **Preconditions:**
  - At least two todos exist, including **Weekly report draft** and at least one other.
- **Steps:**
  1. Hover the row for **Weekly report draft** so the **Delete** control is usable.
  2. Click **Delete** on that row.
- **Expected result:**
  - **Weekly report draft** no longer appears under the todo list.
  - Other todos are unchanged and still visible on **All**.
- **Priority:** High

### TC-005

- **Title:** Completed todos are cleared in bulk when using Clear completed
- **Preconditions:**
  - At least one todo is completed; at least one todo remains active.
- **Steps:**
  1. Click **Clear completed** in the footer.
- **Expected result:**
  - All completed rows are removed.
  - Active rows remain; **Clear completed** is no longer shown if no completed rows remain.
- **Priority:** Medium

### TC-006

- **Title:** Active-only view hides completed todos
- **Preconditions:**
  - Mix of active and completed todos (e.g. after TC-003).
- **Steps:**
  1. Click footer link **Active**.
- **Expected result:**
  - Only non-completed todos are listed.
  - Clicking **All** shows every todo again.
- **Priority:** Medium

### TC-007

- **Title:** Completed-only view lists only finished items
- **Preconditions:**
  - At least one completed and one active todo.
- **Steps:**
  1. Click **Completed**.
- **Expected result:**
  - Only completed rows appear; active todos are hidden until **All** or **Active** is selected.
- **Priority:** Medium

---

## Negative flows

### TC-008

- **Title:** No todo row is created when only spaces are submitted
- **Preconditions:**
  - Page loaded at the demo URL; list may be empty or non-empty.
- **Steps:**
  1. Note the current number of todo rows.
  2. In **What needs to be done?**, type three spaces `   `.
  3. Press **Enter**.
- **Expected result:**
  - Row count is unchanged (whitespace-only input is not added as a todo).
- **Priority:** High

### TC-009

- **Title:** Completing one todo does not complete other todos
- **Preconditions:**
  - At least two active todos with different labels.
- **Steps:**
  1. Complete exactly one todo via its checkbox.
  2. Inspect every other active todo’s checkbox and styling.
- **Expected result:**
  - Only the targeted row is `completed`; others stay active.
- **Priority:** High

### TC-010

- **Title:** Deleting one todo does not remove adjacent todos
- **Preconditions:**
  - At least three todos with fixed labels `A`, `B`, `C` (use short distinct strings e.g. `Alpha todo`, `Bravo todo`, `Charlie todo`).
- **Steps:**
  1. Delete **Bravo todo** via **Delete**.
  2. Verify **Alpha todo** and **Charlie todo** still appear on **All**.
- **Expected result:**
  - Only **Bravo todo** is removed; remaining labels and order for survivors match expectations.
- **Priority:** High

### TC-011

- **Title:** Filter does not mutate data—switching views does not delete todos
- **Preconditions:**
  - At least one active and one completed todo.
- **Steps:**
  1. Click **Completed**, note which labels appear.
  2. Click **Active**, note labels.
  3. Click **All**.
- **Expected result:**
  - Same set of todos exists across views; only visibility changes per filter.
- **Priority:** Medium

---

## Edge cases

### TC-012

- **Title:** Leading and trailing spaces on new todo text are trimmed when saved
- **Preconditions:**
  - Any list state.
- **Steps:**
  1. In **What needs to be done?**, type `   Pick up dry cleaning   `.
  2. Press **Enter**.
- **Expected result:**
  - New row label displays `Pick up dry cleaning` (no leading/trailing spaces).
- **Priority:** Medium

### TC-013

- **Title:** Duplicate text is allowed for two separate todos
- **Preconditions:**
  - Empty or non-empty list.
- **Steps:**
  1. Add `Water plants`, **Enter**.
  2. Add `Water plants`, **Enter**.
- **Expected result:**
  - Two rows both show **Water plants**; counter reflects two additional items.
- **Priority:** Low

### TC-014

- **Title:** Special characters and symbols are preserved in the todo label
- **Preconditions:**
  - Any list state.
- **Steps:**
  1. Add `Budget: 50% @home "urgent" & review <script>`, **Enter**.
- **Expected result:**
  - Label renders as entered text (no unintended HTML execution; characters visible as plain text).
- **Priority:** Medium

### TC-015

- **Title:** Very long single-line todo is accepted and displayed
- **Preconditions:**
  - Any list state.
- **Steps:**
  1. Paste a string of at least 500 characters (no newlines) into **What needs to be done?**.
  2. Press **Enter**.
- **Expected result:**
  - One new row exists; text is stored and visible (scroll or wrap behavior is acceptable; no silent truncation without UI indication).
- **Priority:** Low

### TC-016

- **Title:** Inline edit saves on Enter and cancels on Escape
- **Preconditions:**
  - Page open at the demo URL.
- **Steps:**
  1. Add todo **Edit me please** via **What needs to be done?** and **Enter**.
  2. Double-click label **Edit me please** to enter edit mode.
  3. Change text to `Edited via keyboard`, press **Enter**.
  4. Double-click again, change to `Should not save`, press **Escape**.
- **Expected result:**
  - After step 3, label reads **Edited via keyboard**.
  - After step 4, label remains **Edited via keyboard** (discard on Escape).
- **Priority:** Medium

### TC-017

- **Title:** Counter reaches zero when the last active todo is completed then cleared appropriately
- **Preconditions:**
  - Exactly one active todo (optional follow-up: single completed todo after clear).
- **Steps:**
  1. Complete the only active todo; observe counter **0 items left** (or equivalent).
  2. Optionally click **Clear completed** and confirm list/footer behavior for empty state.
- **Expected result:**
  - Count matches active todos; app handles empty state without errors.
- **Priority:** Low

---

## AC traceability (revalidation)

| AC | Covered by (minimum) |
|----|----------------------|
| 1. Create a todo list | TC-001 |
| 2. Add item (4) | TC-002 |
| 3. Finish an item | TC-003 |
| 4. Remove an item | TC-004 |

---

## Ambiguities and gaps in the acceptance criteria

1. **“Add item (4)”** is ambiguous: it may mean add **four** items, add a **fourth** item, or add an item whose text is **`4`**. This plan treats it as **four distinct todos** in TC-002 and notes the alternate readings here.
2. **“Create a todo list”** does not define whether a single todo counts as a “list” or whether multiple items are required; TC-001 uses the first item creating the list UI (footer + row), which matches the demo behavior.
3. No AC for **persistence**: refreshing the page or opening a new tab is not specified; behavior may reset to empty.
4. No AC for **routing** (`#/`, `#/active`, `#/completed`): filters may update the URL; not specified for testing.
5. **Remove** does not specify **Delete** vs **Clear completed**; TC-004 uses per-row **Delete**; TC-005 covers bulk clear separately.
6. Typos in the source prompt (**Playright**, **fteatures**, **Rtmove**) were interpreted as Playwright TodoMVC, “features”, and “remove” respectively.
7. **Accessibility** (keyboard-only, screen readers) and **mobile** layout are not in scope for the written ACs but may matter for a full product test strategy.
