# school-config Specification

## Purpose

The school name, Schulträger and logo come from one config file in the project folder, with safe defaults, instead of hardcoded text. They are not stored in the database and not editable in the browser.

## Requirements
### Requirement: School identity in a config file
The app SHALL read the school name (short and long form), the Schulträger and the path of the school logo from one config file in the project folder, `school-config.js`. The file SHALL contain a comment explaining what the installing school has to change. Nothing of this SHALL be stored in the database.

#### Scenario: Defaults
- **WHEN** the config file holds the current values
- **THEN** all pages look exactly as before the change

#### Scenario: Changing the logo
- **WHEN** the developer replaces the logo file (or changes its path in the config) and reloads
- **THEN** the new logo is shown where the old one was

### Requirement: Where the config is used
The configured logo SHALL be shown on the login page, the portal header, the teacher lookup page and the printed access card. The configured long name SHALL be used in their image descriptions and the heading of the printed access card; the configured short name SHALL be used in the `school_name` field of the Leihvertrag PDF. The legal pages SHALL keep their static logo and text.

#### Scenario: New name
- **WHEN** the name in the config is changed
- **THEN** the printed card heading shows the long name and a newly generated Leihvertrag PDF has it in its school name field

#### Scenario: Legal pages
- **WHEN** the config is changed
- **THEN** Datenschutz and Impressum are unchanged

### Requirement: Safe fallback
If the config file is missing, broken or incomplete, every page SHALL still work and show the built-in defaults ("Martin Luther King Schule", "Stadt Marl", `mlks_logo.png`). Configured text SHALL be inserted as text, never as HTML.

#### Scenario: Config missing
- **WHEN** `school-config.js` cannot be loaded
- **THEN** the login page works and shows the default logo and name

#### Scenario: Markup in the name
- **WHEN** the configured name contains `<b>x</b>`
- **THEN** it is displayed as literal text

### Requirement: Read-only display in the panel
The panel section "Schule" SHALL show the configured name, Schulträger and logo preview and a short description of how to change them. It SHALL NOT offer editing or uploading.

#### Scenario: Opening the section
- **WHEN** an admin opens the Verwaltung panel
- **THEN** the "Schule" section shows the values the app is using, without any input fields

### Requirement: Logo check
The Systemprüfung SHALL report whether the configured logo file can be loaded, and name the path if it cannot.

#### Scenario: Wrong path
- **WHEN** the config points to `missing.png`
- **THEN** the check shows a problem naming `missing.png`
