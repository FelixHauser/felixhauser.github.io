## REMOVED Requirements

### Requirement: Staff login warning
**Reason**: A person who is not active must not keep access to the app, so the status now locks the login (see the added requirement below). The warning that the login "still works" no longer applies.
**Migration**: None; the warning text on the detail page is removed.

## ADDED Requirements

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
