Feature: DS-3 — Program name validation and duplicate prevention

  As an admin user, I want program names validated on create
  so that only allowed characters are saved and duplicate names are rejected.

  # Happy paths

  Scenario: Program is created when Name contains allowed letters, spaces, and allowed special characters
    Given I am on the program creation form
    And no existing program named "Informatique & IA - Niveau 2"
    When I enter "Informatique & IA - Niveau 2" in Program Name
    And I fill Description with a valid value
    And I click Create
    Then the modal closes
    And the program list shows "Informatique & IA - Niveau 2"

  Scenario: Program is created when Name contains each allowed special character
    Given I am on the program creation form
    And no existing program named "AI% & Data@Scale-2.0, \"Advanced\""
    When I enter "AI% & Data@Scale-2.0, \"Advanced\"" in Program Name
    And I fill Description with a valid value
    And I click Create
    Then the modal closes
    And the saved name preserves %, &, @, -, ., comma, and double-quote characters

  Scenario: Leading and trailing spaces are trimmed before save
    Given I am on the program creation form
    And no existing program named "Web Development 2027"
    When I enter "   Web Development 2027   " in Program Name
    And I fill Description with a valid value
    And I click Create
    Then the modal closes
    And the program list shows "Web Development 2027" without leading or trailing spaces

  Scenario: Name accepts minimum non-empty valid value
    Given I am on the program creation form
    And no existing program named "A"
    When I enter "A" in Program Name
    And I fill Description with a valid value
    And I click Create
    Then the modal closes
    And the program list shows "A"

  Scenario: Name with only allowed punctuation and letters remains valid after trim
    Given I am on the program creation form
    And no existing program named "\"AI\", Data-2026"
    When I enter "  \"AI\", Data-2026  " in Program Name
    And I fill Description with a valid value
    And I click Create
    Then the modal closes
    And the program list shows "\"AI\", Data-2026"

  Scenario: Name at maximum allowed length is accepted
    Given I am on the program creation form
    And no existing program with a 255-character valid name
    When I enter a valid name exactly at the maximum length using allowed characters only
    And I fill Description with a valid value
    And I click Create
    Then the modal closes
    And the program is created with the exact provided name

  # Negative

  Scenario: Form is not submitted when Name contains only spaces
    Given I am on the program creation form
    When I enter "   " in Program Name
    And I click Create
    Then the name is trimmed to empty
    And the form is not submitted
    And validation indicates Program Name is required or empty

  Scenario: Duplicate Name is rejected when exactly matching an existing program
    Given I am logged in as admin on the Programs page
    And program "Web Development 2026" already exists in the list
    When I open the program creation form
    And I enter "Web Development 2026" in Program Name
    And I fill Description with a valid value
    And I click Create
    Then the form is not submitted
    And a duplicate-name error is visible
    And the list contains exactly one program with that name

  Scenario: Duplicate Name is rejected when case differs only
    Given program "Web Development 2026" already exists in the list
    When I open the program creation form
    And I enter "web development 2026" in Program Name
    And I fill Description with a valid value
    And I click Create
    Then the form is not submitted
    And an error indicates the name already exists

  Scenario: Duplicate Name is rejected when only whitespace count differs
    Given program "Web Development 2026" already exists in the list
    When I open the program creation form
    And I enter "  Web   Development    2026  " in Program Name
    And I fill Description with a valid value
    And I click Create
    Then the input is normalized for duplicate comparison
    And the form is not submitted
    And an error indicates the name already exists

  Scenario: Name is rejected when it contains a non-allowed special character
    Given I am on the program creation form
    When I enter "Finance + Accounting" in Program Name
    And I fill Description with a valid value
    And I click Create
    Then the form is not submitted
    And validation indicates invalid character(s) in Program Name

  Scenario: Name is rejected when empty string is submitted
    Given I am on the program creation form
    When I leave Program Name empty
    And I click Create
    Then the form is not submitted
    And validation indicates Program Name is required

  Scenario: Name with tab/newline-only whitespace is treated as empty
    Given I am on the program creation form
    When I enter a value consisting only of tab or newline whitespace in Program Name
    And I click Create
    Then the value is treated as empty after trim
    And the form is not submitted
    And required validation is shown

  Scenario: Name exceeding maximum allowed length is rejected
    Given I am on the program creation form
    When I enter a valid name with length one character over the maximum
    And I fill Description with a valid value
    And I click Create
    Then the form is not submitted
    And validation indicates the name length exceeds the limit

  Scenario: Duplicate check applies after trimming leading/trailing spaces
    Given program "Data Science 2026" already exists in the list
    When I open the program creation form
    And I enter "   Data Science 2026   " in Program Name
    And I fill Description with a valid value
    And I click Create
    Then the name is normalized before duplicate check
    And the form is not submitted
    And an error indicates the name already exists

  # Ambiguities / gaps in ACs

  # - Max length numeric limit is not specified in the ticket (255 assumed from app behavior).
  # - Internal whitespace normalization for duplicate checks is unclear (only leading/trailing trim is explicit).
  # - Unicode letters/accents behavior is not defined.
  # - Exact error message text, placement, and timing are not specified.
  # - Apostrophe and parentheses are not in the allowed character list; intent for names like Bachelor's Program is unclear.
