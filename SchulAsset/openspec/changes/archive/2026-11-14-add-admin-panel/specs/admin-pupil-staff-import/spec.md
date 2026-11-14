## MODIFIED Requirements

### Requirement: Combined import dialog
The CSV import dialog SHALL be opened for one fixed kind of data — iPads, pupils or staff — chosen by the admin in the admin panel (Verwaltung). The dialog SHALL NOT offer a way to change the kind; its title SHALL name the kind (e.g. "Schüler aus CSV importieren") and it SHALL show the format hint and template download of that kind. To import another kind the admin closes the dialog and chooses the other entry in the panel.

#### Scenario: Kind fixed by the panel entry
- **WHEN** an admin clicks "Schüler aus CSV importieren" in the panel
- **THEN** the dialog opens with the title "Schüler aus CSV importieren", the pupil format hint, and no control to switch to another kind

#### Scenario: Other kind
- **WHEN** an admin wants to import iPads after opening the pupil dialog
- **THEN** they close it and click "iPads aus CSV importieren" in the panel, which opens a fresh dialog for iPads

#### Scenario: iPad import unchanged
- **WHEN** an admin imports iPads through the dialog
- **THEN** it behaves exactly as before (preview, optional status column, history entries)
