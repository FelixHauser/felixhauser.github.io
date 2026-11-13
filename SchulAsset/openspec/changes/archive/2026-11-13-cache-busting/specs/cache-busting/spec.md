## ADDED Requirements

### Requirement: Local assets carry a version suffix
Every local script and stylesheet referenced from an HTML page SHALL be requested with a `?v=<version>` suffix, and all pages SHALL use the same version value.

#### Scenario: Pages reference versioned files
- **WHEN** any of `login.html`, `portal.html`, `admin.html`, `datenschutz.html` or `impressum.html` is opened
- **THEN** each local `<script src>` and `<link rel="stylesheet">` URL ends in `?v=` followed by the current version

#### Scenario: External libraries are unchanged
- **WHEN** a page references a CDN library
- **THEN** its URL is not modified by the version suffix

### Requirement: One-step version update
The project SHALL provide a script that updates the version suffix in all pages at once.

#### Scenario: Bumping the version
- **WHEN** the developer runs `bump-version.sh`
- **THEN** all local asset references in all pages receive the same new version value and the script lists what changed

#### Scenario: Running it twice on the same day
- **WHEN** the script is run again on the same day without an argument
- **THEN** the counter part of the version increases so the value differs from the previous one
