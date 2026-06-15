import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Search } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/Badge'
import { usePatients, useUpdatePatient } from '@/features/patients/hooks'
import { formatDate, addDaysToDate, todayISO } from '@/utils/dates'
import type { Patient, ResponseFormValues } from '@/types'

const STATUS_OPTIONS = [
  { value: 'AUTORIZADA',      label: '✅ Autorizada'       },
  { value: 'EM ANALISE',      label: '🔄 Em análise'        },
  { value: 'SEM AUTORIZAÇÃO', label: '⏳ Sem autorização'   },
  { value: 'NEGADA',          label: '🚫 Negada'            },
]

const TRATATIVA_OPTIONS = [
  { value: 'NULO',      label: 'Nulo'       },
  { value: 'EM ANALISE',label: 'Em análise' },
  { value: 'RECURSO',   label: 'Recurso'    },
]

const SITUACAO_OPTIONS = [
  { value: 'SOLICITADO', label: 'Solicitado' },
  { value: 'A SOLICITAR',label: 'A solicitar'},
  { value: 'RETIRADO',   label: 'Retirado'   },
]

export function ResponsePage() {
  const location = useLocation()
  const { data: patients = [] } = usePatients()
  const { mutate: updatePatient, isPending } = useUpdatePatient()

  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Patient | null>(null)

  const { register, handleSubmit, watch, reset, setValue } = useForm<ResponseFormValues>({
    defaultValues: { data_envio_solicitacao: todayISO(), tratativa: 'NULO', situacao: 'SOLICITADO' }
  })

  const statusValue = watch('status_guia')

  // Auto-select if navigated from dashboard
  useEffect(() => {
    const id = (location.state as { patientId?: string })?.patientId
    if (id) {
      const p = patients.find(p => p.id === id)
      if (p) selectPatient(p)
    }
  }, [location.state, patients])

  const results = query.length >= 2
    ? patients.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        (p.plano_terapeutico||'').toLowerCase().includes(query.toLowerCase()) ||
        (p.convenio||'').toLowerCase().includes(query.toLowerCase()) ||
        String(p.registro||'').includes(query)
      ).slice(0, 8)
    : []

  function selectPatient(p: Patient) {
    setSelected(p)
    setQuery('')
    reset({
      status_guia: p.status_guia,
      tratativa: p.tratativa || 'NULO',
      situacao: p.situacao || 'SOLICITADO',
      senha_protocolo: p.senha_protocolo || '',
      data_autorizacao: p.data_autorizacao || '',
      vencimento_dias: null,
      data_envio_solicitacao: todayISO(),
      observacao: p.observacao || '',
    })
  }

  function onSubmit(values: ResponseFormValues) {
    if (!selected) return

    const update: Partial<Patient> = {
      status_guia: values.status_guia,
      tratativa: values.tratativa,
      situacao: values.situacao,
      observacao: values.observacao,
      data_envio_solicitacao: values.data_envio_solicitacao,
    }

    if (values.status_guia === 'AUTORIZADA') {
      update.senha_protocolo = values.senha_protocolo
      update.data_autorizacao = values.data_autorizacao
      if (values.vencimento_dias && values.data_autorizacao) {
        update.vencimento_guia = addDaysToDate(values.data_autorizacao, values.vencimento_dias)
      }
      update.situacao = 'SOLICITADO'
    } else if (values.status_guia === 'EM ANALISE') {
      update.senha_protocolo = values.senha_protocolo
      update.situacao = 'SOLICITADO'
    }

    updatePatient(
      { id: selected.id, input: update },
      { onSuccess: () => { setSelected(null); reset() } }
    )
  }

  return (
    <div>
      <PageHeader
        title="Registrar Resposta"
        subtitle="Atualize o status de autorização de qualquer convênio"
      />

      <div className="p-8 space-y-6 max-w-2xl">
        {/* Search */}
        {!selected && (
          <Card title="Buscar paciente">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Nome, medicamento, convênio ou registro..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>

            {results.length > 0 && (
              <div className="mt-2 space-y-1">
                {results.map(p => (
                  <button
                    key={p.id}
                    onClick={() => selectPatient(p)}
                    className="w-full text-left px-3 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-gray-900">{p.name || '(sem nome)'}</span>
                        <span className="text-xs text-gray-400 ml-2">{p.convenio}</span>
                      </div>
                      <StatusBadge status={p.status_guia} />
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {p.plano_terapeutico} · Ciclo {p.ciclo_realizado || '—'} · Próx: {formatDate(p.proxima_qt)}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {query.length >= 2 && results.length === 0 && (
              <p className="text-sm text-gray-400 mt-3">Nenhum resultado encontrado.</p>
            )}
          </Card>
        )}

        {/* Response form */}
        {selected && (
          <Card
            title="Resposta do convênio"
            action={
              <Button size="sm" onClick={() => { setSelected(null); reset() }}>
                ← Trocar paciente
              </Button>
            }
          >
            {/* Selected patient info */}
            <div className="mb-5 p-3 bg-gray-50 rounded-lg">
              <div className="font-medium text-gray-900">{selected.name}</div>
              <div className="text-sm text-gray-500 mt-0.5">
                {selected.convenio} · {selected.plano_terapeutico} · Ciclo {selected.ciclo_realizado || '—'} · Próx: {formatDate(selected.proxima_qt)}
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Status da guia *"
                  options={STATUS_OPTIONS}
                  placeholder="Selecione..."
                  {...register('status_guia', { required: true })}
                />
                <Select label="Tratativa" options={TRATATIVA_OPTIONS} {...register('tratativa')} />
              </div>

              {statusValue === 'AUTORIZADA' && (
                <div className="grid grid-cols-3 gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <Input label="Senha / Protocolo" {...register('senha_protocolo')} />
                  <Input label="Data da autorização" type="date" {...register('data_autorizacao')} />
                  <Input label="Validade (dias)" type="number" placeholder="Ex: 90" {...register('vencimento_dias', { valueAsNumber: true })} />
                </div>
              )}

              {statusValue === 'EM ANALISE' && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <Input label="Nº do protocolo de análise" {...register('senha_protocolo')} />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Input label="Data do envio" type="date" {...register('data_envio_solicitacao')} />
                <Select label="Situação" options={SITUACAO_OPTIONS} {...register('situacao')} />
              </div>

              <Input label="Observação" {...register('observacao')} />

              <div className="flex gap-3 pt-2">
                <Button type="submit" variant="primary" loading={isPending}>
                  💾 Salvar resposta
                </Button>
                <Button type="button" onClick={() => { setSelected(null); reset() }}>
                  Cancelar
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </div>
  )
}
