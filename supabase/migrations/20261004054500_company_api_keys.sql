-- One API key per company for the stamp API (key shown once at creation).

create table public.company_api_keys (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  key_prefix text not null,
  key_hash text not null unique,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  constraint company_api_keys_prefix_length check (char_length(key_prefix) between 8 and 24)
);

create index company_api_keys_company_id_idx on public.company_api_keys (company_id);
create index company_api_keys_prefix_idx on public.company_api_keys (key_prefix);

alter table public.company_api_keys enable row level security;
alter table public.company_api_keys force row level security;

create policy company_api_keys_select_own
  on public.company_api_keys
  for select
  to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = company_api_keys.company_id
        and c.owner_id = (select auth.uid())
    )
  );

revoke all on table public.company_api_keys from anon, authenticated;
grant select on table public.company_api_keys to authenticated;
grant select, insert, update, delete on table public.company_api_keys to service_role;
