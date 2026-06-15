import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  fetchPatients,
  fetchPatientById,
  createPatient,
  updatePatient,
  bulkCreatePatients,
  deactivatePatient,
} from './api'
import type { PatientCreateInput, PatientUpdateInput } from '@/types'

export const PATIENTS_KEY = ['patients'] as const

export function usePatients() {
  return useQuery({
    queryKey: PATIENTS_KEY,
    queryFn: fetchPatients,
    staleTime: 1000 * 60 * 2, // 2 min
  })
}

export function usePatient(id: string) {
  return useQuery({
    queryKey: [...PATIENTS_KEY, id],
    queryFn: () => fetchPatientById(id),
    enabled: !!id,
  })
}

export function useCreatePatient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: PatientCreateInput) => createPatient(input),
    onSuccess: (patient) => {
      qc.invalidateQueries({ queryKey: PATIENTS_KEY })
      toast.success(`${patient.name || 'Paciente'} adicionado com sucesso.`)
    },
    onError: (err: Error) => {
      toast.error(`Erro ao salvar: ${err.message}`)
    },
  })
}

export function useUpdatePatient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PatientUpdateInput }) =>
      updatePatient(id, input),
    onSuccess: (patient) => {
      qc.invalidateQueries({ queryKey: PATIENTS_KEY })
      toast.success(`${patient.name || 'Registro'} atualizado.`)
    },
    onError: (err: Error) => {
      toast.error(`Erro ao atualizar: ${err.message}`)
    },
  })
}

export function useBulkImport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (inputs: PatientCreateInput[]) => bulkCreatePatients(inputs),
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: PATIENTS_KEY })
      toast.success(`${count} registros importados.`)
    },
    onError: (err: Error) => {
      toast.error(`Erro na importação: ${err.message}`)
    },
  })
}

export function useDeactivatePatient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deactivatePatient(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PATIENTS_KEY })
      toast.success('Paciente movido para inativos.')
    },
    onError: (err: Error) => {
      toast.error(`Erro: ${err.message}`)
    },
  })
}
