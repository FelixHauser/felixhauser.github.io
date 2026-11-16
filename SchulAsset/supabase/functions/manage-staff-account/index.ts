// Edge Function: manage-staff-account
//
// Lists, locks, unlocks, deletes and sets new passwords for logins of teachers and admins.
// Only callable by an admin. (OpenSpec change `manage-logins`.)
//
// Request:  POST { action: 'list' }                       all teacher and admin logins
//           POST { action: 'list', user_ids: [uuid, …] }  only these (1 to 50; fast, for one detail page)
//           POST { action: 'lock' | 'unlock' | 'delete' | 'reset_password', user_ids: [uuid, …] }   (1 to 50)
// Response: list           → { logins: [ { user_id, email, role, locked, last_sign_in_at } ] }
//           the others     → { results: [ { user_id, email, ok: true, password? } | { user_id, error } ] }
//                            one result per id, HTTP 200 even when single entries fail.
//
// Rules:
//   - Only logins with a user_roles row of role 'teacher' or 'admin' are touched. Addresses ending
//     in @schulasset.local (iPad portal logins) are always refused.
//   - lock = Supabase Auth ban (reversible, stored by Supabase); unlock removes the ban.
//   - delete removes the Auth user. user_roles and staff.user_id clear with it; the Lehrkraft stays
//     (staff.login_email is cleared here first).
//   - You cannot lock or delete your own login, and a lock/delete is refused if it would leave no
//     active admin (counted over the whole call).
//   - reset_password: 12 random characters, returned once, never stored or logged.
//
// Deploy: paste into Supabase Studio → Edge Functions → manage-staff-account → Deploy.
// Studio has no automatic deployment from the repo: redeploy after every change here.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MAX_ENTRIES = 50

// "Locked" = banned for about 100 years. unlock = 'none'.
const LOCK_DURATION = '876000h'

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
// Same generator as create-staff-account.
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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type Role = 'teacher' | 'admin'
type Result =
  | { user_id: string; email: string; ok: true; password?: string }
  | { user_id: string; error: string }

// True if the Auth user is currently banned.
// deno-lint-ignore no-explicit-any
function isLocked(user: any): boolean {
  return !!user?.banned_until && new Date(user.banned_until).getTime() > Date.now()
}

// All user_roles rows of teachers and admins (paged, so more than 1000 rows would still work).
// deno-lint-ignore no-explicit-any
async function loadRoleRows(adminClient: any): Promise<{ user_id: string; role: Role }[]> {
  const rows: { user_id: string; role: Role }[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await adminClient
      .from('user_roles').select('user_id, role').in('role', ['teacher', 'admin'])
      .order('user_id').range(from, from + 999)
    if (error) throw new Error('Rollen konnten nicht gelesen werden: ' + error.message)
    rows.push(...data)
    if (data.length < 1000) break
  }
  return rows
}

// List: teacher and admin logins only (never the iPad portal logins).
// With `onlyIds` only those logins are read (one lookup each): much faster than paging through
// every Auth user, which also includes all iPad portal logins.
// deno-lint-ignore no-explicit-any
async function listLogins(adminClient: any, onlyIds: string[] | null) {
  const roleRows = (await loadRoleRows(adminClient)).filter(r => !onlyIds || onlyIds.includes(r.user_id))
  const roleById = new Map(roleRows.map(r => [r.user_id, r.role]))

  const logins = []

  if (onlyIds) {
    const found = await Promise.all(roleRows.map(r => adminClient.auth.admin.getUserById(r.user_id)))
    for (const { data } of found) {
      const u = data?.user
      const role = u && roleById.get(u.id)
      if (!u || !role || (u.email ?? '').toLowerCase().endsWith('@schulasset.local')) continue
      logins.push({
        user_id: u.id, email: u.email ?? '', role,
        locked: isLocked(u), last_sign_in_at: u.last_sign_in_at ?? null,
      })
    }
    return logins
  }

  // The Auth user list also holds all portal logins; page through it and keep only our ids.
  for (let page = 1; ; page++) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw new Error('Zugänge konnten nicht gelesen werden: ' + error.message)
    for (const u of data.users) {
      const role = roleById.get(u.id)
      if (!role || (u.email ?? '').toLowerCase().endsWith('@schulasset.local')) continue
      logins.push({
        user_id: u.id, email: u.email ?? '', role,
        locked: isLocked(u), last_sign_in_at: u.last_sign_in_at ?? null,
      })
    }
    if (data.users.length < 1000) break
  }
  return logins
}

// Ids of the admins that are currently not locked (needed for the "last admin" rule).
// deno-lint-ignore no-explicit-any
async function activeAdminIds(adminClient: any): Promise<Set<string>> {
  const adminIds = (await loadRoleRows(adminClient)).filter(r => r.role === 'admin').map(r => r.user_id)
  const active = new Set<string>()
  for (const id of adminIds) {
    const { data } = await adminClient.auth.admin.getUserById(id)
    if (data?.user && !isLocked(data.user)) active.add(id)
  }
  return active
}

