## Why

The buttons for adding and importing data ("+ Neues iPad", "+ Neuer Schüler", "+ Neue Lehrkraft", "+ Neuer Admin", "CSV importieren") sit in the toolbars of the three lists. That placement was temporary (decision 2026-11-13). Setting up the system and getting real data in are admin jobs, not everyday list work, and the later admin features (manage logins, settings, purge old data) need one place to live.

## What Changes

- New sidebar item **Verwaltung** (admin panel) and view `#admin`, opened from the sidebar like every other view.
- The panel groups the admin jobs into sections:
  - **Daten hinzufügen**: "Neues iPad", "Neuer Schüler", "Neue Lehrkraft", and "Aus CSV importieren" (iPads / Schüler / Lehrkräfte). These reuse the existing dialogs unchanged.
  - **Zugänge**: "Neuer Admin" (existing dialog). Teacher logins stay on the Lehrkräfte pages.
  - **Schule** (read-only): shows the school name, the Schulträger and the logo as configured, and explains how to change them (edit the config file, replace the logo file, push).
  - **Systemprüfung** (read-only): checks that the database and the Edge Functions respond, shows record counts and the asset version, and warns about leftover test data (`ZZ…` serial numbers) before go-live.
- The add / import buttons are **removed** from the iPad, pupil and staff lists (**BREAKING** for muscle memory only; no data or behaviour changes).
- The panel is built so later admin features (manage logins, school settings, purge) can be added as further sections.

- New config file `school-config.js` (school name, Schulträger, logo file path) that the installing school edits once, plus the logo image file in the project folder. Login page, portal, teacher lookup page, the printed access card and the school name in the Leihvertrag PDF read their values from it instead of hardcoded text. This is the same idea as the planned Supabase config file (TODO Priority 6). Nothing is stored in the database and nothing is uploaded through the browser.

Not in this change: editing the name or logo in the browser (a static GitHub Pages site cannot write to its own folder), creating the database structure from the browser, the schema export, the legal pages (Datenschutz, Impressum; they stay static), the fixed text inside the PDF templates, and retention years or other settings. A static page with the public anon key cannot create tables; that stays with the schema export and the distribution package (TODO Priority 1 and 6).

## Capabilities

### New Capabilities
- `admin-panel`: the Verwaltung view, its sections, and where the add / import / new-admin actions live.
- `admin-system-check`: the read-only health check and record counts shown in the panel.
- `school-config`: the config file (name, Schulträger, logo), where the app uses it, the defaults, and the read-only display in the panel.

### Modified Capabilities
- `admin-pupil-staff-import`: the combined import dialog no longer has a kind drop-down; the kind is fixed by the panel entry that opened it (prevents importing a file as the wrong kind). The other dialogs keep their requirements; only the button that opens them moves.

## Impact

- `admin.html` (nav item, script tag), `admin.js` (`VIEW_RENDERERS`), new `views/admin-panel.js`, small styles in `admin.css`.
- `views/ipad-list.js`, `views/pupil-list.js`, `views/staff-list.js`: remove the toolbar buttons (the modal functions stay).
- No database change, no new Edge Function, no new dependency.
- New `school-config.js` (the school's own config, loaded first by `login.html`, `portal.html`, `lookup.html` and `admin.html`); small changes in `doc-generator.js` (school name) and the print card in `admin.html`; `bump-version.sh` must also stamp the new script tag.
- `./bump-version.sh` before the next push; `statusquo.md` and `TODO.md` updated at the end.
