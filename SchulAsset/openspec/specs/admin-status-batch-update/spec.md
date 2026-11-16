# admin-status-batch-update Specification

## Purpose
TBD - created by archiving change add-active-status. Update Purpose after archive.
## Requirements
### Requirement: Batch status update by CSV
An admin SHALL be able to update the active status of existing pupils and of existing staff from a CSV file, in the same import dialog family as the other CSV imports (separate entries for pupils and staff, fixed kind, template download, format hint). The update SHALL never create people.

#### Scenario: Leavers list
- **WHEN** an admin selects a pupil file with `is_active` = `nein` for 80 pupils and confirms the preview
- **THEN** those 80 pupils are inactive and a summary is shown

#### Scenario: Unknown person
- **WHEN** a row matches nobody
- **THEN** it is reported as not found and nothing is created

### Requirement: Status file formats
A pupil status file SHALL have the columns `first_name`, `last_name`, `is_active` and MAY have `address` and `inactive_since`. A staff status file SHALL have the columns `kuerzel` and `is_active` and MAY have `inactive_since`; other columns are ignored. Separator `;` or `,`, UTF-8. The value of `is_active` SHALL be accepted case-insensitively as `ja`/`nein`, `true`/`false`, `1`/`0` or `aktiv`/`nicht aktiv`; any other value, including an empty cell, SHALL make the row invalid.

#### Scenario: Value variants
- **WHEN** rows use `Nein`, `0`, `false` and `nicht aktiv`
- **THEN** all four are read as inactive

#### Scenario: Bad value
- **WHEN** a row has `vielleicht` or an empty `is_active`
- **THEN** it is listed as invalid with its line number and nothing is written for it

#### Scenario: Wrong file
- **WHEN** the header lacks `is_active` or the identifying columns
- **THEN** the dialog names the missing columns and offers no import

### Requirement: Inactive date in the file
For rows that set a person inactive, the optional column `inactive_since` (`yyyy-mm-dd` or `dd.mm.yyyy`) SHALL give the date since when the person is inactive; when the column or the cell is empty, the day of the import SHALL be used. A date that cannot be read or lies in the future SHALL make the row invalid. For rows that set a person active the column SHALL be ignored and `inactive_since` cleared. An already inactive person whose row gives a different date SHALL be counted as "will be updated" (date correction); with the same date, or without a date in the file, as unchanged.

#### Scenario: Date given
- **WHEN** a row has `nein` and `31.07.2026`
- **THEN** the person is set inactive since 2026-07-31

#### Scenario: No date
- **WHEN** a row has `nein` and no date
- **THEN** the person is set inactive since the day of the import

#### Scenario: Future or unreadable date
- **WHEN** a row has a date in the future or `Sommer`
- **THEN** the row is invalid and not written

#### Scenario: Date correction
- **WHEN** a person is already inactive since 2026-09-15 and the file gives `nein` and 2026-07-31
- **THEN** the row is counted as will be updated and the date becomes 2026-07-31

### Requirement: Matching existing people
A staff row SHALL be matched on the Kürzel (ignoring case). A pupil row with an address SHALL be matched on first name + last name + address (ignoring case and surrounding spaces); a pupil row without an address SHALL be matched on first and last name and only when exactly one pupil has that name. A name shared by several pupils SHALL be reported as ambiguous and skipped. A person that occurs twice in the file SHALL be reported as duplicate, and only the first row counts.

#### Scenario: Name only, unique
- **WHEN** a row has no address and exactly one pupil has that name
- **THEN** that pupil is matched

#### Scenario: Name only, ambiguous
- **WHEN** a row has no address and two pupils have that name
- **THEN** the row is reported as ambiguous with the hint to add the address, and nobody is changed

#### Scenario: More than 1000 people
- **WHEN** more than 1000 pupils exist and the row refers to one stored beyond the first 1000
- **THEN** the pupil is matched

### Requirement: Preview before writing
Before anything is written the dialog SHALL show how many rows will be updated (split into deactivated and reactivated), are unchanged (person already has that status), were not found, are ambiguous or duplicate, are invalid, or are blocked because the person still has an iPad, with a reason per problem row. Nothing SHALL be written until the admin confirms.

#### Scenario: Blocked by an iPad
- **WHEN** a row would deactivate a pupil who still has an assigned iPad
- **THEN** the row is listed as blocked with the iPad's serial number and is not written

#### Scenario: Unchanged
- **WHEN** a row sets a person inactive who is already inactive
- **THEN** it is counted as unchanged and not written

#### Scenario: Cancel
- **WHEN** the admin closes the dialog after the preview
- **THEN** no status has changed

### Requirement: Writing and result
On confirmation the changes SHALL be written in chunks and a summary SHALL be shown (deactivated, reactivated, unchanged, skipped). For staff, the logins of the people who were deactivated SHALL be locked and the logins of those reactivated SHALL be unlocked, in chunks of at most 50, and the summary SHALL state how many logins were locked or unlocked and which failed. If a write fails the update SHALL stop and show how many were saved. A shown list SHALL refresh afterwards without a manual reload.

#### Scenario: Successful update
- **WHEN** the admin confirms a preview with rows to update
- **THEN** the status of exactly those people changes and the summary shows the counts

#### Scenario: Re-running the same file
- **WHEN** the same file is imported again
- **THEN** every valid row is reported as unchanged and nothing is written

#### Scenario: Staff with logins deactivated
- **WHEN** a staff file deactivates 8 Lehrkräfte of whom 6 have a login
- **THEN** the 6 logins are locked and the summary says so

#### Scenario: A lock fails
- **WHEN** one login cannot be locked
- **THEN** that person's status is not changed, the summary names them and the others are done

### Requirement: Hint about the export
The status update dialogs SHALL tell the admin that the matching export file (Verwaltung → Daten exportieren) can be edited and used as the status file.

#### Scenario: Dialog hint
- **WHEN** the dialog "Status Schüler aus CSV aktualisieren" is opened
- **THEN** the hint mentions the export file as a starting point
