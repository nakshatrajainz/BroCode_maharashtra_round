-- Company accounts and the private half of each stamp.
-- The browser may read a person's own company row. It cannot read stamp keys.

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  category text not null,
  stamp_address text not null,
  created_at timestamptz not null default now(),
  constraint companies_name_length check (char_length(btrim(name)) between 2 and 80),
  constraint companies_category_known check (category in ('maker', 'editor', 'publisher')),
  constraint companies_stamp_format check (stamp_address ~ '^0x[0-9a-f]{40}$'),
  constraint companies_one_stamp_per_job unique (owner_id, category),
  constraint companies_stamp_unique unique (stamp_address)
);

create index companies_owner_id_idx on public.companies (owner_id);

alter table public.companies enable row level security;

create policy companies_select_own
  on public.companies
  for select
  to authenticated
  using (owner_id = (select auth.uid()));

revoke all on table public.companies from anon, authenticated;
grant select on table public.companies to authenticated;
grant select, insert, update, delete on table public.companies to service_role;

create table public.stamp_keys (
  company_id uuid primary key references public.companies (id) on delete cascade,
  sealed_private_key text not null,
  created_at timestamptz not null default now()
);

alter table public.stamp_keys enable row level security;
alter table public.stamp_keys force row level security;

revoke all on table public.stamp_keys from anon, authenticated, public;
grant select, insert, delete on table public.stamp_keys to service_role;
