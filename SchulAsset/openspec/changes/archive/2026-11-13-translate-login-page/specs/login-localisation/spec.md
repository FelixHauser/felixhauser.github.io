## ADDED Requirements

### Requirement: Login page strings follow the selected language
Every user-visible string on `login.html`, including the auto-login message, the forgot-password and new-password sections, and all messages produced by `auth.js`, SHALL be taken from `translations.js` in the selected language (German default, English, Turkish).

#### Scenario: Forgot-password section in English
- **WHEN** the language is English and the user clicks the forgot-password link
- **THEN** the intro text, e-mail label, send button and back link are shown in English

#### Scenario: New-password section in Turkish
- **WHEN** the language is Turkish and the page is opened through a recovery link
- **THEN** the intro text, field label and save button are shown in Turkish

#### Scenario: Auto-login message
- **WHEN** the page is opened with QR parameters `sn` and `pw` and the language is English
- **THEN** the "logging in" message is shown in English

#### Scenario: Validation and result messages
- **WHEN** the user submits the reset form with an empty e-mail, or a too-short new password, or the action succeeds
- **THEN** the message is shown in the selected language

### Requirement: Every login key exists in all languages
Each key in the `login` block of `translations.js` SHALL exist in German, English and Turkish.

#### Scenario: Complete key set
- **WHEN** the key sets of the `login` blocks of `de`, `en` and `tr` are compared
- **THEN** they are identical
