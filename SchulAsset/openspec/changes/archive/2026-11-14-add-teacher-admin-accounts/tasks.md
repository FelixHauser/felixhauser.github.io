## 1. Database (SQL runs by hand in Supabase Studio; Claude prepares the file)

- [x] 1.1 Write `supabase/staff-accounts.sql`: `ALTER TABLE public.staff ADD COLUMN user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL, ADD COLUMN login_email text;` and `GRANT SELECT, UPDATE ON public.staff TO service_role;`; Marçal runs it in the SQL Editor
- [x] 1.2 Check that an admin can still read and update `staff` as before (open a Lehrkraft in the admin area, edit and save)

## 2. Edge Function `create-staff-account`

- [x] 2.1 Write `supabase/functions/create-staff-account/index.ts` as designed: CORS helper like `create-ipad-account`; caller must be `admin`; 1–50 entries; e-mail normalised and checked, `@schulasset.local` refused, role `teacher`/`admin` only, `staff_id` rules; `createUser` with `email_confirm: true`; existing e-mail refused without changing it; role upsert; link on `staff`; delete the new user if a later step fails; per-entry results; passwords from `crypto.getRandomValues` (12 characters, no look-alikes, groups of four); nothing logged
- [x] 2.2 Marçal pastes the function into Studio → Edge Functions → Deploy (link in `statusquo.md`)
- [x] 2.3 Test from the browser console as admin (`supabase.functions.invoke`): one teacher; one admin; the same e-mail again → refused and the first account unchanged; an `@schulasset.local` address → refused; a batch of three with one duplicate → two created, one error; called as the test teacher → Forbidden; then delete the test accounts in Studio

## 3. Shared admin helpers

- [x] 3.1 `admin.js`: `createStaffAccounts(accounts)` calls the function, shows the function's real error text on failure and returns the per-entry results
- [x] 3.2 `admin.js`: `showCredentialsDialog({ title, rows, note })` — the modal that shows e-mail and password once, with "wird nicht gespeichert", values escaped; closing it leaves nothing behind

## 4. Admin screens

- [x] 4.1 `views/staff-list.js`: field "E-Mail (Zugang)" in "+ Neue Lehrkraft"; staff row first, then the login if an e-mail was given; clear message if the login fails after the Lehrkraft was saved; credentials dialog on success, then open the detail page
- [x] 4.2 `views/staff-list.js`: column "Zugang" in the list (marker if `user_id` is set); `staff` select includes `user_id, login_email`
- [x] 4.3 `views/staff-detail.js`: row "Zugang" (e-mail, or "kein Zugang") and button "Zugang einrichten" for Lehrkräfte without login (e-mail → function with `staff_id` → credentials dialog → page refresh)
- [x] 4.4 `views/staff-list.js` + `staff-list` toolbar: button "+ Neuer Admin" → dialog (e-mail, note that admins have full access) → function with role `admin` → credentials dialog

## 5. CSV import of Lehrkräfte

- [x] 5.1 `views/csv-import.js` staff kind: optional `email` column (still valid without it); e-mail format check; second occurrence of an e-mail in the file = invalid; hint and template (`first_name;last_name;kuerzel;email`) updated
- [x] 5.2 Staff `insertChunk` returns the new ids with their Kürzel; after the staff chunks, create logins in batches of 25 for the rows with an e-mail (through `createStaffAccounts`), collecting passwords and per-row errors
- [x] 5.3 Result dialog: "N Lehrkräfte importiert · M Zugänge angelegt · K nicht angelegt" with reasons; button "Zugangsdaten herunterladen" (`zugangsdaten-lehrkraefte.csv`, UTF-8 with BOM, `;`, columns `email;password;name`) only if at least one login was created, with the warning; passwords kept only in memory and dropped when the dialog closes
- [x] 5.4 Test with a small file: rows with and without e-mail, a duplicate e-mail, an invalid e-mail, an existing Kürzel with an e-mail, and one e-mail that is already registered

## 6. Wording, docs, verification

- [x] 6.1 `translations.js`: neutral `login.forgotIntro` and `login.newPasswordIntro` in DE, EN, TR (no "Admin"); also the German fallback text in `login.html`; `node check-translations.js` still clean
- [x] 6.2 `CLAUDE.md`: roles `admin` / `student` / `teacher` with one line each
- [x] 6.3 `supabase/db-changes.md` (SQL, function deploy and test steps), `statusquo.md` (new function, how it works, the weaker iPad password scheme noted), `TODO.md` (Roles: admin/teacher creation done; remaining admin panel items stay)
- [x] 6.4 Run `./bump-version.sh`; manual test in the browser: "+ Neue Lehrkraft" with and without e-mail, "Zugang einrichten", "+ Neuer Admin", the new admin and a new teacher can log in and land on the right page, CSV with logins and the download, existing admin/teacher/student logins unchanged
- [x] 6.5 Remove the test accounts and test Lehrkräfte; do not commit or push without Marçal's OK
