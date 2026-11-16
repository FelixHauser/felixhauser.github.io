## ADDED Requirements

### Requirement: Result line in the section of the export
While a file is prepared and after it was saved, the progress, row count or error message SHALL be shown in the section of the export that was started, not in another section.

#### Scenario: Pupil export
- **WHEN** an admin starts "Als CSV exportieren" in the section "Schüler"
- **THEN** "wird geladen…" and then the number of exported rows appear in the section "Schüler" only
