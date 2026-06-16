// ─── Core domain types ───────────────────────────────────────────────────────

export type StatusTratamento =
  | 'ATIVO'
  | 'SUSPENSO'
  | 'FINALIZADO'
  | 'OBITO'


export type GuiaStatus =
  | 'AUTORIZADA'
  | 'SEM AUTORIZAÇÃO'
  | 'EM ANALISE'
  | 'NEGADA'

export type Situacao =
  | 'A SOLICITAR'
  | 'SOLICITADO'
  | 'RETIRADO'

export type Tratativa =
  | 'NULO'
  | 'EM ANALISE'
  | 'RECURSO'

export type Prazo =
  | 'DENTRO DO PRAZO'
  | 'ATENÇÃO'
  | 'ATENCAO'

// ─── Patient record (maps 1:1 to DB row) ─────────────────────────────────────

export interface Patient {
  id: string                      // uuid
  created_at: string
  updated_at: string

  // Identity
  name: string
  registro: string | null
  convenio: string
  medico: string | null

  // Treatment
  plano_terapeutico: string
  ciclo_realizado: string | null
  ultima_qt: string | null        // ISO date string
  intervalo_dias: number | null
  proxima_qt: string | null       // ISO date string

  // Authorization state
  status_guia: GuiaStatus
  tratativa: Tratativa
  data_autorizacao: string | null
  vencimento_guia: string | null
  senha_protocolo: string | null

  // Workflow
  situacao: Situacao
  prazos: Prazo | null
  solicitar_ciclo: string | null
  solicitar_dia: string | null
  data_envio_solicitacao: string | null

  // Other
  laserterapia: boolean
  observacao: string | null
  diagnostico: string | null
  is_active: boolean
  status_tratamento: StatusTratamento
}

// ─── Form types (partial, used for create/update) ────────────────────────────

export type PatientCreateInput = Omit<Patient, 'id' | 'created_at' | 'updated_at'>

export type PatientUpdateInput = Partial<PatientCreateInput>

// ─── Response logging form ───────────────────────────────────────────────────

export interface ResponseFormValues {
  status_guia: GuiaStatus
  tratativa: Tratativa
  situacao: Situacao
  senha_protocolo: string
  data_autorizacao: string
  vencimento_dias: number | null
  data_envio_solicitacao: string
  observacao: string
}

// ─── Excel import row (raw, before mapping) ──────────────────────────────────

export interface ExcelRow {
  PACIENTE?: string
  REGISTRO?: string | number
  'CONVÊNIO'?: string
  'MÉDICO'?: string
  'PLANO TERAPÊUTICO'?: string
  'CICLO REALIZADO'?: string | number
  'ULTIMA QT'?: string | number
  INTERVALO?: number
  'PROXIMA QT'?: string | number
  'STATUS GUIA ATUAL'?: string
  TRATATIVA?: string
  'DATA DA AUTORIZAÇÃO'?: string | number
  'VENCIMENTO DA GUIA'?: string | number
  LASERTERAPIA?: boolean | string
  'OBSERVAÇÃO'?: string
  'SOLICITAR CICLO'?: string | number
  PRAZOS?: string
  'SOLICITAR DIA'?: string | number
  'SITUAÇÃO'?: string
  'SENHA / PROTOCOLO'?: string | number
  'DATA DO ENVIO DA SOLICITAÇÃO'?: string | number
}

// ─── Dashboard stats ─────────────────────────────────────────────────────────

export interface DashboardStats {
  total: number
  atencao: number
  proximos7dias: number
  emAnalise: number
  autorizadas: number
  semAutorizacao: number
}
