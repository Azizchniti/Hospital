import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  // ── 1. Validate API key ────────────────────────────────────────────────────
  const expectedKey = Deno.env.get('MV_SYNC_API_KEY') ?? ''
  const authHeader  = req.headers.get('Authorization') ?? ''
  const providedKey = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''

  if (!expectedKey || providedKey !== expectedKey) {
    console.warn('[sync-patient] unauthorized — invalid API key')
    return json({ success: false, error: 'Unauthorized' }, 401)
  }

  // ── 2. Parse body ──────────────────────────────────────────────────────────
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ success: false, error: 'Invalid JSON body' }, 400)
  }

  const nome             = typeof body.nome             === 'string' ? body.nome.trim()             : ''
  const numero_prontuario = typeof body.numero_prontuario === 'string' ? body.numero_prontuario.trim() : ''
  const cpf              = typeof body.cpf              === 'string' ? body.cpf.trim()              : null
  const convenio         = typeof body.convenio         === 'string' ? body.convenio.trim()         : 'A DEFINIR'
  const medico           = typeof body.medico           === 'string' ? body.medico.trim()           : null
  const diagnostico      = typeof body.diagnostico      === 'string' ? body.diagnostico.trim()      : null

  if (!nome) return json({ success: false, error: 'Campo obrigatório em falta: nome' }, 400)
  if (!numero_prontuario) return json({ success: false, error: 'Campo obrigatório em falta: numero_prontuario' }, 400)

  console.log('[sync-patient] request — prontuario:', numero_prontuario, 'nome:', nome)

  // ── 3. Connect with service role (bypasses RLS) ────────────────────────────
  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // ── 4. Duplicate check by registro (prontuário) ────────────────────────────
  const { data: existing } = await adminClient
    .from('patients')
    .select('id')
    .eq('registro', numero_prontuario)
    .maybeSingle()

  if (existing) {
    console.log('[sync-patient] already exists — prontuario:', numero_prontuario, 'id:', existing.id)
    return json({ success: true, patient_id: existing.id, status: 'already_exists' }, 200)
  }

  // ── 5. Insert patient with oncology defaults ───────────────────────────────
  const { data: patient, error } = await adminClient
    .from('patients')
    .insert({
      name:              nome,
      registro:          numero_prontuario,
      cpf:               cpf,
      convenio:          convenio,
      medico:            medico,
      diagnostico:       diagnostico,
      plano_terapeutico: 'A DEFINIR',
      status_guia:       'SEM AUTORIZAÇÃO',
      tratativa:         'NULO',
      situacao:          'A SOLICITAR',
      laserterapia:      false,
      is_active:         true,
      status_tratamento: 'ATIVO',
    })
    .select('id')
    .single()

  if (error) {
    console.error('[sync-patient] insert failed:', JSON.stringify(error))
    return json({ success: false, error: 'Erro interno ao registar paciente.' }, 500)
  }

  console.log('[sync-patient] created — id:', patient.id, 'nome:', nome)
  return json({ success: true, patient_id: patient.id, status: 'created' }, 201)
})
