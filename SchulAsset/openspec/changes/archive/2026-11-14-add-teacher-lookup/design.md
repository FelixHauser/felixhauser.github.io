## Context

Today `user_roles.role` is `admin` or `student`. `auth.js` sends `admin` to `admin.html` and everybody else to `portal.html`; both pages sign out users of the wrong role. All admin RLS policies check `role = 'admin'`, so a new role has no access to anything by default — writes stay impossible unless a policy is added for it.

The admin pages are not suitable for the new users: the iPad detail page loads signed contracts and pupil addresses and carries 14 action buttons; the lists would show every iPad and pupil. Row-level security cannot hide a single column (the address), so "read policies on the tables" would let the role dump all addresses through the API even if the page never showed them.

Agreed in the exploration (2026-11-14): one read-only role for teachers and repair people; S/N lookup only, no lists; the owner's name first, everything else only after an extra click (so nothing private appears when a teacher looks something up in front of a pupil); repair people need the address (for bills), the contract data, the Übergabeprotokoll and the history with the Schadenmeldung.

## Goals / Non-Goals

**Goals:**
- A teacher can scan or type a S/N and see the owner's name; one click more shows everything a repair person needs.
- The `teacher` role can read exactly one iPad at a time, found by exact S/N, and can write nothing.
- Private data is only fetched after the "Details anzeigen" click.

**Non-Goals:**
- Lists, search by name, or browsing of any kind.
- Changing anything (status, assignment, reports) from the lookup page.
- Downloading signed documents (the signature image is never returned).
- Verlustmeldung records (they appear in the history as an entry only).
- A UI to create teacher accounts (done by hand in Supabase Studio).
- Translating the lookup page (German only, like the admin area).
- Escaping in the student portal (its few admin-typed fields are shown only to the family concerned) and a Content-Security-Policy (the pages use inline `onclick` handlers throughout, so a strict policy would break them; separate project).

## Decisions

**1. Two database functions, no table policies for the role.**
`lookup_ipad(p_serial text)` and `lookup_ipad_details(p_ipad_id <type of ipads.id>)`, both `SECURITY DEFINER` with `SET search_path = public`, returning `jsonb`. The `teacher` role gets **no** SELECT policy on any table, so the REST API returns nothing for it when queried directly. *Alternative:* read policies + the admin pages in a read-only mode — less work, but exposes all rows/addresses and relies on hiding buttons. Rejected.

**2. Role check inside the functions.**
Each function first checks `EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('teacher','admin'))` and raises an error otherwise. `EXECUTE` is revoked from `PUBLIC`/`anon` and granted to `authenticated` only. Admins are allowed too, so the page can be tested with an admin login; admins can read everything anyway. Students are refused.

