## ADDED Requirements

### Requirement: Admin panel view
The admin interface SHALL have a sidebar item "Verwaltung" that opens a view at `#admin`, organised in titled sections. The URL SHALL match the screen, like every other view.

#### Scenario: Opening the panel
- **WHEN** an admin clicks "Verwaltung" in the sidebar
- **THEN** the panel opens, the sidebar item is highlighted and the address ends in `#admin`

#### Scenario: Reload
- **WHEN** an admin reloads the browser on `#admin`
- **THEN** the panel is shown again

### Requirement: Add and import actions live in the panel
The section "Daten hinzufügen" SHALL offer "Neues iPad", "Neuer Schüler", "Neue Lehrkraft" and "Aus CSV importieren" for iPads, Schüler and Lehrkräfte. Each SHALL open the same dialog as before with unchanged behaviour. The section "Zugänge" SHALL offer "Neuer Admin".

#### Scenario: New iPad from the panel
- **WHEN** an admin clicks "Neues iPad" in the panel and saves valid data
- **THEN** the iPad is created and its detail page opens, as before

#### Scenario: CSV import from the panel
- **WHEN** an admin clicks the import action for Schüler
- **THEN** the import dialog opens with the kind Schüler preselected

#### Scenario: New admin from the panel
- **WHEN** an admin clicks "Neuer Admin" and completes the dialog
- **THEN** the admin login is created and the credentials dialog is shown, as before

### Requirement: Lists no longer carry add or import buttons
The iPad, pupil and staff lists SHALL NOT show "+ Neues iPad", "+ Neuer Schüler", "+ Neue Lehrkraft", "+ Neuer Admin" or "CSV importieren". Search, filters and clickable rows SHALL keep working.

#### Scenario: iPad list toolbar
- **WHEN** an admin opens the iPad list
- **THEN** the toolbar has search and filters only, no add or import button

### Requirement: Works on phone and tablet
The panel SHALL be usable at phone width without horizontal page scrolling.

#### Scenario: Narrow screen
- **WHEN** the panel is opened on a phone-width screen
- **THEN** sections stack vertically and all buttons are reachable
