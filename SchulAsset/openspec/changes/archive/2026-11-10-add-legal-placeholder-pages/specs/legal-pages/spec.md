## ADDED Requirements

### Requirement: Legal pages exist and are public
The system SHALL provide a Datenschutzerklärung page (`datenschutz.html`) and an Impressum page (`impressum.html`) that load without authentication, without contacting Supabase and without loading resources from third-party hosts.

#### Scenario: Visitor opens the Datenschutzerklärung without logging in
- **WHEN** a visitor who is not logged in opens `datenschutz.html`
- **THEN** the page displays the Datenschutzerklärung content
- **AND** no redirect to the login page occurs

#### Scenario: Supabase is unavailable
- **WHEN** a visitor opens `impressum.html` while Supabase is paused or unreachable
- **THEN** the page displays fully and without errors

### Requirement: Legal pages are German only
Each legal page SHALL be written and displayed in German, regardless of the language stored in `localStorage.lang`, and SHALL NOT offer a language switcher. German is the legally binding language.

#### Scenario: UI language is not German
- **WHEN** a visitor whose `localStorage.lang` is `tr` opens `datenschutz.html`
- **THEN** the page content, banner and navigation are shown in German

### Requirement: Placeholder content is clearly marked
While the final legal text has not been supplied, each legal page SHALL display a visible German notice stating that the content is placeholder text and not legally valid, and the content block SHALL carry an HTML comment marking it as placeholder.

#### Scenario: Placeholder notice is visible
- **WHEN** a visitor opens either legal page before the real text has been inserted
- **THEN** a prominent notice above the content states that the text is a placeholder and not legally valid

### Requirement: Legal pages are linked from login and portal
The login page and the pupil portal SHALL show footer links to both legal pages, with link labels in the active UI language (DE, EN or TR).

#### Scenario: Links on the login page
- **WHEN** a visitor views `login.html`
- **THEN** links to the Datenschutzerklärung and the Impressum are visible below the login card, labelled in the active UI language
- **AND** clicking one opens the corresponding German legal page

#### Scenario: Links in the portal
- **WHEN** a logged-in pupil views `portal.html`
- **THEN** footer links to both legal pages are visible, labelled in the active UI language
- **AND** after following one and going back, the pupil is still logged in

#### Scenario: Footer survives portal re-rendering
- **WHEN** the portal re-renders its content after an action
- **THEN** the footer links remain visible

### Requirement: Navigating back from a legal page
Each legal page SHALL offer a back link that returns to the previous page, or to `login.html` if there is no previous page in the history.

#### Scenario: Opened directly
- **WHEN** a visitor opens `impressum.html` directly (no browser history) and clicks the back link
- **THEN** `login.html` is shown
