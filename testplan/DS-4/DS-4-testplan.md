# Test plan: Delete program with confirmation

**Feature:** Delete a program only after an explicit confirmation step.  
**Primary program name used in tests:** Test Program  
**Confirmation dialog (specified copy and controls):**
- Message: `Delete program <program name>? All its semesters and courses will be removed. This cannot be undone.` (with the actual program name substituted for `<program name>`).
- **Confirm** button  
- **Cancel** button  

---

## 1. Positive flows

### TC-001  
**Title:** Deleting Test Program after confirmation removes it from the program list  

**Preconditions:**  
- User is logged in with permission to manage programs.  
- A program named **Test Program** exists and appears in the program list.  
- At least one other program exists in the list (so the list is non-empty after deletion).  

**Steps:**  
1. Open the screen that shows the program list.  
2. Locate the row or card for **Test Program**.  
3. Click the **delete** icon (trash/delete control) for **Test Program**.  
4. Verify the confirmation dialog appears.  
5. Verify the dialog message is exactly: `Delete program "Test Program"? All its semesters and courses will be removed. This cannot be undone.`.  
6. Verify **Confirm** and **Cancel** are visible and enabled.  
7. Click **Confirm**.  

**Expected result:**  
- The confirmation dialog closes.  
- **Test Program** no longer appears in the program list.  
- Other programs remain listed unchanged.  
- No error toast or blocking error is shown for a successful delete.  

**Priority:** High  

---

### TC-002  
**Title:** Canceling deletion leaves Test Program in the program list  

**Preconditions:**  
- Same as TC-001 ( **Test Program** exists in the program list).  

**Steps:**  
1. Open the program list.  
2. Click the **delete** icon for **Test Program**.  
3. Verify the confirmation dialog appears with message `Delete program "Test Program"? All its semesters and courses will be removed. This cannot be undone.`.  
4. Click **Cancel**.  

**Expected result:**  
- The dialog closes.  
- **Test Program** still appears in the program list in the same position as before (or equivalent stable ordering if the list auto-sorts).  
- No success message implying deletion occurred.  

**Priority:** High  

---

### TC-003  
**Title:** Confirmation dialog shows the correct program name when several programs exist  

**Preconditions:**  
- Programs **Test Program**, **Alpha Schedule**, and **Beta Schedule** exist in the list.  

**Steps:**  
1. Open the program list.  
2. Click the **delete** icon for **Alpha Schedule** only.  

**Expected result:**  
- Dialog message is `Delete program "Alpha Schedule"? All its semesters and courses will be removed. This cannot be undone.` (not Test Program or Beta Schedule).  
- **Confirm** and **Cancel** are shown.  

**Priority:** Medium  

---

## 2. Negative flows

### TC-004  
**Title:** Program is not removed when the user only opens the dialog and does not confirm  

**Preconditions:**  
- **Test Program** exists in the program list.  

**Steps:**  
1. Note the current count of programs (or screenshot the list).  
2. Click the **delete** icon for **Test Program**.  
3. Verify the dialog is open.  
4. Do not click **Confirm**; click **Cancel**.  
5. Refresh the program list view (same session; use the application’s refresh control or navigate away and back if no explicit refresh exists).  

**Expected result:**  
- **Test Program** is still present after step 4 and after step 5.  
- Program count is unchanged from step 1.  

**Priority:** High  

---

### TC-005  
**Title:** Deleting Test Program does not remove a different program from the list  

**Preconditions:**  
- **Test Program** and **Retention Pilot 2026** both exist.  

**Steps:**  
1. Open the program list.  
2. Click **delete** for **Test Program** only.  
3. On the dialog, confirm the title names **Test Program**.  
4. Click **Confirm**.  

**Expected result:**  
- **Test Program** is removed.  
- **Retention Pilot 2026** remains in the list with no change to its data.  

**Priority:** High  

---

### TC-006  
**Title:** No duplicate or silent delete occurs when Confirm is clicked once  

**Preconditions:**  
- Exactly one program named **Test Program** exists (no duplicate names in test data).  

**Steps:**  
1. Open the program list and record all program names.  
2. Click **delete** for **Test Program**.  
3. Click **Confirm** once (single click).  

**Expected result:**  
- Only one **Test Program** entry is removed (list does not drop two rows).  
- No second confirmation dialog appears unless the product explicitly requires it (should not for this feature).  

**Priority:** Medium  

---

### TC-007  
**Title:** Cancel does not partially delete or mark the program as deleted in the UI  

