import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge, SituacaoBadge, PrazoBadge } from '@/components/ui/Badge'
import { usePatients } from '@/features/patients/hooks'
import { formatDate, calcPrazo } from '@/utils/dates'

export function PatientsPage() {
  const navigate = useNavigate()
  const { data: patients = [], isLoading } = usePatients()
  const [query, setQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSituacao, setFilterSituacao] = useState('')

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return patients.filter(p => {
      if (filterStatus && p.status_guia !== filterStatus) return false
      if (filterSituacao && p.situacao !== filterSituacao) return false
      if (!q) return true
      return (
        p.name.toLowerCase().includes(q) ||
        (p.plano_terapeutico||'').toLowerCase().includes(q) ||
        (p.convenio||'').toLowerCase().includes(q) ||
        String(p.registro||'').includes(q)
      )
    })
  }, [patients, query, filterStatus, filterSituacao])

  return (
    <div>
      <PageHeader
        title="Pacientes"
        subtitle={`${patients.length} registros ativos`}
      />

      <div className="p-8">
        <Card>
          {/* Filters */}
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

          {/* Table */}
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
                  {filtered.slice(0, 200).map(p => (
                    <tr key={p.id} className={
                      (p.prazos === 'ATENÇÃO' || p.prazos === 'ATENCAO') ? 'bg-orange-50' : 'hover:bg-gray-50'
                    }>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{p.name || '—'}</div>
                        <div className="text-xs text-gray-400">{p.registro || ''}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{p.convenio}</td>
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
                          className="mr-2"
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
