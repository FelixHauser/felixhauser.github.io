## 1. Spike and function

- [x] 1.1 Spike (done 2026-11-16: an open session of a locked teacher keeps working; new sign-in is refused; see design decision 5): with a test teacher login, check what a locked (banned) and a deleted user can still do with an already open session (admin pages, `lookup_ipad`), and whether the function can end the session; write the result into `design.md` (decision 5) and decide about the token lifetime
- [x] 1.2 Write `supabase/functions/manage-staff-account/index.ts`: admin check, scope (teacher/admin only, never `@schulasset.local`), actions `list`, `lock`, `unlock`, `delete`, `reset_password`, 1–50 ids, per-entry results, CORS headers on every response
- [x] 1.3 Safety rules in the function: not the caller (lock, delete), never leaving no active admin (counted over the whole call); delete also removes the role and clears `staff.login_email`
- [x] 1.4 Password generator as in `create-staff-account`; passwords never stored or logged
- [x] 1.5 Deploy by hand in Studio under exactly this name (needs the user); test each action and each refusal with test logins

## 2. Client helper and Systemprüfung

- [x] 2.1 Helper in `admin.js` like `createStaffAccounts()`: `manageStaffAccounts(action, userIds)` (chunks of 50, merged results)
- [x] 2.2 Add `manage-staff-account` to the function probe list in `views/admin-panel.js`

## 3. Lehrkraft detail page

- [x] 3.1 Load the login state (active / locked) for the shown Lehrkraft and display it
- [x] 3.2 Buttons "Zugang sperren / entsperren", "Zugang löschen", "Neues Passwort setzen" with confirmation dialogs and the credentials dialog for the new password
- [x] 3.3 Remove the old warning text for inactive staff with a login

## 4. Lehrkräfte list: sorting and batch actions

- [x] 4.1 Pure sort function (Name, Kürzel, Zugang, Status; reversible) with a Node test; clickable headers with an indicator
- [x] 4.2 Access column shows kein Zugang / aktiv / gesperrt (one `list` call when the list opens)
- [x] 4.3 Row check boxes, "alle sichtbaren auswählen", selection bar with count
- [x] 4.4 Batch actions: lock, unlock, delete, new passwords; confirmation with count; chunks; summary with failures; one-time credentials file via `csvCell`

## 5. Admins page

- [x] 5.1 View `views/admins.js` (`#admins`) registered in `admin.js` and `admin.html`; link in Verwaltung → Zugänge
- [x] 5.2 Table with e-mail, status, last sign-in and per-row lock, unlock, delete, new password; refused actions show the reason

## 6. Not active locks the login

- [x] 6.1 `views/person-status.js`: deactivating a Lehrkraft with a login locks first, then saves; reactivating saves, then unlocks; failures as specified
- [x] 6.2 `views/status-import.js`: staff status update locks and unlocks the affected logins in chunks; summary text and failure handling
- [x] 6.3 Update the dialog texts that say the login keeps working

## 7. Verify and document

- [x] 7.1 Manual test with test logins (ZZ…): every action from the list, the detail page and the Admins page; refusals (own login, last admin, portal login); batch of at least 5; deactivate and reactivate by hand and by CSV
- [x] 7.2 `node check-translations.js` still passes; `./bump-version.sh`
- [x] 7.3 Update `statusquo.md`, `TODO.md` ("Manage existing logins" done; remaining: change own password, forced change) and `supabase/db-changes.md` if anything was run by hand

## 8. Lock also applies to open sessions

- [x] 8.1 `supabase/teacher-lookup.sql`: both lookup functions refuse a locked caller; Test D added; entry in `supabase/db-changes.md`
- [x] 8.2 `create-ipad-account`, `create-staff-account`, `manage-staff-account`: 403 for a locked caller
- [x] 8.3 Run PART 1 of `teacher-lookup.sql` in the SQL editor and redeploy the three functions (needs the user)
- [x] 8.4 Test: locked teacher with an open lookup window is refused on the next search; after unlocking it works again; optional: a locked second admin gets 403 from a function
