Feature: DS-4 — Delete program with confirmation

  As an admin user, I want to delete a program I no longer need, with a
  confirmation step to prevent accidental deletion.

  # Happy paths (from ticket acceptance criteria)

  Scenario: Delete program with confirmation
    Given a program "Test Program" exists on the Programs page
    When I click the delete icon for "Test Program"
    Then I see a confirmation dialog naming "Test Program"
    When I confirm deletion
    Then "Test Program" is removed from the program list

  Scenario: Cancel program deletion
    Given a program exists on the Programs page
    When I click the delete icon for that program
    And I see the confirmation dialog
    And I click Cancel (dismiss the dialog)
    Then the program still exists in the list

  # Happy paths (extended)

  Scenario: Confirming delete removes only the targeted program
    Given programs "Test Program" and "Retention Pilot 2026" exist
    When I confirm deletion of "Test Program"
    Then "Test Program" is removed
    And "Retention Pilot 2026" remains visible

  Scenario: Canceled delete persists after page reload
    Given a program "Test Program" exists
    When I open the delete dialog and dismiss it
    And I reload the Programs page
    Then "Test Program" is still listed once

  Scenario: Canceled delete persists after navigating away and back
    Given a program "Test Program" exists
    When I dismiss the delete confirmation dialog
    And I navigate away from Programs and return
    Then "Test Program" is still listed once

  Scenario: Program remains editable after canceling delete
    Given a program "Test Program" exists
    When I dismiss the delete confirmation dialog
    And I open edit for "Test Program"
    Then the edit form shows the original program name

  # Negative

  Scenario: No error alerts appear after a successful delete
    Given programs "Test Program" and another program exist
    When I confirm deletion of "Test Program"
    Then no error alerts are shown on the Programs page

  Scenario: No delete-success toast appears when deletion is canceled
    Given a program "Test Program" exists
    When I dismiss the delete confirmation dialog
    Then no delete-success message is shown

  Scenario: Confirming delete does not remove sibling programs
    Given programs "Test Program" and "Sibling Program" exist
    When I confirm deletion of "Test Program"
    Then "Sibling Program" remains listed exactly once

  # Edge cases

  Scenario: Confirmation dialog names the correct program when several exist
    Given programs "Test Program", "Alpha Schedule", and "Beta Schedule" exist
    When I open delete for "Alpha Schedule" and dismiss
    Then the dialog message references "Alpha Schedule" only
    And "Alpha Schedule" remains in the list

  Scenario: Dialog message is correct for a long program name
    Given a program with a long name exists
    When I open the delete confirmation dialog
    Then the dialog message contains the full program name verbatim

  Scenario: Dialog message handles special characters in the program name
    Given a program named with special characters (e.g. "Test Program & Co. (2026) – #1")
    When I open the delete confirmation dialog
    Then the dialog message contains the name verbatim

  Scenario: Only one confirmation dialog opens per delete click
    Given a program "Test Program" exists
    When I click delete once and dismiss the dialog
    Then exactly one confirmation dialog was shown
    And "Test Program" remains in the list

  Scenario: A single confirm click removes the program once without duplicate dialogs
    Given programs "Test Program" and "Sibling Program" exist
    When I click delete on "Test Program" and accept the dialog once
    Then "Test Program" is removed
    And only one confirmation dialog opened
    And "Sibling Program" remains listed once

<!--
Ambiguities / gaps:
- Ticket does not specify exact confirmation dialog copy; tests assert a pattern
  matching "Delete program '<name>'?" and "cannot be undone".
- Ticket does not define behavior for unauthorized users; out of scope unless
  a separate auth story covers delete permissions.
- Ticket does not specify toast/notification on successful delete; extended
  scenarios assert no erroneous alerts rather than requiring a success toast.
-->
