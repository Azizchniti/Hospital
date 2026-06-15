import { useState } from 'react'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { DropZone } from '@/components/ui/DropZone'
import { useBulkImport, usePatients } from '@/features/patients/hooks'
import { parseXLSX, type ImportResult } from '@/lib/xlsxHandler'

export function ImportPage() {
  const { data: patients = [] } = usePatients()
  const { mutate: bulkImport, isPending } = useBulkImport()
  const [preview, setPreview] = useState<ImportResult | null>(null)
  const [parseError, setParseError] = useState('')

  async function handleFile(file: File) {
    setParseError('')
    setPreview(null)
    try {
      const result = await parseXLSX(file)
      setPreview(result)
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Erro ao ler arquivo')
    }
  }

  function doImport() {
    if (!preview) return
    bulkImport(preview.rows, { onSuccess: () => setPreview(null) })
  }

  return (
    <div>
      <PageHeader
        title="Importar Excel"
        subtitle="Carregue a planilha existente para sincronizar com o banco de dados"
      />

      <div className="p-8 space-y-6 max-w-2xl">
        <Card title="Carregar planilha (.xlsx)">
          <p className="text-sm text-gray-500 mb-4">
            Os dados da aba <strong>Autorização</strong> serão importados. Registros existentes com mesmo
            registro + medicamento serão atualizados (upsert).
          </p>

          <DropZone
            accept=".xlsx,.xls"
            onFile={handleFile}
            label="Clique ou arraste o arquivo Excel"
            sublabel="Formatos aceitos: .xlsx, .xls"
          />

          {parseError && (
            <div className="flex items-start gap-2 mt-4 p-3 bg-red-50 rounded-lg text-sm text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {parseError}
            </div>
          )}

          {preview && (
            <div className="mt-4 space-y-4">
              <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg text-sm text-green-700">
                <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <strong>{preview.rows.length}</strong> registros encontrados na aba <em>{preview.sheetName}</em>.
                  {preview.skipped > 0 && <span className="text-gray-500"> ({preview.skipped} linhas ignoradas por falta de dados.)</span>}
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-2 text-xs font-semibold text-gray-500 text-left">Paciente</th>
                      <th className="px-4 py-2 text-xs font-semibold text-gray-500 text-left">Convênio</th>
                      <th className="px-4 py-2 text-xs font-semibold text-gray-500 text-left">Medicamento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {preview.rows.slice(0, 10).map((r, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2">{r.name || '—'}</td>
                        <td className="px-4 py-2 text-gray-500">{r.convenio}</td>
                        <td className="px-4 py-2 text-gray-500 max-w-[200px] truncate">{r.plano_terapeutico}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.rows.length > 10 && (
                  <div className="px-4 py-2 text-xs text-gray-400 bg-gray-50 border-t border-gray-100">
                    ... e mais {preview.rows.length - 10} registros
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button variant="primary" loading={isPending} onClick={doImport}>
                  ⬆ Importar {preview.rows.length} registros
                </Button>
                <Button onClick={() => setPreview(null)}>Cancelar</Button>
              </div>
            </div>
          )}
        </Card>

        <Card title="Status atual do banco">
          <p className="text-sm text-gray-600">
            <span className="text-2xl font-bold text-gray-900">{patients.length}</span>{' '}
            pacientes ativos no banco de dados.
          </p>
        </Card>
      </div>
    </div>
  )
}
