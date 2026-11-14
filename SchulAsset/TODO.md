# SchulAsset — To-do list to full operation

Created: 2026-11-09 · Decision: **stay on Supabase (Frankfurt)**

**Layout:** open items first (by priority), finished items collected under **✅ Done** at the end of the file. When an item is finished, move it down.

---

# 🔲 Pending

## Priority 1 — Protect what exists (cheap, do first)

- [ ]  **Export the database schema into the repo** — tables, RLS policies, triggers and grants currently exist only inside Supabase. Save as SQL (e.g. `supabase/schema.sql`) so the database can be rebuilt at any time.
  - Also include everything logged in `supabase/db-changes.md` (manual changes made so far), the `auth.users` triggers, and the Auth settings (signups off, email confirmation off)
  - Verify by building an empty second Supabase project from the file and checking the app works against it
  - Planned for late in the project; until then, log every manual database change in `supabase/db-changes.md`

## Priority 2 — Blockers before going live

### Getting real data in (part of the admin panel, see Priority 3)
- [ ]  **Remove the dummy data before go-live** — incl. the `ZZ…` test iPads from the import tests if still present

## Priority 3 — Administration side
- [ ]  **Roles** (decision 2026-11-13) — three roles in `user_roles`:
  - `student` — unchanged: parent/pupil portal, sees only their own iPad
  - `teacher` — **done 2026-11-14** (OpenSpec change `add-teacher-lookup`, tested manually): read-only, for teachers and repair people; enters or scans a S/N on `lookup.html`, sees the owner's name, then ("Details anzeigen") address, guardian, Leihvertrag date/version + blank template, Übergabeprotokoll, and ("Verlauf anzeigen") history + Schadenmeldungen. No lists, no changes. Access only through two database functions (`supabase/teacher-lookup.sql`).
  - `admin` — unchanged name, full rights: sets up the site and modifies things (add / import / delete iPads, assign, settings, purge). No separate "root admin"
    - **Creating logins done 2026-11-14** (OpenSpec change `add-teacher-admin-accounts`): "+ Neue Lehrkraft" with e-mail, "Zugang einrichten", "+ Neuer Admin", optional `email` column in the Lehrkräfte CSV (Edge Function `create-staff-account`).
  - Admin users have an Admin panel with the admin options
    - Bulk import and individual adding of iPads, users, staff (see Priority 2 — needed before go-live)
    - **Archiving / anonymising** (decision: no hard deletes — the history must survive)
      - iPads are **archived**: hidden from lists, history kept
      - Pupils/staff are **anonymised**: personal data removed, audit trail kept
      - Bulk action from a sorted list: e.g. sort users by having an iPad or not, anonymise all users without iPad; archive all decommissioned iPads
      - Archive / Decommission button on iPad detail view
      - Implements the retention concept from Priority 2
