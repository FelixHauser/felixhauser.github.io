# portal-localisation Specification

## Purpose

The main screen of the student portal follows the selected language (German default, English, Turkish): all visible texts, the date format, and a live update when the language is switched. The Leihvertrag text and the generated PDFs stay German.

## Requirements
### Requirement: Main portal screen follows the selected language
All visible texts of the student portal main screen SHALL be shown in the language selected by the user (German, English or Turkish): the greeting, iPad detail rows, the step titles, subtitles and buttons, the problem-report block and error messages.

#### Scenario: Turkish parent opens the portal
- **WHEN** the language is set to Turkish and the main screen is shown
- **THEN** no German text remains on the main screen, apart from the Leihvertrag contract text and generated PDFs

#### Scenario: German stays unchanged
- **WHEN** the language is German
- **THEN** the main screen shows the same texts as before this change

### Requirement: Language switch updates the open page
Switching the language on the portal SHALL update the main screen immediately without reloading the page.

#### Scenario: Switching while logged in
- **WHEN** the user taps another language button
- **THEN** the greeting, steps and buttons change to that language at once

### Requirement: Dates follow the language
Dates on the portal SHALL be formatted with the locale of the selected language.

#### Scenario: Acceptance date in English
- **WHEN** the language is English and a step shows an acceptance date
- **THEN** the date uses the English (en-GB) format

### Requirement: No unused portal translation keys
Every portal translation key defined in `translations.js` SHALL be used by the code.

#### Scenario: Check script is clean
- **WHEN** `node check-translations.js` is run
- **THEN** it reports no errors and no "defined but never used" warnings for `portal.*` keys
