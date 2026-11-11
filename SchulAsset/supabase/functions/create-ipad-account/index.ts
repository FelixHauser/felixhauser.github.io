import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ADJECTIVES = [
  'Blau', 'Rot', 'Grün', 'Grau', 'Wild', 'Stark', 'Schnell', 'Klug',
  'Groß', 'Klein', 'Mutig', 'Froh', 'Kühl', 'Warm', 'Hell', 'Dunkel',
  'Laut', 'Still', 'Frisch', 'Sanft',
]
const NOUNS = [
  'Hund', 'Katze', 'Vogel', 'Baum', 'Berg', 'See', 'Mond', 'Stern',
  'Wind', 'Wald', 'Wolf', 'Bär', 'Fuchs', 'Adler', 'Tiger', 'Löwe',
  'Igel', 'Lachs', 'Regen', 'Blitz',
]

function generatePassword(): string {
  const adj  = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  const num  = Math.floor(Math.random() * 90) + 10
  return `${adj}-${noun}-${num}`
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// JSON response that always carries CORS headers, so the browser can read
// error messages too (without them, errors show up as an opaque CORS failure).
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

const PAGE_SIZE = 1000

// True if createUser failed because the email is already registered.
// Checks the error code/status first; the message is only a fallback.
function isEmailExistsError(err: { code?: string; status?: number; message?: string } | null): boolean {
  if (!err) return false
  return err.code === 'email_exists'
    || err.status === 422
    || /already/i.test(err.message ?? '')
}

// Finds a user's id by email by paging through all users, one page at a time.
// No fixed upper limit on the number of accounts (the old code only looked at
// the first 1000). Stops as soon as the email is found or a page comes back empty
// (not "page not full", so a server-side cap on the page size cannot cut it short).
// deno-lint-ignore no-explicit-any
async function findUserIdByEmail(adminClient: any, email: string): Promise<string | null> {
  for (let page = 1; ; page++) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: PAGE_SIZE })
    if (error) throw new Error('Could not list users: ' + error.message)
    const users = data?.users ?? []
    const match = users.find((u: { email?: string }) => u.email?.toLowerCase() === email.toLowerCase())
    if (match) return match.id
    if (users.length === 0) return null
  }
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
      return json({ error: 'Missing authorization' }, 401)
    }

    // Verify the caller is an authenticated admin.
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: userError } = await callerClient.auth.getUser()
    if (userError || !user) {
      return json({ error: 'Unauthorized' }, 401)
    }
    const { data: roleRow } = await callerClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()
    if (!roleRow || roleRow.role !== 'admin') {
      return json({ error: 'Forbidden' }, 403)
    }

    // Parse request.
    const { serial_number } = await req.json()
    if (!serial_number) {
      return json({ error: 'Missing serial_number' }, 400)
    }

    const email    = `${String(serial_number).toUpperCase()}@schulasset.local`
    const password = generatePassword()

    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    // Create the auth account for this iPad. This is the common case (first
    // assignment) and needs no user listing at all.
    let userId: string

    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (newUser?.user && !createError) {
      userId = newUser.user.id
    } else if (isEmailExistsError(createError)) {
      // The account already exists (reassignment / password reset): find it and
      // set the new password. Paged search, so it works for any number of accounts.
      const existingId = await findUserIdByEmail(adminClient, email)
      if (!existingId) {
        return json({ error: 'Account exists but could not be found' }, 500)
      }
      const { error: updateError } = await adminClient.auth.admin.updateUserById(existingId, { password })
      if (updateError) {
        return json({ error: 'Failed to reset password: ' + updateError.message }, 500)
      }
      userId = existingId
    } else {
      return json({ error: createError?.message ?? 'Failed to create user' }, 500)
    }

    // Always upsert user_roles — whether the account is new or existing.
    const { error: roleError } = await adminClient
      .from('user_roles')
      .upsert({ user_id: userId, role: 'student' }, { onConflict: 'user_id' })

    if (roleError) {
      return json({ error: 'Failed to set user role: ' + roleError.message }, 500)
    }

    return json({ password })
  } catch (err) {
    return json({ error: err.message }, 500)
  }
})
