## ADDED Requirements

### Requirement: Panel grouped by subject
The admin panel SHALL show one section each for "Schüler", "Lehrkräfte" and "iPads", followed by "Zugänge", "Schule" and "Systemprüfung". Each subject section SHALL list its actions in this order: new, import from CSV, update status from CSV (Schüler and Lehrkräfte only), export as CSV. Each row SHALL show a label and a short description of what it does, and the section titles SHALL have an icon. Row labels SHALL NOT repeat the subject, but the dialogs SHALL keep their titles with the subject.

#### Scenario: Pupil actions together
- **WHEN** an admin opens Verwaltung
- **THEN** the section "Schüler" contains "Neuer Schüler", "Aus CSV importieren", "Status aus CSV aktualisieren" and "Als CSV exportieren", and no row of another subject

#### Scenario: iPads without status update
- **WHEN** an admin looks at the section "iPads"
- **THEN** it contains "Neues iPad", "Aus CSV importieren" and "Als CSV exportieren", and no status update

#### Scenario: Same behaviour as before
- **WHEN** an admin clicks "Aus CSV importieren" in the section "Schüler"
- **THEN** the dialog "Schüler aus CSV importieren" opens, as before

## MODIFIED Requirements

### Requirement: Add and import actions live in the panel
The sections "Schüler", "Lehrkräfte" and "iPads" SHALL offer "Neuer Schüler", "Neue Lehrkraft" and "Neues iPad" and, for each subject, "Aus CSV importieren". Each SHALL open the same dialog as before with unchanged behaviour. The section "Zugänge" SHALL offer "Neuer Admin".

#### Scenario: New iPad from the panel
- **WHEN** an admin clicks "Neues iPad" in the section "iPads" and saves valid data
- **THEN** the iPad is created and its detail page opens, as before

#### Scenario: CSV import from the panel
- **WHEN** an admin clicks "Aus CSV importieren" in the section "Schüler"
- **THEN** the import dialog opens with the kind Schüler preselected

#### Scenario: New admin from the panel
- **WHEN** an admin clicks "Neuer Admin" and completes the dialog
- **THEN** the admin login is created and the credentials dialog is shown, as before

### Requirement: Status updates in the panel
The sections "Schüler" and "Lehrkräfte" of the admin panel SHALL each contain the entry "Status aus CSV aktualisieren", opening the batch status dialog for that kind.

#### Scenario: Open the dialog
- **WHEN** an admin clicks "Status aus CSV aktualisieren" in the section "Schüler"
- **THEN** the dialog for pupil status files opens, with its format hint and template download

### Requirement: Export section in the panel
Each of the sections "Schüler", "Lehrkräfte" and "iPads" SHALL contain the entry "Als CSV exportieren" and a note that the file contains personal data.

#### Scenario: Open the panel
- **WHEN** an admin opens Verwaltung
- **THEN** each of the three subject sections has its export entry and the note