**Preconditions:**  
- **Test Program** exists; user can open its details or see its status if applicable.  

**Steps:**  
1. Open the program list.  
2. Click **delete** for **Test Program**.  
3. Click **Cancel**.  
4. If the app has a program detail view, open **Test Program**’s details.  

**Expected result:**  
- **Test Program** is fully usable and visible; no “deleted”, “archived”, or strikethrough state unless that state existed before the test.  
- No empty row left where **Test Program** was removed.  

**Priority:** Medium  

---

## 3. Edge cases

### TC-008  
**Title:** Dialog message remains correct for a long program name  

**Preconditions:**  
- A program exists with name: `North Region Holiday Overtime Program Q1-Q2 2026 Extended Pilot`.  

**Steps:**  
1. Open the program list.  
2. Click **delete** for that program.  

**Expected result:**  
- Message is `Delete program "North Region Holiday Overtime Program Q1-Q2 2026 Extended Pilot"? All its semesters and courses will be removed. This cannot be undone.` (full name, not truncated in a way that changes meaning; UI may wrap text).  
- **Confirm** and **Cancel** remain visible and usable (e.g., scroll within dialog if needed).  

**Priority:** Low  

---

### TC-009  
**Title:** Program name with special characters appears verbatim in the dialog  

**Preconditions:**  
- A program exists with name: `Test Program & Co. (2026) – #1`.  

**Steps:**  
1. Click **delete** for that program.  

**Expected result:**  
- Dialog text matches the exact stored program name (including `&`, parentheses, en dash, and `#`).  

**Priority:** Low  

---

### TC-010  
**Title:** Only one confirmation dialog opens per delete icon click  

**Preconditions:**  
- **Test Program** is in the list.  

**Steps:**  
1. Click the **delete** icon for **Test Program** once.  

**Expected result:**  
- A single confirmation dialog is shown (not stacked duplicates).  

**Priority:** Medium  

---

### TC-011  
**Title:** Behavior is consistent if the user opens delete then navigates away (if allowed)  

**Preconditions:**  
- **Test Program** exists; user can open delete dialog and also navigate to another page without confirming.  

**Steps:**  
1. Click **delete** for **Test Program**.  
2. Without clicking **Confirm** or **Cancel**, navigate away using browser back, app sidebar, or close dialog via any **non-destructive** affordance the app provides (not **Confirm**).  

**Expected result:**  
- **Test Program** remains in the list when returning to the program list.  
- If the AC only defines **Cancel**, any other dismiss path should either behave like cancel or be documented; minimally, **Test Program** must not be deleted without an explicit **Confirm** (see ambiguities below).  

**Priority:** Low  

---

## Traceability to acceptance criteria

| AC scenario | Covered by |
|-------------|------------|
| Delete **Test Program** → dialog → confirm → removed from list | TC-001 |
| Delete icon → dialog → **Cancel** → program still in list | TC-002, TC-004, TC-007 |
| Dialog content (message pattern, **Confirm**, **Cancel**) | TC-001, TC-002, TC-003, TC-008, TC-009 |

---

## Ambiguities and gaps in the acceptance criteria

1. **Exact punctuation and casing:** The AC gives the message pattern but not whether it ends with a period or question mark; tests assume the string is exactly as written, with the program name appended as shown and no extra punctuation unless the product adds it consistently.  
2. **Dismissal other than Cancel:** No AC for closing via overlay click, **Escape**, or an **X** button; TC-011 flags this—behavior should match **Cancel** or be specified.  
3. **Permissions and errors:** No AC for users without delete permission, network failure on **Confirm**, or server-side rejection; real systems need cases for “Confirm clicked but program still listed” with an error message.  
4. **Concurrency:** No AC if **Test Program** is deleted in another tab/session while the dialog is open.  
5. **List refresh:** “Removed from the program list” does not state whether the list updates via live subscription, manual refresh, or navigation; tests assume the UI updates immediately after successful **Confirm**.  
6. **Duplicate names:** No rule for two programs named **Test Program**; TC-006 assumes unique names for that case.  
7. **Accessibility:** No requirement for focus trap, default button, or screen reader labels on **Confirm** / **Cancel**—worth adding if WCAG is in scope.  
8. **Post-delete navigation:** No AC for where the user lands (stay on list, empty state, toast)—only that the program is absent from the list.  

This plan uses only the instructions you provided; field labels follow the AC (**Test Program**, delete icon, confirmation dialog, **Confirm**, **Cancel**) plus concrete secondary names where useful for isolation tests.
