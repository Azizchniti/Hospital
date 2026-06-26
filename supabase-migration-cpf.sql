-- Add CPF column to patients (sent by MV on sync)
-- Safe to run on existing data — nullable, no backfill needed.
alter table public.patients
  add column if not exists cpf text;

create index if not exists patients_cpf_idx on public.patients (cpf);
