# SchulAsset — Status Quo & Road Map

Last updated: 2026-11-14 (session 14 — portal translations wired, translation review tooling, Sie + Leihvertrag decisions, admin Last activity in German)

---

## Current state: what works right now

### Admin interface (`admin.html`)
- Login → role check → routes to admin or portal
- **Schnellsuche** — serial number search + QR scanner (landing page after admin login)
- **iPads** — merged view: Dashboard (status cards, total count) at top + full iPad list below; clicking a status card filters the list; clicking total clears filter; search and type filter still work
- **iPad detail** — full info card + history timeline + contextual write actions (see section below)
- **Pupil list** — searchable by name; rows clickable → pupil detail; "+ Neuer Schüler" button → modal → creates and navigates to detail
- **Pupil detail** — info card (first/last name, address) with inline edit; current iPad card (→ iPad detail); full assignment history across all iPads
- **Staff list** — searchable by name or Kürzel; rows clickable → staff detail; "+ Neue Lehrkraft" button → same pattern
- **Staff detail** — info card (first/last name, Kürzel) with inline edit; current iPad card
- **Last activity** — nav item (clock icon) → main view showing last 50 `ipad_history` entries across all iPads with event badge, serial, detail, changed_by, timestamp
- Responsive design, hamburger menu on mobile/tablet
- Works on iPad (Safari) including QR scanner with back camera

### Student portal (`portal.html`)
- Login → role check → routes to portal
- Shows iPad info card (S/N, status, type, storage, assigned date)
- **Leihvertrag (terms)** — accept button if not yet done; optional guardian fields (erz_first_name, erz_last_name, erz_address — only if different from pupil); writes to `terms_acceptance` + `ipad_history`; shows download button once accepted → downloads filled **Leihvertrag.pdf** (PDF form via pdf-lib, with signature)
- **Schadenmeldung** — modal form (damage type, description, datum_eingetreten, datum_entdeckt, perpetrator); writes to `schadenmeldung` + `ipad_history`; shows download button → downloads filled **Schadensmeldung.pdf** (PDF form via pdf-lib)
- **Verlustmeldung** — modal form (date, circumstances, ort_verlust, datum_bemerkt, police ref, notitzen); writes to `verlustmeldung` + `ipad_history`; **automatically sets iPad status to `lost`**; shows download button → downloads jsPDF-generated **Verlustmeldung.pdf**
- **Übergabeprotokoll / Rückgabeprotokoll** — portal-side code ready: shows card if admin has created a record; pending ones show "Erhalt/Rückgabe bestätigen" button; accepted ones show download button (jsPDF). Cards only appear once admin creates records (Priority 2).
- Fully localised: DE (default), EN, TR
- Mobile-first, sheet-style modals

### Admin interface — Pending view (`views/meldungen.js`)
- **Pending** nav item (inbox icon) — admin action inbox, shows only items requiring a next step
- Four tabs, each with a count badge:
  - **Schadenmeldungen** — unresolved damage reports (`resolved_at IS NULL`); "Erledigt" button marks resolved and removes from list; download button still available
  - **Verlustmeldungen** — same pattern
  - **Übergabe** — iPads where terms were accepted but no Übergabeprotokoll created since `assigned_date`; "→ Zum iPad" navigates to iPad detail
  - **Rückgabe** — Rückgabeprotokolle signed by pupil (`accepted_at IS NOT NULL`) where iPad still has an assignment; "→ Zum iPad" navigates to iPad detail
- `resolved_at` column added to both `schadenmeldung` and `verlustmeldung` tables

### Admin interface — iPad detail history downloads
- History timeline entries for `terms_accepted`, `schadenmeldung`, `verlustmeldung` show a "↓ Herunterladen" button
- Clicking fetches the source record from DB and generates the document on the spot

### Admin interface — iPad detail write actions
Buttons are contextual — only shown when relevant to the current iPad state:
- **Zuweisen** — shown when NOT assigned AND status ≠ lost/stolen/decommissioned; select pupil or staff (or create new inline); sets assignment + status → in_use; calls Edge Function to create/reset portal account; shows generated password
- **Zuweisung aufheben** — shown when assigned; checks Rückgabeprotokoll state first (warns if missing or unsigned); clears assignment; invalidates terms; resets portal password silently
- **Übergabeprotokoll** — shown when assigned to pupil AND status = in_use; admin fills condition/notes/Kürzel; pupil signs on portal
- **Rückgabeprotokoll** — shown when assigned to pupil AND status = in_use; same form; pupil signs on portal
- **Status ändern** — always shown; statuses available/to_be_erased/decommissioned also sever assignment + invalidate terms + reset password automatically
- **Schadenmeldung** — shown when status ≠ decommissioned; writes to schadenmeldung + history
- **Verlustmeldung** — shown when status ≠ lost/stolen/decommissioned; writes to verlustmeldung + history; sets status to lost

### iPad account model
- Accounts belong to the iPad, not the pupil: `{serial_number}@schulasset.local`
- On first assignment → Edge Function creates the auth account + user_roles row
- On reassignment → Edge Function resets the password (old pupil locked out)
- On return/free → password silently reset to block old pupil
- Password generated as `Adjektiv-Nomen-ZZ` (German word list), shown once to admin

### Edge Function: create-ipad-account
- Deployed to Supabase (Studio → Edge Functions)
- Accepts: `{ serial_number }`
- Caller must be authenticated admin (verified via JWT + user_roles)
- Creates or resets portal account; returns `{ password }`
- Source: `supabase/functions/create-ipad-account/index.ts`

### Key lifecycle rules
- Übergabeprotokoll/Rückgabeprotokoll on portal only show records created AFTER `ipad.assigned_date` → old records from previous owners are invisible
- terms_acceptance is soft-deleted (`invalidated_at`) when iPad is freed; portal filters `.is('invalidated_at', null)`
- Correct return flow: **Rückgabeprotokoll** (pupil signs) → **Zuweisung aufheben**
- "Zuweisung aufheben" warns if Rückgabeprotokoll is missing or unsigned before proceeding
- Pending protocols show full details (condition, accessories, Kürzel) so pupil can review before signing

