-- Execute este script uma única vez em Supabase > SQL Editor > New query.
-- Ele cria a tabela de leads e permite SOMENTE inserções públicas.
-- Não crie políticas SELECT, UPDATE ou DELETE para o papel anon.

create table if not exists public.assessment_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  assessment_id text not null unique,
  first_name text not null check (char_length(first_name) between 1 and 60),
  email text not null,
  whatsapp text not null,
  marketing_consent boolean not null default false,
  assessment jsonb not null
);

alter table public.assessment_leads enable row level security;
grant insert on table public.assessment_leads to anon;

drop policy if exists "Formulário público pode inserir leads" on public.assessment_leads;
create policy "Formulário público pode inserir leads"
on public.assessment_leads
for insert
to anon
with check (
  char_length(first_name) between 1 and 60
  and char_length(email) between 3 and 254
  and char_length(whatsapp) between 8 and 25
);

-- Opcional: visualizar e exportar somente dentro do painel do Supabase.
-- O navegador público não terá permissão para consultar os registros.
