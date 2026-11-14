# teacher-lookup Specification

## Purpose

Teachers and repair people look up ONE iPad by serial number on a separate, read-only page (`lookup.html`): the owner's name first, all details only after an extra click, history and Schadenmeldungen behind their own button. Users with the role `teacher` are routed there at login. German only.

## Requirements
### Requirement: Teachers are routed to the lookup page
After a successful login a user with the role `teacher` SHALL be sent to `lookup.html`; `admin` users to `admin.html`; all other users to `portal.html`. This SHALL hold for the password login, the QR auto-login and the end of the password-reset flow.

#### Scenario: Teacher logs in
- **WHEN** a user with role `teacher` logs in with e-mail and password
- **THEN** the browser opens `lookup.html`

#### Scenario: Admin and pupil are unaffected
- **WHEN** an `admin` or a `student` logs in
- **THEN** they land on `admin.html` or `portal.html` as before

#### Scenario: Other roles cannot use the lookup page
- **WHEN** a `student` opens `lookup.html` directly, or nobody is logged in
- **THEN** the user is sent to `login.html`

### Requirement: Look up an iPad by serial number
The lookup page SHALL let the user type a serial number or scan its QR code and SHALL show the serial number and the owner's name of the iPad with exactly that serial number (case-insensitive).

#### Scenario: Known serial number
- **WHEN** the user enters a serial number that exists
- **THEN** the page shows that serial number and the name of the owner

#### Scenario: Scan
- **WHEN** the user scans a QR code containing a serial number
- **THEN** the same lookup runs as if the number had been typed

#### Scenario: Unknown serial number
- **WHEN** the serial number does not exist
- **THEN** the page says that no iPad was found and shows nothing else

#### Scenario: iPad without owner
- **WHEN** the iPad has no owner
- **THEN** the page shows "nicht zugewiesen" instead of a name, and the details can still be opened

#### Scenario: No lists
- **WHEN** the user uses the page
- **THEN** there is no list of iPads or pupils and no search by name or partial serial number

### Requirement: Private details only after an extra step
Everything except the serial number and the owner's name SHALL be shown only after the user presses "Details anzeigen", and SHALL be requested from the database only then.

#### Scenario: First result
- **WHEN** a lookup succeeds
- **THEN** no address, status, contract or history is visible and none has been loaded

#### Scenario: Show details
- **WHEN** the user presses "Details anzeigen"
- **THEN** the page shows status, type, storage, the owner's address, the guardian's name and address (only if the family entered a different guardian), the Leihvertrag acceptance date and version, a link to the blank Leihvertrag template, the Übergabeprotokoll, and a button "Verlauf anzeigen"

#### Scenario: New search clears the details
- **WHEN** the user starts a new search
- **THEN** the details of the previous iPad are removed from the page

### Requirement: History includes the Schadenmeldungen
The button "Verlauf anzeigen" SHALL reveal the iPad's Schadenmeldungen (type, description, dates, person responsible, whether resolved) and all history entries, newest first.

#### Scenario: iPad with a damage report
- **WHEN** the user presses "Verlauf anzeigen" for an iPad with a Schadenmeldung
- **THEN** the Schadenmeldung is visible with its description and dates

#### Scenario: iPad without history
- **WHEN** the iPad has no history entries
- **THEN** the page says that there is no history

### Requirement: Contract information without signed documents
The page SHALL show whether and when the Leihvertrag was accepted and which version, a link to the blank template in a new tab, and the Übergabeprotokoll as text. It SHALL NOT show or offer signatures or signed documents.

#### Scenario: Contract accepted
- **WHEN** the current assignment has an accepted Leihvertrag
- **THEN** the page shows the acceptance date and the version

#### Scenario: Contract not accepted
- **WHEN** there is none
- **THEN** the page says "Leihvertrag noch nicht akzeptiert"

#### Scenario: Template link
- **WHEN** the user opens the template link
- **THEN** the blank Leihvertrag PDF opens in a new tab, labelled as the current template

#### Scenario: No signed downloads
- **WHEN** the details are shown
- **THEN** there is no button that downloads a signed contract or protocol

### Requirement: The page is read-only and safe to display
The lookup page SHALL contain no action that changes data, and every value coming from the database SHALL be HTML-escaped before it is shown.

#### Scenario: Text with markup
- **WHEN** a history note or damage description contains `<script>` or HTML tags
- **THEN** the text is shown literally and nothing is executed

#### Scenario: Logout
- **WHEN** the user presses "Abmelden"
- **THEN** the session ends and the login page opens

### Requirement: German only, usable on a phone
The lookup page SHALL be in German (like the admin area) and SHALL be usable on a phone-width screen, including the camera scan.

#### Scenario: Phone width
- **WHEN** the page is opened on a phone
- **THEN** all content fits without horizontal scrolling and the scan button works
