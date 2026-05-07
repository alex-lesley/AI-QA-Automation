## Test Plan — Edit Existing Program Details

### Scope
Validate the **Edit existing program details** feature from the Programs page, including:
- Opening a program in edit mode with pre-populated data
- Saving valid updates (especially `Name`)
- Preserving unchanged fields when only one field is edited
- Handling invalid input and boundary conditions

### Test Data Baseline
Use an existing program record in the Programs list:

- `Name`: **Web Development 2026**
- `Description`: **Full-stack web development bootcamp for 2026 intake**
- `Program Code`: **WD-2026**
- `Duration (weeks)`: **24**
- `Status`: **Active**

---

## Positive Flows

### TC-001
- **Title:** Edit form opens with existing program data pre-populated
- **Preconditions:**
  - User is on the `Programs` page
  - Program `Web Development 2026` exists with baseline data
- **Steps:**
  1. Locate `Web Development 2026` in the program list.
  2. Click the edit icon for that row.
- **Expected result:**
  - Edit modal/form opens.
  - Fields show current values exactly:
    - `Name` = `Web Development 2026`
    - `Description` = `Full-stack web development bootcamp for 2026 intake`
    - `Program Code` = `WD-2026`
    - `Duration (weeks)` = `24`
    - `Status` = `Active`
- **Priority:** High

### TC-002
- **Title:** Valid name update is saved and reflected immediately in list
- **Preconditions:**
  - Edit modal is open for `Web Development 2026`
- **Steps:**
  1. In `Name`, replace `Web Development 2026` with `Web Development 2026 - Updated`.
  2. Click `Save`.
- **Expected result:**
  - Modal closes.
  - Programs list refreshes immediately.
  - Updated row displays `Web Development 2026 - Updated`.
  - No duplicate row is created.
- **Priority:** High

### TC-003
- **Title:** Editing only Description preserves all other fields
- **Preconditions:**
  - Program exists with baseline data
  - Edit modal is open for the program
- **Steps:**
  1. Update `Description` to `Full-stack web development bootcamp with updated module sequence`.
  2. Do not change any other field.
  3. Click `Save`.
  4. Re-open edit modal for the same program.
- **Expected result:**
  - Description is updated to new value.
  - `Name`, `Program Code`, `Duration (weeks)`, and `Status` remain unchanged from baseline.
- **Priority:** High

### TC-004
- **Title:** Multiple valid field updates save together correctly
- **Preconditions:**
  - Program exists with baseline data
- **Steps:**
  1. Open edit modal for `Web Development 2026`.
  2. Change `Name` to `Web Development 2026 - Cohort A`.
  3. Change `Description` to `Cohort A schedule and curriculum`.
  4. Change `Duration (weeks)` from `24` to `26`.
  5. Click `Save`.
- **Expected result:**
  - Modal closes.
  - List shows updated `Name`.
  - Re-opened form shows all modified fields saved correctly in one transaction.
- **Priority:** Medium

---

## Negative Flows

### TC-005
- **Title:** Save is blocked when Name is cleared
- **Preconditions:**
  - Edit modal is open for existing program
- **Steps:**
  1. Delete all text from `Name`.
  2. Click `Save`.
- **Expected result:**
  - Modal remains open.
  - Validation error shown for `Name` (required).
  - No changes are persisted in list.
- **Priority:** High

### TC-006
- **Title:** Duplicate program name is rejected
- **Preconditions:**
  - Program `Data Science 2026` exists
  - Edit modal open for `Web Development 2026`
- **Steps:**
  1. Change `Name` to `Data Science 2026`.
  2. Click `Save`.
- **Expected result:**
  - Save fails with duplicate-name validation message.
  - Modal stays open for correction.
  - Original program names remain unchanged in list.
- **Priority:** High

### TC-007
- **Title:** Invalid over-limit Name input is not accepted
- **Preconditions:**
  - Edit modal open
