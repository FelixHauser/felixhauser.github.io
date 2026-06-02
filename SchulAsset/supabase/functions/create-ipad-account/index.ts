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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const supabaseUrl    = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey        = Deno.env.get('SUPABASE_ANON_KEY')!
    const authHeader     = req.headers.get('Authorization')

    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), { status: 401 })
    }

    // Verify the caller is an authenticated admin.
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: userError } = await callerClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }
    const { data: roleRow } = await callerClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()
    if (!roleRow || roleRow.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })
    }

    // Parse request.
    const { serial_number } = await req.json()
    if (!serial_number) {
      return new Response(JSON.stringify({ error: 'Missing serial_number' }), { status: 400 })
    }

    const email    = `${String(serial_number).toUpperCase()}@schulasset.local`
    const password = generatePassword()

    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    // Find existing auth account for this iPad, or create one.
    const { data: listData } = await adminClient.auth.admin.listUsers({ perPage: 1000 })
    const existing = listData?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    )

    let userId: string

    if (existing) {
      await adminClient.auth.admin.updateUserById(existing.id, { password })
      userId = existing.id
    } else {
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })
      if (createError || !newUser.user) {
        return new Response(
          JSON.stringify({ error: createError?.message ?? 'Failed to create user' }),
          { status: 500 }
        )
      }
      userId = newUser.user.id
    }

    // Always upsert user_roles — whether the account is new or existing.
    const { error: roleError } = await adminClient
      .from('user_roles')
      .upsert({ user_id: userId, role: 'student' }, { onConflict: 'user_id' })

    if (roleError) {
      return new Response(JSON.stringify({ error: 'Failed to set user role: ' + roleError.message }), { status: 500 })
    }

    return new Response(JSON.stringify({ password }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
