## Context

Single-add (`submitNewIpad`) normalises the serial number (trim, upper case), relies on the unique constraint and the case-insensitive unique index, and writes one history row. The import must do the same for up to a few thousand rows without one request per row. The CSV format is ours to define; no external export is involved.

## Goals / Non-Goals

**Goals:** safe, predictable import of iPads; nothing written before the admin has seen a preview; clear per-row error reasons; re-running the same file is harmless.

**Non-Goals:** pupils/staff import; assigning iPads during import; updating existing iPads; undo.

## Decisions

- **File format (fixed):** UTF-8 text, first line is a header, columns `serial_number;ipad_type;storage_capacity` and an optional fourth column `status`. Separator `;` or `,` is auto-detected from the header line (German Excel exports `;`). Values: type `student` or `staff`; storage `64gb`, `128gb` or `256gb` (case-insensitive; spaces ignored, so `128 GB` works). A UTF-8 BOM and Windows line endings are tolerated; quoted fields are supported by a small own parser (no library — the project uses plain JS and a CDN dependency would add a privacy item).
- **Status:** the purpose of the import is commissioning new iPads, so the default is `available`. If the `status` column exists and a cell is filled, it must be one of the statuses that need no assignment: `available`, `prepared_for_repair`, `shipped_for_repair`, `back_from_repair`, `to_be_erased`, `lost`, `stolen`, `decommissioned`. Statuses that imply an assignment (`in_use`, `terms_pending`, `handover_pending`) and the in-house repair status are rejected as invalid. The history row records the stored status. No Verlustmeldung is created for imported `lost`/`stolen` iPads (accepted for migrating old data).
- **Row validation:** serial trimmed and upper-cased and non-empty; type and storage must be valid values (no silent defaults, so a wrong column is noticed). Invalid rows are listed with row number and reason and are never imported.
- **Duplicates:** (a) within the file — the first occurrence counts, later ones are reported; (b) already in the database — compared case-insensitively against **all** existing serial numbers, fetched in pages of 1000 at preview time (Supabase returns at most 1000 rows per request by default). Duplicates are skipped, not an error, so a re-run only adds what is missing.
- **Preview then confirm:** the dialog shows totals (new / already existing / duplicate in file / invalid) and a table of problem rows (capped at the first 50 with "… and N more"). The confirm button names the number to be imported; it is disabled when nothing is new.
- **Writing:** insert in chunks of 200 rows with `.select('id, serial_number')`, then one bulk insert of `ipad_history` rows for that chunk (`status_change`, stored status, `changed_by: _adminName()`, notes `iPad angelegt (CSV-Import)`). If a chunk fails (e.g. a race with another admin creating the same serial), the import stops, the dialog shows how many iPads were saved before the error and the error text; a re-run continues safely thanks to the duplicate skip. A failed history insert is logged and counted in the summary but does not roll back iPads (same tolerance as single add).
- **Result:** summary "N iPads importiert, M übersprungen, K ungültig"; the iPad list is re-rendered behind it.
- **Template:** a "Vorlage herunterladen" link creates a small CSV (header plus two example rows) in the browser via a Blob — no extra file in the repo.
- **Placement:** button in the iPad list toolbar next to "+ Neues iPad"; new code in its own file `views/ipad-import.js` so moving it into the admin panel later only means changing where the button is.

## Risks / Trade-offs

- Big files: parsing and the preview run in the browser; a few thousand rows are fine. Chunked inserts keep requests small; progress text is updated per chunk.
- `window._allIpads` used by single add comes from a query that is also limited to 1000 rows; beyond 1000 iPads the friendly duplicate check there is incomplete (the database constraint still catches it). Noted for a follow-up, not fixed here.
- Excel on macOS may save "CSV" in a legacy encoding; the dialog states UTF-8 and the preview makes broken characters visible in the serial column.
