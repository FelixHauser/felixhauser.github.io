## ADDED Requirements

### Requirement: New Lehrkraft with optional login
The form "+ Neue Lehrkraft" SHALL have an optional field "E-Mail (Zugang)". Without an e-mail it SHALL create the Lehrkraft as before. With an e-mail it SHALL create the Lehrkraft and a `teacher` login linked to it, and show the credentials once.

#### Scenario: With e-mail
- **WHEN** an admin enters name, Kürzel and an e-mail and confirms
- **THEN** the Lehrkraft and the login exist and a dialog shows the e-mail and the generated password

#### Scenario: Without e-mail
- **WHEN** no e-mail is entered
- **THEN** only the Lehrkraft is created and no dialog with a password appears

#### Scenario: Taken Kürzel
- **WHEN** the Kürzel is already taken
- **THEN** neither the Lehrkraft nor a login is created and the form says so

#### Scenario: Login fails
- **WHEN** the Lehrkraft was created but the login could not be (for example the e-mail is already registered)
- **THEN** the admin is told that the Lehrkraft exists without access and why, and the detail page offers "Zugang einrichten"

### Requirement: Access status on the Lehrkraft pages
The Lehrkraft detail page SHALL show whether the person has a login and which e-mail, and SHALL offer "Zugang einrichten" (asking for an e-mail) only when there is none. The list SHALL mark Lehrkräfte that have a login.

#### Scenario: Lehrkraft without access
- **WHEN** an admin opens a Lehrkraft without login
- **THEN** the page shows "kein Zugang" and the button "Zugang einrichten"

#### Scenario: Set up access
- **WHEN** the admin enters an e-mail and confirms
- **THEN** a `teacher` login is created and linked, the credentials are shown once, and the page now shows the e-mail

#### Scenario: Lehrkraft with access
- **WHEN** a Lehrkraft has a login
- **THEN** the page shows the e-mail and no "Zugang einrichten" button

### Requirement: New admin
A button "+ Neuer Admin" SHALL ask for an e-mail, create a login with the role `admin` (no Lehrkraft row), and show the credentials once. The dialog SHALL state that admins have full access.

#### Scenario: Create an admin
- **WHEN** an admin enters an e-mail and confirms
- **THEN** an `admin` login exists and the dialog shows the e-mail and password

#### Scenario: E-mail already registered
- **WHEN** the e-mail belongs to an existing account
- **THEN** nothing is changed and the dialog says the e-mail is already registered

### Requirement: Credentials are shown once
The credentials dialog SHALL show the e-mail and the password, SHALL say that the password is not stored, and SHALL NOT be reproducible later. All values shown SHALL be HTML-escaped.

#### Scenario: Closing the dialog
- **WHEN** the dialog is closed
- **THEN** the password cannot be displayed again anywhere in the admin area

### Requirement: Neutral wording on the login page
The texts of the password-reset steps on the login page SHALL NOT call the account an "admin" account, in German, English and Turkish.

#### Scenario: Teacher resets a password
- **WHEN** a teacher opens "Passwort vergessen?"
- **THEN** the text asks for "your e-mail address", not for an admin e-mail address