// Does ONE action for ONE login. Never throws for expected problems: they come back as { error }.
async function actOne(
  // deno-lint-ignore no-explicit-any
  adminClient: any, action: string, userId: string, callerId: string, activeAdmins: Set<string>,
): Promise<Result> {
  const fail = (error: string): Result => ({ user_id: userId, error })

  if (typeof userId !== 'string' || !UUID_RE.test(userId)) return fail('Ungültige Kennung')

  // Scope: only teacher and admin logins, never portal logins.
  const { data: roleRow, error: roleError } = await adminClient
    .from('user_roles').select('role').eq('user_id', userId).maybeSingle()
  if (roleError) return fail('Rolle konnte nicht gelesen werden: ' + roleError.message)
  if (!roleRow || (roleRow.role !== 'teacher' && roleRow.role !== 'admin')) {
    return fail('Kein Lehrkraft- oder Admin-Zugang')
  }
  const { data: found, error: userError } = await adminClient.auth.admin.getUserById(userId)
  if (userError || !found?.user) return fail('Zugang nicht gefunden')
  const email = found.user.email ?? ''
  if (email.toLowerCase().endsWith('@schulasset.local')) return fail('iPad-Konten werden hier nicht verwaltet')

  const removing = action === 'lock' || action === 'delete'
  if (removing && userId === callerId) return fail('Der eigene Zugang kann nicht gesperrt oder gelöscht werden')

  // Never leave the system without an active admin (also counts the other entries of this call).
  const removesActiveAdmin = removing && roleRow.role === 'admin' && activeAdmins.has(userId)
  if (removesActiveAdmin && activeAdmins.size <= 1) {
    return fail('Der letzte aktive Admin kann nicht gesperrt oder gelöscht werden')
  }

  if (action === 'lock') {
    const { error } = await adminClient.auth.admin.updateUserById(userId, { ban_duration: LOCK_DURATION })
    if (error) return fail('Sperren fehlgeschlagen: ' + error.message)
    activeAdmins.delete(userId)
    return { user_id: userId, email, ok: true }
  }

  if (action === 'unlock') {
    const { error } = await adminClient.auth.admin.updateUserById(userId, { ban_duration: 'none' })
    if (error) return fail('Entsperren fehlgeschlagen: ' + error.message)
    if (roleRow.role === 'admin') activeAdmins.add(userId)
    return { user_id: userId, email, ok: true }
  }

  if (action === 'delete') {
    // Clear the shown e-mail first; staff.user_id and user_roles clear themselves with the user.
    const { error: staffError } = await adminClient
      .from('staff').update({ login_email: null }).eq('user_id', userId)
    if (staffError) return fail('Lehrkraft konnte nicht aktualisiert werden: ' + staffError.message)
    const { error } = await adminClient.auth.admin.deleteUser(userId)
    if (error) return fail('Löschen fehlgeschlagen: ' + error.message)
    activeAdmins.delete(userId)
    return { user_id: userId, email, ok: true }
  }

  // reset_password
  const password = generatePassword()
  const { error } = await adminClient.auth.admin.updateUserById(userId, { password })
  if (error) return fail('Neues Passwort konnte nicht gesetzt werden: ' + error.message)
  return { user_id: userId, email, ok: true, password }
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
    // A locked (banned) admin may still hold a valid token for a while: refuse them here.
    if (user.banned_until && new Date(user.banned_until).getTime() > Date.now()) {
      return json({ error: 'Forbidden' }, 403)
    }

    const body   = await req.json()
    const action = body?.action
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    if (action === 'list') {
      const only = body?.user_ids
      if (only !== undefined && (!Array.isArray(only) || only.length < 1 || only.length > MAX_ENTRIES
          || !only.every((id: unknown) => typeof id === 'string' && UUID_RE.test(id)))) {
        return json({ error: `user_ids must contain 1 to ${MAX_ENTRIES} valid ids` }, 400)
      }
      return json({ logins: await listLogins(adminClient, only ?? null) })
    }

    if (!['lock', 'unlock', 'delete', 'reset_password'].includes(action)) {
      return json({ error: 'Unknown action' }, 400)
    }
    const ids = body?.user_ids
    if (!Array.isArray(ids) || ids.length < 1 || ids.length > MAX_ENTRIES) {
      return json({ error: `user_ids must contain 1 to ${MAX_ENTRIES} entries` }, 400)
    }

    // Counted once per call; actOne keeps it up to date as entries are processed.
    const activeAdmins = await activeAdminIds(adminClient)

    // One after the other: simple, and a batch of 50 takes only a few seconds.
    const results: Result[] = []
    for (const id of ids) {
      results.push(await actOne(adminClient, action, id, user.id, activeAdmins))
    }

    return json({ results })
  } catch (err) {
    return json({ error: (err as Error).message }, 500)
  }
})
