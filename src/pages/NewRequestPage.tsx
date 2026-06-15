import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { FileText, CheckCircle, AlertCircle } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { DropZone } from '@/components/ui/DropZone'
import { useCreatePatient } from '@/features/patients/hooks'
import { parseDocx } from '@/lib/docxParser'
import { todayISO } from '@/utils/dates'
import type { PatientCreateInput } from '@/types'

type FormValues = {
  name: string
  registro: string
  convenio: string
  medico: string
  plano_terapeutico: string
  ciclo_realizado: string
  intervalo_dias: number
  proxima_qt: string
  diagnostico: string
  observacao: string
}

export function NewRequestPage() {
  const [parseStatus, setParseStatus] = useState<'idle' | 'parsing' | 'done' | 'error'>('idle')
  const [parseMessage, setParseMessage] = useState('')
  const { mutate: createPatient, isPending } = useCreatePatient()

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormValues>({
    defaultValues: { intervalo_dias: 30, ciclo_realizado: '1', proxima_qt: todayISO() }
  })

  async function handleDocx(file: File) {
    setParseStatus('parsing')
    setParseMessage('')
    try {
      const { fields, confidence } = await parseDocx(file)
      Object.entries(fields).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          setValue(key as keyof FormValues, val as string)
        }
      })
      const msg = confidence === 'high'
        ? 'Todos os campos principais foram preenchidos automaticamente.'
        : confidence === 'medium'
        ? 'Alguns campos foram preenchidos. Verifique os dados abaixo.'
        : 'Documento lido mas poucos campos foram reconhecidos. Preencha manualmente.'
      setParseStatus('done')
      setParseMessage(msg)
    } catch {
      setParseStatus('error')
      setParseMessage('Não foi possível ler o documento. Preencha manualmente.')
    }
  }

  function onSubmit(values: FormValues) {
    const input: PatientCreateInput = {
      ...values,
      registro: values.registro || null,
      medico: values.medico || null,
      intervalo_dias: Number(values.intervalo_dias) || 30,
      proxima_qt: values.proxima_qt || null,
      diagnostico: values.diagnostico || null,
      observacao: values.observacao || null,
      ultima_qt: null,
      status_guia: 'SEM AUTORIZAÇÃO',
      tratativa: 'NULO',
      data_autorizacao: null,
      vencimento_guia: null,
      laserterapia: false,
      solicitar_ciclo: String(Number(values.ciclo_realizado || 1) + 1),
      solicitar_dia: null,
      situacao: 'A SOLICITAR',
      senha_protocolo: null,
      data_envio_solicitacao: null,
      prazos: 'DENTRO DO PRAZO',
      is_active: true,
    }
    createPatient(input, { onSuccess: () => { reset(); setParseStatus('idle') } })
  }

  return (
    <div>
      <PageHeader
        title="Nova Solicitação"
        subtitle="Carregue o relatório Word ou preencha os dados manualmente"
      />

      <div className="p-8 space-y-6 max-w-3xl">
        {/* Step 1 */}
        <Card title="1 · Carregar relatório Word (opcional)">
          <DropZone
            accept=".docx"
            onFile={handleDocx}
            label="Clique ou arraste o arquivo .docx"
            sublabel="O sistema vai ler e preencher os dados automaticamente"
          />

          {parseStatus === 'parsing' && (
            <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
              <div className="w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
              Lendo documento...
            </div>
          )}
          {parseStatus === 'done' && (
            <div className="flex items-start gap-2 mt-4 p-3 bg-green-50 rounded-lg text-sm text-green-700">
              <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {parseMessage}
            </div>
          )}
          {parseStatus === 'error' && (
            <div className="flex items-start gap-2 mt-4 p-3 bg-red-50 rounded-lg text-sm text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {parseMessage}
            </div>
          )}
        </Card>

        {/* Step 2 */}
        <Card title="2 · Confirmar dados">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Nome do paciente *" {...register('name', { required: 'Obrigatório' })} error={errors.name?.message} />
              <Input label="Registro" {...register('registro')} />
              <Input label="Convênio *" {...register('convenio', { required: 'Obrigatório' })} error={errors.convenio?.message} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Input label="Plano terapêutico / Medicamento *" {...register('plano_terapeutico', { required: 'Obrigatório' })} error={errors.plano_terapeutico?.message} />
              </div>
              <Input label="Médico" {...register('medico')} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Input label="Ciclo" {...register('ciclo_realizado')} />
              <Input label="Intervalo (dias)" type="number" {...register('intervalo_dias')} />
              <Input label="Data prevista" type="date" {...register('proxima_qt')} />
            </div>

            <Input label="Diagnóstico / CID" {...register('diagnostico')} />

            <Textarea label="Justificativa médica" rows={3} {...register('observacao')} />

            <div className="flex gap-3 pt-2">
              <Button type="submit" variant="primary" loading={isPending}>
                <FileText className="w-4 h-4" />
                Adicionar à planilha
              </Button>
              <Button type="button" onClick={() => { reset(); setParseStatus('idle') }}>
                Limpar
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
