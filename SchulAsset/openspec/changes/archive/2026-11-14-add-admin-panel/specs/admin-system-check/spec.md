## ADDED Requirements

### Requirement: Manual read-only system check
The panel SHALL have a section "Systemprüfung" with a button "Prüfung starten". The check SHALL run only when the button is pressed and SHALL NOT create, change or delete any data.

#### Scenario: Not run on open
- **WHEN** an admin opens the panel
- **THEN** no check requests are sent until the button is pressed

#### Scenario: Running the check
- **WHEN** the admin presses "Prüfung starten"
- **THEN** each check shows a pending state and then a result with OK or a plain-text problem

### Requirement: Database check and counts
The check SHALL count the rows of `ipads`, `pupils`, `staff` and `user_roles` without transferring rows, so counts above 1000 are correct. If a table cannot be read, the result SHALL name the table and show the error text.

#### Scenario: All tables readable
- **WHEN** the check runs against a healthy database
- **THEN** the four counts are shown

#### Scenario: A table is not readable
- **WHEN** reading `staff` fails
- **THEN** the result names `staff` and shows the error, and the other checks still run

### Requirement: Edge Function reachability
The check SHALL test whether the Edge Functions `create-ipad-account` and `create-staff-account` answer, without executing them. A function that does not answer SHALL be reported as "nicht erreichbar" with the reason, and SHALL remind the admin that functions are deployed by hand.

#### Scenario: Function deployed
- **WHEN** both functions answer the probe
- **THEN** both show OK and no account is created

#### Scenario: Function missing
- **WHEN** `create-staff-account` is not deployed
- **THEN** it shows "nicht erreichbar" and the other function's result is unaffected

### Requirement: Test-data warning
The check SHALL count iPads whose serial number starts with `ZZ` and, if there are any, show a warning that test data is present and must be removed before go-live.

#### Scenario: Test iPads present
- **WHEN** 3 iPads with serials starting `ZZ` exist
- **THEN** the check shows a warning naming the count of 3

#### Scenario: None present
- **WHEN** no such iPad exists
- **THEN** the test-data result is OK

### Requirement: Version and escaping
The check SHALL show the loaded asset version (the `?v=` value). Any text that comes from errors or the database SHALL be HTML-escaped before display.

#### Scenario: Hostile error text
- **WHEN** an error message contains `<b>x</b>`
- **THEN** it is shown as text, not rendered as HTML
