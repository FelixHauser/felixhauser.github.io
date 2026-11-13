# admin-ipad-creation Specification

## Purpose

An admin can add a single iPad to the inventory from the admin interface. Serial numbers are stored upper case and are unique; only admins may insert iPads.

## Requirements
### Requirement: Admin can add a single iPad
The admin interface SHALL let an admin create an iPad by entering a serial number, a type (student or staff) and a storage capacity (64 GB, 128 GB or 256 GB). The new iPad SHALL have status `available` and no assigned pupil or staff member.

#### Scenario: Successful creation
- **WHEN** an admin enters a new serial number, chooses type and storage, and saves
- **THEN** the iPad exists with status `available` and no assignment, and its detail page is shown

#### Scenario: First history entry
- **WHEN** an iPad has been created
- **THEN** its history contains an entry stating that the iPad was created, with the admin's name and the time

### Requirement: Serial numbers are normalised and unique
The serial number SHALL be stored trimmed and in upper case, and SHALL be unique across all iPads.

#### Scenario: Normalisation
- **WHEN** an admin enters ` abc123 `
- **THEN** the iPad is stored with serial number `ABC123`

#### Scenario: Duplicate serial number
- **WHEN** an admin enters a serial number that already exists (in any letter case)
- **THEN** no iPad is created and the dialog shows that the serial number already exists

#### Scenario: Missing serial number
- **WHEN** an admin saves with an empty serial number
- **THEN** no iPad is created and the dialog asks for a serial number

### Requirement: Only admins can create iPads
The database SHALL allow inserting into `ipads` only for users with the admin role.

#### Scenario: Student account tries to insert
- **WHEN** a student account attempts to insert a row into `ipads`
- **THEN** the database rejects it
