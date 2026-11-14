## 1. Panel shell

- [x] 1.1 Create `views/admin-panel.js` with `renderAdminPanel()` and a list of sections `{ title, render }`
- [x] 1.2 Add the sidebar item "Verwaltung" (Lucide icon, e.g. `settings`) and the `<script>` tag in `admin.html`, before `initAdmin()`
- [x] 1.3 Register `admin: () => renderAdminPanel()` in `VIEW_RENDERERS` (`admin.js`)
- [x] 1.4 Panel styles in `admin.css`, phone width checked

## 2. Move the actions

- [x] 2.1 Section "Daten hinzufügen": buttons for new iPad / pupil / Lehrkraft and for CSV import (iPads / Schüler / Lehrkräfte) calling the existing functions
- [x] 2.2 Section "Zugänge": "Neuer Admin"
- [x] 2.5 Remove the kind drop-down from the CSV import dialog (`views/csv-import.js`): kind fixed by the panel entry, title names the kind, `setCsvImportKind` removed
- [x] 2.3 Remove the toolbar buttons from `views/ipad-list.js`, `views/pupil-list.js`, `views/staff-list.js`; update the "temporary placement" comments
- [x] 2.4 Check that the three lists still look right (toolbar spacing) and that every dialog still works from the panel

## 3. School config (option A)

- [x] 3.1 Create `school-config.js`: `window.SCHOOL` with the current values and a comment block for the installing school, plus `applySchoolBranding()` (guarded, `textContent` only)
- [x] 3.2 Load it first in `login.html`, `portal.html`, `lookup.html`, `admin.html`; mark the logo images with `data-school-logo` and the name places with `data-school-name`; keep today's `src` and text as defaults
- [x] 3.3 Use it for the admin print card (the sidebar keeps the product name "SchulAsset"); use `window.SCHOOL?.name` for the `school_name` field in `doc-generator.js` (old text as fallback)
- [x] 3.4 Panel section "Schule": read-only values, logo preview, short "how to change" steps
- [x] 3.5 Make sure `bump-version.sh` stamps `school-config.js` in all four pages
- [x] 3.6 Check the fallbacks: remove or break the config temporarily and confirm the pages still work with the defaults

## 4. Systemprüfung

- [x] 4.1 Section with "Prüfung starten" and a result row per check (pending / OK / warning / problem)
- [x] 4.2 Row counts with `head: true, count: 'exact'` for `ipads`, `pupils`, `staff`, `user_roles`; per-table error text
- [x] 4.3 Edge Function probes (bare POST, refused with 401 before running) for both functions; "nicht erreichbar" text with reason and the manual-deploy hint
- [x] 4.4 Test-data warning for serials starting `ZZ`
- [x] 4.5 Check that the logo file from the config loads (HEAD or image load); show the asset version; escape all dynamic text with `escapeHtml()`

## 5. Verify and document

- [x] 5.1 Manual test: changing the name and logo in `school-config.js` shows on login, portal, lookup, print card; each action from the panel, reload on `#admin`, phone width, check with a deliberately wrong function name or offline
- [x] 5.2 Run `node check-translations.js` (must still pass) and `./bump-version.sh`
- [x] 5.3 Update `statusquo.md` and `TODO.md` (admin panel and the school name / logo config done, which also covers the first part of Priority 6 "Configurable school details"; login management, purge still open)
