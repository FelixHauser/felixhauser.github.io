# admin-person-picker Specification

## Purpose

Choosing a pupil or staff member in the assign dialog works by searching (name, address, Kürzel; case, umlauts and word order ignored) instead of from a long drop-down, with a short result list and a changeable selection.

## Requirements
### Requirement: Search instead of a long drop-down
The "iPad zuweisen" dialog SHALL let the admin choose the pupil or staff member by typing into a search field and tapping a result, instead of choosing from a drop-down of all people.

#### Scenario: Searching by name
- **WHEN** an admin types part of a name
- **THEN** only matching pupils (or staff, depending on the selected type) are listed

#### Scenario: Words in any order
- **WHEN** an admin types "anna müller" and a pupil "Müller, Anna" exists
- **THEN** that pupil is listed, as for "müller anna"

#### Scenario: Umlauts and case
- **WHEN** an admin types "muller" or "MÜLLER"
- **THEN** pupils named "Müller" are listed

#### Scenario: Searching staff by Kürzel
- **WHEN** the type is Lehrkraft and the admin types a Kürzel
- **THEN** the matching staff member is listed

### Requirement: Results tell people apart
Each result SHALL show the person's name and, for pupils the address and for staff the Kürzel, when they exist. A missing value SHALL not be displayed as "null".

#### Scenario: Namesakes
- **WHEN** two pupils have the same name but different addresses
- **THEN** both are listed with their own address

### Requirement: Limited, readable result list
The list SHALL show at most 20 results and tell the admin how many more matches exist; with an empty search field it SHALL show a hint and no people.

#### Scenario: Many matches
- **WHEN** more than 20 people match
- **THEN** 20 are shown with a note that N more exist and the search should be narrowed

#### Scenario: Empty search
- **WHEN** the search field is empty
- **THEN** no person is listed and a hint asks to type a name

### Requirement: Selecting a person
Tapping a result, or pressing Enter in the search field, SHALL select that person (the first result for Enter). The selection SHALL be shown and SHALL be changeable. Assigning SHALL use the selected person; without a selection the dialog asks to select one.

#### Scenario: Select and assign
- **WHEN** an admin selects a pupil and confirms
- **THEN** the iPad is assigned to that pupil exactly as before

#### Scenario: Change the selection
- **WHEN** an admin clicks "Ändern" on the selected person
- **THEN** the selection is cleared and the search field is shown again

#### Scenario: No selection
- **WHEN** an admin confirms without selecting a person
- **THEN** the dialog shows "Bitte eine Person auswählen." and nothing is assigned

#### Scenario: Switching the type
- **WHEN** the admin switches between Schüler/in and Lehrkraft
- **THEN** the search starts empty for the other group and any earlier selection is dropped

### Requirement: Creating a new person still works
The "+ Neu anlegen" option in the assign dialog SHALL keep working as before.

#### Scenario: New person
- **WHEN** an admin chooses "+ Neu anlegen", fills in the fields and confirms
- **THEN** the person is created and the iPad is assigned to them
