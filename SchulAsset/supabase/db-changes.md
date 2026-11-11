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
