## Why

The new `teacher` role (lookup page) exists, but the only way to give someone access is by hand: create the user in Supabase Studio, then run an SQL statement. That is fine for a test account, not for a whole staff room, and the same hand work is needed for every new admin. The "Lehrkräfte" list also has a gap: a Lehrkraft there is only a name and a Kürzel (used for iPad ownership) with **no login**, so the existing CSV import creates people who cannot use the lookup page.

## What Changes

- New **Edge Function `create-staff-account`** (admin only, deployed by hand like `create-ipad-account`): creates a login with a generated password and the role `teacher` or `admin`, for one or many e-mail addresses at once. It never touches an existing account (an e-mail that is already registered is refused) and never accepts `@schulasset.local` addresses (those are the iPad portal accounts).
- **Link between a Lehrkraft and a login**: new columns `staff.user_id` (unique, the login) and `staff.login_email` (to show it; the browser cannot read the login table).
- **"+ Neue Lehrkraft"** gets an optional field "E-Mail (Zugang)". With an e-mail it creates the Lehrkraft **and** a `teacher` login and shows the credentials once; without, it works as today.
- **Lehrkraft detail page**: shows whether the person has a login (and which e-mail) and offers "Zugang einrichten" for Lehrkräfte without one (all those already created by CSV). The list gets a small "Zugang" marker.
- **New button "+ Neuer Admin"** (next to "+ Neue Lehrkraft" for now, until the admin panel exists): e-mail → creates an `admin` login and shows the credentials once. No CSV import for admins (decision 2026-11-14: too few).
- **CSV import of Lehrkräfte** (this answers "do we need to revisit the CSV import?" — yes): optional column `email`. Rows with an e-mail also get a `teacher` login. After the import a one-time download `zugangsdaten-lehrkraefte.csv` (e-mail; password; name) lets the admin hand out the passwords; nothing is stored. Rows without an e-mail behave as today. Pupil and iPad imports are unchanged.
- **Login page wording** (DE/EN/TR): the password-reset texts say "Admin" ("Geben Sie Ihre Admin-E-Mail-Adresse ein") and are made neutral, because teachers use them too.
- Docs: `CLAUDE.md` (roles now `admin`/`student`/`teacher`), `statusquo.md`, `TODO.md`, `supabase/db-changes.md`.
- **Not changed:** the lookup page, the student portal and its iPad accounts, the existing Edge Function, RLS policies of other tables. **Not included:** removing or locking an account, resetting a teacher's password from the admin side, a "change password" page, single sign-on, an audit log of account creation (see design).

## Capabilities

### New Capabilities
- `staff-accounts`: the Edge Function and the database link — who may create logins, what it creates, what it refuses, how passwords are generated and returned.
- `staff-account-ui`: the admin screens — "+ Neue Lehrkraft" with e-mail, "Zugang einrichten", the access marker, "+ Neuer Admin", and the one-time credentials display.

### Modified Capabilities
- `admin-pupil-staff-import`: the staff CSV gets the optional `email` column, creates logins, and offers the one-time credentials download.

## Impact

- New: `supabase/functions/create-staff-account/index.ts`, `supabase/staff-accounts.sql`.
- Changed: `views/staff-list.js`, `views/staff-detail.js`, `views/csv-import.js`, `admin.js` (shared helpers), `translations.js` (login wording), `CLAUDE.md`, `statusquo.md`, `TODO.md`, `supabase/db-changes.md`.
- Database, by hand in Supabase Studio: two columns on `staff`, a grant for the Edge Function. The Edge Function is pasted into Studio → Edge Functions (not deployed automatically).
- Security: only admins can call the function; passwords are shown once and never stored; all text shown is escaped.
- No change for existing admin, teacher or student logins.
