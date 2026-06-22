Feature: DS-2 — Edit existing program details

  As an admin user, I want to edit an existing program's details
  so that I can correct or update program information after creation.

  # Happy paths (from ticket acceptance criteria)

  Scenario: Open program for editing
    Given I am on the Programs page
    And a program "Web Development 2026" exists
    When I click the edit icon on "Web Development 2026"
    Then I see the edit form pre-populated with the program's current data

  Scenario: Successfully edit a program name
    Given I am editing "Web Development 2026"
    When I change the Name to "Web Development 2026 - Updated"
    And I click Save
    Then the modal closes
    And the program list immediately shows "Web Development 2026 - Updated"

  Scenario: Edit preserves unchanged fields
    Given I am editing a program
    When I only change the Description
    And I click Save
    Then the Name and other fields remain unchanged

  # Happy paths (extended)

  Scenario: Multiple valid field updates save together correctly
    Given I am editing a program with name and description
    When I change both Name and Description
    And I click Save
    Then the modal closes
    And reopening edit shows both updated values

  # Negative

  Scenario: Save is blocked when Name is cleared
    Given I am editing a program
    When I clear the Name field
    Then the Save button is disabled
    And the program name in the list is unchanged

  Scenario: Duplicate program name is rejected
    Given programs "Web Development 2026" and "Data Science 2026" exist
    When I edit "Web Development 2026" and set Name to "Data Science 2026"
    And I click Save
    Then save is blocked with validation or the modal remains open
    And the original program row is unchanged

  Scenario: Canceling edit does not persist unsaved changes
    Given I am editing a program
    When I change the Name to a temporary value
    And I click Cancel
    Then the modal closes
    And the list still shows the original program name

  Scenario: Invalid over-limit Name input is not accepted
    Given I am editing a program
    When I enter a Name exceeding the maximum length
    And I click Save
    Then save is blocked with validation or the modal remains open
    And the list still shows the original program name

  # Edge cases

  Scenario: Name with leading/trailing spaces is handled consistently
    Given I am editing a program
    When I change the Name to a value with leading and trailing spaces
    And I click Save
    Then the list reflects trimmed or rejected behavior consistently

  Scenario: Name supports valid special characters
    Given I am editing a program
    When I change the Name to include colons, ampersands, and hyphens
    And I click Save
    Then the modal closes
    And the list shows the updated name without rendering executable markup

  Scenario: Description supports max-length boundary value
    Given I am editing a program
    When I set Description to exactly 1000 characters
    And I click Save
    Then save succeeds or shows validation per product rules

  Scenario: Rapid repeated Save clicks do not create inconsistent updates
    Given I am editing a program
    When I change the Name and double-click Save
    Then exactly one updated row appears in the list

  Scenario: Concurrent update conflict is handled safely
    Given two admin sessions editing the same program
    When session B saves a name change first
    And session A then saves a description change
    Then stale overwrite does not silently revert session B's name change

  Scenario: Empty Description behavior follows validation rules
    Given I am editing a program with a description
    When I clear the Description field
    And I click Save
    Then empty description is accepted or blocked per product validation rules

<!--
Ambiguities / gaps:
- Ticket does not specify max Name length; spec uses 256 chars based on DS-3 patterns.
- Empty Description accept/reject is product-dependent; test branches on outcome.
- Concurrent edit conflict UX (error vs last-write-wins) is not specified in ticket AC.
-->
