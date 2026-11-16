## Why

Pupils and staff who leave the school stay in every list and in the "iPad zuweisen" picker forever, which gets worse with 1000+ pupils and every school year. There is also no way to tell who is still at the school, and the planned "export and delete old data" feature needs exactly that information. Updating hundreds of leavers one by one is not realistic, so the admin also needs a batch update from a CSV file (as Moodle does it).

## What Changes

- New columns on `pupils` and `staff`: `is_active boolean not null default true` (plain yes/no, no reason) and `inactive_since date` (null while active). The date is the start of the idle period for the later "export + delete old data" feature.
- Pupil and staff detail pages: an "aktiv / nicht mehr an der Schule" toggle. Setting inactive asks for the date since when (default today, can be set back, e.g. to the last school day); reactivating clears it.
- Setting someone inactive is **refused** while an iPad is still assigned to them (the admin does the Rückgabe / "Zuweisung aufheben" first).
- Pupil and staff lists hide inactive people by default; a filter ("Ehemalige anzeigen") shows them again; inactive rows are marked.
- The person picker in "iPad zuweisen" offers only active people.
- **Batch status update by CSV:** the admin prepares a file with the person's identifying columns plus `is_active` (`ja`/`nein`, also `1`/`0`, `true`/`false`) and an optional `inactive_since` date (default: the day of the import); the import matches existing people, shows a preview (will be updated / unchanged / not found / invalid / blocked because an iPad is assigned) and writes only after confirmation. It never creates people.
- Existing CSV imports (pupils, staff) create people as active; their format is unchanged.
- Staff logins are not touched (locking a login stays in "Manage existing logins"); the staff detail page only warns that a login still exists.

## Capabilities

### New Capabilities
- `person-active-status`: the `is_active` flag on pupils and staff, the toggle, the "no iPad assigned" rule, and hiding inactive people in lists and the person picker.
- `admin-status-batch-update`: the CSV batch update of the active status (format, matching, preview, result).

### Modified Capabilities
- `admin-panel`: new entries "Status Schüler aus CSV aktualisieren" and "Status Lehrkräfte aus CSV aktualisieren" in the section "Daten hinzufügen".
- `admin-person-picker`: lists only active people.
- `admin-pupil-staff-import`: new people are created active (no format change).

## Impact

- **Database:** two `ALTER TABLE … ADD COLUMN` (two columns each); no new policy needed (admin UPDATE on both tables already exists). SQL logged in `supabase/db-changes.md`. Existing rows become active.
- **Code:** `views/pupil-list.js`, `views/staff-list.js`, `views/pupil-detail.js`, `views/staff-detail.js`, `views/ipad-detail.js` (assign picker queries), `views/csv-import.js` (new update kinds), `views/admin-panel.js`, `admin.css`, `admin.js` if shared helpers are needed.
- **Not affected:** the portal and the teacher lookup (`lookup_ipad*` functions keep showing owners regardless of status).
- **Later features that build on it:** export + delete of old data, school-year bulk actions.
- No change to the Edge Functions. Asset version must be bumped before the push.
