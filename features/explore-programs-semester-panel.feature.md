## Coverage snapshot
- Page: `/programs`
- Already covered: create, edit, delete, name validation, list display, empty state, sidebar nav
- Explored via a11y tree: this session

## Selected gap (one flow)
**Flow:** Program row selection opens the semester management panel
**Why this one:** Exercises the right-hand semester panel — a distinct UI region that no existing spec asserts.

## Gherkin test plan

Feature: Programs — semester panel selection (discovered)

  Scenario: TC-001 Selecting a program reveals the semester management panel
    Given I am logged in as admin
    And I am on the Programs page
    And a program "Semester Panel Alpha" exists in the list
    When I click the program name "Semester Panel Alpha"
    Then I do not see "Select a program to manage semesters"
    And I see "Semesters & scheduling config"
    And I see the button "+ Semester"
    And I see "Manage Courses"
    And the semester panel shows "Semester Panel Alpha"

  Scenario: TC-002 Switching selection updates the semester panel context
    Given I am logged in as admin
    And programs "Semester Panel Alpha" and "Semester Panel Beta" exist in the list
    And I have selected program "Semester Panel Alpha"
    When I click the program name "Semester Panel Beta"
    Then the semester panel shows "Semester Panel Beta"
    And the semester panel does not show "Semester Panel Alpha"

## Locator hints (from a11y tree)
- Select prompt: text "Select a program to manage semesters"
- Semester panel heading: text "Semesters & scheduling config"
- New semester: button "+ Semester"
- Manage courses: text "Manage Courses"
- Program row select: click program name paragraph in table row

## For test-writer
- Suggested file: `tests/ds6-program-semester-panel.spec.ts`
- POM updates: `SemesterPanel` component; `ProgramRow.select()`; `ProgramsPage.semesterPanel`
