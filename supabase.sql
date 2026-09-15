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

-- CONFIRMAÇÃO DE E-MAIL — estado efêmero, sem dados de saúde ou contato.
-- O token completo permanece apenas entre o navegador e a função da Vercel.
-- Aqui é mantido somente o hash irreversível do token, por poucos minutos,
-- para que expiração, tentativas e uso único funcionem entre instâncias.
create schema if not exists private;

create table if not exists private.mandala_report_email_tokens (
  token_hash text primary key check (token_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null,
  attempts smallint not null default 0 check (attempts between 0 and 5),
  consumed_at timestamptz
);

alter table private.mandala_report_email_tokens enable row level security;
revoke all on schema private from public, anon, authenticated;
revoke all on table private.mandala_report_email_tokens from public, anon, authenticated;

-- Registra um token recém-gerado. A função não recebe e-mail, nome, PDF,
-- respostas ou código; por isso uma chamada direta não revela dados pessoais.
create or replace function public.mandala_register_report_token(
  p_token_hash text,
  p_expires_at timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, private
as $$
begin
  if p_token_hash !~ '^[a-f0-9]{64}$' then
    return false;
  end if;
  if p_expires_at <= clock_timestamp() or p_expires_at > clock_timestamp() + interval '16 minutes' then
    return false;
  end if;

  -- Limpeza automática de identificadores já inúteis; não envolve leads.
  delete from private.mandala_report_email_tokens
  where expires_at < clock_timestamp() - interval '1 day';

  insert into private.mandala_report_email_tokens (token_hash, expires_at)
  values (p_token_hash, p_expires_at)
  on conflict (token_hash) do nothing;
  return true;
end;
$$;

-- Consome atomicamente o token. Uma tentativa inválida também conta; o token
-- correto só pode devolver true uma vez e nenhuma informação pessoal retorna.
create or replace function public.mandala_consume_report_token(
  p_token_hash text,
  p_code_valid boolean
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, private
as $$
declare
  accepted boolean;
begin
  if p_token_hash !~ '^[a-f0-9]{64}$' then
    return false;
  end if;

  update private.mandala_report_email_tokens
     set attempts = attempts + 1,
         consumed_at = case when p_code_valid then clock_timestamp() else consumed_at end
   where token_hash = p_token_hash
     and expires_at > clock_timestamp()
     and consumed_at is null
     and attempts < 5
  returning p_code_valid into accepted;

  return coalesce(accepted, false);
end;
$$;

revoke all on function public.mandala_register_report_token(text, timestamptz) from public, authenticated;
revoke all on function public.mandala_consume_report_token(text, boolean) from public, authenticated;
grant execute on function public.mandala_register_report_token(text, timestamptz) to anon;
grant execute on function public.mandala_consume_report_token(text, boolean) to anon;
