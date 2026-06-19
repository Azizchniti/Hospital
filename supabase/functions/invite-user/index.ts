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

function isRateLimitError(err: unknown): boolean {
  const msg = (err as any)?.message?.toLowerCase() ?? ''
  const status = (err as any)?.status
  return status === 429 || msg.includes('rate limit') || msg.includes('email rate')
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }, 405)

  try {
    const supabaseUrl    = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey        = Deno.env.get('SUPABASE_ANON_KEY')!

    // ── 1. Authenticate the caller ───────────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ code: 'UNAUTHORIZED', message: 'Missing authorization header' }, 401)

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: { user: caller }, error: authErr } = await callerClient.auth.getUser()
    if (authErr || !caller) {
      console.error('[invite-user] Auth error:', authErr?.message)
      return json({ code: 'UNAUTHORIZED', message: 'Invalid or expired session' }, 401)
    }

    // ── 2. Verify caller is admin ────────────────────────────────────────────
    const { data: callerProfile } = await callerClient
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single()

    if (callerProfile?.role !== 'admin') {
      console.warn('[invite-user] Non-admin attempt by:', caller.id)
      return json({ code: 'FORBIDDEN', message: 'Only admins can invite users' }, 403)
    }

    // ── 3. Parse and validate body ───────────────────────────────────────────
    let body: { email?: unknown; full_name?: unknown; role?: unknown }
    try {
      body = await req.json()
    } catch {
      return json({ code: 'INVALID_BODY', message: 'Invalid JSON body' }, 400)
    }

    const { email, full_name, role } = body
    const normalizedEmail = typeof email === 'string' ? email.toLowerCase().trim() : ''

    console.log('[invite-user] Request — email:', normalizedEmail, 'role:', role, 'by:', caller.id)

    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      return json({ code: 'INVALID_EMAIL', message: 'Invalid email address' }, 400)
    }
    if (!role || !['admin', 'user'].includes(role as string)) {
      return json({ code: 'INVALID_ROLE', message: 'Role must be "admin" or "user"' }, 400)
    }

    // ── 4. Check if email is already registered ──────────────────────────────
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: existing } = await adminClient
      .from('profiles')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (existing) {
      return json({ code: 'ALREADY_EXISTS', message: 'Este email já tem uma conta registada.' }, 409)
    }

    // ── 5. Send invite (service role only — never exposed to browser) ────────
    const origin = req.headers.get('origin') || 'https://hospital-dtt2.vercel.app'

    const { data: invite, error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(
      normalizedEmail,
      {
        redirectTo: `${origin}/set-password`,
        data: { full_name: typeof full_name === 'string' ? full_name.trim() : '', role },
      }
    )

    if (inviteErr) {
      console.error('[invite-user] inviteUserByEmail error:', JSON.stringify(inviteErr))

      if (isRateLimitError(inviteErr)) {
        return json({
          code: 'RATE_LIMIT',
          message: 'Limite de emails atingido. Aguarde alguns minutos e tente novamente.',
        }, 429)
      }

      return json({ code: 'INVITE_FAILED', message: inviteErr.message }, 400)
    }

    // ── 6. Upsert profile (set role + created_by — trigger may have run) ─────
    const { error: upsertErr } = await adminClient.from('profiles').upsert(
      {
        id: invite.user.id,
        email: normalizedEmail,
        full_name: typeof full_name === 'string' ? full_name.trim() : '',
        role,
        created_by: caller.id,
      },
      { onConflict: 'id' }
    )

    if (upsertErr) {
      console.error('[invite-user] Profile upsert failed:', JSON.stringify(upsertErr))
      return json({ code: 'PROFILE_ERROR', message: 'Invite sent but profile setup failed. Contact support.' }, 500)
    }

    console.log('[invite-user] Success — invited:', normalizedEmail, 'user_id:', invite.user.id)
    return json({ success: true, user_id: invite.user.id })

  } catch (err) {
    console.error('[invite-user] Unexpected error:', err)
    return json({ code: 'INTERNAL_ERROR', message: 'Internal server error' }, 500)
  }
})
