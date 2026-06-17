-- ============================================================
--  Autorização Oncologia — Supabase Schema
--  Run this once in the Supabase SQL Editor
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─── patients table ──────────────────────────────────────────────────────────

create table if not exists public.patients (
  id                        uuid primary key default gen_random_uuid(),
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),

  -- Identity
  name                      text not null default '',
  registro                  text,
  convenio                  text not null default '',
  medico                    text,

  -- Treatment
  plano_terapeutico         text not null default '',
  ciclo_realizado           text,
  ultima_qt                 date,
  intervalo_dias            integer,
  proxima_qt                date,

  -- Authorization state
  status_guia               text not null default 'SEM AUTORIZAÇÃO'
                              check (status_guia in ('AUTORIZADA','SEM AUTORIZAÇÃO','EM ANALISE','NEGADA')),
  tratativa                 text not null default 'NULO'
                              check (tratativa in ('NULO','EM ANALISE','RECURSO')),
  data_autorizacao          date,
  vencimento_guia           date,
  senha_protocolo           text,

  -- Workflow
  situacao                  text not null default 'A SOLICITAR'
                              check (situacao in ('A SOLICITAR','SOLICITADO','RETIRADO')),
  prazos                    text,
  solicitar_ciclo           text,
  solicitar_dia             text,
  data_envio_solicitacao    date,

  -- Other
  laserterapia              boolean not null default false,
  observacao                text,
  diagnostico               text,
  is_active                 boolean not null default true,

  -- Treatment lifecycle (ATIVO = normal; others = archived)
  status_tratamento         text not null default 'ATIVO'
                              check (status_tratamento in ('ATIVO','SUSPENSO','FINALIZADO','OBITO'))
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────

create index on public.patients (is_active);
create index on public.patients (status_guia);
create index on public.patients (situacao);
create index on public.patients (proxima_qt);
create index on public.patients (convenio);
-- Unique index used for upsert on import.
-- Must be a full index (no WHERE clause) so that Supabase's ON CONFLICT
-- clause matches it — partial indexes require the predicate in the
-- ON CONFLICT target, which the JS client cannot express.
-- NULLs in `registro` are still allowed to repeat because NULL != NULL
-- in a unique index, so null-registro rows are inserted without conflict.
create unique index if not exists patients_registro_plano_idx
  on public.patients (registro, plano_terapeutico);

-- ─── updated_at trigger ──────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger patients_updated_at
  before update on public.patients
  for each row execute procedure public.set_updated_at();

-- ─── Row Level Security ──────────────────────────────────────────────────────
-- Enable RLS — currently open to authenticated users only.
-- Tighten per role when needed.

alter table public.patients enable row level security;

-- Allow all operations for authenticated users
create policy "authenticated users can do everything"
  on public.patients
  for all
  to authenticated
  using (true)
  with check (true);

-- ─── profiles table ──────────────────────────────────────────────────────────
-- Mirrors auth.users 1:1. Created automatically by trigger on signup.

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text not null default '',
  role        text not null default 'user'
                check (role in ('admin', 'user')),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  created_by  uuid references public.profiles (id) on delete set null
);

-- ─── Helper: get current user's role (bypasses RLS to avoid recursion) ───────

create or replace function public.get_my_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ─── RLS on profiles ─────────────────────────────────────────────────────────

alter table public.profiles enable row level security;

-- Any authenticated user can read their own profile; admins can read all.
create policy "profiles_select"
  on public.profiles for select to authenticated
  using (auth.uid() = id or public.get_my_role() = 'admin');

-- Only admins can update profiles (e.g. toggle is_active, change role).
create policy "profiles_update_admin"
  on public.profiles for update to authenticated
  using  (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

-- ─── Trigger: auto-create profile when a new auth user is created ────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'user')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Done ─────────────────────────────────────────────────────────────────────
-- After running this script:
-- 1. Go to Supabase → Authentication → Providers and enable Email.
-- 2. Run this SQL once to promote the first admin (replace the email):
--      UPDATE public.profiles SET role = 'admin' WHERE email = 'you@hospital.com';
-- 3. Copy your project URL and anon key to the app's .env.local file.
-- 4. Deploy the edge function:
--      supabase functions deploy invite-user
