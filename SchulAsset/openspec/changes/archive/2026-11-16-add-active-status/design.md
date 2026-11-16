## Context

`pupils` and `staff` have no notion of "still at the school". Everyone stays in the lists and in the assign picker forever. The planned "export + delete old data" feature (TODO, Priority 3) and the school-year bulk actions both need it.

Existing building blocks we reuse:
- `views/csv-import.js`: pure parser/validators plus a table of kinds (`CSV_KINDS`) and one generic dialog (preview, chunked write, result). Pupils match on first name + last name + address (`pupilKey`), staff on the unique Kürzel.
- `fetchAllRows()` (admin.js): paging around Supabase's 1000-row limit. Any list that can exceed 1000 rows must use it, ordered by a unique column last, and never use `.in(...)` with long id lists.
- `views/person-picker.js` and the assign dialog in `views/ipad-detail.js` (loads all pupils / staff).
- Admin already has UPDATE rights on `pupils` and `staff` (policies exist), so no new RLS policy is needed.

## Goals / Non-Goals

**Goals:**
- A plain boolean `is_active` (default true) on `pupils` and `staff`, settable one by one and in batch via CSV.
- Inactive people disappear from default lists and from the assign picker, but stay reachable (filter) and keep their history.
- A person with an assigned iPad can never be set inactive (single or batch).

**Non-Goals:**
- No reason for leaving. (The date since when someone is inactive *is* stored, decision 2026-11-16.)
- No locking of staff logins (separate TODO "Manage existing logins"); only a warning on the staff detail page.
- No export/delete of inactive people (later feature).
- No change to the portal or the teacher lookup functions.

## Decisions

**1. Boolean column, default true, not null, plus a date.** `ALTER TABLE … ADD COLUMN is_active boolean NOT NULL DEFAULT true, ADD COLUMN inactive_since date` on both tables, with `CHECK (is_active OR inactive_since IS NOT NULL)` and `CHECK (NOT is_active OR inactive_since IS NULL)` so the two can never contradict each other. `inactive_since` is a `date` (not a timestamp): the 5-year idle period counts in days and the admin may need to set it back to the real last school day. Decision 2026-11-16: the date is needed because the retention clock starts there. Existing rows become active; CSV imports and "+ Neu" forms need no change because the default applies. Alternative (status text with reasons) rejected by the user: no reason needed.

**2. The "no iPad assigned" rule is enforced in the client only.** Before setting inactive, query `ipads` for `assigned_pupil_id` / `assigned_staff_id = id`. For the batch, load all assigned ids once with `fetchAllRows` (`select assigned_pupil_id where not null`) into a Set — no id lists in URLs. Alternative: a database trigger. Rejected for now: the rest of the app also enforces its rules in the client (admin-only users, RLS protects who may write), and a trigger would add a manual DB object to log and rebuild; can be added later if needed.

**3. Reactivating is always allowed**, single and batch (a pupil returns or was set inactive by mistake). It clears `inactive_since`, so a later deactivation starts a new clock. Unchanged rows are reported as "unchanged", not as errors. An already-inactive person whose file row gives a *different* `inactive_since` counts as "will be updated" (date correction); same date or no date column → unchanged.

**3b. Setting the date.** The client always writes `is_active` and `inactive_since` together. Detail page: setting inactive opens a small dialog with a date field (default today, future dates refused). CSV: optional column `inactive_since` (`yyyy-mm-dd` or `dd.mm.yyyy`, as Excel in German produces it); when empty or missing, the day of the import is used; ignored for `ja` rows; a date in the future or unreadable is invalid. No database trigger: one place (client) writes both values, same as the other rules.

**4. Lists: filter, not separate pages.** Pupil and staff lists get a check box "Ehemalige anzeigen" (default off). Off → query adds `.eq('is_active', true)`. On → all rows; inactive rows get a grey "nicht aktiv" badge. The state is kept in a module variable only (resets on reload; acceptable).

