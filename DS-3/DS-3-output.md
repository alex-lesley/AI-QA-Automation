## Test Plan: Program Name Validation & Duplicate Prevention

### Scope
This plan validates only the `Name` field behavior on the program creation form:
- Trim behavior
- Allowed/disallowed characters
- Duplicate prevention (case/whitespace-insensitive)
- Boundary and negative validations

API/network failure behavior and other fields are out of scope.

## Positive Flows

### TC-001
- **Title:** Program is created when Name contains allowed letters, spaces, and allowed special characters
- **Preconditions:**
  - Program creation form is open
  - No existing program named `Informatique & IA - Niveau 2`
- **Steps:**
  1. Enter `Informatique & IA - Niveau 2` in `Name`.
  2. Keep all other required fields valid.
  3. Click `Create`.
- **Expected result:**
  - Form is submitted successfully.
  - New program is created with name exactly `Informatique & IA - Niveau 2`.
- **Priority:** High

### TC-002
- **Title:** Program is created when Name contains each allowed special character
- **Preconditions:**
  - Program creation form is open
  - No existing program named `AI% & Data@Scale-2.0, "Advanced"`
- **Steps:**
  1. Enter `AI% & Data@Scale-2.0, "Advanced"` in `Name`.
  2. Keep all other required fields valid.
  3. Click `Create`.
- **Expected result:**
  - Form is submitted successfully.
  - Program is created; saved `Name` preserves allowed characters `%`, `&`, `@`, `-`, `.`, `,`, `"`.
- **Priority:** High

### TC-003
- **Title:** Leading and trailing spaces are trimmed before save
- **Preconditions:**
  - Program creation form is open
  - No existing program named `Web Development 2027`
- **Steps:**
  1. Enter `   Web Development 2027   ` in `Name`.
  2. Keep all other required fields valid.
  3. Click `Create`.
- **Expected result:**
  - Form is submitted successfully.
  - Program is created with saved name `Web Development 2027` (without leading/trailing spaces).
- **Priority:** High

## Negative Flows

### TC-004
- **Title:** Form is not submitted when Name contains only spaces
- **Preconditions:**
  - Program creation form is open
- **Steps:**
  1. Enter `   ` in `Name`.
  2. Click `Create`.
- **Expected result:**
  - Name is trimmed to empty value.
  - Form is not submitted.
  - Validation indicates `Name` is required/empty.
- **Priority:** High

### TC-005
- **Title:** Duplicate Name is rejected when exactly matching an existing program
- **Preconditions:**
  - Existing program: `Web Development 2026`
  - Program creation form is open
- **Steps:**
  1. Enter `Web Development 2026` in `Name`.
  2. Keep all other required fields valid.
  3. Click `Create`.
- **Expected result:**
  - Form is not submitted.
  - Error shown: name already exists.
- **Priority:** High

### TC-006
- **Title:** Duplicate Name is rejected when case differs only
- **Preconditions:**
  - Existing program: `Web Development 2026`
  - Program creation form is open
- **Steps:**
  1. Enter `web development 2026` in `Name`.
  2. Keep all other required fields valid.
  3. Click `Create`.
- **Expected result:**
  - Form is not submitted.
  - Error shown: name already exists (case-insensitive duplicate detection).
- **Priority:** High

### TC-007
- **Title:** Duplicate Name is rejected when only whitespace count differs
- **Preconditions:**
  - Existing program: `Web Development 2026`
  - Program creation form is open
- **Steps:**
  1. Enter `  Web   Development    2026  ` in `Name`.
  2. Keep all other required fields valid.
  3. Click `Create`.
- **Expected result:**
  - Input is normalized for duplicate comparison (whitespace/case rule).
  - Form is not submitted.
  - Error shown: name already exists.
- **Priority:** High

### TC-008
- **Title:** Name is rejected when it contains a non-allowed special character
- **Preconditions:**
  - Program creation form is open
