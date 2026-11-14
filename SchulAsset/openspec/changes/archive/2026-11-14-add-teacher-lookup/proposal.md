## Why

Teachers who find an iPad without an owner, and the people who send broken iPads for repair, need to find out quickly whose iPad it is and what is wrong with it. Today only admins can look this up, because the only staff interface is the admin area. Repair people also need the contract data (did the family accept the conditions?) and the owner's address (for the bill). Giving these people admin accounts would let them change everything; giving them read access to the tables would let them list all iPads and all pupils' addresses.

While planning this, a security problem turned up in the admin area: text typed by parents (damage description, police reference, shown through the history notes) is put into the admin pages as HTML without escaping. A parent could type HTML or script into a damage report and it would run in the admin's browser, with the admin's session. Parents should have no way to act on the admin side, so this is fixed in the same change, using the same escaping helper the new lookup page needs.

## What Changes

- New role **`teacher`** in `user_roles`: read-only, for teachers and for repair people (one role for both, decision 2026-11-14).
- New small page **`lookup.html`** (German only, like the admin area), separate from the admin interface so that no admin buttons or write code are loaded:
  - Step 1: type or scan (QR) a serial number → shows the serial number and the **name of the owner only**.
  - Step 2: a button "Details anzeigen" loads and shows the rest: status, type, storage, the owner's address (and the guardian's name and address if the family entered a different one), Leihvertrag accepted on / version, a link to the blank Leihvertrag template, the Übergabeprotokoll (as text), and a "Verlauf" with the full history including the Schadenmeldungen. The private data is not loaded into the page before the button is pressed.
  - No list of iPads, no list of pupils, no way to change anything, no download of signed documents.
- Two new **database functions** (the only thing the `teacher` role may call; it gets no policies on the tables): one looks up an iPad by exact serial number and returns the owner's name; the other returns the details of one iPad.
- **Login routing**: `auth.js` sends `admin` → `admin.html`, `teacher` → `lookup.html`, everyone else → `portal.html` (login, QR auto-login and the end of the password-reset flow).
- Database changes are logged in `supabase/db-changes.md`; a teacher account is created by hand in Supabase Studio (same as admin accounts today).
- **Security fix in the admin area**: one shared function `escapeHtml()` (new file `escape-html.js`, loaded by `admin.html` and `lookup.html`; it also escapes `'`, which the existing `_htmlEsc` does not). Every piece of database text that the admin views put into HTML is escaped with it — first the parent-typed text (history notes, who-filed, assigned/changed-by), then names, addresses, serial numbers and Kürzel in all admin views. The old `_htmlEsc` is replaced by it.
- **Not changed:** the admin interface's behaviour and look, the student portal, existing RLS policies, the Edge Function.

## Capabilities

### New Capabilities
- `teacher-lookup`: the lookup page — S/N entry and QR scan, two-step reveal, what the details show, read-only, German only, role routing at login.
- `teacher-lookup-data`: the database side — the `teacher` role, the two lookup functions, who may call them, what they return and what they never return.
- `admin-output-escaping`: text from the database is HTML-escaped wherever the admin pages and the lookup page insert it into HTML, so stored text can never run as script.

### Modified Capabilities

## Impact

- New files: `lookup.html`, `lookup.js`, `lookup.css`, `escape-html.js`.
- Changed: `admin.html` (loads `escape-html.js`), `admin.js` (old `_htmlEsc` removed) and all `views/*.js` that build HTML from database values, `auth.js` (role routing in three places), `bump-version.sh` run (new local scripts/styles carry the version suffix), `supabase/db-changes.md`, `TODO.md` ("Roles" item), `statusquo.md`.
- Database (done by hand in Supabase Studio, SQL provided): allow the role value `teacher` in `user_roles`; create the two functions; grant execute to authenticated users only.
- No change for existing admin or student users.
- CDN libraries already in use are reused (supabase-js 2.119.0, html5-qrcode 2.3.8), pinned to the same versions.
