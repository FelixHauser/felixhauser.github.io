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