**3. Step 1 returns the minimum.**
`lookup_ipad` matches `upper(serial_number) = upper(trim(p_serial))` (exact, not substring — unlike Schnellsuche) and returns `{ ipad_id, serial_number, owner_name }` or `null`. `owner_name` is `null` for an iPad without owner ("nicht zugewiesen"); the details can still be opened (an orphan iPad's history is exactly what a repair person may need). Pupil and staff owners are shown the same way (name only).

**4. Step 2 returns everything the page shows — and nothing more.**
`lookup_ipad_details` returns one object:

```
ipad       serial_number, ipad_type, storage_capacity, status, assigned_date
owner      kind ('pupil'|'staff'|null), first_name, last_name, address (pupils only)
guardian   first_name, last_name, address   — from the current terms row, only if entered
terms      accepted_at, terms_version       — current (invalidated_at IS NULL) row, else null
uebergabe  kurzel, condition, maengel, notes, created_at, accepted_at
           — latest created since assigned_date (same rule as the portal), else null
history    ipad_history rows (event_type, status, assigned_to, changed_by, changed_at, notes), newest first
schaden    schadenmeldung rows (damage_type, description, filed_by, filed_at,
           datum_eingetreten, datum_entdeckt, perpetrator, resolved_at), newest first
```

Never returned: `signature_url`, `ip_address`, `portal_password_hash`, auth data, other iPads.

**5. Separate page `lookup.html`, not the admin shell.**
No router, no sidebar, no write code loaded: `lookup.js` contains only the guard, the lookup, the rendering and logout. Reuses `supabase-client.js`, the html5-qrcode scanner (same CDN version as `admin.html`) and the look of `admin.css` where it fits, plus a small `lookup.css`. Phone first (scanning happens on an iPad/phone). State is kept in memory; "← Neue Suche" returns to step 1.

**6. Everything dynamic is HTML-escaped, on the new page and in the admin area.**
History notes and damage descriptions contain text typed by parents. One shared `escapeHtml(value)` in `escape-html.js` (loaded by `admin.html` and `lookup.html` before the other scripts) turns `& < > " '` into entities and turns `null`/`undefined`/numbers into safe strings. `lookup.js` uses it for every value and has no inline handlers that contain data.

In the admin area the existing, rarely used `_htmlEsc` is replaced by it, and every database value that the views put into HTML is wrapped. Order of work: (a) the parent-typed text — `ipad_history.notes`, `changed_by`, `assigned_to`, `filed_by` (ipad-detail, meldungen, pupil-detail, activity); (b) everything else in `views/*.js` (names, addresses, serial numbers, Kürzel, protocol fields). Values that only go into `textContent` or `.value` need no escaping. *Alternative:* escape only the notes — fixes the known hole but leaves the same bug class everywhere else; rejected, since text from CSV imports and admin input has the same shape. *Alternative:* build the DOM with `textContent` instead of HTML strings — safer by construction but a rewrite of the views; rejected for size.

**7. Leihvertrag template = the current blank PDF, labelled as such.**
The link opens `document_templates/Leihvertrag_2.1_fillable.pdf` in a new tab. It is the *current* template, not necessarily the version the family accepted: the database records `terms_version: '1.0'` while the file is named 2.1. The label says "Aktuelle Vorlage"; proper version tracking belongs to the open TODO "Editable, versioned Leihvertrag".

**8. Login routing in one helper.**
`auth.js` gets `pageForRole(role)` (`admin` → `admin.html`, `teacher` → `lookup.html`, otherwise `portal.html`) used at all three redirect places: password login, QR auto-login, and the end of the password-reset flow (which today always goes to `admin.html`). `lookup.html` bounces other roles to `login.html`, like the existing guards.

**9. Role value and accounts.**
`teacher` must be allowed in `user_roles.role`. Whether that column is a CHECK constraint or an enum is not visible from the repo; the first task checks it in Studio and the SQL is chosen accordingly. A teacher account is created like an admin account: Supabase Studio → Authentication → add user (real e-mail + password), then one `INSERT INTO user_roles`. The steps are written into `supabase/db-changes.md`.

## Risks / Trade-offs

- [A `teacher` can look up serial numbers one by one] → Accepted: each lookup shows only one iPad; there is no list and no substring search. Serial numbers are not guessable in bulk by accident, and the people holding the role are staff.
- [Parent-typed text rendered in the page] → Escaped everywhere on the new page and in the admin area (decision 6).
- [A missed spot in the admin views stays vulnerable, or a double-escaped value shows `&amp;`] → Systematic pass file by file with `grep` for `${` inside HTML templates, plus a manual test with a hostile damage description (`<img src=x onerror=...>`) through every place where it can appear (iPad Verlauf, Pending, Last activity, lookup page). Rule added to `statusquo.md` "Patterns to follow": database text goes into HTML only through `escapeHtml()`.
- [Unknown column type of `ipads.id`] → Task 1 checks it; the function parameter uses the same type.
- [Functions are SQL that lives only in Supabase] → Logged in `supabase/db-changes.md` like every manual change, and included in the later schema export.
- [Shoulder surfing] → Step 1 shows the name only; the details need a deliberate click and are fetched only then. The page does not remember details after "Neue Suche".
- [The Edge/REST API still lets a logged-in teacher call the two functions directly] → That is the intended maximum: one iPad per call, same data as the page.

## Migration Plan

1. Check the `user_roles` constraint in Studio; allow `teacher`.
2. Create the two functions (SQL from the tasks) and grant execute.
3. Test the functions as admin, as teacher and as student in Studio / the browser.
4. Add the page and the routing; test with a teacher account.
5. Rollback: delete `lookup.html`/`lookup.js`/`lookup.css`, revert `auth.js`, `DROP FUNCTION` both functions; nothing else depends on them.

## Open Questions

- The template shown is the current one, not the one signed (decision 7) — resolved later by the versioned-Leihvertrag work.
