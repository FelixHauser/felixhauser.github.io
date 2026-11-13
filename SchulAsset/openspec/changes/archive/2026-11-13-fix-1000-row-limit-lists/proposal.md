## Why

Supabase returns at most 1000 rows per request. The iPad list was fixed with `fetchAllRows()` (`import-ipads-csv`), but other admin screens still use a single query and silently cut off at 1000 rows: pupil list, staff list, the person dropdown in the assign dialog and the Pending (Übergabe/Rückgabe) tabs. With 1000+ pupils this would show wrong or missing data without any error. The Übergabe tab has a second problem: it sends every assigned iPad id in the URL of two `.in(...)` queries, and with hundreds of ids the request URL becomes too long to be accepted.

## What Changes

- Pupil list, staff list and the assign-dialog dropdowns load all rows through `fetchAllRows()`.
- Pending view: the Rückgabe tab and the damage/loss lists load all rows via `fetchAllRows()`; the Übergabe tab no longer sends id lists in the URL — it loads the assigned iPads, the valid terms acceptances and the Übergabeprotokolle in pages and combines them in the browser.
- `fetchAllRows()` is documented to need a stable, unique ordering; queries ordered by a non-unique column get `id` as a second sort key.
- The serial-number fetch in `views/ipad-import.js` reuses `fetchAllRows()` instead of its own loop.
- No database changes.

## Capabilities

### New Capabilities
- `admin-list-completeness`: admin lists, dropdowns and the Pending tabs show all rows, also beyond 1000.

### Modified Capabilities
- `admin-ipad-import`: no requirement change (implementation reuses the helper).

## Impact

- `views/pupil-list.js`, `views/staff-list.js`, `views/ipad-detail.js` (dropdowns), `views/meldungen.js`, `views/ipad-import.js`, comment in `admin.js`.
- No Supabase, Edge Function or portal changes.
- Not changed: queries filtered to one pupil/staff/iPad, Schnellsuche (limit 5), Last activity (limit 50).
