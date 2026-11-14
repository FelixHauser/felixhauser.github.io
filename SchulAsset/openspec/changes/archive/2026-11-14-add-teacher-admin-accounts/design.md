## Context

Today a "Lehrkraft" is a row in `staff` (name, Kürzel, owner of staff iPads) with no login. Logins live in Supabase Auth; the browser can neither create them nor even read the list of users, so creating one needs a server-side function with the `service_role` key. The project already has one: `create-ipad-account` (checks the caller is an admin through the JWT and `user_roles`, creates the user with a generated password, upserts the role, returns the password once). Admin and teacher accounts are created by hand in Studio today.

Decisions already taken (2026-11-14): `+ Neue Lehrkraft` creates people in the `teacher` role; a new "+ Neuer Admin" button; no CSV for admins; the Lehrkräfte CSV optionally creates logins (answer to the question "do we need to revisit the CSV import?"), with a one-time download of the generated passwords.

## Goals / Non-Goals

**Goals:**
- An admin can create `teacher` and `admin` logins from the admin area, one at a time or in bulk through the CSV.
- A Lehrkraft row and its login are linked, so the UI can show who has access.
- Passwords are generated, shown once, never stored; existing accounts can never be changed or taken over by this feature.

**Non-Goals (written down so they are not forgotten):**
- Removing or locking an account when someone leaves (today: delete the user in Studio; the link then clears itself).
- An admin-side "reset password" for teachers and admins, and a "change password" page. Today a forgotten password goes through "Passwort vergessen?" (needs working e-mail sending in Supabase).
- Forcing a password change at the first login (Supabase has no built-in switch).
- Invitation e-mails, single sign-on, a log of who created which account (Supabase's own auth log exists).
- Changing the role of an existing account.

## Decisions

**1. One Edge Function, `create-staff-account`, that accepts a list.**
Request `{ accounts: [{ email, role: 'teacher' | 'admin', staff_id? }] }` (1 to 50 entries). Response `{ results: [{ email, password } | { email, error }] }` with HTTP 200 even when single entries fail, so one bad address does not lose the others. The same function serves the single forms and the CSV. *Alternative:* one function per case, or one request per CSV row — more code, and 300 teachers would mean 300 requests.

For every entry the function: trims and lowercases the e-mail (Supabase lowercases anyway), checks a basic e-mail format, refuses `@schulasset.local` (iPad portal accounts), refuses an unknown role, refuses a `staff_id` that is not a `teacher` entry, does not exist or already has a login. It creates the user (`email_confirm: true`), upserts the `user_roles` row, and for a teacher with `staff_id` sets `staff.user_id` and `staff.login_email`. If any step after the user creation fails, the new user is deleted again, so no half-made account remains.

**2. An existing e-mail is refused, never "reset".**
`create-ipad-account` resets the password of an existing account — right for iPad accounts, dangerous here: it would let an "add teacher" with an admin's address change that admin's password, or turn a student account into something else. This function returns `E-Mail ist bereits registriert` and changes nothing.

**3. Stronger passwords than the iPad scheme, from a secure random source.**
`create-ipad-account` builds `Adjektiv-Nomen-ZZ` with `Math.random` (about 36,000 combinations, not cryptographically random). Teacher and admin accounts see personal data or have full rights, so this function uses `crypto.getRandomValues` and 12 characters from an alphabet without look-alikes (no 0/O, 1/l/I), shown in groups of four, e.g. `K7mP-x3Qz-9TfA`. The iPad function is left alone (separate, noted in `statusquo.md`).

**4. The link: `staff.user_id` and `staff.login_email`.**
`user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL`, `login_email text`. The e-mail is stored on `staff` only to display it. Deleting a login in Studio clears `user_id`, and the page shows "kein Zugang" again (`login_email` is cleared by the UI/function when it sets a new link; a stale value is shown only together with `user_id`). Admin logins have no `staff` row. The function (service role) writes the link; admins already have UPDATE on `staff`. A `GRANT SELECT, UPDATE ON public.staff TO service_role` is added if missing (the same thing was needed for `user_roles`).

**5. UI: staff row first, then the login.**
"+ Neue Lehrkraft" inserts the `staff` row first (the database checks the Kürzel), then, if an e-mail was given, calls the function with the new `staff_id`. If the function fails, the Lehrkraft exists without a login; the message says so and the detail page offers "Zugang einrichten". *Alternative:* create the login first — would leave an orphan login whenever the Kürzel is taken.
One shared helper in `admin.js` calls the function (`supabase.functions.invoke`, showing the function's real error text, as for the iPad accounts) and one shared "Zugangsdaten" dialog shows e-mail and password once, with the sentence that the password is not stored and the user can change it with "Passwort vergessen?". All shown text is escaped.

**6. "+ Neuer Admin" sits next to "+ Neue Lehrkraft".**
A temporary placement, like the other add/import buttons, until the admin panel exists (TODO). It asks only for the e-mail, warns that admins have full access, and creates the `admin` login without a `staff` row.

**7. CSV: optional `email` column, accounts after the rows.**
- Header: `first_name;last_name;kuerzel` stays valid; `email` may be added. Template and hint show the new column.
- Validation: if present, the e-mail must look like an e-mail and must not repeat inside the file (second occurrence = invalid). Whether an e-mail is already registered cannot be known before (the browser cannot read the user list); that is reported by the function per row.
- Rows whose Kürzel exists are skipped as before, **including their e-mail** — an existing Lehrkraft gets a login with "Zugang einrichten", not through a re-import.
- Import: insert the staff chunk (now returning id and Kürzel), then call the function in batches of 25 for the rows with an e-mail. Failures per row are collected; the staff rows stay.
- Result dialog: "N Lehrkräfte importiert · M Zugänge angelegt · K Zugänge nicht angelegt" with the reasons, and — if any password was created — a button "Zugangsdaten herunterladen" (UTF-8 with BOM, `;`-separated: `email;password;name`). The file exists only in the browser until downloaded; the dialog warns to delete it after handing out the passwords.

**8. Login page wording.**
`login.forgotIntro` and `login.newPasswordIntro` mention "Admin" in DE, EN and TR; they become neutral ("Ihre E-Mail-Adresse", "Ihr Konto"). `check-translations.js` must stay clean.

**9. Documentation of roles.**
`CLAUDE.md` says roles are `admin`/`student`; it becomes `admin`/`student`/`teacher` with one line each, since the file steers future work.

## Risks / Trade-offs

- [A misspelled e-mail creates a login nobody can use, and since there is no confirmation mail it is not noticed] → The e-mail is shown back on the credentials dialog; "Zugang einrichten" is not offered for Lehrkräfte that have a login; fixing means deleting the user in Studio (documented). Acceptable at this scale.
- [A file with passwords lies in the Downloads folder] → One-time, only on explicit click, warning in the dialog; passwords are never shown again or stored. The alternative (invitation e-mails) needs school SMTP and was not chosen.
- [An admin can create admins] → By design; the function checks the caller's role on every call.
- [The Edge Function is deployed by hand and the repo copy can drift] → Same as `create-ipad-account`; the deploy step and the test calls are in the tasks and in `statusquo.md`.
- [A batch of 25 sequential user creations takes a few seconds] → Fine for the expected size (≈100 teachers); the dialog shows progress per batch.
- [The existing `create-ipad-account` uses weaker passwords] → Noted, not changed here.

## Migration Plan

1. Run the SQL (columns + grant) in Studio; log it.
2. Paste the Edge Function into Studio → Edge Functions → deploy; test with calls from the browser console as admin (one teacher, one admin, existing e-mail refused, non-admin refused, `@schulasset.local` refused).
3. Ship the UI; test each screen and the CSV with a small file.
4. Rollback: remove the UI changes; delete the function; `ALTER TABLE staff DROP COLUMN user_id, DROP COLUMN login_email` — nothing else depends on them.

## Open Questions

- None blocking. (Later: admin-side password reset and account removal belong to the admin panel work.)
