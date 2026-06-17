import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const supabaseUrl      = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey          = Deno.env.get('SUPABASE_ANON_KEY')!

    // ── 1. Authenticate the caller ───────────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Missing authorization header' }, 401)

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: { user: caller }, error: authErr } = await callerClient.auth.getUser()
    if (authErr || !caller) return json({ error: 'Invalid or expired session' }, 401)

    // ── 2. Verify caller is admin ────────────────────────────────────────────
    const { data: callerProfile } = await callerClient
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single()

    if (callerProfile?.role !== 'admin') {
      return json({ error: 'Forbidden: only admins can invite users' }, 403)
    }

    // ── 3. Validate request body ─────────────────────────────────────────────
    const { email, full_name, role } = await req.json()

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return json({ error: 'Invalid email address' }, 400)
    }
    if (!role || !['admin', 'user'].includes(role)) {
      return json({ error: 'Role must be "admin" or "user"' }, 400)
    }

    // ── 4. Send invite using service role (server-side only) ─────────────────
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const origin = req.headers.get('origin') || 'http://localhost:5173'

    const { data: invite, error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(
      email.toLowerCase().trim(),
      {
        redirectTo: `${origin}/set-password`,
        data: { full_name: full_name?.trim() ?? '', role },
      }
    )

    if (inviteErr) return json({ error: inviteErr.message }, 400)

    // ── 5. Upsert profile (trigger already ran, but we need created_by) ──────
    await adminClient.from('profiles').upsert(
      {
        id: invite.user.id,
        email: email.toLowerCase().trim(),
        full_name: full_name?.trim() ?? '',
        role,
        created_by: caller.id,
      },
      { onConflict: 'id' }
    )

    return json({ success: true, user_id: invite.user.id })
  } catch (err) {
    console.error('[invite-user]', err)
    return json({ error: 'Internal server error' }, 500)
  }
})
