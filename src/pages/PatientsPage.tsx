import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, CheckCircle } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge, SituacaoBadge, PrazoBadge } from '@/components/ui/Badge'
import { usePatients, useRegisterCycle } from '@/features/patients/hooks'
import { formatDate, calcPrazo, addDaysToDate, todayISO } from '@/utils/dates'
import type { Patient } from '@/types'

function nextCicloLabel(current: string | null): string {
  if (!current) return '1'
  const n = parseInt(current, 10)
  return isNaN(n) ? current : String(n + 1)
}

function CycleModal({
  patient,
  onClose,
}: {
  patient: Patient
  onClose: () => void
}) {
  const { mutate: registerCycle, isPending } = useRegisterCycle()
  const [dataRealizada, setDataRealizada] = useState(todayISO())
  const [cicloRealizado, setCicloRealizado] = useState(nextCicloLabel(patient.ciclo_realizado))

  const proximaQt = patient.intervalo_dias
    ? addDaysToDate(dataRealizada, patient.intervalo_dias)
    : null

  function handleSave() {
    registerCycle(
      { id: patient.id, payload: { ultima_qt: dataRealizada, ciclo_realizado: cicloRealizado, proxima_qt: proximaQt } },
      { onSuccess: onClose }
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <h2 className="text-base font-semibold text-gray-900">Registrar ciclo realizado</h2>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
          <div className="font-medium text-gray-900">{patient.name}</div>
          <div className="text-gray-500 mt-0.5">{patient.plano_terapeutico} · {patient.convenio}</div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Data de realização</label>
            <input
              type="date"
              value={dataRealizada}
              onChange={e => setDataRealizada(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Ciclo realizado</label>
            <input
              type="text"
              value={cicloRealizado}
              onChange={e => setCicloRealizado(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>

          <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
            <span className="font-medium">Próxima QT calculada: </span>
            {proximaQt ? formatDate(proximaQt) : '—'}
            {patient.intervalo_dias && (
              <span className="text-blue-500 ml-1">({patient.intervalo_dias} dias)</span>
            )}
          </div>

          <p className="text-xs text-gray-400">
            Situação será redefinida para "A Solicitar" automaticamente.
          </p>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="primary" loading={isPending} onClick={handleSave}>
            Confirmar ciclo
          </Button>
          <Button onClick={onClose}>Cancelar</Button>
        </div>
      </div>
    </div>
  )
}

export function PatientsPage() {
  const navigate = useNavigate()
  const { data: patients = [], isLoading } = usePatients()
  const [query, setQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSituacao, setFilterSituacao] = useState('')
  const [cyclePatient, setCyclePatient] = useState<Patient | null>(null)

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return patients.filter(p => {
      if (filterStatus && p.status_guia !== filterStatus) return false
      if (filterSituacao && p.situacao !== filterSituacao) return false
      if (!q) return true
      return (
        p.name.toLowerCase().includes(q) ||
        (p.plano_terapeutico || '').toLowerCase().includes(q) ||
        (p.convenio || '').toLowerCase().includes(q) ||
        String(p.registro || '').includes(q)
      )
    })
  }, [patients, query, filterStatus, filterSituacao])

  // Group by registro (or name if no registro) so multiple treatment lines are visually linked
  const rows = useMemo(() => {
    let lastKey = ''
    return filtered.slice(0, 200).map(p => {
      const key = p.registro || p.name
      const isFirstInGroup = key !== lastKey
      lastKey = key
      return { patient: p, isFirstInGroup }
    })
  }, [filtered])

  return (
    <div>
      <PageHeader title="Pacientes" subtitle={`${patients.length} registros ativos`} />

      {cyclePatient && (
        <CycleModal patient={cyclePatient} onClose={() => setCyclePatient(null)} />
      )}

      <div className="p-8">
        <Card>
          <div className="flex flex-wrap gap-3 mb-5">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar nome, medicamento, convênio..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              <option value="">Todos os status</option>
              <option value="AUTORIZADA">Autorizada</option>
              <option value="SEM AUTORIZAÇÃO">Sem autorização</option>
              <option value="EM ANALISE">Em análise</option>
              <option value="NEGADA">Negada</option>
            </select>
            <select
              value={filterSituacao}
              onChange={e => setFilterSituacao(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              <option value="">Todas as situações</option>
              <option value="A SOLICITAR">A solicitar</option>
              <option value="SOLICITADO">Solicitado</option>
              <option value="RETIRADO">Retirado</option>
            </select>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-gray-400 text-sm">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-3xl mb-2">📋</p>
              <p className="text-sm">Nenhum paciente encontrado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Paciente</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Convênio</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Medicamento</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Ciclo</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Próxima QT</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Situação</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Prazo</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map(({ patient: p, isFirstInGroup }) => (
                    <tr
                      key={p.id}
                      className={
                        (p.prazos === 'ATENÇÃO' || p.prazos === 'ATENCAO')
                          ? 'bg-orange-50'
                          : !isFirstInGroup
                          ? 'bg-gray-50/60 hover:bg-gray-100/60'
                          : 'hover:bg-gray-50'
                      }
                    >
                      <td className="px-4 py-3">
                        {isFirstInGroup ? (
                          <>
                            <div className="font-medium text-gray-900">{p.name || '—'}</div>
                            <div className="text-xs text-gray-400">{p.registro || ''}</div>
                          </>
                        ) : (
                          <div className="text-xs text-gray-400 pl-3 border-l-2 border-gray-200">
                            {p.registro || p.name}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{isFirstInGroup ? p.convenio : ''}</td>
                      <td className="px-4 py-3 text-gray-700 max-w-[160px]">
                        <div className="truncate" title={p.plano_terapeutico}>{p.plano_terapeutico}</div>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">{p.ciclo_realizado || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(p.proxima_qt)}</td>
                      <td className="px-4 py-3"><StatusBadge status={p.status_guia} /></td>
                      <td className="px-4 py-3"><SituacaoBadge situacao={p.situacao} /></td>
                      <td className="px-4 py-3"><PrazoBadge prazo={p.prazos || calcPrazo(p.proxima_qt)} /></td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Button
                          size="sm"
                          className="mr-1"
                          onClick={() => setCyclePatient(p)}
                          title="Registrar ciclo realizado"
                        >
                          Ciclo ✓
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => navigate('/resposta', { state: { patientId: p.id } })}
                        >
                          Resposta
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filtered.length > 200 && (
            <p className="text-xs text-gray-400 mt-3 text-center">
              Mostrando 200 de {filtered.length}. Use a busca para filtrar.
            </p>
          )}
        </Card>
      </div>
    </div>
  )
}
