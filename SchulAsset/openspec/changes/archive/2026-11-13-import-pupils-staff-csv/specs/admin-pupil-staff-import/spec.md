## ADDED Requirements

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
A staff file SHALL have a header line with the columns `first_name`, `last_name` and `kuerzel`, all required. A row whose Kürzel equals (ignoring case) the Kürzel of an existing staff member, or of an earlier row of the same file, SHALL be skipped and listed in the preview.

#### Scenario: Valid staff file
- **WHEN** an admin selects a file with valid rows
- **THEN** the preview shows them as new and nothing is written yet

#### Scenario: Existing Kürzel
- **WHEN** a row has a Kürzel that already exists, in any letter case
- **THEN** it is reported as already existing and not imported

#### Scenario: Missing Kürzel
- **WHEN** a row has an empty Kürzel
- **THEN** it is listed as invalid and not imported

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
