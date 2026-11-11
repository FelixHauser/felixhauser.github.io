# admin-ipad-detail Specification

## Purpose

The admin detail pages (iPad, pupil, staff) can be reloaded or opened by link and show the same item; the iPad detail view always shows the saved state after an action, however the action's dialog is closed; and a stale response never overwrites a newer one.

## Requirements

### Requirement: Detail pages survive a reload
The address of an admin detail page SHALL contain the id of the item shown (`#ipad-detail/<id>`, `#pupil-detail/<id>`, `#staff-detail/<id>`), so that reloading the browser, opening a bookmark or following a pasted link shows the same item.

#### Scenario: Reload on the iPad detail page
- **WHEN** an admin is on the detail page of an iPad and reloads the browser
- **THEN** the same iPad's detail page is shown

#### Scenario: Reload on a pupil or staff detail page
- **WHEN** an admin is on a pupil or staff detail page and reloads the browser
- **THEN** the same pupil or staff member's detail page is shown

#### Scenario: Opening a link to an iPad
- **WHEN** a logged-in admin opens the address `#ipad-detail/<id>` in a new tab
- **THEN** the detail page of that iPad is shown

#### Scenario: Opening a detail from a list
- **WHEN** an admin clicks an iPad, pupil or staff row in a list
- **THEN** the address contains the id of the clicked item and the detail page is shown

### Requirement: The address matches the screen
When the router cannot show the requested page, it SHALL show a fallback page and replace the address with the fallback's address, without adding a browser history entry, so that every later click on a list row opens its detail page.

#### Scenario: Detail address without an id
- **WHEN** an admin opens `#ipad-detail` (no id)
- **THEN** the iPad list is shown
- **AND** the address is `#ipads`
- **AND** clicking an iPad in the list opens its detail page

#### Scenario: Unknown address
- **WHEN** an admin opens an address the app does not know
- **THEN** the iPad list is shown and the address is `#ipads`

#### Scenario: Fallback does not trap the Back button
- **WHEN** the router has replaced a broken address with the fallback
- **THEN** the browser's Back button does not return to the broken address

### Requirement: Detail view shows saved state after an action
After an admin action on the iPad detail page has saved its changes, the page SHALL show the saved state (status, assignment, available actions and history) without a manual refresh, regardless of how the action's dialog is closed.

#### Scenario: Assignment with password card closed by "Verstanden"
- **WHEN** an admin assigns an iPad to a pupil and closes the password card with "Verstanden"
- **THEN** the page shows the new assignment, the new status and the new history entry

#### Scenario: Assignment with password card closed by the ✕ button
- **WHEN** an admin assigns an iPad to a pupil and closes the password card with the ✕ button in the header
- **THEN** the page shows the new assignment, the new status and the new history entry

#### Scenario: Page is current while the password card is open
- **WHEN** an admin assigns an iPad to a pupil and the password card is shown
- **THEN** the page behind the dialog already shows the saved assignment

### Requirement: Older responses never overwrite newer ones
When the detail page is rendered more than once in quick succession, only the most recently started render SHALL write to the page.

#### Scenario: Overlapping renders
- **WHEN** a second render starts while a first render is still waiting for data
- **THEN** the page shows the data of the second render, even if the first render's data arrives later

### Requirement: Manual refresh shows changes made elsewhere
The "↻ Aktualisieren" button on the iPad detail page SHALL show the current stored state, including changes made by other sessions (for example a parent accepting the Leihvertrag in the portal), without leaving the page.

#### Scenario: Parent accepts the contract while the teacher has the page open
- **WHEN** a parent accepts the Leihvertrag in the portal (in a separate browser session) while an admin has that iPad's detail page open, and the admin then clicks "↻ Aktualisieren"
- **THEN** the page shows the accepted contract and the actions that depend on it (for example the Übergabeprotokoll action)
