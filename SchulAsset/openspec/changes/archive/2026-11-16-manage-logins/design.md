## Context

`create-staff-account` creates teacher and admin logins with the service role. A Lehrkraft is linked to a login by `staff.user_id` (unique, `ON DELETE SET NULL`) and `staff.login_email` (display only). Admin logins are only in Supabase Auth and `user_roles`. The browser cannot list, lock, delete or change other users' logins, because that needs the service role, so it has to go through an Edge Function. Status changes (`is_active`) are written directly from the browser (`views/person-status.js`) and in chunks by the CSV status update (`views/status-import.js`).

## Goals / Non-Goals

**Goals:**
- Everything an admin needs to do to a teacher or admin login is possible in the app.
- A person who is not active has no access.
- Dangerous mistakes (locking yourself out, losing the last admin) are impossible.
- Batch work for a whole year of departures.

**Non-Goals:**
- Changing one's own password, forced change at first login (separate changes).
- Managing iPad portal logins (they have their own flow).
- Changing a login's role, or changing an e-mail address.
- Linking admins to people.

## Decisions

1. **One new function `manage-staff-account` with an `action` field** (`list`, `lock`, `unlock`, `delete`, `reset_password`), same style as `create-staff-account`: `POST { action, user_ids: [...] }`, 1–50 ids, one result per id, HTTP 200 even when single entries fail. Alternative: one function per action; rejected, it repeats the admin check and the safety rules five times, and every function must be deployed by hand.
2. **Scope is enforced on the server.** The function only acts on users that have a `user_roles` row with role `teacher` or `admin`. It refuses any `@schulasset.local` address and any user without such a role. The caller must be an admin (JWT plus `user_roles`, same check as the other functions).
3. **Safety rules on the server, not only in the UI:** an id equal to the caller is refused for lock and delete; lock and delete are refused if they would leave no active admin (counted over the whole request, so a batch cannot remove them all). Password reset of one's own login is allowed.
4. **Lock = Supabase Auth ban** (`ban_duration` a very long value; unlock = `none`). It is reversible and stored by Supabase, so no database column is needed. `list` reads `banned_until` to show active or locked. Alternative: a `locked` column plus checks in every RLS policy; rejected, too invasive.
5. **A lock does not end an open session, so the sensitive paths check it too.** Spike result (2026-11-16): a locked teacher can no longer sign in, but a window that was already signed in kept working. A ban blocks new sign-ins and refreshing, while an issued access token stays valid until it expires (default 1 hour). Therefore:
   - the two lookup functions (the only access of the `teacher` role) also require that `auth.users.banned_until` is empty or in the past (SQL, `supabase/teacher-lookup.sql`, logged in `db-changes.md`);
   - the three Edge Functions refuse a locked caller with 403 (the user returned by `getUser()` carries `banned_until`);
   - **accepted gap:** a locked admin keeps reading and writing through the table rules (RLS) until the token expires, because rewriting every admin policy is out of proportion for a rare case. Remedy if needed: shorten the JWT expiry in Supabase (Project settings → JWT). Documented in `statusquo.md`.
6. **Delete removes the Auth user.** `user_roles` is removed too; the `staff` row stays, its `user_id` clears itself (`ON DELETE SET NULL`) and the function also clears `login_email`. Nothing else references the login.
7. **List:** `list` returns teacher and admin logins only: `{ user_id, email, role, locked, last_sign_in_at }`. The function takes the ids from `user_roles` (role teacher or admin) and reads those users; it does not hand out the 1700 portal accounts. The browser joins the result to `staff` by `user_id`. The Lehrkräfte list calls it once when it opens. A detail page asks only for its own login (`list` with `user_ids`: one lookup instead of paging through all Auth users, which include the iPad portal logins).
8. **Password reset** uses the same generator as `create-staff-account` (12 characters, `crypto.getRandomValues`), returns the password once, never stores or logs it. The client shows it in the existing credentials dialog; for a batch, it offers the one-time credentials file (`showCredentialsDialog`, formula-safe via `csvCell`).
9. **Not active ⇒ locked, with a fail-safe order.** Deactivating: lock the login first, then write `is_active = false`; if the lock fails nothing is changed and the admin sees the error; if the status write fails afterwards, the person is locked but still active (harmless, and visible in the list). Reactivating: write the status first, then unlock; a failure leaves the person active but locked (harmless). Persons without a login need no call. Alternative: one database trigger; rejected, the lock lives in Supabase Auth, not in our tables.
10. **Reactivation unlocks, without remembering why.** There is only one lock state. A login that an admin locked on purpose and whose person is later reactivated is unlocked; the admin can lock it again. Alternative: remember the reason; rejected, needs a column for a rare case.
11. **CSV status update for staff:** after the status writes of a chunk, the function is called for the affected logins (lock for deactivated, unlock for reactivated), in chunks of 50. The summary shows how many logins were locked or unlocked and which failed. Pupils are unchanged.
12. **Lehrkräfte list:** columns Name, Kürzel, Zugang (kein Zugang / aktiv / gesperrt), Status; click a header to sort, click again to reverse; default sort stays by name. A checkbox per row and "alle sichtbaren auswählen". With a selection a bar shows the count and the actions; each action asks for confirmation with the count and applies only to selected people who have a login. The sorting function is pure and tested in Node.
13. **Admins page** (`#admins`, linked from Verwaltung → Zugänge): table e-mail, role, status, last sign-in, with row actions lock / unlock / delete / new password and the safety rules explained when refused. No batch (few rows).
14. **Texts:** German only (admin area), with "Sie"; names and e-mails go through `escapeHtml()`.

## Risks / Trade-offs

- [A locked or deleted user keeps a valid session for up to an hour] → lookup functions and Edge Functions check the ban; a locked admin's table access runs until the token expires (accepted, documented; shorten the JWT expiry if needed).
- [Deactivation can lock a login the admin still wanted] → the confirmation dialog says that the login will be locked; reactivation unlocks.
- [Last-admin rule counts wrongly with a stale list] → the function recounts active admins itself at request time.
- [The function is not deployed after an edit] → the Systemprüfung already checks reachability of the functions; add this one to its list.
- [Mistake in a batch] → confirmation with count; results per person; lock is reversible, delete asks a second time.

## Migration Plan

0. Re-run PART 1 of `supabase/teacher-lookup.sql` in the SQL editor (adds the lock check to the lookup functions).
1. Deploy `manage-staff-account` by hand in Studio, redeploy `create-ipad-account` and `create-staff-account` (lock check), then add the new one to the Systemprüfung.
2. Deploy the app files. Existing logins keep working; inactive staff with a login stay unlocked until someone acts (an admin can select them in the list sorted by Status and lock them in one batch).
3. Rollback: remove the buttons (revert the commit); locked logins stay locked in Auth until unlocked in Studio.

## Open Questions

- Should the lock also be offered for iPad portal accounts? (Not planned; their flow already resets the password.)
