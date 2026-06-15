import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import type { Patient, PatientCreateInput, ExcelRow } from '@/types'
import { toISODate, calcPrazo } from '@/utils/dates'

// ─── Import ──────────────────────────────────────────────────────────────────

function mapRow(row: ExcelRow): PatientCreateInput | null {
  const convenio = row['CONVÊNIO']?.toString().trim()
  const plano = row['PLANO TERAPÊUTICO']?.toString().trim()
  if (!convenio && !plano) return null

  return {
    name: row['PACIENTE']?.toString().trim() || '',
    registro: row['REGISTRO']?.toString().replace('.0','').trim() || null,
    convenio: convenio || '',
    medico: row['MÉDICO']?.toString().trim() || null,
    plano_terapeutico: plano || '',
    ciclo_realizado: row['CICLO REALIZADO']?.toString().trim() || null,
    ultima_qt: toISODate(row['ULTIMA QT']) || null,
    intervalo_dias: row['INTERVALO'] ? Number(row['INTERVALO']) : null,
    proxima_qt: toISODate(row['PROXIMA QT']) || null,
    status_guia: (row['STATUS GUIA ATUAL']?.toString().trim() as Patient['status_guia']) || 'SEM AUTORIZAÇÃO',
    tratativa: (row['TRATATIVA']?.toString().trim() as Patient['tratativa']) || 'NULO',
    data_autorizacao: toISODate(row['DATA DA AUTORIZAÇÃO']) || null,
    vencimento_guia: toISODate(row['VENCIMENTO DA GUIA']) || null,
    laserterapia: row['LASERTERAPIA'] === true || row['LASERTERAPIA'] === 'TRUE',
    observacao: row['OBSERVAÇÃO']?.toString().trim() || null,
    solicitar_ciclo: row['SOLICITAR CICLO']?.toString().trim() || null,
    prazos: (row['PRAZOS']?.toString().trim() as Patient['prazos']) || null,
    solicitar_dia: row['SOLICITAR DIA']?.toString().trim() || null,
    situacao: (row['SITUAÇÃO']?.toString().trim() as Patient['situacao']) || 'A SOLICITAR',
    senha_protocolo: row['SENHA / PROTOCOLO']?.toString().trim() || null,
    data_envio_solicitacao: toISODate(row['DATA DO ENVIO DA SOLICITAÇÃO']) || null,
    diagnostico: null,
    is_active: true,
  }
}

export interface ImportResult {
  rows: PatientCreateInput[]
  sheetName: string
  skipped: number
}

export async function parseXLSX(file: File): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: 'binary' })
        const sheetName =
          wb.SheetNames.find(s => s.toLowerCase().includes('autor')) || wb.SheetNames[0]
        const ws = wb.Sheets[sheetName]

        // Find the actual header row — spreadsheets often have title/merged rows above the data
        const raw2d = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '' }) as unknown[][]
        let headerRowIdx = 0
        for (let i = 0; i < Math.min(10, raw2d.length); i++) {
          if (raw2d[i].some(cell => String(cell).trim().toUpperCase() === 'PACIENTE')) {
            headerRowIdx = i
            break
          }
        }

        // Normalize column keys: trim whitespace so ' PACIENTE ' → 'PACIENTE'
        const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '', range: headerRowIdx })
        const raw = rawRows.map(row => {
          const out: Record<string, unknown> = {}
          for (const [k, v] of Object.entries(row)) out[k.trim()] = v
          return out
        }) as ExcelRow[]

        const rows: PatientCreateInput[] = []
        let skipped = 0
        for (const r of raw) {
          const mapped = mapRow(r)
          if (mapped) rows.push(mapped)
          else skipped++
        }

        resolve({ rows, sheetName, skipped })
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsBinaryString(file)
  })
}

// ─── Export ──────────────────────────────────────────────────────────────────

export function exportToXLSX(patients: Patient[]): void {
  const rows = patients.map(p => ({
    'PACIENTE': p.name,
    'REGISTRO': p.registro || '',
    'CONVÊNIO': p.convenio,
    'MÉDICO': p.medico || '',
    'PLANO TERAPÊUTICO': p.plano_terapeutico,
    'CICLO REALIZADO': p.ciclo_realizado || '',
    'ULTIMA QT': p.ultima_qt ? format(new Date(p.ultima_qt), 'dd/MM/yyyy') : '',
    'INTERVALO': p.intervalo_dias || '',
    'PROXIMA QT': p.proxima_qt ? format(new Date(p.proxima_qt), 'dd/MM/yyyy') : '',
    'STATUS GUIA ATUAL': p.status_guia,
    'TRATATIVA': p.tratativa,
    'DATA DA AUTORIZAÇÃO': p.data_autorizacao ? format(new Date(p.data_autorizacao), 'dd/MM/yyyy') : '',
    'VENCIMENTO DA GUIA': p.vencimento_guia ? format(new Date(p.vencimento_guia), 'dd/MM/yyyy') : '',
    'LASERTERAPIA': p.laserterapia ? 'TRUE' : 'FALSE',
    'OBSERVAÇÃO': p.observacao || '',
    'SOLICITAR CICLO': p.solicitar_ciclo || '',
    'PRAZOS': p.prazos || calcPrazo(p.proxima_qt),
    'SOLICITAR DIA': p.solicitar_dia || '',
    'SITUAÇÃO': p.situacao,
    'SENHA / PROTOCOLO': p.senha_protocolo || '',
    'DATA DO ENVIO DA SOLICITAÇÃO': p.data_envio_solicitacao
      ? format(new Date(p.data_envio_solicitacao), 'dd/MM/yyyy')
      : '',
  }))

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [
    {wch:32},{wch:10},{wch:16},{wch:18},{wch:32},{wch:14},{wch:12},{wch:10},
    {wch:14},{wch:20},{wch:14},{wch:18},{wch:18},{wch:12},{wch:32},{wch:16},
    {wch:18},{wch:14},{wch:14},{wch:22},{wch:14},
  ]
  XLSX.utils.book_append_sheet(wb, ws, 'Autorização')

  const dateStr = format(new Date(), 'dd-MM-yyyy')
  XLSX.writeFile(wb, `autorizacao_oncologia_${dateStr}.xlsx`)
}
