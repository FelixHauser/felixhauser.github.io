## ADDED Requirements

### Requirement: Sortable Lehrkräfte list
The Lehrkräfte list SHALL let the admin sort by Name, Kürzel, Zugang (kein Zugang, aktiv, gesperrt) and Status by clicking the column header; clicking again reverses the order. The default order SHALL stay by name. Search and "Ehemalige anzeigen" SHALL keep working together with the sorting.

#### Scenario: Sort by access
- **WHEN** the admin clicks the header "Zugang"
- **THEN** the rows are ordered by access state, and a second click reverses the order

#### Scenario: Sorting with search
- **WHEN** a search text is entered while the list is sorted by Kürzel
- **THEN** only matching rows remain and they stay in Kürzel order

### Requirement: Row selection
Each row SHALL have a check box, and the list SHALL offer to select all currently visible rows. A bar SHALL show how many rows are selected. Selecting SHALL NOT change anything by itself.

#### Scenario: Select all visible
- **WHEN** the admin searches and then selects all visible rows
- **THEN** only the rows currently shown are selected

### Requirement: Batch actions on the selection
With a selection the admin SHALL be able to lock the logins, unlock them, delete them and set new passwords. Each action SHALL apply only to selected people who have a login, SHALL ask for confirmation with the number of logins concerned, SHALL work in chunks of at most 50 and SHALL show a summary of successes and failures per person.

#### Scenario: Lock a selection
- **WHEN** the admin selects 12 former teachers who have a login and confirms "Zugang sperren"
- **THEN** their 12 logins are locked and the list shows them as gesperrt

#### Scenario: Selection includes people without login
- **WHEN** 5 of 12 selected people have no login
- **THEN** the confirmation names 7 logins and the 5 others are ignored

#### Scenario: One failure
- **WHEN** one login cannot be locked
- **THEN** the summary names that person and the reason, and the others are done

### Requirement: Batch passwords as a one-time file
After setting new passwords for several people the dialog SHALL offer a one-time download of the credentials (e-mail, password, name), safe against spreadsheet formulas, kept only in memory and never stored.

#### Scenario: Batch reset
- **WHEN** the admin sets new passwords for 20 teachers
- **THEN** the result dialog offers one file with 20 rows, and closing the dialog discards it
