## Why

The admin can import pupils, staff and iPads and update the active status from CSV files, but there is no way to get the data back out. For the status update (Moodle style) the admin needs a current list to edit in Excel and import again; for inventory and the Stadt Marl (who owns the iPads) a list of who has which iPad is needed (TODO, Priority 4 "Exports").

## What Changes

- New section **"Daten exportieren"** in the admin panel (Verwaltung) with three downloads: pupils, staff, iPads.
- Each download contains **all** rows (including inactive people), not just what a list currently shows, and works above 1000 rows.
- Pupils: `first_name;last_name;address;is_active;inactive_since` — the same columns as the status import, with `is_active` as `ja`/`nein`, so the file can be edited and imported again.
- Staff: `kuerzel;first_name;last_name;is_active;inactive_since` — no login data, no e-mail, no passwords.
- iPads: `serial_number;ipad_type;storage_capacity;status;assigned_to` (the owner's name, empty when free), for inventory lists.
- File format: UTF-8 with BOM (Excel opens umlauts correctly), `;` separator, fields quoted when needed, and made safe against spreadsheet formulas.
- The status import dialog hints that the export file can be edited and imported again.

## Capabilities

### New Capabilities
- `admin-csv-export`: the three downloads, their columns, completeness and file format.

### Modified Capabilities
- `admin-panel`: new section "Daten exportieren".
- `admin-status-batch-update`: the hint in the dialog mentions the export.

## Impact

- **Code:** new `views/csv-export.js` (pure CSV building + the three download functions), `views/admin-panel.js` (new section), `views/status-import.js` (hint text), `admin.html` (script tag).
- **Database:** none. Reading only, admin policies already allow it.
- **Privacy:** the files contain personal data (names, addresses) and are saved to the admin's computer; the panel says so. No export of signatures, passwords, login e-mails or history.
- Asset version must be bumped before the push.
