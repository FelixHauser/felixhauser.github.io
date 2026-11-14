-- teacher-lookup.sql — database part of the OpenSpec change `add-teacher-lookup`.
--
-- HOW TO RUN: Supabase Studio → SQL Editor → paste PART 1 → Run.
--             Then create the test account (PART 2), then run the check (PART 3).
-- The role value `teacher` needs no change: user_roles.role is plain text without a CHECK.
-- Logged in supabase/db-changes.md.

-- ======================================================================
-- PART 1 — the two lookup functions
-- ======================================================================
-- The `teacher` role has NO policy on any table. It can only call these two functions,
-- which return one iPad at a time. Callers must be logged in as teacher or admin.

-- Step 1 of the lookup page: exact serial number → id, serial number, owner's name.
CREATE OR REPLACE FUNCTION public.lookup_ipad(p_serial text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('teacher', 'admin')
  ) THEN
    RAISE EXCEPTION 'not allowed' USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_build_object(
           'ipad_id',       i.id,
           'serial_number', i.serial_number,
           'owner_name',    COALESCE(p.first_name || ' ' || p.last_name,
                                     s.first_name || ' ' || s.last_name)
         )
    INTO v_result
    FROM public.ipads i
    LEFT JOIN public.pupils p ON p.id = i.assigned_pupil_id
    LEFT JOIN public.staff  s ON s.id = i.assigned_staff_id
   WHERE upper(i.serial_number) = upper(trim(p_serial))
   LIMIT 1;

  RETURN v_result;   -- null when no iPad has exactly this serial number
END;
$$;

