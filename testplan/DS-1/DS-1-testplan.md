## Test Plan — Create New Academic Program

**Jira:** [DS-1](https://legionqaschool.atlassian.net/browse/DS-1) — Create new academic program  
**Status:** In Progress · **Priority:** High · **Labels:** mvp, program-setup

**User story:** As an admin user, I want to create a new academic program so that I can begin designing its curriculum structure.

**Related defects (from Jira links):** DS-16 (modal dismiss >2s), DS-17 (double-click duplicates), DS-18 (duplicate name clears Description), DS-19 (substring row matching), SS-26 (double-click duplicate submit)

### Scope

Validate the **Create new academic program** flow on Didaxis Studio: navigating to the creation form as an admin, submitting valid **Program Name** and **Description** values, list refresh after save, and validation that blocks creation when **Program Name** is empty.

**In scope:** Programs page navigation, **+ New Program** modal, **Program Name**, **Description**, **Create** action, modal close, list update, empty-name validation (disabled **Create**).

**Out of scope:** Edit/delete programs, permissions for non-admin roles, API contracts, performance, accessibility audits, and persistence after full logout (unless noted in ambiguities).

**Primary UI references (Didaxis Studio — test environment):**

| Element | How it appears / behaves |
|--------|---------------------------|
| Login | `https://test.didaxis.studio/login` — email, password, **Sign In** |
| Programs page | `/programs` |
| New program | **+ New Program** button opens modal |
| Program Name | Placeholder `e.g. Computer Science BSc` |
| Description | Placeholder `Brief description` |
| Submit | **Create** button |

---

## Positive Flows

### TC-001

- **Title:** Program creation form opens with Program Name and Description fields (AC: navigate to program creation form)
- **Preconditions:**
  - User is logged in as **admin**.
  - User is on the **Programs** page.
- **Steps:**
  1. Click **+ New Program**.
- **Expected result:**
  - A program creation form (modal) is displayed.
  - **Program Name** field is visible (placeholder `e.g. Computer Science BSc`).
  - **Description** field is visible (placeholder `Brief description`).
  - **Create** control is present.
- **Priority:** High

### TC-002

- **Title:** Valid program is created and appears in the list after Create (AC: successfully create a program)
- **Preconditions:**
  - User is logged in as **admin**.
  - Program creation form is open (e.g. after TC-001).
  - Program name **Web Development 2026** does not already exist in the list.
- **Steps:**
  1. In **Program Name**, enter `Web Development 2026`.
  2. In **Description**, enter `Full-stack web development program`.
  3. Click **Create**.
- **Expected result:**
  - The modal closes.
  - The program list includes **Web Development 2026** (visible row/card title or name column).
  - No error toast or inline validation blocks the save.
- **Priority:** High

### TC-003

- **Title:** Create button stays disabled when Program Name is empty (AC: validation prevents empty program name)
- **Preconditions:**
  - User is logged in as **admin**.
  - Program creation form is open.
- **Steps:**
  1. Leave **Program Name** empty (do not type or clear field so it is blank).
  2. Optionally enter text in **Description** (e.g. `Optional description only`).
  3. Observe the **Create** button state.
- **Expected result:**
  - **Create** is **disabled** (not clickable).
  - No program is added to the list while **Program Name** remains empty.
- **Priority:** High

### TC-004

- **Title:** Program is created with Description empty when Program Name is valid
- **Preconditions:**
  - User is logged in as **admin**.
  - Program creation form is open.
  - Name `Cybersecurity Fundamentals 2026` is not already in the list.
- **Steps:**
  1. In **Program Name**, enter `Cybersecurity Fundamentals 2026`.
  2. Leave **Description** empty.
  3. Click **Create** (enabled once name is filled).
- **Expected result:**
  - Modal closes.
  - **Cybersecurity Fundamentals 2026** appears in the program list.
  - If Description is optional, empty description is accepted; if required, validation blocks save (see ambiguities).
- **Priority:** Medium

### TC-005

- **Title:** Re-opening New Program after a successful create shows a fresh empty form
- **Preconditions:**
  - User is logged in as **admin**.
  - A program was just created successfully (e.g. TC-002).
- **Steps:**
  1. Click **+ New Program** again.
- **Expected result:**
  - Creation form opens with **Program Name** and **Description** empty (no values from the previous submission).
- **Priority:** Low

---

## Negative Flows

### TC-006

- **Title:** No program is added when the creation modal is closed without Create
- **Preconditions:**
  - User is logged in as **admin**.
  - Program creation form is open.
  - Note the current program count or whether `Draft Program QA` exists.
- **Steps:**
  1. Enter **Program Name** `Draft Program QA`.
  2. Enter **Description** `Should not be saved`.
  3. Close the modal via **Cancel**, **X**, or equivalent dismiss control (not **Create**).
- **Expected result:**
  - Modal closes.
  - **Draft Program QA** does **not** appear in the program list.
- **Priority:** High

### TC-007

- **Title:** Filling only Description does not enable Create or create a program
- **Preconditions:**
  - User is logged in as **admin**.
  - Program creation form is open.
- **Steps:**
  1. Leave **Program Name** empty.
  2. In **Description**, enter `Description without a program name`.
  3. Attempt to click **Create**.
- **Expected result:**
  - **Create** remains disabled.
  - No new program row appears in the list.
- **Priority:** High

### TC-008

- **Title:** Duplicate Program Name is rejected and list is unchanged
- **Preconditions:**
  - User is logged in as **admin**.
  - Program **Web Development 2026** already exists in the list (from TC-002 or seed data).
- **Steps:**
  1. Click **+ New Program**.
  2. Enter **Program Name** `Web Development 2026`.
  3. Enter **Description** `Duplicate attempt`.
  4. Click **Create** (if enabled).
- **Expected result:**
  - Save is blocked with a clear validation or error message (e.g. duplicate name).
  - Modal remains open or closes only after user dismisses error—no second duplicate row for **Web Development 2026**.
  - Existing program data is unchanged.
- **Priority:** High

### TC-009

- **Title:** Whitespace-only Program Name does not create a program
- **Preconditions:**
  - User is logged in as **admin**.
  - Program creation form is open.
- **Steps:**
  1. In **Program Name**, enter three spaces `   `.
  2. In **Description**, enter `Whitespace name test`.
  3. Check **Create** state and attempt submit if enabled.
- **Expected result:**
  - **Create** stays disabled **or** submit is blocked with validation.
  - No new program row is added for whitespace-only name.
- **Priority:** High

### TC-010

- **Title:** Program is not created when network or server save fails
- **Preconditions:**
  - User is logged in as **admin**.
  - Ability to simulate offline or API failure (devtools, proxy, or test hook).
- **Steps:**
  1. Open program creation form.
  2. Enter **Program Name** `Network Failure Program`.
  3. Enter **Description** `Simulated failure`.
  4. Block network or force API error, then click **Create**.
- **Expected result:**
  - User sees an error state (message or retry); modal does not silently succeed.
  - **Network Failure Program** does **not** appear in the list unless save actually succeeded.
- **Priority:** Medium

---

## Edge Cases

### TC-011

- **Title:** Leading and trailing spaces on Program Name are trimmed when saved
- **Preconditions:**
  - User is logged in as **admin**.
  - Program creation form is open.
  - `Data Analytics 2026` (trimmed) does not already exist.
- **Steps:**
  1. In **Program Name**, enter `   Data Analytics 2026   `.
  2. In **Description**, enter `Trim behavior check`.
  3. Click **Create**.
- **Expected result:**
  - List shows **Data Analytics 2026** without leading/trailing spaces (or validation rejects untrimmed input—behavior must be consistent).
- **Priority:** Medium

### TC-012

- **Title:** Special characters and symbols are preserved in Program Name and Description
- **Preconditions:**
  - User is logged in as **admin**.
  - Program creation form is open.
- **Steps:**
  1. In **Program Name**, enter `AI & ML (2026) — "Applied" <test>`.
  2. In **Description**, enter `Covers C++, 50% labs & O'Brien's module @campus`.
  3. Click **Create**.
- **Expected result:**
  - Modal closes; list displays name and description text as entered (no HTML injection; characters visible as plain text).
- **Priority:** Medium

### TC-013

- **Title:** Single-character Program Name is accepted at minimum boundary
- **Preconditions:**
  - User is logged in as **admin**.
  - Program creation form is open.
  - Name `X` is not already used.
- **Steps:**
  1. In **Program Name**, enter `X`.
  2. In **Description**, enter `Minimum length name`.
  3. Click **Create**.
- **Expected result:**
  - Program **X** is created and listed, unless product defines a higher minimum length.
- **Priority:** Low

### TC-014

- **Title:** Maximum-length Program Name is accepted or rejected with clear feedback
- **Preconditions:**
  - User is logged in as **admin**.
  - Program creation form is open.
  - Known max length from spec (if unknown, use 255 characters as probe).
- **Steps:**
  1. Paste a **Program Name** of exactly the documented max length (e.g. 255 `a` characters).
  2. Enter **Description** `Max length program name`.
  3. Click **Create**.
  4. Repeat with max length + 1 character if max is known.
- **Expected result:**
  - At max length: save succeeds and full name appears in list **or** validation explains limit.
  - Over max: save blocked with validation; no truncated silent save without indication.
- **Priority:** Medium

### TC-015

- **Title:** Maximum-length Description is accepted or rejected with clear feedback
- **Preconditions:**
  - User is logged in as **admin**.
  - Program creation form is open.
- **Steps:**
  1. Enter **Program Name** `Long Description Program 2026`.
  2. Paste **Description** at documented max length (e.g. 2000 characters).
  3. Click **Create**.
  4. If applicable, repeat with max + 1.
- **Expected result:**
  - Behavior matches product limits: success at max, clear error over max; list shows stored description correctly.
- **Priority:** Medium

### TC-016

- **Title:** Duplicate names differing only by letter case are handled consistently
- **Preconditions:**
  - User is logged in as **admin**.
  - Program **Web Development 2026** exists.
- **Steps:**
  1. Open creation form.
  2. Enter **Program Name** `web development 2026`.
  3. Enter **Description** `Case variant duplicate`.
  4. Click **Create**.
- **Expected result:**
  - System either rejects as duplicate (case-insensitive) or allows as distinct (case-sensitive)—behavior is explicit and documented; list must not show ambiguous duplicates if duplicates are forbidden.
- **Priority:** Medium

### TC-017

- **Title:** Rapid double-click on Create does not create duplicate programs
- **Preconditions:**
  - User is logged in as **admin**.
  - Program creation form is open.
  - Name `UX Design Certificate 2026` does not exist.
- **Steps:**
  1. Fill **Program Name** `UX Design Certificate 2026` and **Description** `Double submit test`.
  2. Double-click **Create** quickly.
- **Expected result:**
  - Exactly one **UX Design Certificate 2026** appears in the list.
  - Modal closes once; no duplicate rows from duplicate requests.
- **Priority:** Low

### TC-018

- **Title:** Non-admin user cannot access program creation (if role model applies)
- **Preconditions:**
  - User is logged in as a non-admin role (e.g. instructor or viewer), if such roles exist.
- **Steps:**
  1. Navigate to **Programs** page.
  2. Look for **+ New Program** and attempt to open creation form (direct URL if hidden).
- **Expected result:**
  - **+ New Program** is hidden or disabled **or** creation is blocked with authorization error.
  - No new program can be created without admin permission.
- **Priority:** Medium

---

## AC Traceability

| AC scenario | Covered by (minimum) |
|-------------|----------------------|
| Navigate to program creation form | TC-001 |
| Successfully create a program | TC-002 |
| Validation prevents empty program name | TC-003, TC-007 |

---

## Ambiguities and Gaps in the Acceptance Criteria

1. **Description requirement** is unspecified: AC always fills Description on success, but TC-004 probes empty Description—product may require, optional, or whitespace-only rules differ.
2. **Whitespace-only Program Name** is not in AC; expected behavior (disabled **Create** vs trim-to-empty) is undefined (TC-009).
3. **Max/min length** for **Program Name** and **Description** are not stated (TC-013–TC-015 use assumed boundaries).
4. **Duplicate program names** are not mentioned; case sensitivity and trim rules are unclear (TC-008, TC-016).
5. **Trim behavior** for leading/trailing spaces on **Program Name** is not specified (TC-011).
6. **Cancel / dismiss** path is not in AC; users need clarity on whether partial input is discarded (TC-006).
7. **Non-admin access** to **+ New Program** is implied by “logged in as admin” but not tested in AC (TC-018).
8. **Error messaging** when validation fails (empty name, duplicate, server error) is not defined—only disabled **Create** for empty name.
9. **List refresh timing** after Create (“shows” immediately vs after reload) is not specified.
10. **Special characters**, **unicode**, and **HTML/script** in names are out of scope in AC but relevant for security/display (TC-012).
11. **Concurrent creation** of the same name from two sessions is not covered.
12. **Program fields beyond Name and Description** (code, status, duration) are not mentioned; form may grow without AC update.