- [ ]  **Manage existing logins** (left out of `add-teacher-admin-accounts` on purpose) — remove or lock the access of a teacher/admin who leaves (today: delete the user in Studio); admin-side password reset for teachers and admins; a "change password" page for logged-in users; optionally force a password change at the first login. Part of the admin panel.
- [ ]  **Editable, versioned Leihvertrag** — edit the iPad contract conditions via both a .md file (for displaying it online) and the fillable PDF. `terms_version: '1.0'` is currently hardcoded; every change must create a new version, so it stays recorded which version each family signed.
- [ ]  **Manual export + delete of old data (PDF first)** — the database must not grow without limit. Decision 2026-11-13: it is a **manual, per-item process**; nothing is exported or deleted automatically (setting an iPad to decommissioned does *not* trigger anything).
  - **iPads:** on a decommissioned iPad the admin can click "Verlauf exportieren und löschen": the iPad's full history (master data, history, signed Leihvertrag, protocols, damage/loss reports) is generated as a PDF and downloaded; only after the admin confirms that the PDF was saved is the iPad with all its records deleted. Only offered for status `decommissioned`.
  - **Pupils and staff:** same pattern ("Daten exportieren und löschen"), but they need an **active / not active** status first (new column on `pupils` and `staff`, e.g. `is_active`, plus a way to set it: "left the school" / "no longer at the school"). Export + delete is only offered for not-active people who have no assigned iPad. Inactive people are hidden from the default lists and from the assign dialog (filter to show them).
  - **Idle period as a setting (decision 2026-11-13):** an admin setting "number of years before data can be exported and deleted" (default 5). The export + delete button is only enabled once an iPad has been decommissioned / a person has been inactive for that many years. Needs a small settings table (teacher read, admin write)
  - Needs a confirmation step (what will be deleted, how many records), like the CSV import
  - This is the implementation of the **retention and deletion concept** (Priority 2, DSGVO) and replaces the earlier decision "no hard deletes" for data past the idle period. The audit-trail rule (`ipad_history` is append-only) needs an explicit, admin-only exception for this delete; `CLAUDE.md` must be updated then.
  - Open questions: is 5 years legally acceptable (ask the Datenschutzbeauftragte / Stadt Marl); when do the 5 years start (decommissioning date; pupil's leaving date); where the PDF archives are stored (they contain personal data and must be kept as securely as the database)
  - Related: "Archiving / anonymising" under **Admin user** above overlaps with the active/not-active status — decide together whether anonymising is still needed or replaced by export + delete

## Priority 4 — Day-to-day operation

- [ ]  **Pilot with one class** — real pupils, real parents using the portal from home; collect feedback before rolling out to 1000+ iPads
- [ ]  **School-year bulk actions** — e.g. a whole year group leaving: mark returns, free assignments, reassign in batches
- [ ]  **Exports** — CSV/PDF lists for the Stadt Marl and inventory (who has which iPad, lost/stolen, damaged)

## Priority 5 — Nice to have / housekeeping

- [ ]  **Nightly backup to the Raspberry Pi** — `pg_dump` from Supabase to the Pi in school: an on-site copy of all data, plus a test server for trying changes

## Priority 6 — Distribution

- [ ] **Create a distribution package** — create a distribution package so that the web app can be used for other schools
  - **Not part of the package:** `CLAUDE.md`, `statusquo.md`, `TODO.md`, `.claude/`, `openspec/`, the school's own legal texts and logo, and `supabase/db-changes.md` (superseded by the schema export). They stay in the private repo for backup only.
- [ ] **Config file for Supabase credentials** — one clearly commented file (e.g. `config.js`) the installing school edits once (decision: no GUI page — a static site could only store it in one visitor's browser; the anon key is public, so a file is safe)
- [ ] **Configurable school details — documents** — school name, logo and Schulträger are done (`school-config.js`, see Done); still open: the document templates (Leihvertrag PDF text, Schadensmeldung PDF, the "Eigentum der Stadt Marl" sentence in the portal) and the legal pages, which stay school-specific
- [ ] **Create a database creation system** — where after installing/copying the files on a server, the database structure can be created without having to enter the Supabase project page (if at all possible)

---

# 🤝 Handled by others (not developer work)

Marçal only develops the product. These items depend on other people at the school / Stadt Marl; they are kept here so nothing is lost. Development work that follows from them is listed under **Pending** (e.g. archiving once the retention rules exist).

## Data protection (DSGVO) 📋
- [ ] Sign the **AVV** (data processing agreement) with Supabase
- [ ] Add the app to the school's **Verarbeitungsverzeichnis**
- [ ] Get sign-off from the school's / Schulträger's **Datenschutzbeauftragte(r)** (incl. the US-parent-company question)
- [ ] Involve the **Stadt Marl** as owner of the iPads
- [ ] Define a **retention and deletion concept** — when is a pupil's data deleted after leaving?
- [ ] Insert the **real Datenschutzerklärung and Impressum text** from the school — see "How to insert the real legal text" in `statusquo.md`; remove the placeholder banner afterwards

## Hosting, ownership and accounts
- [ ]  **Decide hosting and ownership** — the app runs under the personal account `felixhauser.github.io`. Decide whose GitHub account and which domain it lives on, and who can take over if you are unavailable.
- [ ]  **Document admin management** — how a new admin account is created in Supabase Studio, and who holds the Supabase owner login.
- [ ]  **Supabase paid plan** — free tier pauses the project after 7 days of inactivity and has no automatic backups. Not acceptable for signed contracts.

## Translation review
- [ ]  **Native-speaker review of EN/TR** — prepared by OpenSpec change `evaluate-translations`: run `node export-translations.js`, give `translation-review.csv` (+ `openspec/changes/evaluate-translations/translation-findings.md`) to a native speaker; they fill `comment_en` / `comment_tr`; apply the answers in `translations.js`. The German questions are settled (2026-11-14: "Sie" everywhere, "Leihvertrag" as the only name) — 10 suggestions F3–F12 remain for the reviewer.

---

# ✅ Done

## Priority 1 — Protect what exists
- [x]  **Fix the Edge Function 1000-account limit** — `create-ipad-account` creates first and pages through `listUsers` only if the account exists; tested live (OpenSpec change `fix-account-lookup-limit`)
- [x]  **Fix refresh bug** — detail pages keep their id in the URL so F5 stays on the item, the address always matches the screen, the page re-renders right after "Zuweisen", latest-render-wins guard; tested manually (OpenSpec change `fix-ipad-detail-refresh`)
- [x]  **Pin all CDN library versions** — lucide 1.72.0, supabase-js 2.119.0; Lucide guarded with `window.lucide?.` so the admin app starts even if it fails to load (OpenSpec change `pin-cdn-versions`)

## Priority 2 — Blockers before going live
- [x]  **Datenschutzerklärung** and **Impressum** pages — built (German only, linked from login and portal), with placeholder text (OpenSpec change `add-legal-placeholder-pages`)
- [x]  **Add individual iPads, pupils and staff** in the admin interface — "+ Neues iPad" (OpenSpec change `add-individual-ipads`), "+ Neuer Schüler", "+ Neue Lehrkraft"
- [x]  **Bulk import (CSV) for iPads** — preview before writing, optional `status` column, template download; tested with 1500 rows (OpenSpec change `import-ipads-csv`)
- [x]  **Bulk import (CSV) for pupils and staff** — one combined import dialog (iPads / Schüler / Lehrkräfte) with preview; pupils match on first name + last name + address, staff on the unique Kürzel; the pupil address is now optional in the database; Kürzel unique case-insensitively with clear messages in all forms; tested with 1500 pupils (OpenSpec change `import-pupils-staff-csv`)
- [x]  **Searchable person picker in the assign dialog** — search field with results (name, address, Kürzel; umlaut- and case-insensitive; max 20 results) replaces the long drop-down; reusable component `views/person-picker.js` (OpenSpec change `add-person-picker`)
- [x]  **1000-row limit in other lists** — pupil/staff lists, assign dropdowns and Pending tabs use `fetchAllRows()`; the Übergabe tab no longer sends id lists in the URL (OpenSpec change `fix-1000-row-limit-lists`)
- [x]  **Translate the hardcoded German strings on the login page** — 13 new `login.*` keys in DE/EN/TR, tested manually (OpenSpec change `translate-login-page`)

## Localization
- [x]  **Wire the unused portal keys into `portal.js`** — the main portal view (greeting, iPad info, Übergabe/Rückgabe steps) was hardcoded German; found by `check-translations.js` (46 unused keys). CLAUDE.md requires the portal to be fully localised.
  - Done 2026-11-14 (OpenSpec change `wire-portal-translations`, tested manually in DE/EN/TR, archived; spec `openspec/specs/portal-localisation/`). Leihvertrag text and PDFs stay German for now (decide separately whether to translate them).
- [x]  **Review sheet + first-pass evaluation** — `export-translations.js`, shared `translation-tools.js`, `translation-findings.md` (2 fixes applied, 12 open suggestions) (OpenSpec change `evaluate-translations`, 2026-11-14)

## Priority 3 — Administration side
- [x]  **Admin panel "Verwaltung"** (OpenSpec change `add-admin-panel`, tested manually 2026-11-14): sidebar item `#admin` with "Daten hinzufügen" (new iPad / pupil / Lehrkraft, three CSV imports), "Zugänge" (new admin), "Schule" (read-only) and a read-only "Systemprüfung" (row counts, Edge Function reachability, `ZZ…` test-data warning, logo file, asset version). The add/import buttons were removed from the three lists; the CSV dialog is opened for one fixed kind (no drop-down). Later admin features (manage logins, purge, settings) become further sections in `views/admin-panel.js`.
- [x]  **School name, Schulträger and logo in a config file** — `school-config.js` + logo file in the folder, used by login, portal, lookup, print card and the Leihvertrag PDF; defaults if missing; editing needs a file change + push (a static site cannot save files from the browser)

## Priority 5 — Housekeeping
- [x]  **Git housekeeping** — `.claude/settings.local.json` is ignored (personal permissions); the OpenSpec setup (`.claude/commands`, `.claude/skills`) is committed; `CLAUDE.md` and `statusquo.md` stay in the (private) repo as a backup — the misleading ignore lines were removed
- [x]  **Cache-busting for script files** — local scripts and stylesheets carry `?v=<version>`; run `./bump-version.sh` before every push that changes a `.js`/`.css` file (OpenSpec change `cache-busting`)
- [x]  **Automated translation check** — `node check-translations.js` compares DE/EN/TR (missing/empty keys, placeholders, keys used in code but undefined); all 120 keys complete (OpenSpec change `check-translations`)
