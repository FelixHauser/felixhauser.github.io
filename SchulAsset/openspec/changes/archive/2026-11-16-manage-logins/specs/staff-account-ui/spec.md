## MODIFIED Requirements

### Requirement: Access status on the Lehrkraft pages
The Lehrkraft detail page SHALL show whether the person has a login, which e-mail, and whether it is active or locked. It SHALL offer "Zugang einrichten" (asking for an e-mail) only when there is no login, and, when there is one, "Zugang sperren" or "Zugang entsperren", "Zugang löschen" and "Neues Passwort setzen". The list SHALL show for each Lehrkraft whether there is no login, an active or a locked one.

#### Scenario: Lehrkraft without access
- **WHEN** an admin opens a Lehrkraft without login
- **THEN** the page shows "kein Zugang" and the button "Zugang einrichten"

#### Scenario: Set up access
- **WHEN** the admin enters an e-mail and confirms
- **THEN** a `teacher` login is created and linked, the credentials are shown once, and the page now shows the e-mail

#### Scenario: Lehrkraft with access
- **WHEN** a Lehrkraft has an active login
- **THEN** the page shows the e-mail, "aktiv", and the buttons to lock, delete and set a new password, but no "Zugang einrichten"

#### Scenario: Locked access
- **WHEN** a Lehrkraft's login is locked
- **THEN** the page shows "gesperrt" and offers "Zugang entsperren" instead of "Zugang sperren"
