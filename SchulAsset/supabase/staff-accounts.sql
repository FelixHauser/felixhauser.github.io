-- staff-accounts.sql — database part of the OpenSpec change `add-teacher-admin-accounts`.
--
-- HOW TO RUN: Supabase Studio → SQL Editor → paste PART 1 → Run.
-- Logged in supabase/db-changes.md.

-- ======================================================================
-- PART 1 — link a Lehrkraft (staff row) to a login
-- ======================================================================
-- user_id      the login (Supabase Auth user) of this Lehrkraft; unique; cleared automatically
--              when the login is deleted in Studio.
-- login_email  the e-mail of that login, stored only to DISPLAY it (the browser cannot read
--              the list of logins).
ALTER TABLE public.staff
  ADD COLUMN IF NOT EXISTS user_id     uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS login_email text;

-- The Edge Function `create-staff-account` writes the link with the service role.
GRANT SELECT, UPDATE ON public.staff TO service_role;

-- Check (should list both new columns):
-- SELECT column_name, data_type FROM information_schema.columns
--  WHERE table_schema = 'public' AND table_name = 'staff' ORDER BY ordinal_position;

-- Rollback (nothing else depends on the columns):
-- ALTER TABLE public.staff DROP COLUMN user_id, DROP COLUMN login_email;
