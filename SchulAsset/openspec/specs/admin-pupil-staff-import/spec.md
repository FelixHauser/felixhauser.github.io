# admin-pupil-staff-import Specification

## Purpose

Pupils and staff can be imported from CSV files through the combined import dialog (iPads / Schüler / Lehrkräfte), with a preview before anything is written. Pupils are matched on first name + last name + address; staff on their unique Kürzel, which the database enforces case-insensitively. A staff file may have an `email` column: those rows also get a teacher login, with a one-time download of the generated passwords.

## Requirements
### Requirement: Combined import dialog
The CSV import dialog SHALL let the admin choose what to import — iPads, pupils or staff — and SHALL show the format hint and template download of the chosen kind. The "CSV importieren" buttons on the pupil list and the staff list SHALL open the dialog with the matching kind preselected.

#### Scenario: Preselected kind
- **WHEN** an admin clicks "CSV importieren" on the pupil list
- **THEN** the dialog opens with "Schüler" selected

#### Scenario: Changing the kind
- **WHEN** an admin changes the kind after choosing a file
- **THEN** the file and the preview are cleared and the hint and template of the new kind are shown

#### Scenario: iPad import unchanged
- **WHEN** an admin imports iPads through the dialog
- **THEN** it behaves exactly as before (preview, optional status column, history entries)

### Requirement: Pupil CSV format
A pupil file SHALL have a header line with the columns `first_name`, `last_name` and `address` (separator `;` or `,`, UTF-8). First name and last name are required; the address is optional and stored empty as no address.

#### Scenario: Valid pupil file
- **WHEN** an admin selects a file with valid rows
- **THEN** the preview shows them as new and nothing is written yet

#### Scenario: Missing name
- **WHEN** a row has an empty first or last name
- **THEN** it is listed as invalid with its row number and reason and is not imported

### Requirement: Pupil duplicates
A pupil row SHALL count as already existing when first name, last name and address all equal (ignoring case and surrounding spaces) those of an existing pupil, and as a duplicate when they equal an earlier row of the same file. Such rows SHALL be skipped and listed in the preview.

#### Scenario: Re-running a file
- **WHEN** the same pupil file is imported a second time
- **THEN** every row is reported as already existing and none is created

#### Scenario: Same name, different address
- **WHEN** a row has the same first and last name as an existing pupil but a different address
- **THEN** it is imported as a new pupil

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

### Requirement: Kürzel is unique
The Kürzel of a staff member SHALL be unique (ignoring case), enforced by the database, and every place that creates or edits a staff member SHALL show a clear message when the Kürzel is already taken.

#### Scenario: New teacher with a taken Kürzel
- **WHEN** an admin creates a teacher with a Kürzel that already exists, in any letter case
- **THEN** no teacher is created and the form says that the Kürzel is already taken

#### Scenario: Editing to a taken Kürzel
- **WHEN** an admin changes a teacher's Kürzel to one used by another teacher
- **THEN** the change is rejected with the same message

### Requirement: Preview, import and result for pupils and staff
Before any record is written the dialog SHALL show counts of new, already existing, duplicate-in-file and invalid rows with a reason per problem row. On confirmation the new rows SHALL be created in chunks and a summary SHALL be shown; if a write fails the import stops and shows how many records were saved.

#### Scenario: Successful import
- **WHEN** an admin confirms a preview with new rows
- **THEN** those pupils or staff exist and a summary of imported, skipped and invalid rows is shown

#### Scenario: More than 1000 existing records
- **WHEN** more than 1000 pupils exist and the file contains a pupil stored beyond the first 1000
- **THEN** it is reported as already existing

#### Scenario: List refresh
- **WHEN** an import finishes while the matching list is shown
- **THEN** the list shows the new records without a manual reload

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
