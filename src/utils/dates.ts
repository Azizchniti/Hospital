import { format, differenceInDays, parseISO, isValid, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Prazo } from '@/types'

/** Convert Excel serial date number or ISO string to JS Date */
export function toDate(value: string | number | null | undefined): Date | null {
  if (!value) return null

  if (typeof value === 'number') {
    // Excel serial date (days since 1900-01-01, with leap year bug)
    const date = new Date(Math.round((value - 25569) * 86400 * 1000))
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset())
    return isValid(date) ? date : null
  }

  if (typeof value === 'string') {
    // Try ISO first
    const iso = parseISO(value)
    if (isValid(iso)) return iso

    // Try dd/MM/yyyy
    const parts = value.split('/')
    if (parts.length === 3) {
      const [d, m, y] = parts
      const date = new Date(Number(y), Number(m) - 1, Number(d))
      return isValid(date) ? date : null
    }
  }

  return null
}

/** Format date for display */
export function formatDate(value: string | number | null | undefined): string {
  const date = toDate(value)
  if (!date) return '—'
  return format(date, 'dd/MM/yyyy', { locale: ptBR })
}

/** Convert date to ISO string for DB storage */
export function toISODate(value: string | number | null | undefined): string | null {
  const date = toDate(value)
  if (!date) return null
  return format(date, 'yyyy-MM-dd')
}

/** Days from today (positive = future, negative = overdue) */
export function daysFromToday(value: string | null | undefined): number | null {
  if (!value) return null
  const date = toDate(value)
  if (!date) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return differenceInDays(date, today)
}

/** Compute PRAZOS status */
export function calcPrazo(proximaQt: string | null | undefined): Prazo {
  const diff = daysFromToday(proximaQt)
  if (diff === null) return 'DENTRO DO PRAZO'
  return diff <= 7 ? 'ATENÇÃO' : 'DENTRO DO PRAZO'
}

/** Add days to a date, return ISO string */
export function addDaysToDate(dateStr: string, days: number): string {
  const date = toDate(dateStr)
  if (!date) return ''
  return format(addDays(date, days), 'yyyy-MM-dd')
}

/** Today as ISO string */
export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd')
}
