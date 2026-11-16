## MODIFIED Requirements

### Requirement: Inactive people hidden by default
The pupil list and the staff list SHALL show only active people unless the admin ticks "Ehemalige anzeigen". With it ticked, inactive people SHALL be shown with a "nicht aktiv" mark. Search SHALL work on whatever the list currently shows. While inactive people are hidden, the headline with the number of rows SHALL also state how many inactive people are hidden, counting only those who match the current search.

#### Scenario: Default list
- **WHEN** an admin opens the pupil list
- **THEN** inactive pupils are not listed

#### Scenario: Show former
- **WHEN** the admin ticks "Ehemalige anzeigen"
- **THEN** inactive people are listed too, marked "nicht aktiv"

#### Scenario: Detail page of an inactive person
- **WHEN** an admin opens the detail page of an inactive person (e.g. from a history entry)
- **THEN** the page works as before and shows the inactive status

#### Scenario: Hidden people are counted
- **WHEN** 1200 pupils are active, 35 are inactive and the admin has not ticked "Ehemalige anzeigen"
- **THEN** the headline reads "1200 Schüler · 35 ehemalige ausgeblendet"

#### Scenario: Count follows the search
- **WHEN** the admin searches for a name and 2 of the 35 inactive pupils match it
- **THEN** the headline states 2 hidden former pupils, not 35

#### Scenario: Nothing hidden or all shown
- **WHEN** no inactive person is hidden, or "Ehemalige anzeigen" is ticked
- **THEN** the headline shows only the number of rows
