import { supabase } from '@/lib/supabase'
import type { Patient, PatientCreateInput, PatientUpdateInput } from '@/types'

const TABLE = 'patients'

export async function fetchPatients(): Promise<Patient[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (error) throw error
  return data as Patient[]
}

export async function fetchPatientById(id: string): Promise<Patient> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Patient
}

export async function createPatient(input: PatientCreateInput): Promise<Patient> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data as Patient
}

export async function updatePatient(id: string, input: PatientUpdateInput): Promise<Patient> {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Patient
}

export async function bulkCreatePatients(inputs: PatientCreateInput[]): Promise<number> {
  const CHUNK = 100
  let total = 0

  // Deduplicate by (registro, plano_terapeutico) — keep last occurrence.
  // The Excel sheet may have duplicate rows; sending duplicates in one batch
  // causes "ON CONFLICT DO UPDATE command cannot affect row a second time".
  const seen = new Map<string, PatientCreateInput>()
  for (const p of inputs) {
    const key = `${p.registro ?? ''}|${p.plano_terapeutico}`
    seen.set(key, p)
  }
  const deduped = Array.from(seen.values())

  const withRegistro = deduped.filter(p => p.registro != null && p.registro !== '')
  const withoutRegistro = deduped.filter(p => p.registro == null || p.registro === '')

  for (let i = 0; i < withRegistro.length; i += CHUNK) {
    const chunk = withRegistro.slice(i, i + CHUNK)
    const { error, count } = await supabase
      .from(TABLE)
      .upsert(chunk, { onConflict: 'registro,plano_terapeutico' })
      .select()
    if (error) throw error
    total += count ?? chunk.length
  }

  for (let i = 0; i < withoutRegistro.length; i += CHUNK) {
    const chunk = withoutRegistro.slice(i, i + CHUNK)
    // No unique constraint for null-registro rows — plain insert only
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error, count } = await supabase
      .from(TABLE)
      .insert(chunk as any)
      .select()
    if (error) throw error
    total += count ?? chunk.length
  }

  return total
}

export async function deactivatePatient(id: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}
