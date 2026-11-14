## ADDED Requirements

### Requirement: One shared escaping function
The project SHALL provide one function `escapeHtml(value)` that converts the characters `&`, `<`, `>`, `"` and `'` into HTML entities and returns an empty string for `null` and `undefined`. It SHALL be available on `admin.html` and `lookup.html`.

#### Scenario: Markup is neutralised
- **WHEN** `escapeHtml('<img src=x onerror=alert(1)>')` is called
- **THEN** the result contains no `<` or `>` and displays as the literal text

#### Scenario: Quotes inside attributes
- **WHEN** a value containing `'` or `"` is placed in an attribute through `escapeHtml`
- **THEN** it cannot end the attribute

#### Scenario: Non-text values
- **WHEN** the value is `null`, `undefined` or a number
- **THEN** the function returns an empty string, or the number as text, and does not throw

### Requirement: Database text is escaped before it is put into HTML
Every value that originates from the database (or from a CSV file) and that the admin pages or the lookup page insert into an HTML string SHALL pass through `escapeHtml`. This SHALL apply first to text typed by parents (history notes, damage and loss descriptions, who filed or accepted, assigned-to and changed-by names) and then to all other database text (names, addresses, serial numbers, Kürzel, protocol fields).

#### Scenario: Hostile damage description in the history
- **WHEN** a parent files a Schadenmeldung with a description containing HTML or script, and an admin opens the iPad's Verlauf
- **THEN** the description is shown as literal text and no script runs

#### Scenario: Other places the text appears
- **WHEN** the same text shows up in the Pending view, the Last activity view, a pupil's history or the lookup page
- **THEN** it is shown as literal text everywhere

#### Scenario: Normal text is unchanged
- **WHEN** a note contains an umlaut, an apostrophe or an ampersand (for example "Müller & Söhne")
- **THEN** it is displayed correctly, not as entity codes

### Requirement: The rule is documented
The rule "database text goes into HTML only through `escapeHtml()`" SHALL be written into the "Patterns to follow" of `statusquo.md`.

#### Scenario: Pattern list
- **WHEN** a developer reads `statusquo.md`
- **THEN** the escaping rule is listed with the other patterns
