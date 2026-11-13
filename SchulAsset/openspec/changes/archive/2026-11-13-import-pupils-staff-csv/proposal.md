## Why

Before go-live roughly a thousand pupils and the teaching staff must get into the system. Adding them one by one with "+ Neuer Schüler" / "+ Neue Lehrkraft" is not realistic. The iPad CSV import already works; pupils and staff need the same, in the same dialog.

## What Changes

- The CSV import dialog becomes **one combined dialog** with a choice at the top: **iPads / Schüler / Lehrkräfte**. Each choice has its own fixed format, hint, template download, preview and result summary; the iPad behaviour stays exactly as it is.
- Opening points (temporary, until the admin panel exists): the existing "CSV importieren" button on the iPad list, and new "CSV importieren" buttons on the pupil list and the staff list that open the same dialog with the matching choice preselected.
- **Pupil file:** `first_name;last_name;address` (address optional). A row counts as already existing when first name, last name and address all match an existing pupil (case-insensitive, trimmed); those rows are skipped and listed in the preview, so re-running a file is harmless.
- **Staff file:** `first_name;last_name;kuerzel`. The Kürzel identifies a teacher: a row whose Kürzel already exists (case-insensitive) is skipped.
- Same safety rules as the iPad import: preview before anything is written, per-row reasons for invalid rows, chunked insert, result summary. No history rows (pupils and staff have no history table).
- The CSV parser, the preview/result UI and the chunked insert are shared between the three kinds instead of being copied.

## Capabilities

### New Capabilities
- `admin-pupil-staff-import`: an admin can import many pupils or staff from a CSV file via the combined import dialog, with preview and result summary.

### Modified Capabilities

## Impact

- `views/ipad-import.js` is generalised (renamed to `views/csv-import.js`, loaded from `admin.html`); the pure parser functions stay Node-testable. Buttons added in `views/pupil-list.js` and `views/staff-list.js`; list views re-render after an import.
- Database: the Kürzel of a teacher must be unique, so the database enforces it — a unique index on `upper(kuerzel)` if none exists (check first, clean existing duplicates if any; logged in `supabase/db-changes.md`). The existing "+ Neue Lehrkraft", the staff edit form and the inline "new teacher" in the assign dialog show a clear message when a Kürzel is taken. INSERT policies for `pupils` and `staff` already exist.
- No portal or Edge Function changes. Active / not active status for pupils and staff (see `TODO.md`) is a separate change; imported people are simply created as today.
