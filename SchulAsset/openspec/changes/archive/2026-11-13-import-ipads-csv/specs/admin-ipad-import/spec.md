## ADDED Requirements

### Requirement: CSV format and template
The admin interface SHALL accept a CSV file whose first line is a header with the columns `serial_number`, `ipad_type` and `storage_capacity` and an optional column `status`, separated by `;` or `,`, and SHALL offer an empty template to download.

#### Scenario: Semicolon and comma files
- **WHEN** an admin selects a valid file separated by `;` and another valid file separated by `,`
- **THEN** both are read correctly

#### Scenario: Template download
- **WHEN** an admin clicks the template link
- **THEN** a CSV with the header and example rows is downloaded

### Requirement: Preview before import
Before any iPad is written, the dialog SHALL show how many rows are new, how many already exist, how many are duplicates within the file and how many are invalid, with a reason for each problem row.

#### Scenario: Nothing written during preview
- **WHEN** an admin selects a file
- **THEN** a preview is shown and no iPad has been created

#### Scenario: Invalid rows
- **WHEN** a row has an empty serial number, an unknown type or an unknown storage capacity
- **THEN** it is listed as invalid with its row number and reason and is not imported

#### Scenario: Existing and repeated serial numbers
- **WHEN** a serial number already exists in the database in any letter case, or appears twice in the file
- **THEN** it is reported and not imported again

### Requirement: Import of new iPads
On confirmation the system SHALL create every valid, new row as an iPad with the status from the `status` column, or `available` when that column is missing or the cell is empty, with no assignment, store its serial number trimmed and upper case, and write an "iPad angelegt (CSV-Import)" history entry for it.

#### Scenario: Default status
- **WHEN** a row has no status value
- **THEN** the iPad is created as `available`

#### Scenario: Declared status
- **WHEN** a row has the status `decommissioned`
- **THEN** the iPad is created with status `decommissioned` and no assignment

#### Scenario: Status that needs an assignment
- **WHEN** a row has the status `in_use`, `terms_pending` or `handover_pending`, or an unknown status
- **THEN** the row is listed as invalid and is not imported

#### Scenario: Successful import
- **WHEN** an admin confirms a preview with new rows
- **THEN** those iPads exist, each has a history entry, and a summary of imported, skipped and invalid rows is shown

#### Scenario: Re-running the same file
- **WHEN** the same file is imported a second time
- **THEN** all rows are reported as already existing and none is created

#### Scenario: Database error during import
- **WHEN** a write fails part-way
- **THEN** the import stops, the number of iPads saved so far and the error are shown, and a re-run imports only the missing rows

### Requirement: Existing duplicates are found beyond 1000 iPads
The duplicate check SHALL compare against all iPads in the database, not only the first 1000.

#### Scenario: More than 1000 iPads exist
- **WHEN** more than 1000 iPads exist and the file contains a serial number that is stored beyond the first 1000
- **THEN** it is reported as already existing

### Requirement: iPad list and dashboard show all iPads
The iPad list and the dashboard counts SHALL include every iPad in the database, also when there are more than 1000.

#### Scenario: More than 1000 iPads
- **WHEN** more than 1000 iPads exist and an admin opens the iPad view
- **THEN** the list and the total on the dashboard show all of them
