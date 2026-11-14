// Edge Function: create-staff-account
//
// Creates logins for teachers and admins. Only callable by an admin.
//
// Request:  POST { accounts: [ { email, role: 'teacher' | 'admin', staff_id? } ] }   (1 to 50 entries)
// Response: { results: [ { email, password } | { email, error } ] }   — one result per entry,
//           HTTP 200 even when single entries fail, so one bad address does not lose the others.
//
// Rules (see openspec change `add-teacher-admin-accounts`):
//   - An e-mail that is already registered is REFUSED. This function never changes an existing
//     account (no password reset, no role change) — unlike create-ipad-account.
//   - Addresses ending in @schulasset.local belong to the iPad portal and are refused.
//   - staff_id (optional) links the new login to a Lehrkraft; only for the role teacher.
//   - If a step after creating the user fails, the user is deleted again (no half-made accounts).
//   - Passwords come from crypto.getRandomValues, are returned once and are never stored or logged.
//
// Deploy: paste into Supabase Studio → Edge Functions → create-staff-account → Deploy.
// Studio has no automatic deployment from the repo: redeploy after every change here.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MAX_ENTRIES = 50

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// JSON response that always carries CORS headers, so the browser can read errors too.
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

// 12 random characters, no look-alikes (no 0 O 1 l I), shown in groups of four: K7mP-x3Qz-9TfA.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'

function generatePassword(): string {
  // Rejection sampling: bytes above the largest multiple of the alphabet size are skipped,
  // so every character is equally likely (no modulo bias).
  const limit = 256 - (256 % ALPHABET.length)
  const chars: string[] = []
  while (chars.length < 12) {
    const bytes = new Uint8Array(24)
    crypto.getRandomValues(bytes)
    for (const b of bytes) {
      if (b < limit && chars.length < 12) chars.push(ALPHABET[b % ALPHABET.length])
    }
  }
  return chars.join('').match(/.{4}/g)!.join('-')
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// True if createUser failed because the e-mail is already registered.
function isEmailExistsError(err: { code?: string; status?: number; message?: string } | null): boolean {
  if (!err) return false
  return err.code === 'email_exists' || /already/i.test(err.message ?? '')
}

type Entry = { email?: unknown; role?: unknown; staff_id?: unknown }
type Result = { email: string; password: string } | { email: string; error: string }

// Creates ONE login. Never throws for expected problems: they come back as { email, error }.
// deno-lint-ignore no-explicit-any
async function createOne(adminClient: any, entry: Entry): Promise<Result> {
  const email   = String(entry?.email ?? '').trim().toLowerCase()
  const role    = entry?.role
  const staffId = entry?.staff_id ?? null
  const fail = (error: string): Result => ({ email, error })

  if (email.length > 254 || !EMAIL_RE.test(email)) return fail('Ungültige E-Mail-Adresse')
  if (email.endsWith('@schulasset.local'))         return fail('Diese Adresse ist für iPad-Konten reserviert')
  if (role !== 'teacher' && role !== 'admin')      return fail('Unbekannte Rolle')

  if (staffId !== null) {
    if (role !== 'teacher') return fail('Eine Lehrkraft kann nur den Zugang „teacher“ erhalten')
    const { data: staff, error } = await adminClient
      .from('staff').select('id, user_id').eq('id', staffId).maybeSingle()
    if (error)           return fail('Lehrkraft konnte nicht gelesen werden: ' + error.message)
    if (!staff)          return fail('Lehrkraft nicht gefunden')
    if (staff.user_id)   return fail('Diese Lehrkraft hat bereits einen Zugang')
  }

  const password = generatePassword()
  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email, password, email_confirm: true,
  })
  if (createError || !created?.user) {
    return fail(isEmailExistsError(createError)
      ? 'E-Mail ist bereits registriert'
      : (createError?.message ?? 'Konto konnte nicht angelegt werden'))
  }
  const userId = created.user.id

  // From here on, a failure removes the new user again (user_roles and the staff link clear with it).
  const rollback = async (message: string): Promise<Result> => {
    await adminClient.auth.admin.deleteUser(userId)
    return fail(message)
  }

  const { error: roleError } = await adminClient
    .from('user_roles').upsert({ user_id: userId, role }, { onConflict: 'user_id' })
  if (roleError) return rollback('Rolle konnte nicht gespeichert werden: ' + roleError.message)

  if (staffId !== null) {
    const { error: linkError } = await adminClient
      .from('staff').update({ user_id: userId, login_email: email }).eq('id', staffId)
    if (linkError) return rollback('Verknüpfung mit der Lehrkraft fehlgeschlagen: ' + linkError.message)
  }

  return { email, password }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const supabaseUrl    = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey        = Deno.env.get('SUPABASE_ANON_KEY')!
    const authHeader     = req.headers.get('Authorization')

    if (!authHeader) {
      return json({ error: 'Unauthorized' }, 401)
    }

    // The caller must be a logged-in admin (checked with the caller's own token).
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: userError } = await callerClient.auth.getUser()
    if (userError || !user) {
      return json({ error: 'Unauthorized' }, 401)
    }
    const { data: roleRow } = await callerClient
      .from('user_roles').select('role').eq('user_id', user.id).single()
    if (!roleRow || roleRow.role !== 'admin') {
      return json({ error: 'Forbidden' }, 403)
    }

    const body = await req.json()
    const accounts = body?.accounts
    if (!Array.isArray(accounts) || accounts.length < 1 || accounts.length > MAX_ENTRIES) {
      return json({ error: `accounts must contain 1 to ${MAX_ENTRIES} entries` }, 400)
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    // One after the other: simple, and a batch of 25 takes only a few seconds.
    const results: Result[] = []
    for (const entry of accounts) {
      results.push(await createOne(adminClient, entry))
    }

    return json({ results })
  } catch (err) {
    return json({ error: (err as Error).message }, 500)
  }
})