### What is NOT yet built
- See **`TODO.md`** — prioritised to-do list towards full operation (Priority 1 → 6)

### Account lookup (no account limit)
- `create-ipad-account` tries `createUser` first; only if the email already exists does it page through `listUsers` (1000 per page, until found) to reset the password. Works for any number of portal accounts. **The deployed version in Supabase must be updated by hand after changing the source** (Studio → Edge Functions). All responses carry CORS headers so errors are readable in the browser. `service_role` needs `GRANT SELECT, INSERT, UPDATE ON public.user_roles` (the function upserts the role row).

---

## File structure

```
SchulAsset/
  login.html / login.css         — login page (school logo, medium blue bg)
  auth.js                        — login logic, role detection, routing
  supabase-client.js             — Supabase client (credentials hardcoded, anon key, safe)
  translations.js                — i18n: DE (default), EN, TR; covers login + full portal
  doc-generator.js               — document generation: pdf-lib fills PDF form templates for Leihvertrag + Schadenmeldung; jsPDF builds Verlustmeldung, Übergabeprotokoll, Rückgabeprotokoll. Loaded in both portal.html and admin.html.
  admin.html / admin.css         — admin shell, light sidebar, Lucide icons
  admin.js                       — auth guard, view router, shared helpers
  portal.html / portal.css       — student portal shell + 3 modals
  portal.js                      — student auth guard, iPad fetch, all portal actions + downloads
  views/
    schnellsuche.js              — serial number search + QR scanner
    ipad-list.js                 — dashboard cards + searchable/filterable iPad table (merged)
    ipad-detail.js               — iPad info + history timeline + write actions
    pupil-list.js                — searchable pupil table (rows clickable)
    pupil-detail.js              — pupil info (editable) + current iPad + assignment history
    staff-list.js                — searchable staff table (rows clickable)
    staff-detail.js              — staff info (editable) + current iPad
    meldungen.js                 — Pending view (4 tabs: Schäden, Verlust, Übergabe, Rückgabe)
    activity.js                  — Last activity view (last 50 ipad_history entries)
  document_templates/            — fillable PDF templates used at runtime (Leihvertrag_2.1_fillable.pdf, Schadensmeldung_fillable.pdf)
  supabase/functions/            — Edge Function source (create-ipad-account)
  mlks_logo.png                  — school logo (used in login card + portal header)
  CLAUDE.md                      — project instructions for coding agent
  statusquo.md                   — this file
```

---

## Database schema (additions beyond CLAUDE.md)

### Tables and key columns

**terms_acceptance** — `id, ipad_id, accepted_at, ip_address, terms_version, erz_first_name, erz_last_name, erz_address`
- Guardian fields are nullable; only stored if different from the pupil

**pupils** — `id, first_name, last_name, address, created_at`
- `intune_login` column removed (served no purpose)

**schadenmeldung** — `id, ipad_id, damage_type, description, filed_by, filed_at, pdf_url, datum_eingetreten, datum_entdeckt, perpetrator, resolved_at (nullable)`

**verlustmeldung** — `id, ipad_id, date_of_loss, circumstances, police_report_number, filed_by, filed_at, pdf_url, ort_verlust, datum_bemerkt, notitzen, resolved_at (nullable)`

**uebergabeprotokoll** — `id, ipad_id, serial_number, pupil_name, kurzel, condition, maengel, notes, created_at, accepted_at, accepted_by`
- condition: `'neuwertig' | 'ohne_maengel' | 'mit_maengeln'`
- Admin creates it; student/parent accepts via portal

**rueckgabeprotokoll** — `id, ipad_id, serial_number, pupil_name, kurzel, condition, maengel, defekt_beschreibung, notes, created_at, accepted_at, accepted_by`
- condition: `'ohne_maengel' | 'mit_maengeln' | 'defekt'`

---

## Supabase RLS status

