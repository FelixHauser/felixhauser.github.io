# Manual database changes (log)

Every SQL statement or setting we change by hand in Supabase (SQL Editor, Auth settings, etc.) is logged here, newest at the bottom.

**Why:** these changes exist only in the live database, not in the repo. When the schema is exported to `supabase/schema.sql` (see `TODO.md`, Priority 1), this file is the checklist of what the export must contain. Nothing here should get lost.

**Rule:** after running anything by hand in Supabase, add an entry below (date, what, why, the SQL).

---

## 2026-11-11 — service_role may write to user_roles

**Why:** the Edge Function `create-ipad-account` failed with `permission denied for table user_roles` when saving the student role.

```sql
GRANT SELECT, INSERT, UPDATE ON public.user_roles TO service_role;
```

## 2026-11-13 — admins may insert iPads; serial numbers unique case-insensitively

**Why:** OpenSpec change `add-individual-ipads` (admin "+ Neues iPad"). `ipads` had no INSERT grant or policy. A unique constraint on `serial_number` (`ipads_serial_number_key`) already existed; the extra index makes it case-insensitive.

```sql
GRANT INSERT ON public.ipads TO authenticated;

CREATE POLICY admin_insert_ipads ON public.ipads
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE UNIQUE INDEX IF NOT EXISTS ipads_serial_number_unique
  ON public.ipads (upper(serial_number));
```

Existing constraints on `ipads` (for the schema export): `ipads_pkey`, `ipads_serial_number_key UNIQUE (serial_number)`, `only_one_assignment` CHECK, FKs `ipads_assigned_pupil_id_fkey` / `ipads_assigned_staff_id_fkey` (ON DELETE SET NULL). No CHECK constraints on `ipad_type` / `storage_capacity`.

## 2026-11-13 — staff Kürzel unique case-insensitively

**Why:** OpenSpec change `import-pupils-staff-csv`. A Kürzel identifies a teacher and must be unique. `staff_kuerzel_key UNIQUE (kuerzel)` already existed but is case-sensitive (`bei` and `BEI` would both be allowed), while the import and the forms treat them as the same.

```sql
CREATE UNIQUE INDEX IF NOT EXISTS staff_kuerzel_upper_unique
  ON public.staff (upper(kuerzel));
```

Existing indexes on `staff` (for the schema export): `staff_pkey (id)`, `staff_kuerzel_key (kuerzel)`.

## 2026-11-13 — pupil address is optional

**Why:** OpenSpec change `import-pupils-staff-csv`. `pupils.address` was NOT NULL, but the forms ("Adresse (optional)"), the lists (`address ?? '—'`) and the CSV import treat the address as optional; saving a pupil without an address failed with `null value in column "address" … violates not-null constraint`. Decision: the address is a convenience, not a requirement. (The Leihvertrag PDF leaves the address field blank for such pupils.)

```sql
ALTER TABLE public.pupils ALTER COLUMN address DROP NOT NULL;
```

## 2026-11-14 — teacher role: two lookup functions

**Why:** OpenSpec change `add-teacher-lookup`. Teachers and repair people look up ONE iPad by exact serial number (owner's name first, details after a click). The role `teacher` gets **no policy on any table**; it can only call two functions. `user_roles.role` is plain `text` without a CHECK constraint, so the new value `teacher` needed no change (`ipads.id` is `uuid`; policy "Users can read their own role" `SELECT (user_id = auth.uid())` lets every role read its own row).

**SQL:** `supabase/teacher-lookup.sql` (PART 1) — `lookup_ipad(p_serial text)` and `lookup_ipad_details(p_ipad_id uuid)`; both `SECURITY DEFINER`, `SET search_path = public`, refuse everybody except roles `teacher` / `admin`; `REVOKE ALL … FROM PUBLIC, anon`, `GRANT EXECUTE … TO authenticated`. The details never contain signature images, IP addresses or portal password data.

**Tested (PART 3 of the SQL file, run in a rolled-back transaction):** teacher → step 1 works (also lower case), partial serial → null, `ipads` / `pupils` not readable directly (0 rows), step 2 returns the details; student → `not allowed`; anon → `permission denied for function`.

**How to create a teacher account** (same as for admins, by hand):
1. Studio → Authentication → Users → Add user → Create new user: e-mail + password, tick "Auto Confirm User".
2. SQL Editor:
```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'teacher' FROM auth.users WHERE email = 'teacher@example.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'teacher';
```
`user_roles.user_id` is unique, so one role per user. Remove the account's role (or delete the user) to take access away.

**Rollback:** `DROP FUNCTION public.lookup_ipad(text); DROP FUNCTION public.lookup_ipad_details(uuid);`
