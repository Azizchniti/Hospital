import { useMemo } from 'react'
import { usePatients } from '@/features/patients/hooks'
import { daysFromToday, calcPrazo } from '@/utils/dates'
import type { Patient, DashboardStats } from '@/types'

export function useDashboard() {
  const { data: patients = [], isLoading, error } = usePatients()

  const stats = useMemo<DashboardStats>(() => ({
    total: patients.length,
    atencao: patients.filter(p => {
      const prazo = p.prazos || calcPrazo(p.proxima_qt)
      return prazo === 'ATENÇÃO' || prazo === 'ATENCAO'
    }).length,
    proximos7dias: patients.filter(p => {
      const diff = daysFromToday(p.proxima_qt)
      return diff !== null && diff >= 0 && diff <= 7
    }).length,
    emAnalise: patients.filter(p => p.status_guia === 'EM ANALISE').length,
    autorizadas: patients.filter(p => p.status_guia === 'AUTORIZADA').length,
    semAutorizacao: patients.filter(p => p.status_guia === 'SEM AUTORIZAÇÃO').length,
  }), [patients])

  const urgent: Patient[] = useMemo(() =>
    patients.filter(p => {
      const prazo = p.prazos || calcPrazo(p.proxima_qt)
      return prazo === 'ATENÇÃO' || prazo === 'ATENCAO'
    }).sort((a, b) => {
      const da = daysFromToday(a.proxima_qt) ?? 999
      const db = daysFromToday(b.proxima_qt) ?? 999
      return da - db
    }), [patients])

  const upcoming: Patient[] = useMemo(() =>
    patients.filter(p => {
      const diff = daysFromToday(p.proxima_qt)
      return diff !== null && diff >= 0 && diff <= 7
    }).sort((a, b) => {
      const da = daysFromToday(a.proxima_qt) ?? 999
      const db = daysFromToday(b.proxima_qt) ?? 999
      return da - db
    }), [patients])

  const underAnalysis: Patient[] = useMemo(() =>
    patients.filter(p => p.status_guia === 'EM ANALISE'), [patients])

  return { stats, urgent, upcoming, underAnalysis, isLoading, error }
}
