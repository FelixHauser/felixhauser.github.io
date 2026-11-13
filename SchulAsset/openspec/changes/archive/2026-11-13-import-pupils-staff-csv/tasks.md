## 1. Database check

- [x] 1.1 Check in Supabase whether `staff.kuerzel` is unique (constraint/index) and whether current staff data has duplicate Kürzel; if no case-insensitive unique index exists, create `CREATE UNIQUE INDEX` on `upper(kuerzel)` (clean existing duplicates first) — SQL given by Claude, run by the user
- [x] 1.2 Log the SQL (and the result of the check) in `supabase/db-changes.md`

## 2. Refactor to a generic import

- [x] 2.1 Rename `views/ipad-import.js` → `views/csv-import.js`; update the script tag in `admin.html`
- [x] 2.2 Define the "kinds" table (`ipads`, `pupils`, `staff`); move the iPad logic into the `ipads` kind unchanged
- [x] 2.3 Generic dialog with the kind selector, preview, chunked insert and result summary driven by the selected kind; entry point `openCsvImportModal(kind)`
- [x] 2.4 Re-run the existing iPad parser tests (Node) and the existing import entry (`openIpadImportModal` still works from the iPad list)

## 3. Pupils and staff

- [x] 3.1 `validatePupilRows()` (names required, optional address, key `first|last|address`) and fetch of existing pupils via `fetchAllRows()`
- [x] 3.2 `validateStaffRows()` (all three columns required, key Kürzel) and fetch of existing staff
- [x] 3.3 Templates and format hints for both kinds; "CSV importieren" buttons on `views/pupil-list.js` and `views/staff-list.js`
- [x] 3.4 Re-render the matching list after an import
- [x] 3.5 Handle the unique violation (`23505`) with "Das Kürzel … ist bereits vergeben." in `staff-list.js` (new teacher), `staff-detail.js` (edit) and `ipad-detail.js` (inline new teacher)

## 4. Verification

- [x] 4.1 Node tests for both validators (BOM, CRLF, quotes, `;`/`,`, empty address, same name different address, in-file duplicates, Kürzel in different case, missing columns)
- [x] 4.2 Manual test (incl. a taken Kürzel in "+ Neue Lehrkraft" and in the edit form): import a small pupil file and a small staff file; re-import (all skipped); bad rows; lists refresh; iPad import still works (re-import of a small iPad file reports "already exists")
- [x] 4.3 Large pupil file (~1500 generated rows, names prefixed `ZZ`), re-import reports all existing; delete the test data afterwards
- [x] 4.4 Move the TODO item to Done, update `statusquo.md` and the `CLAUDE.md`/docs mentions of the import if needed
