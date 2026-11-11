# SchulAsset — Status Quo & Road Map

Last updated: 2026-11-10 (session 11 complete — legal pages via OpenSpec)

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

### Known issue
- **Edge Function 1000-account limit** — `create-ipad-account` finds existing accounts via `listUsers({ perPage: 1000 })`. With more than 1000 portal accounts, an account not on that first page is not found → `createUser` fails with "already registered" → reassignment / password reset fails. Fix: look the user up by email instead of listing all users.

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