| Table | GRANT | RLS | Admin policy | Student policy |
|---|---|---|---|---|
| user_roles | SELECT | ✅ | — | ✅ reads own row |
| ipads | SELECT | ✅ | ✅ read all | ✅ read own (by S/N, uppercase) |
| ipads | UPDATE | ✅ | ✅ update all fields | ✅ update status to lost/stolen only |
| terms_acceptance | UPDATE | ✅ | ✅ update (invalidate) | ❌ not needed |
| pupils | SELECT | ✅ | ✅ read all | ✅ read own (the pupil linked to the student's iPad) |
| staff | SELECT | ✅ | ✅ read all | ❌ not yet |
| ipad_history | SELECT | ✅ | ✅ read all | ❌ not yet (not needed for portal) |
| ipad_history | INSERT | ✅ (grant) | ✅ insert all | ✅ insert own |
| schadenmeldung | SELECT, INSERT, UPDATE | ✅ | ✅ read all + update (resolve) | ✅ insert own |
| verlustmeldung | SELECT, INSERT, UPDATE | ✅ | ✅ read all + update (resolve) | ✅ insert own |
| pupils | UPDATE | ✅ | ✅ update all fields | ❌ |
| pupils | INSERT | ✅ | ✅ insert | ❌ |
| staff | UPDATE | ✅ | ✅ update all fields | ❌ |
| staff | INSERT | ✅ | ✅ insert | ❌ |
| terms_acceptance | SELECT, INSERT | ✅ | ✅ read all | ✅ read + insert own |
| uebergabeprotokoll | SELECT, INSERT, UPDATE | ✅ | ✅ all | ✅ select own + update own (accept) |
| rueckgabeprotokoll | SELECT, INSERT, UPDATE | ✅ | ✅ all | ✅ select own + update own (accept) |

**Critical gotcha:** All student RLS policies must use `upper(split_part(auth.email(), '@', 1))` to compare against the serial number — Supabase lowercases all email addresses, so the raw split would never match the uppercase serial numbers in the DB.

---

## Key technical decisions & gotchas

| Issue | Solution |
|---|---|
| `const` in script files not globally visible | Use `window.supabase = ...` for shared objects |
| VIEW_RENDERERS defined before view files load | Arrow functions: `() => renderIpadList()` |
| Firefox isolates localStorage per `file://` URL | Use `python3 -m http.server 8080` for local dev |
| Supabase new key format doesn't persist session | Set `persistSession: true, storage: window.localStorage` in createClient |
| Supabase table access denied even with RLS policy | Also need `GRANT SELECT ON table TO authenticated` |
| Race condition: view renderer not defined when router fires | Call `initAdmin()` from the inline `<script>` at the bottom of admin.html, after all view `<script>` tags |
| Supabase lowercases all emails | Extract S/N with `.toUpperCase()` in JS; use `upper()` in all RLS policies |
| Supabase pupils join returns `{}` when student has no RLS policy | `{}` is truthy → name renders as "undefined undefined"; fix: add student SELECT policy on pupils |
| jsPDF UMD build | Accessed as `window.jspdf.jsPDF` — loaded from `https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js` |
| Client-side docx → PDF conversion | Rejected. pdf-lib fills named form fields in a PDF template directly in the browser — no server needed |

### Local development
```bash
cd "/Users/marcal/Library/Mobile Documents/com~apple~CloudDocs/Programings Projects/Barretina Software Web/felixhauser.github.io/SchulAsset"
python3 -m http.server 8080
# open http://localhost:8080/login.html
```

---

## Next steps — in order of priority

---

### ~~Priority 1 — PDF filling (client-side, pdf-lib)~~ ✅ Done

Both documents now use **pdf-lib** to fill PDF form templates in the browser and download as `.pdf`.

- **Schadenmeldung** → `document_templates/Schadensmeldung_fillable.pdf`
- **Leihvertrag** → `document_templates/Leihvertrag_2.1_fillable.pdf`

pdf-lib loaded via CDN in `admin.html` and `portal.html`. `generateLeihvertrag()` and `generateSchadenmeldung()` in `doc-generator.js` updated accordingly. docxtemplater and the old .docx templates have been removed.

---

### ~~Priority 2 — Dashboard enhancements~~ ✅ Done

Recent activity is covered by the dedicated **Last activity** nav item (clock icon → last 50 `ipad_history` entries). Embedding it in the iPads view was dropped to avoid overcrowding.

---

### ~~Session 7 — Password reset~~ ✅ Done

- **Student portal password reset** — "Passwort zurücksetzen" button on iPad detail (shown when assigned to pupil); calls `create-ipad-account` Edge Function; shows new password in modal
- **Admin forgot password** — "Passwort vergessen?" link on login page; sends Supabase reset email; recovery token detected on return → new password form shown inline

### ~~Session 8 — New statuses, timeline portal, QR login~~ ✅ Done (+ session 8c bug fix)

- **New iPad statuses** — `terms_pending` (assigned, Leihvertrag not yet signed) and `handover_pending` (Übergabeprotokoll created, not yet signed by student); assignment now sets `terms_pending` instead of `in_use`
- **Automatic status flow** — DB triggers handle status transitions: Übergabeprotokoll accepted → `in_use`; Zuweisung aufheben → `available`
- **Übergabeprotokoll button logic fixed** — only appears after Leihvertrag is accepted; was previously in the wrong branch and never showed
- **Timeline portal UI** — portal completely redesigned as a 4-step vertical timeline (Leihvertrag → iPad erhalten → In Verwendung → Rückgabe); iPad details hidden behind an info button; damage/loss buttons shown only when `in_use`; protocol condition shown before confirmation
- **QR code login** — password modal now shows QR code; admin can print an A5 card (school logo, pupil name, QR code, URL, username, password); scanning the QR auto-logs in the student with no typing
- **Kürzel pre-fill** — Übergabe/Rückgabe modals remember last used Kürzel via localStorage
- **Refresh button** on iPad detail view
- **DB triggers** — `on_ipad_auth_user` upserts `user_roles` on auth account create/update; `on_uebergabe_accepted` flips iPad to `in_use` when student signs; `unique constraint` on `user_roles.user_id`
- **History entries** written when student accepts Übergabe/Rückgabeprotokoll
- **Bug fix** — `_showPasswordCard` was corrupting the admin modal footer (removing `id="admin-modal-submit"`), causing all subsequent modal opens to crash silently. `closeAdminModal()` now restores the default footer on every close.

### ~~Session 7b — iPad detail redesign + Eigenreparatur~~ ✅ Done

- **iOS-style action table** — grouped sections: Status (prominent) / Meldungen / Aktionen / Sicherheit; each section a rounded card with tappable rows and chevrons
- **Dokumente section** — direct download cards for Leihvertrag, Übergabeprotokoll, Rückgabeprotokoll; only shown when the document exists for the current assignment
- **Übergabeprotokoll button** — hidden once the family has accepted; reappears on reassignment
- **Eigenreparatur status** (purple `#5856d6`) — in-house maintenance; assignment preserved; status modal shows checkboxes (Software-Update, Zurücksetzen, Datenlöschung, Intune-Anmeldung) + free-text field; selections appended to history note

---

## Legal pages (Datenschutzerklärung / Impressum)

`datenschutz.html` and `impressum.html` are public, **German only** (German is the legally binding language), and load no `translations.js`, no Supabase and no CDN. They are linked from a footer on `login.html` and `portal.html`; only the footer link labels are localised (`legal.footerDatenschutz`, `legal.footerImpressum`). Styling: `legal.css`.

### How to insert the real legal text
1. In each page, replace everything inside `<main id="legal-content">` with the school's text (plain HTML: `<h2>`, `<p>`, `<ul>`).
2. Delete the `<div id="placeholder-notice">` banner.
3. Tick the item off in `TODO.md`.

---

## CDN libraries

All CDN libraries are pinned to exact versions (lucide 1.72.0, supabase-js 2.119.0 — same supabase-js version in `login.html`, `portal.html`, `admin.html`). The admin app starts even if Lucide fails to load (`window.lucide?.createIcons()`).
To upgrade one: bump the version string in every HTML file that uses it, smoke-test (admin login, icons, QR scanner, portal), then commit.

---

## Patterns to follow

- **New admin view**: create `views/my-view.js` with `renderMyView()`, add `<script>` to `admin.html` before `lucide.createIcons(); initAdmin();`, add to `VIEW_RENDERERS` in `admin.js`
- **Navigation to detail**: set `window._currentFooId = id` then `window.location.hash = 'foo-detail'`
- **New table**: `GRANT SELECT ON public.table TO authenticated` + `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` + create policy
- **Student RLS policies**: always use `upper(split_part(auth.email(), '@', 1))` for serial number comparison
- **Admin RLS policies**: use `EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')`
- **UI strings**: add to all three languages (de, en, tr) in `translations.js`, use `t('key')` in code
- **Database text in HTML**: any value from the database or a CSV file that goes into an HTML string (template literal for `innerHTML`) must pass through `escapeHtml()` (`escape-html.js`) — parents type some of it (damage descriptions, police reference, history notes). Not needed for `.textContent` / `.value`. Never put data into an inline handler (`onclick="f('${x}')"`): entities are decoded before the script runs; use `data-` attributes + `this.dataset`. Database ids (uuid) in `onclick` are fine.
- **Document download (PDF form)**: `generateLeihvertrag(data)` and `generateSchadenmeldung(data)` are **async** — fetch the fillable PDF from `document_templates/`, fill with pdf-lib, download as .pdf. Always `await` them and wrap in try/catch.
- **Document download (jsPDF)**: `generateVerlustmeldung(data)`, `generateUebergabeprotokoll(data)`, `generateRueckgabeprotokoll(data)` are **synchronous** — generate PDF in-browser and save directly.
- **Global state in portal.js**: `_ipad`, `_pupilName`, `_termsRow`, `_uebergabe`, `_rueckgabe` — use these to build data objects for document generation.

---

## ~~Session 9 — Digital signatures~~ ✅ Done

### Feature
Parents/students can draw their signature with a mouse (desktop) or finger (iPad/smartphone) when accepting the Leihvertrag, Übergabeprotokoll, and Rückgabeprotokoll. The signature is stored as a PNG data URL in the DB and embedded into the generated PDF.

- **Library:** `signature_pad` v4 (CDN, MIT) — handles mouse + touch + retina natively
- **Storage:** signature stored as base64 PNG data URL in `signature_url text` column (no Storage bucket needed)
- **DB columns added:** `signature_url` on `uebergabeprotokoll`, `rueckgabeprotokoll`, `terms_acceptance`
- **Leihvertrag modal:** signature canvas + clear button; acceptance blocked until signed
- **Übergabe/Rückgabe:** new `accept-sig-modal` opens before confirming; signature required
- **PDFs:** signature image embedded — pdf-lib for Leihvertrag, jsPDF `addImage` for protocols
- **Admin downloads:** Leihvertrag download passes `signature_url` through; protocols use `select('*')` so already included
- Tested on desktop (mouse) and iPad (finger) ✅

---

## ~~Session 10 — Cleanup & planning~~ ✅ Done (2026-11-09 / 10)

- **Removed dead code:** `views/dashboard.js` (never loaded; dashboard merged into iPad list), unused `formatTime()` in `portal.js`, debug `console.log`s in `auth.js` (logged user id + role on every login), stale TODO in `doc-generator.js`
- **Removed unused files:** `config.js` (credentials live in `supabase-client.js`) + its `.gitignore` entry; the four `.docx` files in `document_templates/` (no longer used at runtime; recoverable from git history)
- **Removed duplicate Edge Function** at repo root `supabase/functions/create-ipad-account/` — an older session 3–5 draft, superseded by `SchulAsset/supabase/functions/create-ipad-account/` (the deployed version)
- **Docs:** `statusquo.md` and `CLAUDE.md` updated — no more docxtemplater / `.docx` / `config.js` references
- **OpenSpec** (v1.3.1) initialised at repo root for Claude Code: `/opsx:explore`, `/opsx:propose`, `/opsx:apply`, `/opsx:archive` — use for future feature work
- **`TODO.md` created** — prioritised to-do list towards full operation; replaces the road map in this file

### Decisions taken (2026-11-10)
- **Stay on Supabase (Frankfurt).** Migrating to own SQL/SQLite would mean a full rewrite (own backend, auth, access control). A Raspberry Pi 3 as production host was rejected: too little RAM for self-hosted Supabase, must be reachable from parents' homes (school LAN), reliability and DSGVO burden. The Pi may serve as nightly backup target / test server instead.
- **No hard deletes.** iPads are archived (history kept), pupils/staff anonymised (audit trail kept).
- **New read-only role for teachers/staff** planned (Priority 3).
- **Localisation:** portal + login fully localised (DE/EN/TR); admin interface German only — `CLAUDE.md` updated.
- **Distribution:** Supabase credentials via a config file (no GUI page); school details (name, logo, Schulträger, templates) to become configurable.

### Next session
Start with **Priority 1** in `TODO.md` — first the refresh bug on the iPad detail view.

---

## ~~Session 11 — Legal pages (OpenSpec change `add-legal-placeholder-pages`)~~ ✅ Done (2026-11-10)

First feature built with the OpenSpec workflow (explore → apply → archive). Archived at `openspec/changes/archive/2026-11-10-add-legal-placeholder-pages/`; main spec at `openspec/specs/legal-pages/spec.md`.

- **Datenschutzerklärung + Impressum pages** — `datenschutz.html`, `impressum.html`, `legal.css`. Public, **German only** (decision: German is the only legally binding language; EN/TR elsewhere are a courtesy). No `translations.js`, no Supabase, no CDN; only a tiny inline back-link script.
- **Footer links** on `login.html` (inside the card) and `portal.html` (static `<footer>` outside `#portal-content` so `portal.js` re-renders never wipe it). Only the link labels are localised (`legal.footerDatenschutz`, `legal.footerImpressum`).
- **Content is placeholder** with a visible orange banner. See the "Legal pages" section above for how to insert the real text.
- **Found while testing:** several login-page strings are hardcoded German ("Passwort vergessen?" etc.) → added to `TODO.md` (Localization).
- **Open questions recorded in the archived design:** Impressum entity (school vs. Stadt Marl); the app is served from a personal GitHub Pages domain; the Datenschutzerklärung must disclose the CDNs (jsDelivr, unpkg, cdnjs) — self-hosting them would be a separate change.

### Next session
Start with **Priority 1** in `TODO.md`. Then the login-page translation fix (Priority 2, Localization).

---

## Session 12 (2026-11-11) — summary and where to continue

### Done and pushed (OpenSpec changes, archived)
- **`pin-cdn-versions`** — lucide 1.72.0 and supabase-js 2.119.0 pinned; admin app starts even if Lucide fails (`window.lucide?.createIcons()`). Spec: `openspec/specs/cdn-dependencies/`.
- **`fix-account-lookup-limit`** — `create-ipad-account` now creates first and only pages through `listUsers` if the account exists, so there is no account limit. Also: CORS headers on all responses, and the admin alert now shows the function's real error text. Deployed in Supabase and tested live (create + reset). The paging path beyond 1000 accounts is **untested** (optional task 2.4, skipped). Spec: `openspec/specs/ipad-portal-accounts/`.
- **`supabase/db-changes.md`** — log of manual database changes (first entry: `GRANT SELECT, INSERT, UPDATE ON public.user_roles TO service_role`). **Rule: log every SQL/setting we change by hand in Supabase there.** The schema export (TODO Priority 1) is planned for late in the project and must include this log.

### Refresh bug — OpenSpec change `fix-ipad-detail-refresh` (implemented and tested manually, 2026-11-11)
Location: `openspec/changes/archive/2026-11-11-fix-ipad-detail-refresh/` (archived, committed). Run openspec commands from the `SchulAsset/` folder.

Causes found and fixed:
1. **Browser reload (F5) on a detail page left a dead list.** The URL said `#ipad-detail` without the id (the id lived only in `window._currentIpadId`); after F5 the app fell back to the list but kept the URL, so clicking an iPad set the same hash again → no `hashchange` → nothing happened. **Now:** detail pages use `#ipad-detail/<id>`, `#pupil-detail/<id>`, `#staff-detail/<id>`. `routeToHash()` in `admin.js` splits `view/id`, sets the `_current…Id` global for the view file, and always replaces the URL (`history.replaceState`, no history entry) when the requested page differs from the address — so the URL always matches the screen. `showIpadDetail/showPupilDetail/showStaffDetail` only write the hash.
2. **Assignment:** `submitAssign` now re-renders right after the save, so the page behind the password card is current however it is closed. `_showPasswordCard` keeps its callback in `_passwordCardOnClose` (button calls `_finishPasswordCard()`) instead of serialising it with `toString()`.
3. **Overlapping renders:** `renderIpadDetail()` uses a counter (`_detailRenderId`); only the latest render writes the page (also stops if the admin left the page meanwhile). Errors of the `uebergabeprotokoll` / `rueckgabeprotokoll` / `terms_acceptance` queries are logged with `console.error`.

**Ruled out:** the earlier demo symptom ("↻ Aktualisieren shows nothing after the parent accepted the Leihvertrag") was not caused by caching — Supabase responses are fetched from the network (no cache headers, `cf-cache-status: DYNAMIC`) and ↻ works in a retest. Probable causes: reload (F5) instead of ↻, or admin and parent logged in in the same browser. **Gotcha for testing:** all tabs of one browser share one Supabase session (`localStorage`); a second login in another tab replaces the first. Use a second browser or a private window for the parent.

Out of scope, open question: several actions ignore errors of their secondary writes (e.g. status update in `submitUebergabe`, `ipad_history` inserts). Small known gap: opening a detail link in a fresh tab leaves "← Zurück" without a previous page.

### Other candidates from `TODO.md` for a short session
- Translate hardcoded German strings on `login.html` (Priority 2, Localization), about 20 minutes.
- Git housekeeping (Priority 5): add `.claude/settings.local.json` to `.gitignore`; keep `CLAUDE.md` and `statusquo.md` tracked.
- Still open in Priority 1: paid Supabase plan, schema export (late).

### Working notes for the next session
- Commits and pushes only after the user's explicit OK (a plain "commit and push" in the same message counts for that commit only).
- Local test server: `python3 -m http.server 8080` in `SchulAsset/`.
- The Edge Function in the repo is not deployed automatically: after editing `supabase/functions/create-ipad-account/index.ts`, paste it into Supabase Studio → Edge Functions → Deploy updates. Direct link: https://supabase.com/dashboard/project/uevovvrxwrwvxqnhehmm/functions


---

## Session 13 (2026-11-13) — login page localisation

- **`translate-login-page`** (OpenSpec, tested manually in DE/EN/TR; archived, spec `openspec`/specs/login-localisation/): all remaining hardcoded German on `login.html` and in `auth.js` (forgot-password link, auto-login message, forgot/new-password sections, their messages) now goes through `translations.js` (13 new `login.*` keys; the three languages have identical key sets). Supabase's own error text after the "Fehler:/Error:/Hata:" prefix stays as delivered.
- `TODO.md`: login-translation item ticked; "Add individual pupils and staff" ticked (iPads still open).
- **Gotcha:** after editing `translations.js` the browser may use a cached copy and show raw keys such as `login.forgotLink` — hard-reload (Cmd+Shift+R). Possible later fix: version suffix on script tags (`translations.js?v=…`) so users don't hit this after a deploy.
- (Superseded — see "Where to continue" at the end of this file.)

- **`add-individual-ipads`** (OpenSpec, tested manually; archived, spec `openspec/specs/admin-ipad-creation/`): "+ Neues iPad" button in the toolbar of the iPad list (`views/ipad-list.js`, `openNewIpadModal` / `submitNewIpad`). Fields: serial number (trimmed, stored upper case), type, storage; status `available`; writes a first `ipad_history` row (`status_change`, "iPad angelegt") and opens the detail page. Duplicates rejected (list check + Postgres `23505`). DB: INSERT grant + admin-only policy `admin_insert_ipads` + case-insensitive unique index — logged in `supabase/db-changes.md`. Not tested: the student-cannot-insert check (optional). Remember to delete the test iPad(s) created while testing. Next on this path: CSV bulk import.
- **Placement is temporary:** the "+ Neues iPad" button does not belong in the iPad list toolbar (decision 2026-11-13); it moves into the admin panel when the admin UI is reworked (see `TODO.md`, Priority 3).

- **`import-ipads-csv`** (OpenSpec, tested manually incl. 1500 rows; archived, spec `openspec/specs/admin-ipad-import/`): "CSV importieren" button on the iPad list (temporary placement, like "+ Neues iPad") → `views/ipad-import.js`. Format `serial_number;ipad_type;storage_capacity[;status]` (`;` or `,`, UTF-8; template download in the dialog). Preview first (new / existing / duplicate in file / invalid with reasons), then chunked insert (200) + history row "iPad angelegt (CSV-Import)". Default status `available`; optional `status` column accepts only statuses without assignment. Parser/validation are pure functions (testable in Node). Test data used the prefix `ZZ` — delete before go-live.
- **1000-row limit:** Supabase returns max 1000 rows per request. `fetchAllRows()` in `admin.js` pages through a query; the iPad list uses it (dashboard counts were wrong beyond 1000 otherwise). Fixed everywhere in `fix-1000-row-limit-lists` (archived, spec `openspec/specs/admin-list-completeness/`) (pupil/staff lists, assign dropdowns, Pending tabs). **Rule for new code: any list query that can exceed 1000 rows must go through `fetchAllRows()` with a unique ordering (`.order('id')` last), and never use `.in(...)` with long id lists (URL length).** The paging path itself is unit-tested (fake query builder) and proven on the iPad list (1701 rows); pupils/staff beyond 1000 not tested with real data.

### Decision 2026-11-13 — purging old data
The earlier rule "no hard deletes" is relaxed for old data, as a **manual, per-item process** (see `TODO.md`, Priority 3, "Manual export + delete of old data"): on a decommissioned iPad the admin exports its history as PDF and then deletes it; pupils/staff get an active / not active status and the same export + delete once they are inactive. Nothing is exported or deleted automatically, and setting a status triggers nothing. The idle period (default 5 years) is to become an admin setting; the button is only enabled after that many years. Until the feature exists nothing is deleted. When it is built, `CLAUDE.md` ("`ipad_history` is immutable") needs a matching exception for the admin-only delete.

### Decision 2026-11-13 — roles
`student` (unchanged), `teacher` (new, read-only), `admin` (unchanged, full rights incl. settings). No "root admin". Only the `teacher` role has to be added (see `TODO.md`, Priority 3, "Roles"); the existing `admin` role keeps its name.

- **`import-pupils-staff-csv`** (OpenSpec, tested manually incl. 1500 pupils; archived, spec `openspec/specs/admin-pupil-staff-import/`): `views/ipad-import.js` became **`views/csv-import.js`** — one dialog "Aus CSV importieren" with a choice iPads / Schüler / Lehrkräfte (table of kinds `CSV_KINDS`; add a new kind there). Buttons "CSV importieren" on the iPad, pupil and staff lists (temporary placement). Formats: pupils `first_name;last_name;address` (address optional; existing = same first + last name + address, case-insensitive); staff `first_name;last_name;kuerzel` (all required; existing = same Kürzel). A pupil file containing `kuerzel` / `serial_number` / `ipad_type` columns is refused (wrong kind chosen). Kürzel unique case-insensitively (index `staff_kuerzel_upper_unique`; `kuerzelErrorText()` in `admin.js` gives the message in "+ Neue Lehrkraft", the edit form and the inline new teacher). **DB:** `pupils.address` is now nullable (decision: the address is a convenience, not a requirement; the Leihvertrag PDF leaves it blank). Both DB changes are logged in `supabase/db-changes.md`. Test data prefix `ZZ` was deleted.

- **`add-person-picker`** (OpenSpec, tested manually; archived, spec `openspec/specs/admin-person-picker/`): the person `<select>` in "iPad zuweisen" is replaced by a search field with a result list (`views/person-picker.js`, styles `.picker-*` in `admin.css`). Matching ignores case, umlauts/accents and ß, words in any order, over name + address (pupils) or name + Kürzel (staff); max 20 results; Enter selects the first. Reusable: `createPersonPicker(rootId, { items, onSelect })` with `items = [{ id, label, sub }]`; the selected id is kept in a hidden `<input id="md-person">`, so `submitAssign()` is unchanged. Pure functions `filterPeople` / `normalizeSearch` are Node-testable.

## Cache-busting (OpenSpec change `cache-busting`)
- All local `<script src>` / `<link rel="stylesheet">` in the five HTML pages carry `?v=<version>` (shared value, e.g. `20261113-1`).
- **Routine:** before every push that changes a `.js` or `.css` file, run `./bump-version.sh` (optional argument = explicit version). CDN URLs are never touched. If forgotten, users may see stale files (e.g. raw translation keys).

## Translation check (OpenSpec change `check-translations`)
- `node check-translations.js` (from the SchulAsset folder) checks DE/EN/TR: missing keys, empty texts, placeholder mismatches, and keys used in `.html`/`.js` but not defined in German (errors, exit code 1); unused keys and computed keys are warnings. Run it after every change to texts.
- State on 2026-11-13: 120 keys per language, no errors.
- **Finding:** the 46 "defined but never used" warnings are real. The main portal view in `portal.js` (greeting, serial number, storage, "Zugewiesen seit", the Übergabe/Rückgabe steps, etc.) is still **hardcoded German**; the keys `portal.greeting`, `portal.statuses.*`, `portal.uebergabe.*`, `portal.rueckgabe.*` exist but are not wired in. Open item in TODO.md. Translation quality (EN/TR) still needs a native speaker.

## Session 14 (2026-11-14) — portal wiring implemented, review change proposed

- **`wire-portal-translations`** implemented, tested manually (DE/EN/TR, all fine) and archived (`openspec/changes/archive/2026-11-14-wire-portal-translations/`, spec `openspec/specs/portal-localisation/`). `portal.js` main screen (greeting, iPad details pop-up, four steps, damage/loss block, download alert) now uses `t()` / `tf()`; `tf(key, {name})` in `translations.js` replaces `{placeholders}`; `formatDate` uses `de-DE` / `en-GB` / `tr-TR`; `setLang()` calls `window.onLangChange` (defined in `portal.js`) so the main screen redraws on language switch. New key groups `portal.main.*`, `portal.steps.*`, `portal.close`, `portal.downloadFailed`; old unused keys (`statuses`, `uebergabe`, `rueckgabe`, `terms*`, `status`, `leihvertrag.downloadBtn`) removed. German output verified identical to the former literals (34 texts). `check-translations.js` now also recognises `tf('key', …)`; result: 118 keys per language, no errors, no unused `portal.*` keys (remaining warnings: unused `login.errorGeneric`, one computed key in `openModal`).
- Damage/loss buttons no longer force a line break (`Schaden<br>melden`); text wraps naturally (looked fine in the manual test).
- Asset version bumped to `20261114-1` (`./bump-version.sh`). Nothing committed or pushed yet.
- **`evaluate-translations`** implemented (manual browser check done, all fine; archived, spec `openspec/specs/translation-review/`): `translation-tools.js` (shared loading/scan code, used by both scripts), `export-translations.js` → `translation-review.csv` (git-ignored; `;`-separated, UTF-8 with BOM; columns key, screen, de, en, tr, comment_en, comment_tr; run `node export-translations.js` after every text change), and `openspec/changes/evaluate-translations/translation-findings.md` (first pass by the coding agent, not a native speaker: 2 certain fixes applied — EN "Pupils / Parents", EN "iPad received" — and 12 suggestions left open). **Decisions 2026-11-14:** German uses "Sie" everywhere (portal + login; 7 du-texts changed, also their HTML fallbacks) and "Leihvertrag" is the only name of the contract (replaced "Nutzungsbedingungen" / "Terms of Use" / "Kullanım Koşulları" in the pop-up title and accept button, the admin history label, and the history note written for new acceptances; old history rows keep the old wording). Still open: a person must do the native-speaker review (see `TODO.md`). Asset version `20261114-2`.

### Teacher lookup + escaping fix (OpenSpec change `add-teacher-lookup`, tested manually and archived 2026-11-14; specs `teacher-lookup`, `teacher-lookup-data`, `admin-output-escaping`)
- **New role `teacher`** (read-only; teachers and repair people). `user_roles.role` is plain text without a CHECK, so no constraint change was needed. The role has **no policy on any table**; its only access is two `SECURITY DEFINER` functions, `lookup_ipad(p_serial)` (exact S/N → id, serial, owner name) and `lookup_ipad_details(p_ipad_id)` (owner incl. address, guardian, Leihvertrag date + version, Übergabeprotokoll, history, Schadenmeldungen; never signatures, IP or password data). Callable by `teacher` and `admin` only. SQL, tests and rollback: `supabase/teacher-lookup.sql`, logged in `supabase/db-changes.md`.
- **`lookup.html` / `lookup.js` / `lookup.css`** (German only, phone first, reuses `admin.css`; no admin or write code is loaded): type or scan a S/N → name only → "Details anzeigen" (data requested only then) → "Verlauf anzeigen". Label maps in `lookup.js` are copies of those in `admin.js` / `ipad-detail.js` — keep in sync. The Leihvertrag link opens the *current* blank template (`document_templates/Leihvertrag_2.1_fillable.pdf`), not necessarily the version the family signed (database says `1.0`; versioning is the open TODO "Editable, versioned Leihvertrag").
- **Login routing:** `pageForRole()` in `auth.js` (`admin` → `admin.html`, `teacher` → `lookup.html`, else `portal.html`), used for login, QR auto-login and after the password reset.
- **Create a teacher account** (by hand, like admins): Studio → Authentication → Users → Add user (e-mail + password, auto-confirm), then in the SQL Editor `INSERT INTO public.user_roles (user_id, role) SELECT id, 'teacher' FROM auth.users WHERE email = '…' ON CONFLICT (user_id) DO UPDATE SET role = 'teacher';`
- **Security fix:** `escape-html.js` (`escapeHtml()`, also escapes `'`) replaces the old `_htmlEsc`; all database text that the admin views and the lookup page put into HTML is escaped (parent-typed damage descriptions and notes were rendered as HTML before). Tested with a hostile damage report. Rule in "Patterns to follow".
- `bump-version.sh` now also covers `lookup.html`.

### Logins for teachers and admins (OpenSpec change `add-teacher-admin-accounts`, tested manually and archived 2026-11-14; specs `staff-accounts`, `staff-account-ui`, `admin-pupil-staff-import`)
- **Edge Function `create-staff-account`** (admin only; source `supabase/functions/create-staff-account/index.ts`, **deployed by hand** in Studio → Edge Functions under exactly this name; redeploy after every edit): creates `teacher` or `admin` logins, 1–50 per call, one result each. Never changes an existing account (registered e-mail → "E-Mail ist bereits registriert"), refuses `@schulasset.local`, deletes the new user again if a later step fails. Passwords: 12 characters, secure random, shown once, not stored. Client helpers in `admin.js`: `createStaffAccounts()`, `showCredentialsDialog()`, `isValidEmail()`.
- **Link:** `staff.user_id` (unique, the login) and `staff.login_email` (display only). SQL: `supabase/staff-accounts.sql`; logged in `supabase/db-changes.md`.
- **Screens (Lehrkräfte):** "+ Neue Lehrkraft" has an optional e-mail → also creates the teacher login; detail page shows the access (or "kein Zugang" + "Zugang einrichten"); list has a "Zugang" column; "+ Neuer Admin" (temporary placement until the admin panel). `closeAdminModal()` now empties the dialog body, so passwords never stay in the hidden page.
- **Lehrkräfte CSV:** optional column `email` (`first_name;last_name;kuerzel;email`); rows with an e-mail get a login after the import; the result dialog offers "Zugangsdaten herunterladen" (`zugangsdaten-lehrkraefte.csv`, `email;password;name`, one-time, in memory only; the file is made safe against spreadsheet formulas). Existing Kürzel rows are skipped including their e-mail (use "Zugang einrichten" for them). Failed logins leave the Lehrkraft saved without access.
- **Not built (see `TODO.md`):** removing or locking an access, admin-side password reset, a "change password" page, forced password change at first login. A forgotten password goes through "Passwort vergessen?" (needs working e-mail sending in Supabase). Login reset texts are now neutral (no "Admin").
- **Note:** `create-ipad-account` still builds `Adjektiv-Nomen-ZZ` passwords with `Math.random` (about 36,000 combinations). Acceptable for iPad portal accounts so far; the staff function uses a stronger scheme. Strengthening the iPad one is a possible later change.

## Where to continue (end of session 14, 2026-11-14)
- **No open OpenSpec change.** Session 14 archived `add-teacher-lookup`, `wire-portal-translations` and `evaluate-translations`. The portal and login are fully localised (DE/EN/TR); the admin area is German only, in "Sie" form (also the two unassign warnings in `views/ipad-detail.js`) and the Last activity view is German too.
- After any text change: `node check-translations.js`, then `node export-translations.js` to refresh the review sheet.
- Before every push that changes a `.js`/`.css` file: `./bump-version.sh`.
- Other small items still open (see TODO.md): active/not-active status for pupils/staff, admin panel (move the add/import buttons), native-speaker review of EN/TR. Distribution (Priority 6) stays for last.
- Working on another computer: `git pull` first; start the local server from the SchulAsset folder (`python3 -m http.server 8080`); the OpenSpec CLI must be installed there (`openspec --version`).
- Loose end: test CSV files may still be on the Desktop of the first computer (safe to delete).

## Session 15 (2026-11-14) — OpenSpec change `add-admin-panel` (done, tested manually, archived; specs `admin-panel`, `admin-system-check`, `school-config`, `admin-pupil-staff-import`)

- **Verwaltung** (`#admin`, `views/admin-panel.js`): sections "Daten hinzufügen" (new iPad / Schüler / Lehrkraft, CSV import of iPads / Schüler / Lehrkräfte), "Zugänge" (new admin), "Schule" (read-only), "Systemprüfung". The add/import buttons are gone from the three lists. To add a feature, add one entry to `ADMIN_PANEL_SECTIONS`. The dialogs still live in their list/import view files; the panel only calls them.
- **CSV import dialog:** opened for one fixed kind (title "Schüler aus CSV importieren"); the kind drop-down was removed so a file cannot be imported as the wrong kind.
- **Systemprüfung** (only when "Prüfung starten" is pressed, read-only): row counts (`head: true, count: 'exact'`) of `ipads`, `pupils`, `staff`, `user_roles`; the two Edge Functions are probed with a **bare POST** (401 = deployed, 404 = missing; nothing runs). An `OPTIONS` probe does *not* work: the browser blocks it because the functions do not allow that method. Also: warning for iPads with serial `ZZ…`, check that the logo file loads, asset version.
- **School identity = config file** (decision 2026-11-14; a static GitHub Pages site cannot write files from the browser, and the user did not want it in the database): `school-config.js` defines `window.SCHOOL = { name, fullName, authority, logo }` (defaults = current values) and `applySchoolBranding()`, which fills `img[data-school-logo]` and `[data-school-name]` with `textContent`. Used by login, portal, lookup, the A5 print card, and `doc-generator.js` (`SCHOOL.name` → PDF field `school_name`). The sidebar keeps the product name "SchulAsset"; legal pages stay static. After changing the logo file: Cmd+Shift+R; after changing the config: `./bump-version.sh`. `authority` is not used in any text yet (portal Leihvertrag sentence "Eigentum der Stadt Marl" is still fixed).
- No database change. Asset version `20261114-11`. Nothing committed yet.

## Where to continue (end of session 15, 2026-11-14)
- **No open OpenSpec change.** Uncommitted: everything from session 15 (needs the user's OK to commit and push; run `./bump-version.sh` again only if more `.js`/`.css` files change).
- Next candidates (see TODO.md, Priority 3): active/not-active status for pupils/staff; manage existing logins (lock/remove, admin password reset, change-password page) as a new panel section; editable, versioned Leihvertrag; manual export + delete of old data (needs the active status and a settings table).
- Local server: `python3 -m http.server 8080` in the SchulAsset folder.