REVOKE ALL ON FUNCTION public.lookup_ipad(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.lookup_ipad(text) TO authenticated;


-- Step 2 (after "Details anzeigen"): everything the page shows for ONE iPad.
-- Never returned: signature images, IP addresses, portal password data, other iPads.
CREATE OR REPLACE FUNCTION public.lookup_ipad_details(p_ipad_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ipad      public.ipads%ROWTYPE;
  v_terms     public.terms_acceptance%ROWTYPE;
  v_has_terms boolean;
  v_result    jsonb;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('teacher', 'admin')
  ) THEN
    RAISE EXCEPTION 'not allowed' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_ipad FROM public.ipads WHERE id = p_ipad_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Current Leihvertrag acceptance (not invalidated), newest first.
  SELECT * INTO v_terms
    FROM public.terms_acceptance
   WHERE ipad_id = p_ipad_id AND invalidated_at IS NULL
   ORDER BY accepted_at DESC
   LIMIT 1;
  v_has_terms := FOUND;

  SELECT jsonb_build_object(
    'ipad', jsonb_build_object(
      'serial_number',    v_ipad.serial_number,
      'ipad_type',        v_ipad.ipad_type,
      'storage_capacity', v_ipad.storage_capacity,
      'status',           v_ipad.status,
      'assigned_date',    v_ipad.assigned_date
    ),

    -- Owner: name for everybody, address for pupils only.
    'owner', CASE
      WHEN v_ipad.assigned_pupil_id IS NOT NULL THEN
        (SELECT jsonb_build_object('kind', 'pupil', 'first_name', p.first_name,
                                   'last_name', p.last_name, 'address', p.address)
           FROM public.pupils p WHERE p.id = v_ipad.assigned_pupil_id)
      WHEN v_ipad.assigned_staff_id IS NOT NULL THEN
        (SELECT jsonb_build_object('kind', 'staff', 'first_name', s.first_name,
                                   'last_name', s.last_name)
           FROM public.staff s WHERE s.id = v_ipad.assigned_staff_id)
      ELSE NULL
    END,

    -- Guardian, only if the family entered one in the Leihvertrag.
    'guardian', CASE
      WHEN v_has_terms AND (v_terms.erz_first_name IS NOT NULL
                         OR v_terms.erz_last_name  IS NOT NULL
                         OR v_terms.erz_address    IS NOT NULL)
      THEN jsonb_build_object('first_name', v_terms.erz_first_name,
                              'last_name',  v_terms.erz_last_name,
                              'address',    v_terms.erz_address)
      ELSE NULL
    END,

    -- Leihvertrag: date and version only (no signature).
    'terms', CASE
      WHEN v_has_terms
      THEN jsonb_build_object('accepted_at', v_terms.accepted_at,
                              'terms_version', v_terms.terms_version)
      ELSE NULL
    END,

    -- Latest Übergabeprotokoll of the current assignment (same rule as the portal).
    'uebergabe', (
      SELECT jsonb_build_object('kurzel', u.kurzel, 'condition', u.condition,
                                'maengel', u.maengel, 'notes', u.notes,
                                'created_at', u.created_at, 'accepted_at', u.accepted_at)
        FROM public.uebergabeprotokoll u
       WHERE u.ipad_id = p_ipad_id
         AND u.created_at >= COALESCE(v_ipad.assigned_date, '1970-01-01')
       ORDER BY u.created_at DESC
       LIMIT 1
    ),

    'history', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'event_type', h.event_type, 'status', h.status,
               'assigned_to', h.assigned_to, 'changed_by', h.changed_by,
               'changed_at', h.changed_at, 'notes', h.notes)
             ORDER BY h.changed_at DESC)
        FROM public.ipad_history h WHERE h.ipad_id = p_ipad_id
    ), '[]'::jsonb),

    'schaden', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'damage_type', sm.damage_type, 'description', sm.description,
               'filed_by', sm.filed_by, 'filed_at', sm.filed_at,
               'datum_eingetreten', sm.datum_eingetreten, 'datum_entdeckt', sm.datum_entdeckt,
               'perpetrator', sm.perpetrator, 'resolved_at', sm.resolved_at)
             ORDER BY sm.filed_at DESC)
        FROM public.schadenmeldung sm WHERE sm.ipad_id = p_ipad_id
    ), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.lookup_ipad_details(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.lookup_ipad_details(uuid) TO authenticated;


-- ======================================================================
-- PART 2 — a test teacher account (run AFTER creating the user in Studio)
-- ======================================================================
-- 1. Studio → Authentication → Users → "Add user" → "Create new user":
--    real or test e-mail + password, tick "Auto Confirm User".
-- 2. Put that e-mail below and run only this statement.
--
-- INSERT INTO public.user_roles (user_id, role)
-- SELECT id, 'teacher' FROM auth.users WHERE email = 'TEACHER-EMAIL@example.com'
-- ON CONFLICT (user_id) DO UPDATE SET role = 'teacher';
--
-- Check: SELECT u.email, r.role FROM auth.users u JOIN public.user_roles r ON r.user_id = u.id
--        WHERE u.email = 'TEACHER-EMAIL@example.com';


-- ======================================================================
-- PART 3 — tests (SQL Editor; each runs inside a transaction that is rolled back)
-- ======================================================================
-- Replace TEST-EMAIL with the test teacher's e-mail and SERIAL with a real serial number
-- (take one from the admin iPad list). Run each test on its own.

-- Test A — as the teacher: step 1 works (also in lower case), a partial serial gives null,
--          the tables can NOT be read directly (counts must be 0), step 2 returns the details.
-- begin;
-- select set_config('request.jwt.claims',
--   json_build_object('sub', (select id from auth.users where email = 'TEST-EMAIL'),
--                     'role', 'authenticated')::text, true);
-- set local role authenticated;
-- select
--   public.lookup_ipad(lower('SERIAL'))                       as step1,
--   public.lookup_ipad(substr('SERIAL', 1, 4))                as partial_must_be_null,
--   (select count(*) from public.ipads)                       as ipads_directly_must_be_0,
--   (select count(*) from public.pupils)                      as pupils_directly_must_be_0,
--   public.lookup_ipad_details((public.lookup_ipad('SERIAL')->>'ipad_id')::uuid) as step2;
-- rollback;

-- Test B — as a student: must fail with "not allowed".
-- begin;
-- select set_config('request.jwt.claims',
--   json_build_object('sub', (select user_id from public.user_roles where role = 'student' limit 1),
--                     'role', 'authenticated')::text, true);
-- set local role authenticated;
-- select public.lookup_ipad('SERIAL');
-- rollback;

-- Test C — not logged in (anon): must fail with "permission denied for function".
-- begin;
-- set local role anon;
-- select public.lookup_ipad('SERIAL');
-- rollback;
