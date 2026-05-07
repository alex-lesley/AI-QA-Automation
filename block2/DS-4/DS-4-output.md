## Test Plan: Delete Program with Confirmation

### Scope
Validate delete behavior from the Programs list with focus on:
- Confirmation dialog appearance/content
- Confirm vs Cancel outcomes
- Correct program targeting
- Dialog behavior for different program name formats

## Positive Flows

### TC-001
- **Title:** Confirmation dialog is displayed when deleting an existing program
- **Preconditions:**
  - Program `Test Program` exists in the program list.
- **Steps:**
  1. Locate `Test Program` in the program list.
  2. Click the delete icon for `Test Program`.
- **Expected result:**
  - A confirmation dialog appears.
  - Dialog message is exactly `Are you sure about deleting the program Test Program`.
  - `Confirm` and `Cancel` buttons are visible and enabled.
- **Priority:** High

### TC-002
- **Title:** Program is removed from list after confirmed deletion
- **Preconditions:**
  - Program `Test Program` exists in the program list.
- **Steps:**
  1. Click the delete icon for `Test Program`.
  2. In the confirmation dialog, click `Confirm`.
- **Expected result:**
  - Dialog closes.
  - `Test Program` is removed from the program list immediately.
- **Priority:** High

### TC-003
- **Title:** Program remains in list after deletion is canceled
- **Preconditions:**
  - Program `Test Program` exists in the program list.
- **Steps:**
  1. Click the delete icon for `Test Program`.
  2. In the confirmation dialog, click `Cancel`.
- **Expected result:**
  - Dialog closes.
  - `Test Program` remains visible in the program list.
- **Priority:** High

## Negative Flows

### TC-004
- **Title:** No deletion occurs before explicit confirmation
- **Preconditions:**
  - Program `Test Program` exists in the program list.
- **Steps:**
  1. Click the delete icon for `Test Program`.
  2. Observe the list before clicking any dialog button.
- **Expected result:**
  - `Test Program` is still present while dialog is open.
  - Deletion is not triggered automatically.
- **Priority:** High

### TC-005
- **Title:** Cancel action does not remove any program
- **Preconditions:**
  - Programs `Test Program` and `Web Development 2026` both exist.
- **Steps:**
  1. Click delete icon for `Test Program`.
  2. Click `Cancel`.
- **Expected result:**
  - `Test Program` remains in list.
  - `Web Development 2026` remains unchanged.
  - No unintended row is removed.
- **Priority:** High

### TC-006
- **Title:** Deletion action targets only the selected program
- **Preconditions:**
  - Programs `Test Program`, `Test Program 2`, and `Data Science 2026` exist.
- **Steps:**
  1. Click delete icon for `Test Program 2`.
  2. Click `Confirm`.
- **Expected result:**
  - Only `Test Program 2` is removed.
  - `Test Program` and `Data Science 2026` remain in list.
- **Priority:** High

### TC-007
- **Title:** Confirmation dialog message must include exact selected program name
- **Preconditions:**
  - Program `Web Development 2026` exists.
- **Steps:**
  1. Click delete icon for `Web Development 2026`.
- **Expected result:**
  - Dialog message shows `Are you sure about deleting the program Web Development 2026`.
  - Message does not show a wrong or stale name.
- **Priority:** High

## Edge Cases

### TC-008
- **Title:** Dialog displays and deletes program with special characters in name
- **Preconditions:**
  - Program `Informatique & IA - Niveau 2` exists.
- **Steps:**
  1. Click delete icon for `Informatique & IA - Niveau 2`.
  2. Verify dialog message text.
  3. Click `Confirm`.
- **Expected result:**
  - Dialog message correctly includes full name with special characters.
  - Program is deleted successfully from the list.
- **Priority:** Medium

### TC-009
- **Title:** Dialog displays and cancels deletion for program with quoted name
- **Preconditions:**
  - Program `"AI", Data-2026` exists.
- **Steps:**
  1. Click delete icon for `"AI", Data-2026`.
  2. Verify dialog message text.
  3. Click `Cancel`.
- **Expected result:**
  - Dialog renders quotes/comma correctly in message.
  - Program remains in list after cancel.
- **Priority:** Medium

### TC-010
- **Title:** Dialog handles long program names without truncation errors
- **Preconditions:**
  - Program `Advanced Full Stack Web Development and Cloud Engineering Cohort 2026` exists.
- **Steps:**
  1. Click delete icon for `Advanced Full Stack Web Development and Cloud Engineering Cohort 2026`.
- **Expected result:**
  - Dialog opens normally and remains readable.
  - Program name in message is correct (no broken formatting/overlap).
- **Priority:** Medium

### TC-011
- **Title:** Correct instance is deleted when similarly named programs exist
- **Preconditions:**
  - Programs `Test Program`, `Test Program ` (trailing space if system allows), and `test program` exist.
- **Steps:**
  1. Click delete icon for `test program`.
  2. Click `Confirm`.
- **Expected result:**
  - Only selected row (`test program`) is removed.
  - Other similarly named rows remain.
- **Priority:** Medium

### TC-012
- **Title:** Reopening dialog after cancel still requires explicit confirm
- **Preconditions:**
  - Program `Test Program` exists.
- **Steps:**
  1. Click delete icon for `Test Program`.
  2. Click `Cancel`.
  3. Click delete icon for `Test Program` again.
  4. Click `Confirm`.
- **Expected result:**
  - First attempt does not delete.
  - Second attempt deletes only after `Confirm`.
- **Priority:** Medium

## Ambiguities / Gaps in ACs

- AC does not define behavior if another user/process already removed the program before confirmation.
- AC does not specify whether dialog can be dismissed via `Esc` key or outside-click, and expected result in that case.
- Exact wording/casing/punctuation of the confirmation message is given, but tolerance for localization or minor text variation is not defined.
- No requirement for post-delete feedback (toast/snackbar) is specified.
- Duplicate/special/max-length/empty/boundary rules are listed as test-plan requirements but not functionally meaningful for delete itself unless they affect dialog message rendering from existing names.
