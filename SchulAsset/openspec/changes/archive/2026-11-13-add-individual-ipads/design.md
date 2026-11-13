## Context

Pupils and staff are added through `_openModal(...)` dialogs (`openNewPupilModal` / `submitNewPupil` in `views/pupil-list.js`) which insert, close the modal and navigate to the detail page. iPads follow the same pattern. `ipads` currently has SELECT and UPDATE grants/policies for admins but, to our knowledge, no INSERT. `ipad_history` is append-only and stores names as text.

## Goals / Non-Goals

**Goals:** add one iPad quickly and safely; keep the audit trail; no duplicate serial numbers.

**Non-Goals:** CSV import (separate change); editing the serial number later; creating the portal account (still happens on first assignment); an assignment at creation time.

## Decisions

- **Same dialog pattern as pupils/staff**, in `views/ipad-list.js`, ids prefixed `ni-`. After saving, navigate with `showIpadDetail(id)`.
- **Fields:** serial number (text), type (`student`/`staff` select), storage (`64gb`/`128gb`/`256gb` select). Defaults: type student, 128gb. Status is always `available`.
- **Serial normalisation:** `trim().toUpperCase()` — the student RLS policies and the portal login compare against the upper-case serial number. Empty serial is rejected.
- **Duplicates:** check the loaded `window._allIpads` first for a friendly message; also handle the database's unique-violation (`23505`) in case the list is stale or the column has a unique constraint. Verify during implementation that `serial_number` is unique in the database; if it is not, add `ALTER TABLE ... ADD CONSTRAINT` and log it in `db-changes.md`.
- **History:** insert one row `event_type: 'status_change'`, `status: 'available'`, `changed_by: _adminName()`, `notes: 'iPad angelegt'`. No new event type, so no constraint changes. Written after the insert; if it fails the error is shown but the iPad stays (same tolerance as other actions).
- **RLS:** `GRANT INSERT ON public.ipads TO authenticated;` plus a policy `FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))`, following the project pattern. Students cannot insert. Run by hand in Supabase and logged in `supabase/db-changes.md`.
- **Leading-zero/format checks** on the serial number are not enforced (formats vary); only non-empty and unique.

## Risks / Trade-offs

- The SQL must be run manually before the feature works → documented as the first task; the dialog shows the database error otherwise.
- Typos in the serial number cannot be fixed in the UI (no edit yet); the iPad can be archived later once that feature exists. Mitigation: dialog shows the normalised serial in the confirmation of the detail page.
