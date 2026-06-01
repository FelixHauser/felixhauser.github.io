// Edge Function: create-ipad-account
//
// Creates or resets the portal account for an iPad.
// iPad accounts use the serial number as the login:  sn@schulasset.local
// On first assignment  → creates the auth user + user_roles row.
// On reassignment      → resets the password (old pupil can no longer log in).
// Returns the generated password to the calling admin (shown once, note it down).
//
// Security: caller must be an authenticated admin (verified via JWT + user_roles).

import { serve }        from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// School-appropriate German word list for generated passwords.
const ADJ  = ['Blau','Grün','Rot','Gelb','Groß','Klein','Warm','Hell','Dunkel',
               'Frisch','Ruhig','Stark','Flink','Klar','Sanft','Mutig','Weise']
const NOUN = ['Hund','Katze','Baum','Haus','Berg','See','Wald','Wind','Stern',
              'Mond','Fisch','Vogel','Blume','Stein','Bach','Wiese','Adler']

function generatePassword(): string {
  const adj  = ADJ [Math.floor(Math.random() * ADJ.length)]
  const noun = NOUN[Math.floor(Math.random() * NOUN.length)]
  const num  = Math.floor(Math.random() * 90) + 10
  return `${adj}-${noun}-${num}`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    // ── Verify caller is an admin ──────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user } } = await callerClient.auth.getUser()
    if (!user) return json({ error: 'Unauthorized' }, 401)

    const { data: roleRow } = await callerClient
      .from('user_roles').select('role').eq('user_id', user.id).single()
    if (!roleRow || roleRow.role !== 'admin') return json({ error: 'Forbidden' }, 403)

    // ── Handle request ─────────────────────────────────────────
    const { serial_number } = await req.json()
    if (!serial_number) return json({ error: 'serial_number required' }, 400)

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const email    = `${serial_number.toLowerCase()}@schulasset.local`
    const password = generatePassword()

    // Try to create the account first.
    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (createError) {
      // Account already exists — find it and reset the password.
      const { data: { users } } = await adminClient.auth.admin.listUsers()
      const existing = users.find(u => u.email === email)
      if (!existing) return json({ error: createError.message }, 400)

      await adminClient.auth.admin.updateUserById(existing.id, { password })

      // Ensure the user_roles row still exists (in case it was deleted).
      await adminClient.from('user_roles')
        .upsert({ user_id: existing.id, role: 'student' }, { onConflict: 'user_id' })
    } else {
      // New account — insert the student role.
      await adminClient.from('user_roles')
        .insert({ user_id: created.user.id, role: 'student' })
    }

    return json({ password })

  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}
