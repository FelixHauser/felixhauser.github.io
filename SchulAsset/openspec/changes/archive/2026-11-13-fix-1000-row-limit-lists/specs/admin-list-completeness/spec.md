## ADDED Requirements

### Requirement: Lists show all rows
The pupil list, the staff list, the person dropdown in the assign dialog and the Pending tabs (Schadenmeldungen, Verlustmeldungen, Übergabe, Rückgabe) SHALL include every matching row, also when there are more than 1000.

#### Scenario: More than 1000 pupils
- **WHEN** more than 1000 pupils exist and an admin opens the pupil list or the assign dialog
- **THEN** all pupils are listed and counted

#### Scenario: More than 1000 staff
- **WHEN** more than 1000 staff members exist and an admin opens the staff list
- **THEN** all staff members are listed and counted

#### Scenario: More than 1000 accepted return protocols
- **WHEN** more than 1000 accepted Rückgabeprotokolle exist
- **THEN** the Rückgabe tab still shows every one whose iPad is still assigned

### Requirement: Pending Übergabe works for any number of assigned iPads
The Übergabe tab SHALL determine its rows without request URLs that grow with the number of assigned iPads.

#### Scenario: Many assigned iPads
- **WHEN** more than 500 iPads are assigned to pupils and an admin opens the Übergabe tab
- **THEN** the tab loads without an error and lists exactly the iPads with accepted terms and no Übergabeprotokoll since the current assignment

### Requirement: Paged loading is deterministic
Loading in pages SHALL use an ordering that is unique per row, so no row is returned twice or skipped.

#### Scenario: Equal sort values
- **WHEN** several pupils have the same last and first name
- **THEN** each of them appears exactly once in the list
