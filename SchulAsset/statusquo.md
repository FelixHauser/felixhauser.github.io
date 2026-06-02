# SchulAsset — Status Quo & Road Map

Last updated: 2026-06-02 (session 8 — full session committed & pushed to GitHub)

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
- **Leihvertrag (terms)** — accept button if not yet done; optional guardian fields (erz_first_name, erz_last_name, erz_address — only if different from pupil); writes to `terms_acceptance` + `ipad_history`; shows download button once accepted → downloads filled **Leihvertrag.docx** (Word template via docxtemplater)
- **Schadenmeldung** — modal form (damage type, description, datum_eingetreten, datum_entdeckt, perpetrator); writes to `schadenmeldung` + `ipad_history`; shows download button → downloads filled **Schadensmeldung.docx** (Word template via docxtemplater)
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
- PDF conversion Edge Function (documents currently download as .docx)

---

## File structure

```
SchulAsset/
  login.html / login.css         — login page (school logo, medium blue bg)
  auth.js                        — login logic, role detection, routing
  supabase-client.js             — Supabase client (credentials hardcoded, anon key, safe)
  translations.js                — i18n: DE (default), EN, TR; covers login + full portal
  doc-generator.js               — document generation: docxtemplater for Leihvertrag + Schadenmeldung (fills Word templates → .docx); jsPDF for Verlustmeldung, Übergabeprotokoll, Rückgabeprotokoll (→ .pdf). Loaded in both portal.html and admin.html.
  views/meldungen.js             — admin Meldungen view: tabbed list of all Schadenmeldungen + Verlustmeldungen with download buttons
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
  document_templates/            — original .docx files (for reference; not used at runtime)
  mlks_logo.png                  — school logo (used in login card + portal header)
  CLAUDE.md                      — project instructions for coding agent
  statusquo.md                   — this file
```

---

## Database schema (as of session 3)

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
| docxtemplater CDN | Use jsDelivr with pinned versions: pizzip@3.1.7 + docxtemplater@3.44.0 — unpkg resolves @3 to a broken build |
| docxtemplater global name | Use `window.Docxtemplater \|\| window.docxtemplater` — name varies across CDN builds |
| Word splits `{placeholder}` across XML runs | Delete and retype the placeholder in Word in plain text with no mid-word formatting changes |
| Download button only available immediately after submit | Schadenmeldung/Verlustmeldung download appears in modal success state only; downloading past reports is a Priority 2/3 item |
| Client-side docx → PDF conversion | Rejected. New approach: pdf-lib fills named form fields in a PDF template directly in the browser — no server needed. Leihvertrag + Schadenmeldung only (Priority 1) |

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

pdf-lib loaded via CDN in `admin.html` and `portal.html`. `generateLeihvertrag()` and `generateSchadenmeldung()` in `doc-generator.js` updated accordingly. docxtemplater still used for nothing (can be removed eventually).

---

### ~~Priority 2 — Dashboard enhancements~~ ✅ Done

Recent activity is covered by the dedicated **Last activity** nav item (clock icon → last 50 `ipad_history` entries). Embedding it in the iPads view was dropped to avoid overcrowding.

---

### ~~Session 7 — Password reset~~ ✅ Done

- **Student portal password reset** — "Passwort zurücksetzen" button on iPad detail (shown when assigned to pupil); calls `create-ipad-account` Edge Function; shows new password in modal
- **Admin forgot password** — "Passwort vergessen?" link on login page; sends Supabase reset email; recovery token detected on return → new password form shown inline

### ~~Session 8 — New statuses, timeline portal, QR login~~ ✅ Done

- **New iPad statuses** — `terms_pending` (assigned, Leihvertrag not yet signed) and `handover_pending` (Übergabeprotokoll created, not yet signed by student); assignment now sets `terms_pending` instead of `in_use`
- **Automatic status flow** — DB triggers handle status transitions: Übergabeprotokoll accepted → `in_use`; Zuweisung aufheben → `available`
- **Übergabeprotokoll button logic fixed** — only appears after Leihvertrag is accepted; was previously in the wrong branch and never showed
- **Timeline portal UI** — portal completely redesigned as a 4-step vertical timeline (Leihvertrag → iPad erhalten → In Verwendung → Rückgabe); iPad details hidden behind an info button; damage/loss buttons shown only when `in_use`; protocol condition shown before confirmation
- **QR code login** — password modal now shows QR code; admin can print an A5 card (school logo, pupil name, QR code, URL, username, password); scanning the QR auto-logs in the student with no typing
- **Kürzel pre-fill** — Übergabe/Rückgabe modals remember last used Kürzel via localStorage
- **Refresh button** on iPad detail view
- **DB triggers** — `on_ipad_auth_user` upserts `user_roles` on auth account create/update; `on_uebergabe_accepted` flips iPad to `in_use` when student signs; `unique constraint` on `user_roles.user_id`
- **History entries** written when student accepts Übergabe/Rückgabeprotokoll

### ~~Session 7b — iPad detail redesign + Eigenreparatur~~ ✅ Done

- **iOS-style action table** — grouped sections: Status (prominent) / Meldungen / Aktionen / Sicherheit; each section a rounded card with tappable rows and chevrons
- **Dokumente section** — direct download cards for Leihvertrag, Übergabeprotokoll, Rückgabeprotokoll; only shown when the document exists for the current assignment
- **Übergabeprotokoll button** — hidden once the family has accepted; reappears on reassignment
- **Eigenreparatur status** (purple `#5856d6`) — in-house maintenance; assignment preserved; status modal shows checkboxes (Software-Update, Zurücksetzen, Datenlöschung, Intune-Anmeldung) + free-text field; selections appended to history note

---

## Patterns to follow

- **New admin view**: create `views/my-view.js` with `renderMyView()`, add `<script>` to `admin.html` before `lucide.createIcons(); initAdmin();`, add to `VIEW_RENDERERS` in `admin.js`
- **Navigation to detail**: set `window._currentFooId = id` then `window.location.hash = 'foo-detail'`
- **New table**: `GRANT SELECT ON public.table TO authenticated` + `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` + create policy
- **Student RLS policies**: always use `upper(split_part(auth.email(), '@', 1))` for serial number comparison
- **Admin RLS policies**: use `EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')`
- **UI strings**: add to all three languages (de, en, tr) in `translations.js`, use `t('key')` in code
- **Document download (Word template)**: `generateLeihvertrag(data)` and `generateSchadenmeldung(data)` are **async** — fetch the .docx from `document_templates/`, fill with docxtemplater, download as .docx. Always `await` them and wrap in try/catch.
- **Document download (jsPDF)**: `generateVerlustmeldung(data)`, `generateUebergabeprotokoll(data)`, `generateRueckgabeprotokoll(data)` are **synchronous** — generate PDF in-browser and save directly.
- **Global state in portal.js**: `_ipad`, `_pupilName`, `_termsRow`, `_uebergabe`, `_rueckgabe` — use these to build data objects for document generation.
