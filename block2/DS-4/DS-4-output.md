# Test Plan: Delete Program with Confirmation

## Scope

Validate deleting programs from the program list: confirmation dialog content, Confirm vs Cancel outcomes, correct row targeting, and safe behavior for challenging program names.

---

## Positive Flows

### TC-001

- **ID:** TC-001
- **Title:** Deleting an existing program shows the confirmation dialog with correct copy and actions
- **Preconditions:**
  - User is logged in with permission to manage programs.
  - Program `Test Program` exists in the program list.
- **Steps:**
  1. Open the program list screen.
  2. Locate the row for `Test Program`.
  3. Click the delete icon for `Test Program`.
- **Expected result:**
  - A confirmation dialog is displayed.
  - Dialog message is exactly `Are you sure about deleting the program Test Program`.
  - `Confirm` and `Cancel` buttons are visible and enabled.
- **Priority:** High

### TC-002

- **ID:** TC-002
- **Title:** Confirmed deletion removes only the selected program from the list
- **Preconditions:**
  - Program `Test Program` exists in the program list.
- **Steps:**
  1. Click the delete icon for `Test Program`.
  2. In the confirmation dialog, click `Confirm`.
- **Expected result:**
  - The dialog closes.
  - `Test Program` is no longer shown in the program list.
  - No other programs are removed.
- **Priority:** High

### TC-003

- **ID:** TC-003
- **Title:** Canceled deletion leaves the program in the list
- **Preconditions:**
  - Program `Test Program` exists in the program list.
- **Steps:**
  1. Click the delete icon for `Test Program`.
  2. When the confirmation dialog appears, click `Cancel`.
- **Expected result:**
  - The dialog closes.
  - `Test Program` still appears in the program list unchanged.
- **Priority:** High

### TC-004

- **ID:** TC-004
- **Title:** Dialog message reflects the program selected for a non-example name
- **Preconditions:**
  - Program `Web Development 2026` exists in the program list.
- **Steps:**
  1. Click the delete icon for `Web Development 2026`.
- **Expected result:**
  - Dialog message is exactly `Are you sure about deleting the program Web Development 2026`.
  - `Confirm` and `Cancel` are available.
- **Priority:** Medium

---

## Negative Flows

### TC-005

- **ID:** TC-005
- **Title:** Program is not deleted before the user confirms
- **Preconditions:**
  - Program `Test Program` exists in the program list.
- **Steps:**
  1. Click the delete icon for `Test Program`.
  2. While the confirmation dialog is open, observe the program list (do not click `Confirm` or `Cancel` yet).
- **Expected result:**
  - `Test Program` remains in the list while the dialog is open.
  - No delete request completes without an explicit `Confirm` action.
- **Priority:** High

### TC-006

- **ID:** TC-006
- **Title:** Cancel does not remove any program, including unrelated rows
- **Preconditions:**
  - Programs `Test Program` and `Data Science 2026` exist in the program list.
- **Steps:**
  1. Click the delete icon for `Test Program`.
  2. Click `Cancel`.
- **Expected result:**
  - `Test Program` remains in the list.
  - `Data Science 2026` remains in the list.
  - No row disappears as a side effect of canceling.
- **Priority:** High

### TC-007

- **ID:** TC-007
- **Title:** Confirming deletion removes only the program whose delete icon was clicked
- **Preconditions:**
  - Programs `Test Program`, `Test Program 2`, and `Mobile Apps 101` exist in the program list.
- **Steps:**
  1. Click the delete icon for `Test Program 2`.
  2. Verify the dialog names `Test Program 2`.
  3. Click `Confirm`.
- **Expected result:**
  - Only `Test Program 2` is removed.
  - `Test Program` and `Mobile Apps 101` remain in the list.
- **Priority:** High

### TC-008

- **ID:** TC-008
- **Title:** Dialog must not show a wrong or stale program name for the pending delete
- **Preconditions:**
  - Programs `Morning Cohort` and `Evening Cohort` exist.
- **Steps:**
  1. Click the delete icon for `Evening Cohort`.
  2. Read the dialog message before confirming.
- **Expected result:**
  - Message is `Are you sure about deleting the program Evening Cohort`.
  - Message does not reference `Morning Cohort` or any other program.
- **Priority:** High

### TC-009

- **ID:** TC-009
- **Title:** Repeated Confirm does not corrupt list state or remove additional programs
- **Preconditions:**
  - Program `Test Program` exists.
- **Steps:**
  1. Click the delete icon for `Test Program`.
  2. Click `Confirm` once; if the UI allows a second activation on the same dialog, click `Confirm` again rapidly.
- **Expected result:**
  - At most one delete occurs for `Test Program`.
  - No error page, duplicate API error spam, or removal of another program.