- **Steps:**
  1. Enter `Finance + Accounting` in `Name` (`+` is not in allowed list).
  2. Keep all other required fields valid.
  3. Click `Create`.
- **Expected result:**
  - Form is not submitted.
  - Validation error indicates invalid character(s) in `Name`.
- **Priority:** High

### TC-009
- **Title:** Name is rejected when empty string is submitted
- **Preconditions:**
  - Program creation form is open
- **Steps:**
  1. Leave `Name` empty (`""`).
  2. Click `Create`.
- **Expected result:**
  - Form is not submitted.
  - Validation indicates `Name` is required.
- **Priority:** High

## Edge Cases

### TC-010
- **Title:** Name accepts minimum non-empty valid value
- **Preconditions:**
  - Program creation form is open
  - No existing program named `A`
- **Steps:**
  1. Enter `A` in `Name`.
  2. Keep all other required fields valid.
  3. Click `Create`.
- **Expected result:**
  - Form is submitted successfully.
  - Program is created with name `A`.
- **Priority:** Medium

### TC-011
- **Title:** Name with only allowed punctuation and letters remains valid after trim
- **Preconditions:**
  - Program creation form is open
  - No existing program named `"AI", Data-2026`
- **Steps:**
  1. Enter `  "AI", Data-2026  ` in `Name`.
  2. Keep all other required fields valid.
  3. Click `Create`.
- **Expected result:**
  - Form is submitted successfully.
  - Saved name is `"AI", Data-2026` (trimmed, punctuation preserved).
- **Priority:** Medium

### TC-012
- **Title:** Name with tab/newline-only whitespace is treated as empty
- **Preconditions:**
  - Program creation form is open
- **Steps:**
  1. Enter a value consisting only of tab/newline whitespace (e.g., `\t\t` or `\n`).
  2. Click `Create`.
- **Expected result:**
  - Value is treated as empty after trim.
  - Form is not submitted.
  - Required validation is shown.
- **Priority:** Medium

### TC-013
- **Title:** Name at maximum allowed length is accepted
- **Preconditions:**
  - Program creation form is open
  - Maximum length limit is configured in product requirements
  - No existing program with the test value
- **Steps:**
  1. Enter a valid name exactly at max length (using allowed characters only).
  2. Keep all other required fields valid.
  3. Click `Create`.
- **Expected result:**
  - Form is submitted successfully.
  - Program is created with exact provided name.
- **Priority:** High

### TC-014
- **Title:** Name exceeding maximum allowed length is rejected
- **Preconditions:**
  - Program creation form is open
  - Maximum length limit is configured in product requirements
- **Steps:**
  1. Enter a valid name with length = max + 1 characters.
  2. Keep all other required fields valid.
  3. Click `Create`.
- **Expected result:**
  - Form is not submitted.
  - Validation error indicates name length exceeds limit.
- **Priority:** High

### TC-015
- **Title:** Duplicate check applies after trimming leading/trailing spaces
- **Preconditions:**
  - Existing program: `Data Science 2026`
  - Program creation form is open
- **Steps:**
  1. Enter `   Data Science 2026   ` in `Name`.
  2. Keep all other required fields valid.
  3. Click `Create`.
- **Expected result:**
  - Name is normalized before duplicate check.
  - Form is not submitted.
  - Error shown: name already exists.
- **Priority:** High

## Ambiguities / Gaps in ACs

- **Max length is not specified** (exact numeric limit missing), so TC-013/TC-014 require a defined value.
- **Whitespace normalization rule is unclear** for internal whitespace: does `Web  Development 2026` equal `Web Development 2026` for duplicate checks, or only leading/trailing trim?
- **Unicode letters/accents behavior is not defined** (e.g., `Informatique Étendue`) even though one AC uses standard Latin text only.
- **Error message expectations are vague** (exact text, placement, and timing not defined).
- **Allowed character list excludes apostrophe and parentheses**, but business intent for common names like `Bachelor's Program` is not clarified.
