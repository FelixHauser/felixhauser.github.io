# SchulAsset — To-do list to full operation

Created: 2026-11-09 · Decision: **stay on Supabase (Frankfurt)**


---

## Priority 1 — Protect what exists (cheap, do first)

- [ ]  **Upgrade Supabase to the paid plan** — free tier pauses the project after 7 days of inactivity and has no automatic backups. Not acceptable for signed contracts.
- [ ]  **Export the database schema into the repo** — tables, RLS policies, triggers and grants currently exist only inside Supabase. Save as SQL (e.g. `supabase/schema.sql`) so the database can be rebuilt at any time.
- [ ]  **Fix the Edge Function 1000-account limit** — `create-ipad-account` uses `listUsers({ perPage: 1000 })`; beyond 1000 accounts, reassignment and password reset fail. Look the user up by email instead.
- [ ]  **Fix refresh bug** — website doesn't refresh correctly after a change. Most noticeable on iPad detail view.
- [x]  **Pin all CDN library versions** (done: lucide 1.72.0, supabase-js 2.119.0; Lucide guarded with `window.lucide?.`) — `lucide@latest` and `supabase-js@2` can change overnight and break the app.
  - Pin both to an exact, currently working version (`lucide` in `admin.html`; `supabase-js` in `login.html`, `portal.html`, `admin.html`); the other CDN libraries are already pinned
  - Make Lucide failures harmless: in `admin.html` change `lucide.createIcons(); initAdmin();` to `window.lucide?.createIcons(); initAdmin();` (plain `lucide?.` still throws when the global is missing) — otherwise a Lucide problem throws and `initAdmin()` never runs, which kills the whole admin app (not just the icons)

## Priority 2 — Blockers before going live

### Data protection (DSGVO) 📋 — start early, takes the longest
- [ ] Sign the **AVV** (data processing agreement) with Supabase
- [ ] Add the app to the school's **Verarbeitungsverzeichnis**
- [ ] Get sign-off from the school's / Schulträger's **Datenschutzbeauftragte(r)** (incl. the US-parent-company question)
- [ ] Involve the **Stadt Marl** as owner of the iPads
- [ ] Define a **retention and deletion concept** — when is a pupil's data deleted after leaving?
- [x] **Datenschutzerklärung** and **Impressum** pages — built (German only, linked from login and portal), with placeholder text
- [ ] Insert the **real Datenschutzerklärung and Impressum text** from the school — see "How to insert the real legal text" in `statusquo.md`; remove the placeholder banner afterwards

### Getting real data in (part of the admin panel, see Priority 3)
- [ ]  **Bulk import (CSV)** for iPads, pupils and staff — e.g. from the Logineo export or the school's pupil list
- [ ]  **Add individual iPads, pupils and staff** in the admin interface — currently iPads can only be created in Supabase Studio
- [ ]  Remove the dummy data before go-live

### Ownership
- [ ]  **Decide hosting and ownership** — the app runs under the personal account `felixhauser.github.io`. Decide whose GitHub account and which domain it lives on, and who can take over if you are unavailable.
- [ ]  **Document admin management** — how a new admin account is created in Supabase Studio, and who holds the Supabase owner login.

### Localization
- [ ]  **Translate the hardcoded German strings on the login page** — found: not everything on `login.html` goes through `translations.js`, e.g. "Passwort vergessen?", "Wird angemeldet…" (auto-login), the forgot-password and new-password sections ("Zurück zum Login", "Reset-Link senden", …) and the admin-only hints. These show German whatever language is selected. Add `data-i18n` keys in DE/EN/TR and check `auth.js` messages too (`CLAUDE.md`: login must be fully localised). Other portal strings should be found by the evaluation below.
- [ ]  **Evaluate localization** — check the portal in all set languages (DE/EN/TR): missing or empty texts (automated check), translation quality (native speaker)


## Priority 3 — Administration side
- [ ]  **Admin user** — there must be a difference between regular users and admin users
  - Regular user = **teachers / staff**: new read-only role — can look up whose iPad it is, status, history, etc., but can't change anything
  - Admin users have an Admin panel with the admin options
    - Bulk import and individual adding of iPads, users, staff (see Priority 2 — needed before go-live)
    - **Archiving / anonymising** (decision: no hard deletes — the history must survive)
      - iPads are **archived**: hidden from lists, history kept
      - Pupils/staff are **anonymised**: personal data removed, audit trail kept
      - Bulk action from a sorted list: e.g. sort users by having an iPad or not, anonymise all users without iPad; archive all decommissioned iPads
      - Archive / Decommission button on iPad detail view
      - Implements the retention concept from Priority 2
- [ ]  **Editable, versioned Leihvertrag** — edit the iPad contract conditions via both a .md file (for displaying it online) and the fillable PDF. `terms_version: '1.0'` is currently hardcoded; every change must create a new version, so it stays recorded which version each family signed.


## Priority 4 — Day-to-day operation

- [ ]  **Pilot with one class** — real pupils, real parents using the portal from home; collect feedback before rolling out to 1000+ iPads
- [ ]  **School-year bulk actions** — e.g. a whole year group leaving: mark returns, free assignments, reassign in batches
- [ ]  **Exports** — CSV/PDF lists for the Stadt Marl and inventory (who has which iPad, lost/stolen, damaged)

## Priority 5 — Nice to have / housekeeping

- [ ]  **Nightly backup to the Raspberry Pi** — `pg_dump` from Supabase to the Pi in school: an on-site copy of all data, plus a test server for trying changes
- [ ]  **Git housekeeping**
  - add `.claude/settings.local.json` to the root `.gitignore`, then commit the OpenSpec setup
  - decide whether `CLAUDE.md` / `statusquo.md` stay in the repo (they are tracked, but `.gitignore` says they shouldn't be)


## Priority 6 — Distribution

- [ ] **Create a distribution package** — create a distribution package so that the web app can be used for other schools
- [ ] **Config file for Supabase credentials** — one clearly commented file (e.g. `config.js`) the installing school edits once (decision: no GUI page — a static site could only store it in one visitor's browser; the anon key is public, so a file is safe)
- [ ] **Configurable school details** — school name, logo, Schulträger (currently "Stadt Marl") and document templates, so another school can use its own
- [ ] **Create a database creation system** — where after installing/copying the files on a server, the database structure can be created without having to enter the Supabase project page (if at all possible)
