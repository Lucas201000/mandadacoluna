-- MIGRAÇÃO LGPD — Mandala da Dor na Coluna
-- Execute no Supabase > SQL Editor > New query.
-- Este script NÃO apaga os registros existentes. Ele adapta a coleta futura
-- para guardar apenas o cadastro mínimo, os consentimentos e o prazo de retenção.
-- Não crie políticas SELECT, UPDATE ou DELETE para o papel anon.

create table if not exists public.assessment_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  assessment_id text not null unique,
  first_name text not null check (char_length(first_name) between 1 and 60),
  email text not null,
  whatsapp text,
  marketing_consent boolean not null default false,
  privacy_consent boolean not null default false,
  sensitive_data_consent boolean not null default false,
  consent_version text,
  consent_at timestamptz,
  expires_at timestamptz not null default (now() + interval '90 days'),
  -- Não armazene aqui respostas, pontuações, regiões ou sinais de alerta.
  -- O campo guarda somente metadados mínimos de entrega e consentimento.
  assessment jsonb not null
);

-- Compatibilidade com a tabela criada na versão anterior do projeto.
alter table public.assessment_leads add column if not exists privacy_consent boolean not null default false;
alter table public.assessment_leads add column if not exists sensitive_data_consent boolean not null default false;
alter table public.assessment_leads add column if not exists consent_version text;
alter table public.assessment_leads add column if not exists consent_at timestamptz;
alter table public.assessment_leads add column if not exists expires_at timestamptz;
alter table public.assessment_leads alter column whatsapp drop not null;

-- Mantém os registros atuais sem apagá-los e dá prazo à operação futura.
update public.assessment_leads
set expires_at = coalesce(expires_at, created_at + interval '90 days')
where expires_at is null;

alter table public.assessment_leads alter column expires_at set default (now() + interval '90 days');
alter table public.assessment_leads alter column expires_at set not null;

alter table public.assessment_leads drop constraint if exists assessment_leads_whatsapp_check;
alter table public.assessment_leads add constraint assessment_leads_whatsapp_check
  check (whatsapp is null or char_length(whatsapp) between 8 and 25);

-- Restringe o JSON a metadados de consentimento e entrega. NOT VALID preserva
-- registros históricos sem apagá-los, mas aplica a regra a cada novo registro.
alter table public.assessment_leads drop constraint if exists assessment_leads_minimal_metadata_check;
alter table public.assessment_leads add constraint assessment_leads_minimal_metadata_check
  check (
    jsonb_typeof(assessment) = 'object'
    and assessment ?& array['schema', 'reportRequestedAt', 'consent', 'retention']
    and (assessment - array['schema', 'reportRequestedAt', 'consent', 'retention']) = '{}'::jsonb
    and assessment->>'schema' = 'mandala-lead-minimo-v2'
    and jsonb_typeof(assessment->'consent') = 'object'
    and ((assessment->'consent') - array[
      'privacyAcknowledgedAt', 'sensitiveDataConsentAt', 'localAssessmentConsentAt',
      'adultConfirmedAt', 'policyVersion', 'marketingConsentAt'
    ]) = '{}'::jsonb
    and jsonb_typeof(assessment->'retention') = 'object'
    and ((assessment->'retention') - array['policyDays']) = '{}'::jsonb
    and assessment->'retention'->>'policyDays' = '90'
  ) not valid;

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
  and (whatsapp is null or char_length(whatsapp) between 8 and 25)
  and privacy_consent is true
  and sensitive_data_consent is true
  and consent_version is not null
  and consent_at is not null
  and expires_at >= now() + interval '89 days'
  and expires_at <= now() + interval '91 days'
);

-- Rotina operacional necessária: revise e elimine ou anonimize registros
-- expirados em até 90 dias, salvo se houver obrigação legal de retenção ou
-- solicitação do titular que justifique tratamento diferente. Não automatize
-- essa exclusão sem validar a rotina e as obrigações da clínica.
-- O navegador público não tem permissão para consultar os registros.