**5. Picker shows active people only.** The two queries in the assign dialog get `.eq('is_active', true)`. The picker itself needs no change. The pupil/staff detail page of an inactive person keeps working (history stays readable).

**6. Batch update = a new file `views/status-import.js`** (changed during implementation from "two kinds in `CSV_KINDS`": preview, buckets and result differ too much from the create imports). It has two kinds (pupils, staff), opened from the admin panel next to the other imports, and reuses `parseCsv`, `_csvHeader`, `pupilKey`, `fetchAllRows` and the modal from the existing files. Differences from the create kinds:
- `fetchExisting` returns the people with `id`, identifying fields and `is_active`, plus the Set of ids that still have an iPad.
- Validation maps each row to: **will be updated**, **unchanged** (already has that status), **not found**, **invalid** (bad value, missing columns), **blocked** (would become inactive but has an iPad). The preview shows all five counts with a reason per problem row; the existing generic result shape (`valid / existing / duplicates / invalid`) is reused: `existing` = unchanged, `invalid` carries not-found, invalid and blocked rows with their reason. If the generic preview cannot show the counts under the right names, the kind may supply its own labels.
- Writing = `UPDATE … SET is_active = X WHERE id IN (…)` in chunks, grouped by target value (one `update` per chunk and value). Chunk of ids in `.in()` is kept small (≤ 100 ids; URL length), not the whole file.
- Never creates people.

**7. CSV format of the batch update.**
- Pupils: `first_name;last_name;address;is_active;inactive_since`. `address` is optional: if present the pupil is matched on name + address (as in the create import); if the cell is empty the pupil is matched on first + last name and only if exactly one pupil has that name (otherwise "mehrdeutig – bitte Adresse angeben"). Leaver lists from the school administration often have no address, so this matters.
- Staff: `kuerzel;is_active;inactive_since` (first/last name columns are accepted and ignored). Kürzel matches case-insensitively.
- `is_active` accepts `ja/nein`, `true/false`, `1/0`, `aktiv/nicht aktiv`, case-insensitive; anything else is invalid; an empty cell is invalid (no implicit default in a status file).
- A person listed twice in the file is reported as duplicate (the first row counts).

**8. Unit-testable.** Parsing/validation of the status files are pure functions (same pattern as part 1 of `csv-import.js`) and are tested in Node, including >1000 existing people and ambiguous names.

## Risks / Trade-offs

- [The client check can be bypassed, e.g. with another admin session setting a person inactive just after an iPad was assigned] → the only writers are admins; the detail page shows a warning if an inactive person has an iPad; low impact.
- [Name-only match for pupils picks the wrong pupil] → only used when the name is unique among all pupils; ambiguous names are reported and skipped; the preview lists everything before writing.
- [Wrong `inactive_since` in a file starts the retention clock too early] → the date is shown in the preview (a count per date range is not needed; the list shows each row's date) and the future is refused; the admin can correct the date later with a CSV or on the detail page.
- [A mistaken CSV deactivates many people at once] → the preview shows counts and the list; nothing is written before confirmation; reactivating is the same operation with `ja`.
- [Inactive people hidden from the picker, but an iPad assigned earlier stays] → blocked by decision 2, so cannot happen through the app.
- [Staff with a login become inactive but can still log in to `lookup.html`] → known and out of scope; the detail page warns; handled by "Manage existing logins".

## Migration Plan

1. Run the two `ALTER TABLE` statements in the Supabase SQL editor; log them in `supabase/db-changes.md` (with rollback: `DROP COLUMN is_active`).
2. Deploy code. Existing people are all active, so nothing changes visibly until the first person is set inactive.
3. Rollback: revert the code; the column can stay (harmless) or be dropped.

## Open Questions

None. (The question whether to store `inactive_since` was decided on 2026-11-16: yes, as a `date`.) Not decided here, belongs to the later export + delete feature: how many years the idle period is (default 5) and whether it counts from `inactive_since` exactly.
