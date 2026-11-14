## Context

`admin.html` is a single page with a sidebar and a hash router (`VIEW_RENDERERS` in `admin.js`). Every user who reaches it is already an admin (checked at start-up), so the panel needs no extra role check. The dialogs to add or import data exist as global functions in the list view files (`openNewIpadModal`, `openNewPupilModal`, `openNewStaffModal`, `openNewAdminModal`, `openCsvImportModal(kind)`).

## Goals / Non-Goals

**Goals:**
- One obvious place for setup and data-management jobs.
- Lists contain only list things (search, filter, rows).
- A cheap read-only check that tells the admin whether the system is healthy and whether test data is left.
- Easy to add sections later.

**Non-Goals:**
- Editing the school identity in the browser (needs storage; decision 2026-11-14: config file in the project folder instead).
- Other settings such as retention years.
- Legal pages: they load no script or database by design, so they keep the static logo and name.
- Translating the fixed text inside the PDF templates and the Leihvertrag text on the portal; only the `school_name` PDF field changes.
- Creating tables or policies from the browser: impossible with the anon key and unsafe with any other; belongs to the schema export / distribution package.
- Changing the content or behaviour of the existing dialogs.
- Login management (remove / lock / reset): separate change, will become a section here.

## Decisions

1. **One view file `views/admin-panel.js` with `renderAdminPanel()`**, registered as `admin` in `VIEW_RENDERERS`, following the "new admin view" pattern in `statusquo.md`. The sections are an array of `{ title, render }` entries so a later change adds a section without touching the others.
2. **The panel calls the existing global functions; the dialogs are not moved.** Moving them would be a large, risky diff for no user benefit. Alternative considered: move each dialog into the panel file; rejected for that reason. The functions remain in their list files and are only called from the panel; a comment there says so.
3. **Navigation after a dialog stays as is.** "Neues iPad" still opens the new iPad's detail page; imports still end in their result dialog. No special return-to-panel logic.
4. **Health check = plain reads with the admin's session**, run only when the admin presses "Prüfung starten" (not on every page open, so the panel opens fast and costs no requests):
   - database: `select count` with `head: true` on `ipads`, `pupils`, `staff`, `user_roles`; any error is shown in plain text with the failing table;
   - Edge Functions: a reachability probe: a bare `POST` without login data to `create-ipad-account` and `create-staff-account`. Supabase refuses it with 401 before any function code runs, a missing function answers 404. (An `OPTIONS` request was tried first and is blocked by the browser, because the functions do not allow that method.) It sends no data, so it creates nothing;
   - test data: count of iPads whose serial starts with `ZZ` (the prefix used in all import tests) and the dummy data note;
   - asset version: read from the `?v=` of the loaded `admin.js` script tag.
   Alternative considered: run the check automatically on every open; rejected (needless requests, slower). Alternative: call the functions with a dummy payload; rejected (risk of creating accounts).
5. **Counts use `head: true, count: 'exact'`** so they are not limited by the 1000-row rule and transfer no rows.
6. **Escaping:** all text from errors or the database goes through `escapeHtml()`.
7. **Layout:** reuses existing card and button classes (`.btn-action-detail`, the iPad-detail grouped-card style); only a few panel-specific rules are added to `admin.css`. Phone width must work like the other views.

8. **Config file `school-config.js`** (plain script, no framework) defines `window.SCHOOL = { name, fullName, authority, logo }` (`name` for the PDF, `fullName` for the printed card and alt texts, because the two used different wording before), with defaults "Martin Luther King Schule", "Stadt Marl", `mlks_logo.png`. It carries a comment block telling the installing school what to change. Alternatives: Supabase table or Storage; rejected (decision 2026-11-14, simplest option, no database change, matches the planned distribution config).
9. **The logo is a normal file in the project folder.** `logo` holds its path, so the school either replaces `mlks_logo.png` or points to another file. No size or type checks are needed, because only the developer changes it.
10. **Applying it:** a small function `applySchoolBranding()` in the same file sets the `src` and `alt` of every `img[data-school-logo]` and the text of every `[data-school-name]` after the page has loaded. The HTML keeps today's `src` and text as defaults, so nothing flickers and the pages work even if the config file is missing or broken (the function is guarded). Text goes in with `textContent`, never `innerHTML`.
11. **Documents:** only `doc-generator.js` uses the name (the `school_name` PDF field), reading `window.SCHOOL?.name` with the old text as fallback. The PDF templates are not edited.
12. **Legal pages stay static.** They load no scripts by design.
13. **Panel section "Schule" is read-only:** it shows name, Schulträger and the logo preview from `window.SCHOOL`, and the steps to change them. The Systemprüfung adds a check that the logo file can be fetched. Alternative: no section at all; rejected, because the admin should see what the app currently uses.
14. **Cache-busting:** `school-config.js` is a local script, so it carries `?v=` and `./bump-version.sh` must stamp it in all four pages. A replaced logo file has no version suffix; after changing it a hard reload may be needed (documented in the config comment).

## Risks / Trade-offs

- [Admins used to the old buttons look for them in the lists] → the panel is a sidebar item with a clear name; the statusquo notes the move.
- [The probe may fail because of a browser or network rule, not a broken function] → the result text says "nicht erreichbar" with the status or error, not "kaputt"; it is advisory only.
- [`ZZ` prefix is only a convention] → the message says "Seriennummern beginnend mit ZZ", it does not claim to find all test data.
- [A wrong value in `school-config.js` (e.g. wrong logo path) shows a broken image] → the Systemprüfung checks that the logo file loads, and the defaults are kept in the HTML.
- [Browsers may show an old logo after the file was replaced] → hard reload; noted in the config file.
- [Functions stay in list files while their buttons are elsewhere] → comment at each function; revisit if the panel grows.

## Migration Plan

1. Add `school-config.js` with the current values (no visible change), and load it in the four pages.
2. Deploy. Rollback: remove the script tags; the HTML defaults remain.

## Open Questions

- Should "Neuer Admin" later move to a "Zugänge" page together with login management? (Not needed now.)
