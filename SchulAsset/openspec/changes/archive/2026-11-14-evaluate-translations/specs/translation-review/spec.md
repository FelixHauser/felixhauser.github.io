## ADDED Requirements

### Requirement: Review sheet can be generated
The project SHALL provide a script that exports every translation key with its German, English and Turkish text, plus empty comment columns for English and Turkish, as a CSV file a person can open in a spreadsheet program.

#### Scenario: Export all texts
- **WHEN** `node export-translations.js` is run in the SchulAsset folder
- **THEN** a file `translation-review.csv` is written with one row per translation key and the columns key, screen, de, en, tr, comment_en, comment_tr

#### Scenario: Special characters survive
- **WHEN** the file is opened in Excel or Numbers
- **THEN** German umlauts and Turkish letters (ğ, ş, ı, İ, ç, ö, ü) are displayed correctly

#### Scenario: Texts containing separators or line breaks
- **WHEN** a translation contains a semicolon, a quote or a line break
- **THEN** the cell is quoted so that the row keeps its columns

#### Scenario: Context for the reviewer
- **WHEN** a key is used by the code
- **THEN** its row names the file(s) where it is used, so the reviewer can tell what kind of text it is

### Requirement: Export does not alter the application
The export SHALL only read `translations.js` and the code files; the generated sheet SHALL be excluded from version control.

#### Scenario: Repository stays clean
- **WHEN** the export has been run
- **THEN** `git status` shows no new tracked or untracked file apart from changes made on purpose

### Requirement: Shared loading code
The completeness checker and the export SHALL use the same code to load and flatten the translations, so both always see the same keys.

#### Scenario: Checker result unchanged
- **WHEN** `node check-translations.js` is run after the code was moved into the shared module
- **THEN** its output and exit code are the same as before

### Requirement: Texts have been evaluated
Every English and Turkish text SHALL have been checked for correctness, one term per concept, consistent form of address and fit to its place in the interface, and the result SHALL be recorded in a findings file.

#### Scenario: Findings are recorded
- **WHEN** the evaluation is finished
- **THEN** `translation-findings.md` lists each finding with key, language, problem, suggested text and whether it is certain or a suggestion for the native speaker

#### Scenario: Certain errors are fixed
- **WHEN** a finding is graded certain (typo, clear mistranslation, inconsistent term)
- **THEN** the text in `translations.js` is corrected and `node check-translations.js` still reports no errors

#### Scenario: Taste questions are not decided silently
- **WHEN** a finding is only a suggestion
- **THEN** `translations.js` is left unchanged and the question stays in the findings file for the reviewer

### Requirement: Open review is tracked
The native-speaker review SHALL remain an open item in `TODO.md` until a person has reviewed the sheet and the answers are applied.

#### Scenario: Hand-over
- **WHEN** this change is archived
- **THEN** `TODO.md` states that the sheet and the findings are ready and what the reviewer has to do
