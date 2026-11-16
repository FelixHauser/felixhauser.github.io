## Why

Verwaltung has grown to five sections, and the first two ("Daten hinzufügen", "Daten exportieren") mix pupils, teachers and iPads in one long list of near-identical rows ("Neues iPad", "Neuer Schüler", "Schüler aus CSV importieren", "Status Schüler aus CSV aktualisieren", …). To find one action the admin has to read all of them. Grouping by *what* is managed (Schüler, Lehrkräfte, iPads) matches how people think and makes room for more actions per subject later (manage logins, export + delete old data).

## What Changes

- The panel sections "Daten hinzufügen" and "Daten exportieren" are replaced by one section per subject: **Schüler**, **Lehrkräfte**, **iPads**. Each section holds all actions for that subject, in the same order everywhere: new → import from CSV → update status from CSV (pupils, staff only) → export as CSV.
- Rows get a short description line below the label (for example "Aus CSV importieren — mehrere Schüler aus einer Datei anlegen"), and the section titles get an icon, so the panel can be scanned.
- Row labels no longer repeat the subject (the section says it); the dialogs keep their full titles ("Schüler aus CSV importieren", …).
- The export progress / result line moves into each section (next to its export row) instead of one shared line.
- "Zugänge", "Schule" and "Systemprüfung" stay as they are, after the three subject sections.
- No behaviour change: every action opens the same dialog or download as before.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `admin-panel`: the sections are grouped by subject (Schüler, Lehrkräfte, iPads) instead of by kind of action; rows have descriptions; the section names in the "add and import", "status updates" and "export" requirements change.
- `admin-csv-export`: the export entries are found in the subject sections; the result line is shown in the section of the export.

## Impact

- **Code:** `views/admin-panel.js` (section list and row helper), `views/csv-export.js` (status line per section), `admin.css` (description line, section header with icon).
- **Not affected:** dialogs, imports, exports, database, other views.
- Asset version must be bumped before the push.
