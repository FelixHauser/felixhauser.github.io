# person-active-status Specification

## Purpose
TBD - created by archiving change add-active-status. Update Purpose after archive.
## Requirements
### Requirement: Active flag on pupils and staff
Every pupil and every staff member SHALL have a boolean `is_active`, stored in the database, `true` by default, and a date `inactive_since` that is set exactly when the person is inactive (the database SHALL refuse an inactive person without date and an active person with one). New people (single form, CSV import) SHALL be created active; existing people SHALL be active after the change.

#### Scenario: New person
- **WHEN** an admin creates a pupil or teacher, single or by CSV
- **THEN** the person is active

#### Scenario: Existing data
- **WHEN** the database change has been applied
- **THEN** all existing pupils and staff are active

### Requirement: Toggle on the detail pages
The pupil and staff detail pages SHALL show the current status ("aktiv" / "nicht mehr an der Schule") and let an admin change it. Reactivating SHALL always be possible.

#### Scenario: Set inactive
- **WHEN** an admin sets a person without an assigned iPad to inactive and confirms the date (default today)
- **THEN** the status and `inactive_since` are saved and the page shows "nicht mehr an der Schule seit <date>"

#### Scenario: Date in the past
- **WHEN** the admin enters the last school day instead of today
- **THEN** that date is saved

#### Scenario: Date in the future
- **WHEN** the admin enters a future date
- **THEN** it is refused with a message

#### Scenario: Reactivate
- **WHEN** an admin sets an inactive person to active
- **THEN** the status is saved, `inactive_since` is cleared, and the person appears in the default lists and the assign picker again

### Requirement: No deactivation while an iPad is assigned
A person who still has an iPad assigned SHALL NOT be set inactive, neither from the detail page nor by CSV. The message SHALL tell the admin to take the iPad back first (Rückgabe, then "Zuweisung aufheben").

#### Scenario: Pupil has an iPad
- **WHEN** an admin tries to set a pupil with an assigned iPad to inactive
- **THEN** nothing is changed and a message names the iPad and what to do first

### Requirement: Inactive people hidden by default
The pupil list and the staff list SHALL show only active people unless the admin ticks "Ehemalige anzeigen". With it ticked, inactive people SHALL be shown with a "nicht aktiv" mark. Search SHALL work on whatever the list currently shows. While inactive people are hidden, the headline with the number of rows SHALL also state how many inactive people are hidden, counting only those who match the current search.

#### Scenario: Default list
- **WHEN** an admin opens the pupil list
- **THEN** inactive pupils are not listed

#### Scenario: Show former
- **WHEN** the admin ticks "Ehemalige anzeigen"
- **THEN** inactive people are listed too, marked "nicht aktiv"

#### Scenario: Detail page of an inactive person
- **WHEN** an admin opens the detail page of an inactive person (e.g. from a history entry)
- **THEN** the page works as before and shows the inactive status

#### Scenario: Hidden people are counted
- **WHEN** 1200 pupils are active, 35 are inactive and the admin has not ticked "Ehemalige anzeigen"
- **THEN** the headline reads "1200 Schüler · 35 ehemalige ausgeblendet"

#### Scenario: Count follows the search
- **WHEN** the admin searches for a name and 2 of the 35 inactive pupils match it
- **THEN** the headline states 2 hidden former pupils, not 35

#### Scenario: Nothing hidden or all shown
- **WHEN** no inactive person is hidden, or "Ehemalige anzeigen" is ticked
- **THEN** the headline shows only the number of rows

### Requirement: Inactive staff have no access
Setting a Lehrkraft to inactive SHALL lock their login if they have one, and reactivating SHALL unlock it. A person without a login SHALL be unaffected. The login SHALL be locked before the status is saved, and unlocked after the status is saved, so that a failure never leaves an inactive person with access.

#### Scenario: Deactivate a teacher with a login
- **WHEN** an admin sets a Lehrkraft with a login to inactive
- **THEN** the login is locked and the status is saved

#### Scenario: Lock fails
- **WHEN** the login cannot be locked while deactivating
- **THEN** the status is not changed and the admin sees why

#### Scenario: Reactivate
- **WHEN** an admin reactivates a Lehrkraft whose login was locked
- **THEN** the status is saved and the login is unlocked

#### Scenario: Teacher without login
- **WHEN** a Lehrkraft without a login is set inactive
- **THEN** only the status changes
