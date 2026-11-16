# admin-csv-export Specification

## Purpose
TBD - created by archiving change export-csv-lists. Update Purpose after archive.
## Requirements
### Requirement: CSV downloads of pupils, staff and iPads
An admin SHALL be able to download CSV files of all pupils, all staff and all iPads from the admin panel. Each file SHALL contain every row of its table, including inactive people and regardless of any list filter, also when there are more than 1000 rows.

#### Scenario: All pupils
- **WHEN** an admin downloads the pupil export while some pupils are inactive and more than 1000 pupils exist
- **THEN** the file has one line per pupil, inactive ones included

#### Scenario: Not admin
- **WHEN** a user without the admin role opens the app
- **THEN** no export is reachable (the panel is admin-only)

### Requirement: Export columns
The pupil file SHALL have the columns `first_name;last_name;address;is_active;inactive_since`, the staff file `kuerzel;first_name;last_name;is_active;inactive_since`, the iPad file `serial_number;ipad_type;storage_capacity;status;assigned_to`. `is_active` SHALL be `ja` or `nein`; `inactive_since` SHALL be `yyyy-mm-dd` or empty; `assigned_to` SHALL be the owner's name or empty. The files SHALL NOT contain login e-mails, passwords, signatures, IP addresses or history.

#### Scenario: Round trip
- **WHEN** an admin changes `is_active` to `nein` for some rows of the pupil export and imports the file with "Status Schüler aus CSV aktualisieren"
- **THEN** the preview recognises every row (no "nicht gefunden") and updates the changed ones

#### Scenario: Staff with a login
- **WHEN** the staff export is downloaded
- **THEN** no column reveals whether or with which e-mail a Lehrkraft has a login

#### Scenario: Assigned iPad
- **WHEN** an iPad is assigned to a pupil
- **THEN** `assigned_to` holds "Nachname, Vorname" of that pupil

### Requirement: File format
Files SHALL be UTF-8 with a byte order mark, separated by `;`, lines ended by `\r\n`; a field containing `;`, a quote or a line break SHALL be quoted (quotes doubled); a field starting with `=`, `+`, `-`, `@`, a tab or a carriage return SHALL be prefixed with `'` so spreadsheets do not run it as a formula. File names SHALL contain the kind and the date.

#### Scenario: Umlauts
- **WHEN** a file with names like "Müller" is opened in Excel
- **THEN** the umlauts are shown correctly

#### Scenario: Address with semicolon
- **WHEN** an address contains `;`
- **THEN** the field is quoted and the line keeps the right number of columns

#### Scenario: Formula in a name
- **WHEN** a text field starts with `=`
- **THEN** it is saved with a leading `'`

### Requirement: Feedback and privacy note
While a file is prepared the panel SHALL show that it is loading, then the number of exported rows; an error SHALL be shown in the panel. The section SHALL tell the admin that the files contain personal data.

#### Scenario: Success
- **WHEN** the export finishes
- **THEN** the number of lines is shown next to the entry

### Requirement: Result line in the section of the export
While a file is prepared and after it was saved, the progress, row count or error message SHALL be shown in the section of the export that was started, not in another section.

#### Scenario: Pupil export
- **WHEN** an admin starts "Als CSV exportieren" in the section "Schüler"
- **THEN** "wird geladen…" and then the number of exported rows appear in the section "Schüler" only

