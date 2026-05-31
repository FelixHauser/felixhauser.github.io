# CLAUDE.md — SchulAsset Coding Agent Instructions

---

## Project overview

**SchulAsset** is an internal web app for managing iPads at the Martin Luther King Schule in Marl, NRW. The school manages 1000+ iPads belonging to the Stadt Marl, leased free of charge to pupils. It replaces a cumbersome Logineo database.

**Developer:** Marçal, teacher and IT responsible. Experienced iOS/SwiftUI developer, new to web development. Code must be clean, readable, and well commented.

---

## Tech stack

- **Supabase** — PostgreSQL database, Auth, REST API (Frankfurt region)
- **Vanilla HTML / CSS / JavaScript** — no frameworks for the proof of concept
- **Hosted on GitHub Pages** — static folder on Marçal's existing site
- **JSON translation files** — localisation (de, en, tr), German is default

---

## Supabase project

- Already created and configured
- Tables, Auth, and dummy data are all in place
- The Supabase URL and anon key will be provided separately — use a `config.js` file to store them, never hardcode in source

---

## Database tables

### pupils
```
id, first_name, last_name, address, intune_login (nullable), created_at
```

### staff
```
id, first_name, last_name, kuerzel, created_at
```

### ipads
```
id, serial_number, ipad_type (student/staff), storage_capacity (64gb/128gb/256gb),
status, assigned_pupil_id (nullable → pupils), assigned_staff_id (nullable → staff),
assigned_date, portal_password_hash (nullable), created_at
```

**iPad statuses:**
```
available, in_use, prepared_for_repair, shipped_for_repair,
back_from_repair, to_be_erased, lost, stolen, decommissioned
```

### ipad_history
```
id, ipad_id → ipads, event_type, status, assigned_to (text), changed_by (text),
changed_at, notes
```

**Event types:**
```
assignment, status_change, terms_accepted, schadenmeldung, verlustmeldung, returned, reassigned
```

### schadenmeldung
```
id, ipad_id → ipads, damage_type (screen/water/other), description, filed_by, filed_at, pdf_url
```

### verlustmeldung
```
id, ipad_id → ipads, date_of_loss, circumstances, police_report_number (nullable),
filed_by, filed_at, pdf_url
```

### terms_acceptance
```
id, ipad_id → ipads, accepted_at, ip_address (nullable), terms_version
```

### user_roles
```
id, user_id → auth.users, role (admin/student), created_at
```

---

## Authentication

Two user types:

**Admin**
- Logs in with real email and password
- Full access to everything
- Created manually in Supabase Auth dashboard

**Student/parent**
- Logs in with serial number as username + `@schulasset.local` suffix (added by app, invisible to user)
- Password is a human-friendly generated string e.g. `Blau-Hund-42`
- Can only see their own iPad
- Account created by admin when iPad is assigned

After login, check `user_roles` table to determine which interface to show.

Public signups are disabled. Email confirmation is disabled.

---

## App structure

### Admin interface
- Dashboard — overview counts by status
- iPad list — searchable, filterable by status and type
- iPad detail — full history, actions (assign, change status, file reports)
- Pupil list — searchable
- Pupil detail — linked iPads, history
- Staff list
- Staff detail

### Student/parent portal
- Single iPad view — details and current status
- Accept terms and conditions
- File Schadenmeldung
- File Verlustmeldung
- Localised: German (default), English, Turkish

---

## Key business rules

- Only one of `assigned_pupil_id` or `assigned_staff_id` can be set at a time on an iPad
- Assignment stays during repairs — only the status changes
- When a student leaves, `assigned_pupil_id` is set to NULL — iPad stays in system
- Lost and stolen are separate statuses — both trigger a Verlustmeldung
- `ipad_history` is immutable — append only, never update or delete rows
- Names are hardcoded as text in history rows at write time (audit trail survives deletions)
- Student portal login: serial number typed by user, app appends `@schulasset.local` before sending to Supabase Auth

---

## Localisation

Three languages: German (de), English (en), Turkish (tr). German is default.
Use JSON translation files. All UI strings must go through the translation system — no hardcoded German in the interface.

---

## What to build first (proof of concept)

1. Login page — single form, handles both admin and student login
2. After login, check `user_roles` and route to correct interface
3. Admin: iPad list with status badges, search, filter
4. Admin: iPad detail page with history
5. Student portal: single iPad view

RLS policies in Supabase will need to be configured alongside each view as it is built.

---

## Code style

- Clean, readable, well commented
- No frameworks for proof of concept — vanilla JS only
- Separate files for: auth, supabase client, translations, each major view
- `config.js` for Supabase URL and anon key (gitignored)
