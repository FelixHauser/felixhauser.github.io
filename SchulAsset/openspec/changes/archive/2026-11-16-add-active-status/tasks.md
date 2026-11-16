## 1. Database

- [x] 1.1 Write the SQL (`ALTER TABLE public.pupils / public.staff ADD COLUMN is_active boolean NOT NULL DEFAULT true, ADD COLUMN inactive_since date`, the two CHECK constraints from the design, rollback `DROP COLUMN`) into `supabase/db-changes.md`
- [x] 1.2 Run it in the Supabase SQL editor; check that existing rows are active with empty date, that the CHECK constraints refuse contradictions, and that the admin can update both columns

## 2. Detail pages

- [x] 2.1 Shared helper in `admin.js`: `findAssignedIpads(kind, id)` (in the new `views/person-status.js`) (serial numbers of iPads assigned to a pupil/staff) and the refusal message
- [x] 2.2 `views/pupil-detail.js`: status row with toggle; setting inactive opens a small dialog with a date (default today, no future); reactivating clears the date; refuse deactivation while an iPad is assigned; show "nicht mehr an der Schule seit <Datum>"
- [x] 2.3 `views/staff-detail.js`: same, plus the warning when an inactive teacher still has a login
- [x] 2.4 Styles for the "nicht aktiv" badge in `admin.css`

## 3. Lists and picker

- [x] 3.1 `views/pupil-list.js` and `views/staff-list.js`: "Ehemalige anzeigen" check box (default off), `.eq('is_active', true)` when off, "nicht aktiv" mark when on; still through `fetchAllRows`
- [x] 3.2 `views/ipad-detail.js` assign dialog: load only active pupils/staff

## 4. Batch status update

- [x] 4.1 Pure functions in `views/csv-import.js`: parse the `is_active` value and the `inactive_since` date (`yyyy-mm-dd`, `dd.mm.yyyy`; today as default, no future), `validatePupilStatusRows`, `validateStaffStatusRows` (match, ambiguous, duplicate, unchanged, blocked); export for Node
- [x] 4.2 Node tests: value variants, date formats, future/unreadable date, date correction, name-only unique/ambiguous, duplicates, unchanged, blocked by iPad, >1000 existing people
- [x] 4.3 (implemented in the new file `views/status-import.js` with its own small dialog instead of kinds in `CSV_KINDS`, because preview and result differ too much from the create imports) kinds `pupils` and `staff`: fetch existing (with id and `is_active`) and the set of assigned person ids via `fetchAllRows`; templates and format hints; update in small chunks (`is_active` and `inactive_since` together)
- [x] 4.4 Preview shows the counts (deactivate / reactivate / unchanged / not found / ambiguous or duplicate / invalid / blocked) with reasons; result summary; refresh of the open list
- [x] 4.5 `views/admin-panel.js`: the two new entries in "Daten hinzufügen"

## 5. Test and document

- [x] 5.1 (tested by the user 2026-11-16, after archiving: CSV status update incl. blocked row and re-run) Manual test: single toggle, refusal with iPad, lists/filter, picker, CSV leavers list for pupils and staff incl. a re-run, an ambiguous name and a blocked row
- [x] 5.2 `node check-translations.js` (no portal text changed, should stay clean); `./bump-version.sh`
- [x] 5.3 Update `statusquo.md` and `TODO.md` (tick active status; note that `inactive_since` is the start of the retention clock for the export + delete feature)
