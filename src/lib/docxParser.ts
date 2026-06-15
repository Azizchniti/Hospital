import mammoth from 'mammoth'
import type { PatientCreateInput } from '@/types'

/** Extract raw text from a .docx ArrayBuffer */
async function extractText(buffer: ArrayBuffer): Promise<string> {
  const result = await mammoth.extractRawText({ arrayBuffer: buffer })
  return result.value
}

/** Try multiple regex patterns, return first match group 1 */
function extract(text: string, patterns: RegExp[]): string {
  for (const p of patterns) {
    const m = text.match(p)
    if (m?.[1]) return m[1].trim()
  }
  return ''
}

/** Extract a block of text between two markers */
function extractBlock(lines: string[], startKeyword: string, endKeyword: string): string {
  let collecting = false
  const parts: string[] = []
  for (const line of lines) {
    if (line.toLowerCase().includes(startKeyword.toLowerCase())) { collecting = true; continue }
    if (collecting && line.toLowerCase().includes(endKeyword.toLowerCase())) break
    if (collecting && line.length > 15) parts.push(line)
  }
  return parts.join(' ').trim()
}

export interface ParsedDocx {
  fields: Partial<PatientCreateInput>
  confidence: 'high' | 'medium' | 'low'
  rawText: string
}

export async function parseDocx(file: File): Promise<ParsedDocx> {
  const buffer = await file.arrayBuffer()
  const rawText = await extractText(buffer)
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean)
  const full = lines.join('\n')

  const name = extract(full, [
    /Nome do Usuário:\s*([^|\n]+?)(?:\s*Registro:|$)/i,
    /Nome[:\s]+([A-ZÁÉÍÓÚÀÂÊÔÃÕÇ ]{5,}?)(?:\s+Registro|\s+Matrícula)/i,
  ]).replace(/x+/gi, '').trim()

  const registro = extract(full, [/Registro:\s*(\w+)/i])
  const convenio = extract(full, [/Convênio:\s*(\S+)/i, /Convenio:\s*(\S+)/i])
  const ciclos = extract(full, [/Ciclos Previstos:\s*([\d\/]+)/i])
  const cicloNum = ciclos ? ciclos.split('/')[0] : ''

  const intervalo = extract(full, [/Interv[\.\s]*Dias[:\s]*([\d]+)/i, /Intervalo[:\s]*([\d]+)/i])

  const dataStr = extract(full, [
    /Data Prevista do Atendimento\s+([\d\/]+)/i,
    /Data\s+Prevista[^:]*:\s*([\d\/]+)/i,
  ])

  let proxima_qt: string | null = null
  if (dataStr) {
    const parts = dataStr.split('/')
    if (parts.length === 3) {
      const [d, m, y] = parts
      proxima_qt = `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`
    }
  }

  // Medication: grab first recognisable drug name line from the prescription table
  const drugPattern = /ZOLADEX|ANASTROZOL|ZOLIBBS|HERCEPTIN|KEYTRUDA|PEMBROLIZ|CAPECITAB|TAMOXIFENO|FULVESTRAN|DOCETAXEL|PACLITAXEL|ZOLEDRON|RIBOCICLIBE|LETROZOL|GOSSERELIN|GOSERELINA/i
  const medicationLine = lines.find(l => drugPattern.test(l)) || ''
  const plano_terapeutico = medicationLine.replace(/[|\t]+/g, ' ').replace(/\s{2,}/g,' ').trim().substring(0, 100)

  const diagnostico = extract(full, [
    /Diagnóstico:\s*([^\n|]+?)(?:\s*Data do Diagnóstico|TNM|$)/im,
    /Diagnóstico[:\s]+([^\n]+)/i,
  ])

  const justificativa = extractBlock(lines, 'JUSTIFICATIVA', 'ESQUEMA').substring(0, 600)

  const medico = extract(full, [/Médico[:\s]+([A-ZÁÉÍÓÚÀÂÊÔÃÕÇ ]{4,}?)(?:\n|CRM|$)/i])

  const filled = [name, convenio, plano_terapeutico].filter(Boolean).length
  const confidence = filled === 3 ? 'high' : filled >= 2 ? 'medium' : 'low'

  return {
    rawText,
    confidence,
    fields: {
      name: name || '',
      registro: registro || null,
      convenio: convenio || '',
      medico: medico || null,
      plano_terapeutico,
      ciclo_realizado: cicloNum || '1',
      intervalo_dias: intervalo ? parseInt(intervalo) : 30,
      proxima_qt,
      diagnostico: diagnostico || null,
      observacao: justificativa || null,
      status_guia: 'SEM AUTORIZAÇÃO',
      tratativa: 'NULO',
      situacao: 'A SOLICITAR',
      is_active: true,
      laserterapia: false,
    },
  }
}
