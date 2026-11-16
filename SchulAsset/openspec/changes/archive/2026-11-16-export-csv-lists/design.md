## Context

Imports exist in `views/csv-import.js` and `views/status-import.js`; the one-time credentials download there already has a safe cell function (`_credCell`: quotes `;" \r \n`, prefixes `'` before `= + - @ \t \r`) and the Blob/BOM download pattern. All list queries above 1000 rows must use `fetchAllRows()` with a unique ordering. The admin panel is a list of sections (`ADMIN_PANEL_SECTIONS`).

## Goals / Non-Goals

**Goals:**
- Three complete, correct downloads, usable in Excel and re-importable (pupils, staff).
- One small, pure, Node-testable CSV builder.

**Non-Goals:**
- No PDF export, no filtered export ("only what the list shows"), no history/protocol/damage exports, no scheduled or automatic exports.
- No export of anything secret (signatures, passwords, e-mails, IP addresses).
- Export + delete of old data (later feature) is separate.

## Decisions

**1. New file `views/csv-export.js`.** Part 1 pure functions: `csvCell(value)` and `buildCsv(columns, rows)` (header line + rows, `\r\n`, BOM added at download). Part 2: `exportPupils()`, `exportStaff()`, `exportIpads()` and a small `_downloadCsv(filename, text)`. Alternative: reuse/extend `csv-import.js` — rejected, it is about importing and already large. `_credCell` keeps its place (the credentials download is unchanged); `csvCell` has the same rules. Making `_credCell` call `csvCell` is a possible tidy-up but not needed.

**2. Everything loaded through `fetchAllRows`**, ordered by name then `id`, from `pupils`, `staff` and `ipads` (with a join on the assigned pupil/staff for the name). Alternative: reuse `window._allPupils` from the list — rejected, the lists hide inactive people and may not be loaded.

**3. Columns mirror the import formats.** Pupil columns are exactly the status-import columns; `is_active` is written as `ja`/`nein`; `inactive_since` as **`yyyy-mm-dd`** (unambiguous and sorts correctly; the status import accepts this and `dd.mm.yyyy`, so the file round-trips even if Excel reformats the date). `address` empty when none. Staff: `kuerzel` first so the file also matches the staff status format. iPads: serial/type/storage as stored, status as the database value (e.g. `in_use`, same as the import's optional column), `assigned_to` = "Nachname, Vorname" (pupil) or "Nachname, Vorname (Kürzel)" (staff). Note: re-importing an iPad export as an import would only skip existing rows; statuses with an assignment are not accepted by the iPad import.

**4. Placement:** section "Daten exportieren" in `ADMIN_PANEL_SECTIONS`, three rows (button style as the others) and a hint that the files contain personal data and should be stored and deleted carefully.

**5. File names:** `schueler-export-YYYY-MM-DD.csv`, `lehrkraefte-export-YYYY-MM-DD.csv`, `ipads-export-YYYY-MM-DD.csv`.

**6. Feedback:** the row shows "Wird geladen…" while loading and the count afterwards ("1 520 Zeilen exportiert"); on error the message is shown.

## Risks / Trade-offs

- [Personal data on the admin's computer] → panel note; only admins reach the panel; nothing secret exported.
- [Excel mangles cells (leading zeros, formulas)] → formula prefix as in the credentials file; serial numbers are text already.
- [Long load for ~1500 rows] → paged queries, a few requests; acceptable.
- [Date as `yyyy-mm-dd` may be shown as a date by Excel] → the importers accept both formats, so it round-trips either way.
