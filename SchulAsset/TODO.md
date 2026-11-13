# SchulAsset — To-do list to full operation

Created: 2026-11-09 · Decision: **stay on Supabase (Frankfurt)**

**Layout:** open items first (by priority), finished items collected under **✅ Done** at the end of the file. When an item is finished, move it down.

---

# 🔲 Pending

## Priority 1 — Protect what exists (cheap, do first)

- [ ]  **Upgrade Supabase to the paid plan** — free tier pauses the project after 7 days of inactivity and has no automatic backups. Not acceptable for signed contracts.
- [ ]  **Export the database schema into the repo** — tables, RLS policies, triggers and grants currently exist only inside Supabase. Save as SQL (e.g. `supabase/schema.sql`) so the database can be rebuilt at any time.
  - Also include everything logged in `supabase/db-changes.md` (manual changes made so far), the `auth.users` triggers, and the Auth settings (signups off, email confirmation off)
  - Verify by building an empty second Supabase project from the file and checking the app works against it
  - Planned for late in the project; until then, log every manual database change in `supabase/db-changes.md`

## Priority 2 — Blockers before going live

### Data protection (DSGVO) 📋 — start early, takes the longest
- [ ] Sign the **AVV** (data processing agreement) with Supabase
- [ ] Add the app to the school's **Verarbeitungsverzeichnis**
- [ ] Get sign-off from the school's / Schulträger's **Datenschutzbeauftragte(r)** (incl. the US-parent-company question)
- [ ] Involve the **Stadt Marl** as owner of the iPads
- [ ] Define a **retention and deletion concept** — when is a pupil's data deleted after leaving?
- [ ] Insert the **real Datenschutzerklärung and Impressum text** from the school — see "How to insert the real legal text" in `statusquo.md`; remove the placeholder banner afterwards

### Getting real data in (part of the admin panel, see Priority 3)
- [ ]  **Remove the dummy data before go-live** — incl. the `ZZ…` test iPads from the import tests if still present

### Ownership
- [ ]  **Decide hosting and ownership** — the app runs under the personal account `felixhauser.github.io`. Decide whose GitHub account and which domain it lives on, and who can take over if you are unavailable.
- [ ]  **Document admin management** — how a new admin account is created in Supabase Studio, and who holds the Supabase owner login.

### Localization
- [ ]  **Evaluate localization** — check the portal in all set languages (DE/EN/TR): missing or empty texts (automated check), translation quality (native speaker)

## Priority 3 — Administration side
- [ ]  **Roles** (decision 2026-11-13) — three roles in `user_roles`:
  - `student` — unchanged: parent/pupil portal, sees only their own iPad
  - `teacher` — **new, read-only**: can look up whose iPad it is, status, history, etc., but can't change anything (needs a role value in the `user_roles` constraint/type, read-only RLS policies and a read-only admin UI without action buttons; log the SQL in `supabase/db-changes.md`)
  - `admin` — unchanged name, full rights: sets up the site and modifies things (add / import / delete iPads, assign, settings, purge). No separate "root admin"
  - Admin users have an Admin panel with the admin options
    - Bulk import and individual adding of iPads, users, staff (see Priority 2 — needed before go-live)
      - **Move the add buttons into the admin panel**: "+ Neues iPad" and "CSV importieren" (currently in the toolbar of the iPad list, `views/ipad-list.js`) do not belong there — placed temporarily; same decision needed for "+ Neuer Schüler" / "+ Neue Lehrkraft"
    - **Archiving / anonymising** (decision: no hard deletes — the history must survive)
      - iPads are **archived**: hidden from lists, history kept
      - Pupils/staff are **anonymised**: personal data removed, audit trail kept
      - Bulk action from a sorted list: e.g. sort users by having an iPad or not, anonymise all users without iPad; archive all decommissioned iPads
      - Archive / Decommission button on iPad detail view
      - Implements the retention concept from Priority 2
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
- [ ] **Configurable school details** — school name, logo, Schulträger (currently "Stadt Marl") and document templates, so another school can use its own
- [ ] **Create a database creation system** — where after installing/copying the files on a server, the database structure can be created without having to enter the Supabase project page (if at all possible)

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

## Priority 5 — Housekeeping
- [x]  **Git housekeeping** — `.claude/settings.local.json` is ignored (personal permissions); the OpenSpec setup (`.claude/commands`, `.claude/skills`) is committed; `CLAUDE.md` and `statusquo.md` stay in the (private) repo as a backup — the misleading ignore lines were removed
- [x]  **Cache-busting for script files** — local scripts and stylesheets carry `?v=<version>`; run `./bump-version.sh` before every push that changes a `.js`/`.css` file (OpenSpec change `cache-busting`)