- **Steps:**
  1. Enter a `Name` longer than the allowed max length (e.g., 256 chars if max is 255).
  2. Click `Save`.
- **Expected result:**
  - Validation indicates `Name` exceeds max length.
  - Save does not complete; modal does not close.
  - Existing data remains unchanged.
- **Priority:** High

### TC-008
- **Title:** Canceling edit does not persist unsaved changes
- **Preconditions:**
  - Edit modal open for baseline program
- **Steps:**
  1. Change `Name` to `Web Development 2026 - Temp`.
  2. Click `Cancel` or close (`X`) without saving.
  3. Re-open edit modal for same program.
- **Expected result:**
  - No changes were saved.
  - `Name` still shows `Web Development 2026`.
- **Priority:** Medium

---

## Edge Cases

### TC-009
- **Title:** Name with leading/trailing spaces is handled consistently
- **Preconditions:**
  - Edit modal open
- **Steps:**
  1. Set `Name` to `  Web Development 2026 - Updated  ` (with outer spaces).
  2. Click `Save`.
- **Expected result:**
  - System either trims and saves as `Web Development 2026 - Updated` or rejects with clear message (must match product rule).
  - No silent corruption or duplicate due to whitespace variants.
- **Priority:** Medium

### TC-010
- **Title:** Name supports valid special characters
- **Preconditions:**
  - Edit modal open
- **Steps:**
  1. Change `Name` to `Web Development 2026: Front-End & Back-End`.
  2. Click `Save`.
- **Expected result:**
  - Save succeeds if characters are allowed by rules.
  - List shows exact saved value without encoding issues.
- **Priority:** Medium

### TC-011
- **Title:** Description supports max-length boundary value
- **Preconditions:**
  - Edit modal open
- **Steps:**
  1. Enter Description at exactly max allowed length (e.g., 1000 chars).
  2. Click `Save`.
- **Expected result:**
  - Save succeeds at exact boundary.
  - Stored value matches entered text exactly.
- **Priority:** Medium

### TC-012
- **Title:** Rapid repeated Save clicks do not create inconsistent updates
- **Preconditions:**
  - Edit modal open with modified valid `Name`
- **Steps:**
  1. Change `Name` to `Web Development 2026 - Updated`.
  2. Click `Save` multiple times quickly.
- **Expected result:**
  - Only one update is applied.
  - Modal closes once; no duplicate requests causing duplicate records or UI flicker states.
- **Priority:** Low

### TC-013
- **Title:** Concurrent update conflict is handled safely
- **Preconditions:**
  - Same program open in two browser sessions/users
- **Steps:**
  1. Session A opens edit modal.
  2. Session B updates program `Name` and saves.
  3. Session A edits `Description` and saves stale form.
- **Expected result:**
  - System handles conflict per design (reject with stale-data message or merge safely).
  - Should NOT silently overwrite newer data unexpectedly.
- **Priority:** Medium

### TC-014
- **Title:** Empty Description behavior follows validation rules
- **Preconditions:**
  - Edit modal open
- **Steps:**
  1. Clear `Description`.
  2. Click `Save`.
- **Expected result:**
  - If optional: save succeeds and other fields remain unchanged.
  - If required: validation error shown and save blocked.
  - Behavior must be explicit and consistent.
- **Priority:** Medium

---

## Ambiguities / Gaps in ACs

- `Description` requirement is unclear: can it be empty, whitespace-only, or null?
- Max/min length constraints for `Name` and `Description` are not specified.
- Allowed/disallowed character set for `Name` is not defined (symbols, emojis, non-Latin).
- Duplicate-name rule is not specified (case-sensitive? whitespace-insensitive? scoped globally or per tenant/org?).
- Expected trim behavior for leading/trailing spaces is not defined.
- Error message text/placement and save-button disabled/enabled behavior are not specified.
- No explicit behavior for API/network failure during save.
- No explicit rule for concurrent edits (last-write-wins vs optimistic locking).
- “Program list immediately shows update” lacks timing tolerance (instant UI update vs after reload).
