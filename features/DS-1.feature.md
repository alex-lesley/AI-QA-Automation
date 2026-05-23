Feature: DS-1 — Create new academic program

  As an admin user, I want to create a new academic program
  so that I can begin designing its curriculum structure.

  # Happy paths

  Scenario: Navigate to program creation form
    Given I am logged in as admin
    When I navigate to the Programs page
    And I click "+ New Program"
    Then I see the program creation form with fields: Program Name, Description

  Scenario: Successfully create a program
    Given I am on the program creation form
    When I fill in Program Name with "Web Development 2026"
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the modal closes
    And the program list shows "Web Development 2026"

  Scenario: Program is created with empty Description when Program Name is valid
    Given I am on the program creation form
    When I fill in Program Name with "Cybersecurity Fundamentals 2026"
    And I leave Description empty
    And I click Create
    Then the modal closes
    And the program list shows "Cybersecurity Fundamentals 2026"

  Scenario: Re-opening New Program shows a fresh empty form
    Given I am logged in as admin on the Programs page
    And I have just created program "Web Development 2026"
    When I click "+ New Program"
    Then Program Name and Description fields are empty

  # Negative

  Scenario: Validation prevents empty program name
    Given I am on the program creation form
    When I leave the Program Name field empty
    Then the Create button is disabled

  Scenario: Filling only Description does not enable Create
    Given I am on the program creation form
    When I leave Program Name empty
    And I fill in Description with "Description without a program name"
    Then the Create button is disabled
    And no new program appears in the list

  Scenario: Closing modal without Create does not save a program
    Given I am on the program creation form
    When I fill in Program Name with "Draft Program QA"
    And I fill in Description with "Should not be saved"
    And I close the modal without clicking Create
    Then the modal closes
    And the program list does not show "Draft Program QA"

  Scenario: Duplicate Program Name is rejected
    Given I am logged in as admin on the Programs page
    And program "Web Development 2026" already exists in the list
    When I open the program creation form
    And I fill in Program Name with "Web Development 2026"
    And I fill in Description with "Duplicate attempt"
    And I click Create
    Then save is blocked with a duplicate-name error or the modal remains open
    And the list does not contain a second row for "Web Development 2026"

  Scenario: Whitespace-only Program Name does not create a program
    Given I am on the program creation form
    When I fill in Program Name with "   "
    And I fill in Description with "Whitespace name test"
    Then the Create button is disabled or submit is blocked with validation
    And no new program row is added

  Scenario: Program is not created when network or server save fails
    Given I am on the program creation form
    And the save API is unavailable
    When I fill in Program Name with "Network Failure Program"
    And I fill in Description with "Simulated failure"
    And I click Create
    Then I see an error state
    And "Network Failure Program" does not appear in the list

  # Edge cases

  Scenario: Leading and trailing spaces on Program Name are handled consistently
    Given I am on the program creation form
    When I fill in Program Name with "   Data Analytics 2026   "
    And I fill in Description with "Trim behavior check"
    And I click Create
    Then the list shows "Data Analytics 2026" without leading or trailing spaces
      Or validation rejects the untrimmed input with clear feedback

  Scenario: Special characters are preserved in Program Name and Description
    Given I am on the program creation form
    When I fill in Program Name with "AI & ML (2026) — \"Applied\" <test>"
    And I fill in Description with "Covers C++, 50% labs & O'Brien's module @campus"
    And I click Create
    Then the modal closes
    And the list displays the name and description as plain text without HTML injection

  Scenario: Single-character Program Name is accepted at minimum boundary
    Given I am on the program creation form
    When I fill in Program Name with "X"
    And I fill in Description with "Minimum length name"
    And I click Create
    Then program "X" appears in the list

  Scenario: Maximum-length Program Name is accepted or rejected with clear feedback
    Given I am on the program creation form
    When I fill in Program Name with a 255-character name
    And I fill in Description with "Max length program name"
    And I click Create
    Then save succeeds at max length or validation explains the limit
    When I fill in Program Name with a 256-character name
    And I click Create
    Then save is blocked with validation

  Scenario: Duplicate names differing only by letter case are handled consistently
    Given program "Web Development 2026" exists in the list
    When I open the program creation form
    And I fill in Program Name with "web development 2026"
    And I fill in Description with "Case variant duplicate"
    And I click Create
    Then the system either rejects as duplicate or allows as distinct with explicit behavior

  Scenario: Rapid double-click on Create does not create duplicate programs
    Given I am on the program creation form
    When I fill in Program Name with "UX Design Certificate 2026"
    And I fill in Description with "Double submit test"
    And I double-click Create
    Then exactly one "UX Design Certificate 2026" appears in the list

  Scenario: Non-admin user cannot access program creation
    Given I am logged in as a non-admin user
    When I navigate to the Programs page
    Then "+ New Program" is hidden or disabled
      Or opening creation is blocked with an authorization error

  # Ambiguities and gaps in acceptance criteria
  #
  # 1. Description requirement is unspecified (optional vs required).
  # 2. Whitespace-only Program Name behavior is undefined (disabled vs trim-to-empty).
  # 3. Max/min length for Program Name and Description are not stated.
  # 4. Duplicate names, case sensitivity, and trim rules are unclear.
  # 5. Cancel/dismiss path and error messaging are not defined in AC.
  # 6. Non-admin access is implied by "logged in as admin" but not tested in AC.
  # 7. List refresh timing after Create is not specified.
  # 8. Concurrent creation of the same name from two sessions is not covered.
