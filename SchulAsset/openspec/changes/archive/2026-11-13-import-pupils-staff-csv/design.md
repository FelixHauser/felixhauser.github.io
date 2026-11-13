## Context

`views/ipad-import.js` has two parts: pure functions (`parseCsv`, `validateIpadRows`, Node-testable) and browser code (dialog, `previewIpadImport`, `runIpadImport`) that is specific to iPads. Pupils and staff need the same flow with different columns, duplicate rules and target tables. Pupils have no unique key; staff have a Kürzel. `fetchAllRows()` pages through tables beyond 1000 rows. The user decided: one combined dialog with a choice, and pupil duplicates = same first name + last name + address.

## Goals / Non-Goals

**Goals:** import pupils and staff safely with the same preview-then-confirm flow; keep the iPad import behaviour unchanged; share code instead of copying it.

**Non-Goals:** assigning iPads during import; an active / not active status (separate change); updating existing records; linking pupils to iPads.

## Decisions

- **Importer definitions.** A small table of "kinds": `ipads`, `pupils`, `staff`, each with: label, hint text, template CSV, required header columns, `validate(rows, existing)`, `fetchExisting()`, `insert(chunk)` and the lists to refresh afterwards. The dialog, preview table, chunk loop and summary are written once and driven by the selected kind. The existing iPad code is moved into the `ipads` kind with its logic untouched (including the history rows).
- **File layout.** Rename `views/ipad-import.js` → `views/csv-import.js` (the generic dialog + all three kinds + the shared pure parser). `admin.html` script tag updated. Node tests `require` it as before (`module.exports` of the pure functions: `parseCsv`, `validateIpadRows`, `validatePupilRows`, `validateStaffRows`).
- **Dialog.** A `<select>` "Was importieren?" (iPads / Schüler / Lehrkräfte) at the top. Changing it clears the file and the preview and swaps hint + template. Entry points call `openCsvImportModal(kind)`; the iPad list button keeps working (`kind = 'ipads'`), pupil and staff list buttons preselect their kind.
- **Pupil format and rules.** Header `first_name;last_name;address`; address optional (empty → `NULL`). First and last name required (trimmed, inner whitespace kept). Existing-match key: `first|last|address` lower-cased and trimmed, where an empty address is its own value; existing pupils fetched with `fetchAllRows()` (unique order: `id`). In-file repeats of the same key are reported as duplicates (first occurrence counts). Two people with the same name but different address are both imported.
- **Staff format and rules.** Header `first_name;last_name;kuerzel`. All three required; Kürzel trimmed, compared case-insensitively, stored as typed (trimmed). Duplicate key = Kürzel (in file and against existing staff). Reason: a Kürzel identifies a teacher at the school, names do not.
- **Database.** A Kürzel identifies a teacher, so uniqueness is a rule of the data, not just of the import: check whether `staff.kuerzel` is unique; if not, add `CREATE UNIQUE INDEX ... ON staff (upper(kuerzel))` — if the existing data already contains duplicates the statement fails and the data must be cleaned first. Log in `supabase/db-changes.md`. All other places that write a Kürzel ("+ Neue Lehrkraft" in `staff-list.js`, the edit form in `staff-detail.js`, the inline new teacher in `ipad-detail.js`) handle the unique-violation (`23505`) with a readable message ("Das Kürzel … ist bereits vergeben."). Pupils get no unique index (no natural key).
- **Writing.** Chunks of 200 via `insert([...])`; stop on the first error and report how many rows were saved; a re-run skips what exists (same behaviour as iPads). No history rows for pupils/staff.
- **After import.** The matching list view is re-rendered if it is currently shown (`renderPupilList()` / `renderStaffList()` / `renderIpadList()`); the pupil/staff lists refresh `window._allPupils` / `window._allStaff` through their normal render.
- **Preview.** Same layout as for iPads: counts new / already existing / duplicate in file / invalid and a table of problem rows (first 50) with reasons.
- **Escaping.** All file content shown in the preview goes through `_htmlEsc` (names come from an untrusted file).

## Risks / Trade-offs

- Refactoring the working iPad import could break it → move the code without changing it, rerun the existing Node tests and repeat the manual iPad import test (re-import of a test file must still report "already exists").
- Pupil match on the address means a typo or an address change creates a second pupil on re-import; accepted (decision by the user) and visible in the preview of the second run.
- Two staff with the same Kürzel in real life would be rejected; unlikely at one school and the preview explains it.
- Names with umlauts require UTF-8 — the dialog says so, as for iPads.
