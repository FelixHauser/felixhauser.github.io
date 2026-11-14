## 1. Database (SQL runs by hand in Supabase Studio → SQL Editor; Claude prepares the SQL)

- [x] 1.1 Prepare a small read-only SQL query that shows the type of `user_roles.role` (CHECK constraint or enum), the type of `ipads.id`, and the existing policies on `user_roles`; run it in Studio and read the result
- [x] 1.2 Allow the role value `teacher` — not needed: `user_roles.role` is plain text without a CHECK constraint (found in 1.1); `ipads.id` is `uuid`
- [x] 1.3 Write the SQL for `lookup_ipad(p_serial text)` — `SECURITY DEFINER`, `SET search_path = public`, role check (`teacher`/`admin`), exact case-insensitive match, returns `{ ipad_id, serial_number, owner_name }` or null; `REVOKE` from `PUBLIC`/`anon`, `GRANT EXECUTE` to `authenticated`; run it
- [x] 1.4 Write the SQL for `lookup_ipad_details(p_ipad_id)` returning the object described in the design (ipad, owner, guardian, terms, uebergabe, history, schaden; no signatures/IP/password data), same security setup; run it
- [x] 1.5 Create a test teacher account in Studio (Authentication → add user, e-mail + password) and the `user_roles` row (SQL provided)
- [x] 1.6 Test the functions with real logins via the browser console (`supabase.rpc(...)`): as teacher → works; as student → permission error; direct `supabase.from('ipads').select()` as teacher → no rows; unknown / partial serial → null
- [x] 1.7 Log everything (SQL, how to create a teacher account) in `supabase/db-changes.md`

## 2. Shared escaping helper and the security fix in the admin area

- [x] 2.1 Create `escape-html.js` with `escapeHtml(value)` (`& < > " '`, null/undefined → empty string, numbers → text); load it in `admin.html` before `admin.js`; keep it a pure function so it can be tested in Node
- [x] 2.2 Quick Node test of `escapeHtml` (hostile string, quotes, null, number, umlaut/ampersand stay readable)
- [x] 2.3 Replace `_htmlEsc` in `admin.js` and its users (`csv-import.js`, `pupil-detail.js`, `staff-detail.js`, `person-picker.js`) by `escapeHtml`; remove `_htmlEsc`
- [x] 2.4 Escape the parent-typed text first: `ipad_history` `notes`, `changed_by`, `assigned_to` in `views/ipad-detail.js` (history timeline), `filed_by` in `views/meldungen.js`, `changed_by` in `views/pupil-detail.js`, assigned-to / changed-by in `views/activity.js`
- [x] 2.5 Escape all remaining database text that is put into HTML strings, file by file: `ipad-detail.js` (incl. the password card and protocol/document sections), `meldungen.js`, `ipad-list.js`, `pupil-list.js`, `staff-list.js`, `pupil-detail.js`, `staff-detail.js`, `schnellsuche.js`, `activity.js`, `admin.js` helpers (`assignedName`, `statusBadge` labels); check each template with `grep -F '${'`
- [x] 2.6 Add the rule "database text goes into HTML only through `escapeHtml()`" to "Patterns to follow" in `statusquo.md`
- [x] 2.7 Manual test with a hostile text: file a Schadenmeldung in the portal with description `<img src=x onerror=alert(1)>` and a name-like text `Müller & Söhne <b>fett</b>`; check iPad Verlauf, Pending, Last activity and the pupil history in the admin area — shown as literal text, no alert, normal text (`&`, umlauts, apostrophes) looks normal; then clean up the test report

## 3. Login routing

- [x] 3.1 `auth.js`: add `pageForRole(role)` (`admin` → `admin.html`, `teacher` → `lookup.html`, else `portal.html`) and use it for the password login, the QR auto-login and the end of the password-reset flow
- [x] 3.2 Check that admin and student login still go to their pages

## 4. Lookup page

- [x] 4.1 `lookup.html` + `lookup.css`: header with school logo and "Abmelden", search field, scan button and scan overlay (html5-qrcode 2.3.8 as in `admin.html`), result area; phone first; loads `escape-html.js`; local files carry the `?v=` suffix
- [x] 4.2 `lookup.js`: guard (session + role `teacher` or `admin`, otherwise back to `login.html`), logout; every database value goes through `escapeHtml()`
- [x] 4.3 Step 1: call `lookup_ipad`; show serial number and owner name ("nicht zugewiesen" if none); "nicht gefunden" for no match; Enter key and QR scan trigger the same lookup
- [x] 4.4 Step 2: "Details anzeigen" calls `lookup_ipad_details` only on click; show master data, owner address, guardian (only if present), Leihvertrag date + version or "noch nicht akzeptiert", link "Aktuelle Leihvertrag-Vorlage" (new tab), Übergabeprotokoll as text or "kein Übergabeprotokoll"
- [x] 4.5 "Verlauf" with all entries (newest first) and the Schadenmeldungen (type, description, dates, person responsible, resolved); empty states
- [x] 4.6 "← Neue Suche" clears everything from the page; errors from the functions show a readable German message

## 5. Verification and documentation

- [x] 5.1 Run `./bump-version.sh`
- [x] 5.2 Manual test with the teacher account: login lands on `lookup.html`; scan and typed lookup; name only before the click; details after the click; damage report visible; hostile text from 2.7 shows literally on this page too; no write button anywhere; phone width; student account cannot open the page; admin login unchanged
- [x] 5.3 Update `TODO.md` (Roles: teacher part done, admin panel and the rest stay open) and `statusquo.md` (new page, functions, how to create a teacher account, escaping fix)
- [ ] 5.4 Do not commit or push without Marçal's OK
