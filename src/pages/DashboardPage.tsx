import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Calendar, RefreshCw, CheckCircle, Users, Clock } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge, PrazoBadge } from '@/components/ui/Badge'
import { useDashboard } from '@/features/patients/useDashboard'
import { formatDate, daysFromToday, calcPrazo } from '@/utils/dates'
import type { Patient } from '@/types'

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: number; icon: React.ElementType; color: string
}) {
  return (
    <div className={`bg-white rounded-xl border p-5 ${color}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
        <Icon className="w-4 h-4 text-gray-400" />
      </div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
    </div>
  )
}

function PatientRow({ patient, onRespond }: { patient: Patient; onRespond: () => void }) {
  const diff = daysFromToday(patient.proxima_qt)
  const prazo = patient.prazos || calcPrazo(patient.proxima_qt)

  return (
    <tr className={prazo === 'ATENÇÃO' || prazo === 'ATENCAO' ? 'bg-orange-50' : ''}>
      <td className="px-4 py-3">
        <div className="text-sm font-medium text-gray-900">{patient.name || '—'}</div>
        <div className="text-xs text-gray-400">{patient.convenio}</div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-700 max-w-[180px] truncate">
        {patient.plano_terapeutico}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 text-center">
        {patient.ciclo_realizado || '—'}
      </td>
      <td className="px-4 py-3">
        <div className="text-sm text-gray-700">{formatDate(patient.proxima_qt)}</div>
        {diff !== null && (
          <div className={`text-xs mt-0.5 ${diff < 0 ? 'text-red-500' : 'text-gray-400'}`}>
            {diff < 0 ? `${Math.abs(diff)}d atrasado` : `em ${diff}d`}
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={patient.status_guia} />
      </td>
      <td className="px-4 py-3 text-right">
        <Button size="sm" onClick={onRespond}>Resposta ›</Button>
      </td>
    </tr>
  )
}

function PatientTable({ patients, emptyMsg, onRespond }: {
  patients: Patient[]
  emptyMsg: string
  onRespond: (id: string) => void
}) {
  if (!patients.length) {
    return <p className="text-sm text-gray-400 py-4">{emptyMsg}</p>
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Paciente</th>
            <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Medicamento</th>
            <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Ciclo</th>
            <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Próxima QT</th>
            <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
            <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Ação</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {patients.slice(0, 20).map(p => (
            <PatientRow key={p.id} patient={p} onRespond={() => onRespond(p.id)} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { stats, urgent, upcoming, underAnalysis, isLoading } = useDashboard()

  function goToResponse(id: string) {
    navigate('/resposta', { state: { patientId: id } })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Carregando...
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Painel"
        subtitle="Visão geral de hoje"
      />

      <div className="p-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard label="Atenção urgente"  value={stats.atencao}        icon={AlertTriangle} color="border-orange-200" />
          <StatCard label="Ciclos em 7 dias" value={stats.proximos7dias}  icon={Calendar}      color="border-blue-200"   />
          <StatCard label="Em análise"       value={stats.emAnalise}      icon={RefreshCw}     color="border-purple-200" />
          <StatCard label="Autorizadas"      value={stats.autorizadas}    icon={CheckCircle}   color="border-green-200"  />
          <StatCard label="Sem autorização"  value={stats.semAutorizacao} icon={Clock}         color="border-yellow-200" />
          <StatCard label="Total"            value={stats.total}          icon={Users}         color="border-gray-200"   />
        </div>

        {/* Urgent */}
        <Card title={`⚠ Atenção urgente (${urgent.length})`}>
          <PatientTable
            patients={urgent}
            emptyMsg="Nenhum item urgente no momento."
            onRespond={goToResponse}
          />
        </Card>

        {/* Upcoming */}
        <Card title={`📅 Ciclos nos próximos 7 dias (${upcoming.length})`}>
          <PatientTable
            patients={upcoming}
            emptyMsg="Nenhum ciclo nos próximos 7 dias."
            onRespond={goToResponse}
          />
        </Card>

        {/* Under analysis */}
        <Card title={`🔄 Em análise (${underAnalysis.length})`}>
          <PatientTable
            patients={underAnalysis}
            emptyMsg="Nenhuma guia em análise."
            onRespond={goToResponse}
          />
        </Card>
      </div>
    </div>
  )
}
