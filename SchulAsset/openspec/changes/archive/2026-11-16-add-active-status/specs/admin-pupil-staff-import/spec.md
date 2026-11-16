## ADDED Requirements

### Requirement: Imported people are active
People created by the pupil and staff CSV imports SHALL be active. The import formats SHALL stay unchanged (no status column).

#### Scenario: Import creates active people
- **WHEN** an admin imports a valid pupil file
- **THEN** the new pupils are active and appear in the default list and the assign picker
