# login-management Specification

## Purpose

Admins can list, lock, unlock, delete and set new passwords for teacher and admin logins through the Edge Function manage-staff-account, with server-side safety rules (never your own login, never the last active admin, never iPad portal logins). A lock also counts for open sessions of the lookup functions and the other Edge Functions.

## Requirements
### Requirement: Admin-only function for teacher and admin logins
The system SHALL provide an Edge Function `manage-staff-account` that lists, locks, unlocks, deletes and sets a new password for logins of the roles `teacher` and `admin`. It SHALL only accept callers that are signed in as admin. It SHALL accept 1 to 50 login ids per call and SHALL return one result per id, with HTTP status 200 even when single entries fail.

#### Scenario: Caller is not an admin
- **WHEN** a teacher or a parent account calls the function
- **THEN** the call is refused and nothing is changed

#### Scenario: One bad entry in a batch
- **WHEN** a call contains 10 ids and one of them does not exist
- **THEN** the other 9 are processed and the result for the missing one says why it failed

#### Scenario: Too many entries
- **WHEN** a call contains more than 50 ids
- **THEN** it is refused as a whole

### Requirement: Only teacher and admin logins
The function SHALL act only on logins that have the role `teacher` or `admin`. It SHALL refuse every address ending in `@schulasset.local` and every login without such a role, so iPad portal logins can never be changed by it.

#### Scenario: Portal login
- **WHEN** an id of an iPad portal login is sent
- **THEN** the entry is refused and the account is unchanged

### Requirement: Locking is reversible and separate from deleting
Locking a login SHALL prevent the person from signing in without removing anything, and unlocking SHALL restore the access. Deleting SHALL remove the login for good. Locking and deleting SHALL be separate actions in the interface.

#### Scenario: Lock and unlock
- **WHEN** an admin locks a teacher's login and later unlocks it
- **THEN** the teacher cannot sign in in between and can sign in again afterwards, with the same password

#### Scenario: Locked login signs in
- **WHEN** a person with a locked login tries to sign in
- **THEN** the sign-in is refused

### Requirement: Delete keeps the Lehrkraft
Deleting the login of a Lehrkraft SHALL remove the login and its role, SHALL clear the link and the shown e-mail on the Lehrkraft, and SHALL keep the Lehrkraft itself.

#### Scenario: Deleted login
- **WHEN** an admin deletes a Lehrkraft's login
- **THEN** the Lehrkraft page shows "kein Zugang" and "Zugang einrichten" is offered again

### Requirement: Safety rules on the server
The function SHALL refuse to lock or delete the login of the calling admin, and SHALL refuse any lock or delete that would leave no active admin, counting all entries of the call together. Setting a new password for one's own login SHALL be allowed.

#### Scenario: Own login
- **WHEN** an admin tries to lock or delete their own login
- **THEN** the entry is refused with an explanation

#### Scenario: Last active admin
- **WHEN** an admin tries to lock the only other active admin while being the one to be removed in the same call
- **THEN** the entries that would leave no active admin are refused

### Requirement: Admin sets a new password
An admin SHALL be able to set a new password for a teacher or admin login. The new password SHALL be 12 random characters, shown once to the admin, and SHALL NOT be stored or logged.

#### Scenario: Reset
- **WHEN** an admin sets a new password for a teacher
- **THEN** the password is shown once, the old password no longer works and the new one does

### Requirement: Listing logins
The function SHALL return the teacher and admin logins with e-mail, role, whether locked and the last sign-in, and SHALL NOT return iPad portal logins or any password data.

#### Scenario: List
- **WHEN** an admin opens a page that shows logins
- **THEN** the list contains teachers and admins only, each marked active or locked

### Requirement: Admins page
Verwaltung SHALL have a page "Admins" that lists all admin logins by e-mail with status and last sign-in, and offers lock, unlock, delete and new password per row. Admin logins are identified by e-mail only and are not linked to a person. Refused actions SHALL show the reason.

#### Scenario: Locking another admin
- **WHEN** there are two active admins and one locks the other
- **THEN** the other admin is shown as locked

#### Scenario: Own row
- **WHEN** an admin looks at their own row
- **THEN** lock and delete are not offered or are refused with a reason

### Requirement: Confirmation for destructive actions
Locking, deleting and setting a new password SHALL ask for confirmation naming the person or the number of people, and deleting SHALL state that it cannot be undone.

#### Scenario: Delete
- **WHEN** an admin chooses "Zugang löschen"
- **THEN** a dialog states that the login will be removed for good and nothing happens until it is confirmed

### Requirement: Systemprüfung knows the function
The Systemprüfung SHALL check that `manage-staff-account` is deployed, like the other functions.

#### Scenario: Not deployed
- **WHEN** the function is missing
- **THEN** the check shows "nicht erreichbar" for it

### Requirement: A locked login is refused promptly
Because an already issued session token stays valid for a while, the lookup functions of the teacher role and the Edge Functions SHALL also refuse a caller whose login is locked.

#### Scenario: Locked teacher with an open session
- **WHEN** a teacher's login is locked while the teacher is signed in on the lookup page
- **THEN** the next lookup is refused

#### Scenario: Locked admin calls an Edge Function
- **WHEN** a locked admin with a still valid token calls `create-staff-account`, `create-ipad-account` or `manage-staff-account`
- **THEN** the call is refused with 403

#### Scenario: Unlocked again
- **WHEN** the login is unlocked
- **THEN** lookups and function calls work again
