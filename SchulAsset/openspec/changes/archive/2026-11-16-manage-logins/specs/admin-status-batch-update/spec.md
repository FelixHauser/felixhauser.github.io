## MODIFIED Requirements

### Requirement: Writing and result
On confirmation the changes SHALL be written in chunks and a summary SHALL be shown (deactivated, reactivated, unchanged, skipped). For staff, the logins of the people who were deactivated SHALL be locked and the logins of those reactivated SHALL be unlocked, in chunks of at most 50, and the summary SHALL state how many logins were locked or unlocked and which failed. If a write fails the update SHALL stop and show how many were saved. A shown list SHALL refresh afterwards without a manual reload.

#### Scenario: Successful update
- **WHEN** the admin confirms a preview with rows to update
- **THEN** the status of exactly those people changes and the summary shows the counts

#### Scenario: Re-running the same file
- **WHEN** the same file is imported again
- **THEN** every valid row is reported as unchanged and nothing is written

#### Scenario: Staff with logins deactivated
- **WHEN** a staff file deactivates 8 Lehrkräfte of whom 6 have a login
- **THEN** the 6 logins are locked and the summary says so

#### Scenario: A lock fails
- **WHEN** one login cannot be locked
- **THEN** that person's status is not changed, the summary names them and the others are done
