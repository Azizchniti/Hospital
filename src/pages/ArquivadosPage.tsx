import { useState } from 'react'
import { Search } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusTratamentoBadge } from '@/components/ui/Badge'
import { useArchivedPatients, useArchiveTreatment } from '@/features/patients/hooks'
import { formatDate } from '@/utils/dates'

export function ArquivadosPage() {
  const { data: patients = [], isLoading } = useArchivedPatients()
  const { mutate: archiveTreatment, isPending } = useArchiveTreatment()
  const [query, setQuery] = useState('')

  const filtered = patients.filter(p => {
    const q = query.toLowerCase()
    if (!q) return true
    return (
      p.name.toLowerCase().includes(q) ||
      (p.plano_terapeutico || '').toLowerCase().includes(q) ||
      (p.convenio || '').toLowerCase().includes(q) ||
      String(p.registro || '').includes(q)
    )
  })

  return (
    <div>
      <PageHeader
        title="Arquivados"
        subtitle="Pacientes com tratamento encerrado, suspenso ou óbito"
      />

      <div className="p-8">
        <Card>
          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar nome, medicamento, convênio..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-gray-400 text-sm">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-3xl mb-2">📁</p>
              <p className="text-sm">Nenhum paciente arquivado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Paciente</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Convênio</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Medicamento</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Último ciclo</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Última QT</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{p.name || '—'}</div>
                        <div className="text-xs text-gray-400">{p.registro || ''}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{p.convenio}</td>
                      <td className="px-4 py-3 text-gray-700 max-w-[180px]">
                        <div className="truncate" title={p.plano_terapeutico}>{p.plano_terapeutico}</div>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">{p.ciclo_realizado || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(p.ultima_qt)}</td>
                      <td className="px-4 py-3">
                        <StatusTratamentoBadge status={p.status_tratamento} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          loading={isPending}
                          onClick={() => archiveTreatment({ id: p.id, status: 'ATIVO' })}
                        >
                          Reativar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
