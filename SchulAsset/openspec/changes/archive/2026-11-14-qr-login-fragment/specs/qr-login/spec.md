## ADDED Requirements

### Requirement: Credentials in the fragment
The link in the QR code and on the printed access card SHALL have the form `<address of login.html>#sn=<serial number>&pw=<password>`, with both values URL-encoded. It SHALL NOT put the serial number or the password in the query string (after `?`).

#### Scenario: New card
- **WHEN** an admin creates or resets an iPad's access and the card is shown
- **THEN** the QR code and the printed link contain `login.html#sn=…&pw=…` and no `?sn=` or `&pw=` query part

#### Scenario: Special characters
- **WHEN** a password contains characters such as `&`, `#`, `+` or a space
- **THEN** the link is encoded so that reading it back yields the exact password

### Requirement: Login from the fragment
When `login.html` is opened with `sn` and `pw` in the fragment, it SHALL hide the login form, show the existing "logging in" message and sign in with `<serial in upper case>@schulasset.local` and the password, then route by role as for a normal login.

#### Scenario: Scan with a valid card
- **WHEN** a pupil scans a new card
- **THEN** they are signed in and sent to the portal without typing anything

#### Scenario: Wrong or outdated password
- **WHEN** the card's password is no longer valid
- **THEN** the normal login form and the existing "invalid credentials" message are shown

### Requirement: Credentials leave the address bar
As soon as the login page has read `sn` and `pw`, it SHALL remove them (query and fragment) from the address bar without reloading and without adding a history entry.

#### Scenario: After a successful login start
- **WHEN** the auto-login starts
- **THEN** the address bar shows only the page address, without the serial number or the password

#### Scenario: After a failed login
- **WHEN** the auto-login fails
- **THEN** the address bar is already clean and no password is pre-filled in the form

### Requirement: Old cards keep working
The login page SHALL also accept the old form `login.html?sn=…&pw=…` and treat it exactly like the fragment form, including removing the values from the address bar.

#### Scenario: Old printed card
- **WHEN** a pupil scans a card printed before this change
- **THEN** they are signed in as before

### Requirement: Password-reset link unaffected
A password-reset link (`#…type=recovery`) SHALL still open the new-password form, and SHALL NOT be cleared by the QR logic.

#### Scenario: Reset mail link
- **WHEN** a user opens the link from a password-reset e-mail
- **THEN** the new-password form is shown as before

### Requirement: Credentials are not sent in the request address
Opening a new-format link SHALL NOT send the serial number or password to the web server in the requested address.

#### Scenario: Network check
- **WHEN** a new-format link is opened with the browser's network tools open
- **THEN** the request for `login.html` has no `sn` or `pw` in its address

### Requirement: Printed address without credentials
The "Webseite" line on the printed access card SHALL show only the address of the login page, without the serial number or the password. The username and password SHALL remain printed on their own lines, and the QR code SHALL carry the full link.

#### Scenario: Card layout
- **WHEN** an access card is printed
- **THEN** the "Webseite" line reads like `https://…/login.html` and the credentials appear only in the Benutzername and Passwort lines and inside the QR code
