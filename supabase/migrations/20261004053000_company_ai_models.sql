-- Approved AI models per company, plus model name on each picture line.

create table public.company_models (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  constraint company_models_name_length check (char_length(btrim(name)) between 1 and 80),
  constraint company_models_unique_name unique (company_id, name)
);

create index company_models_company_id_idx on public.company_models (company_id);

alter table public.company_models enable row level security;

create policy company_models_select_own
  on public.company_models
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.companies c
      where c.id = company_models.company_id
        and c.owner_id = (select auth.uid())
    )
  );

revoke all on table public.company_models from anon, authenticated;
grant select on table public.company_models to authenticated;
grant select, insert, update, delete on table public.company_models to service_role;

alter table public.picture_lines
  add column model_id uuid references public.company_models (id) on delete set null,
  add column ai_model text;

alter table public.picture_lines
  add constraint picture_lines_ai_model_length
  check (ai_model is null or char_length(btrim(ai_model)) between 1 and 80);
