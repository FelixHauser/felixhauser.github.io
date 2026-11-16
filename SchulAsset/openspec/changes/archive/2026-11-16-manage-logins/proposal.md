## Why

Teacher and admin logins can be created in the app, but nothing else can be done with them there. To lock a teacher who leaves, reset a forgotten password or remove an old admin, the developer has to go into Supabase Studio. Admin logins are not visible in the app at all. The Lehrkraft page even warns that a former teacher's login "still works and must be removed separately". A person who is no longer at the school should not keep access to the app.

## What Changes

- **New Edge Function `manage-staff-account`** (admin only, deployed by hand like the others) that lists, locks, unlocks, deletes and resets the password of teacher and admin logins, 1–50 per call. iPad portal logins are never touched by it.
- **Lock and delete are separate actions.** Lock is reversible (the person can no longer sign in; nothing is lost). Delete removes the login; the Lehrkraft stays, only the link and the shown e-mail are cleared.
- **Admin sets a new password** for a teacher or admin: a new random password, shown once (same dialog as for new logins).
- **Lehrkräfte detail page:** shows the access as active or locked and offers lock / unlock, delete and set new password.
- **Lehrkräfte list:** sortable columns (name, Kürzel, access, status) and row selection with **batch actions** on the selected rows: lock, unlock, delete login, set new passwords (with the one-time credentials file as for the CSV import).
- **Admins** are e-mail only (not linked to a person): a new page "Admins" in Verwaltung lists them with lock, delete and new password per row.
- **A lock also counts for open sessions:** the lookup functions and the Edge Functions refuse a locked login even if its session token is still valid.
- **Safety rules, enforced on the server:** you cannot lock or delete your own login, and the last active admin cannot be locked or deleted.
- **Not active ⇒ no access:** marking a Lehrkraft as "nicht aktiv" locks their login; reactivating unlocks it. The same applies to the batch status update by CSV. This replaces the earlier rule that the status never touches the login (decision 2026-11-16) and removes the warning text on the detail page.

Not in this change (separate changes, as discussed): a "change my own password" page and forcing a password change at the first login.

## Capabilities

### New Capabilities
- `login-management`: the Edge Function, its actions and safety rules, delete versus lock, password reset by an admin, the Admins page.
- `staff-list-batch`: sorting, selection and batch actions on the Lehrkräfte list.

### Modified Capabilities
- `person-active-status`: replaces "Staff login warning": setting a Lehrkraft inactive locks the login, reactivating unlocks it.
- `admin-status-batch-update`: "Writing and result": the staff CSV status update also locks or unlocks the logins of the people it deactivates or reactivates.
- `staff-account-ui`: "Access status on the Lehrkraft pages": shows active or locked and offers the new actions.

## Impact

- New `supabase/functions/manage-staff-account/index.ts` (deployed by hand in Studio under exactly this name; redeploy after every edit).
- `views/staff-detail.js`, `views/staff-list.js`, `views/person-status.js`, `views/status-import.js`, `views/admin-panel.js`, `admin.js` (router entry and a client helper, like `createStaffAccounts()`), a new view `views/admins.js`, small styles in `admin.css`.
- Database: no new table or column (the locked state is stored by Supabase Auth). The two lookup functions are re-created with a lock check (`supabase/teacher-lookup.sql` PART 1, logged in `db-changes.md`), because a locked login's open session keeps working for up to an hour. The three existing Edge Functions also refuse a locked caller.
- `./bump-version.sh` before the next push; `statusquo.md`, `TODO.md` and `supabase/db-changes.md` (if anything is run by hand) updated at the end.