- **Priority:** Medium

---

## Edge Cases

### TC-010

- **ID:** TC-010
- **Title:** Special characters in the program name appear correctly in the dialog and delete succeeds after confirm
- **Preconditions:**
  - Program `Informatique & IA - Niveau 2` exists.
- **Steps:**
  1. Click the delete icon for `Informatique & IA - Niveau 2`.
  2. Verify the full name appears in the dialog message.
  3. Click `Confirm`.
- **Expected result:**
  - Message is `Are you sure about deleting the program Informatique & IA - Niveau 2` (characters not HTML-encoded or mangled).
  - Program is removed after confirmation.
- **Priority:** Medium

### TC-011

- **ID:** TC-011
- **Title:** Quoted and comma-containing program names render safely in the dialog; cancel preserves the program
- **Preconditions:**
  - Program `"AI", Data-2026` exists.
- **Steps:**
  1. Click the delete icon for `"AI", Data-2026`.
  2. Verify the dialog message includes the full stored name.
  3. Click `Cancel`.
- **Expected result:**
  - Dialog text matches the product rule for the exact message format using that name.
  - Program remains in the list.
- **Priority:** Medium

### TC-012

- **ID:** TC-012
- **Title:** Long program names display readably in the dialog without breaking layout
- **Preconditions:**
  - Program `Advanced Full Stack Web Development and Cloud Engineering Cohort 2026` exists.
- **Steps:**
  1. Click the delete icon for `Advanced Full Stack Web Development and Cloud Engineering Cohort 2026`.
- **Expected result:**
  - Dialog opens; message includes the full program name.
  - No unreadable overlap, clipped-only name, or missing `Confirm`/`Cancel` controls.
- **Priority:** Medium

### TC-013

- **ID:** TC-013
- **Title:** Minimal-length program name still produces correct dialog and correct delete target
- **Preconditions:**
  - Program `A` exists (single-character name, if the product allows it).
- **Steps:**
  1. Click the delete icon for `A`.
  2. Confirm the message references `A` only.
  3. Click `Confirm`.
- **Expected result:**
  - Message is `Are you sure about deleting the program A`.
  - Only that row is removed.
- **Priority:** Low

### TC-014

- **ID:** TC-014
- **Title:** Case-different program names map to the correct row and dialog text
- **Preconditions:**
  - Programs `Test Program` and `test program` both exist (if the product allows case-only distinction).
- **Steps:**
  1. Click the delete icon for `test program`.
  2. Verify dialog message uses `test program` exactly as stored.
  3. Click `Confirm`.
- **Expected result:**
  - Only `test program` is removed; `Test Program` remains if it is a distinct record.
- **Priority:** Medium

### TC-015

- **ID:** TC-015
- **Title:** Duplicate display names still delete only the row whose delete control was activated
- **Preconditions:**
  - Two distinct list rows both show program name `Python Basics` (if duplicates are possible), or two names differing only by invisible characters per product rules.
- **Steps:**
  1. Click the delete icon on the second `Python Basics` row.
  2. Click `Confirm`.
- **Expected result:**
  - Exactly one `Python Basics` row is removed; the other remains (or behavior matches documented duplicate policy).
- **Priority:** Medium

### TC-016

- **ID:** TC-016
- **Title:** Cancel then delete again requires a new confirmation and only deletes after second Confirm
- **Preconditions:**
  - Program `Test Program` exists.
- **Steps:**
  1. Click the delete icon for `Test Program`.
  2. Click `Cancel`.
  3. Click the delete icon for `Test Program` again.
  4. Click `Confirm`.
- **Expected result:**
  - First flow does not delete the program.
  - Second flow deletes only after `Confirm`.
- **Priority:** Medium

---

## Traceability (AC coverage)

| Acceptance scenario | Covered by |
|---------------------|------------|
| Delete with confirmation (dialog → confirm → removed) | TC-001, TC-002 |
| Cancel deletion (dialog → cancel → still in list) | TC-003, TC-006 |

---

## Ambiguities / Gaps in the ACs

- **Concurrent changes:** No rule if `Test Program` is deleted elsewhere before the user clicks `Confirm` (error message, silent no-op, or stale success).
- **Dismissal paths:** No requirement for `Esc`, overlay click, or browser back while the dialog is open; should match `Cancel` or be explicitly disallowed.
- **Exact copy:** Assumes English string and exact punctuation; localization or trailing spaces in stored names are not specified.
- **Post-delete feedback:** No requirement for toast, inline message, or undo.
- **Duplicates / uniqueness:** AC does not state whether duplicate program names are allowed; TC-015 depends on product rules.
- **Permissions / empty list:** AC does not cover users without delete rights or deleting the last program in the list.
