## MODIFIED Requirements

### Requirement: Staff CSV format and duplicates
A staff file SHALL have a header line with the columns `first_name`, `last_name` and `kuerzel`, all required, and MAY have a column `email`. A row whose Kürzel equals (ignoring case) the Kürzel of an existing staff member, or of an earlier row of the same file, SHALL be skipped and listed in the preview; a skipped row's e-mail is ignored.

#### Scenario: Valid staff file
- **WHEN** an admin selects a file with valid rows
- **THEN** the preview shows them as new and nothing is written yet

#### Scenario: File without e-mail column
- **WHEN** the file has only the three required columns
- **THEN** it is accepted as before and no logins are created

#### Scenario: Existing Kürzel
- **WHEN** a row has a Kürzel that already exists, in any letter case
- **THEN** it is reported as already existing and not imported, and no login is created for it

#### Scenario: Missing Kürzel
- **WHEN** a row has an empty Kürzel
- **THEN** it is listed as invalid and not imported

#### Scenario: Invalid e-mail
- **WHEN** a row has an e-mail that is not a valid e-mail address
- **THEN** it is listed as invalid with the reason and not imported

#### Scenario: E-mail twice in the file
- **WHEN** the same e-mail appears in two rows
- **THEN** the later row is listed as invalid and not imported

## ADDED Requirements

### Requirement: Staff import can create logins
For every imported row that has an e-mail, the import SHALL create a `teacher` login linked to the new Lehrkraft, in batches after the Lehrkraft rows were written. A failure for one login SHALL NOT undo the Lehrkraft or stop the other logins.

#### Scenario: Rows with and without e-mail
- **WHEN** a file with 10 rows, 6 of them with an e-mail, is imported
- **THEN** 10 Lehrkräfte exist and 6 of them have a login

#### Scenario: One e-mail already registered
- **WHEN** one of the e-mails is already registered
- **THEN** that Lehrkraft exists without login, the other logins are created, and the result lists the failed e-mail with the reason

#### Scenario: Summary
- **WHEN** the import finishes
- **THEN** the dialog shows how many Lehrkräfte were imported, how many logins were created and how many logins failed

### Requirement: One-time credentials download
When the import created at least one login, the result dialog SHALL offer "Zugangsdaten herunterladen", producing a UTF-8 CSV file with the columns e-mail, password and name, and SHALL warn that the file contains passwords that are not stored anywhere. The file SHALL be available only in that dialog.

#### Scenario: Download
- **WHEN** the admin presses the button after an import that created logins
- **THEN** a file with one line per created login is saved

#### Scenario: No logins created
- **WHEN** no login was created (no e-mails, or all failed)
- **THEN** no download button is shown

#### Scenario: Dialog closed
- **WHEN** the dialog has been closed
- **THEN** the passwords can no longer be downloaded or shown
