# translation-check Specification

## Purpose

An automated check that the DE/EN/TR translations are complete and consistent, and that every translation key used in the code is defined.

## Requirements
### Requirement: Translation completeness check
The project SHALL provide a script `check-translations.js` that compares the German, English and Turkish translations and reports every inconsistency.

#### Scenario: Key missing in a language
- **WHEN** a key exists in German but not in English or Turkish
- **THEN** the script reports the key and language as an error and exits with a non-zero code

#### Scenario: Empty translation
- **WHEN** a translation value is an empty string
- **THEN** the script reports it as an error

#### Scenario: Placeholder mismatch
- **WHEN** the placeholders (such as `{name}`) in a text differ between languages
- **THEN** the script reports the key as an error

#### Scenario: All complete
- **WHEN** all three languages define the same keys with non-empty texts
- **THEN** the script prints a success message and exits with code 0

### Requirement: Keys used in code are defined
The script SHALL scan the HTML and JavaScript files for translation keys and compare them with the German definitions.

#### Scenario: Used but undefined key
- **WHEN** a page uses `data-i18n`, `data-i18n-placeholder` or `t('key')` with a key not defined in German
- **THEN** the script reports the key and file as an error

#### Scenario: Defined but unused key
- **WHEN** a key is defined but never referenced
- **THEN** the script lists it as a warning that does not change the exit code

#### Scenario: Dynamic key
- **WHEN** `t(` is called with a non-literal argument
- **THEN** the script warns that the key cannot be checked
