create extension if not exists pgcrypto;

create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.budget_snapshots (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint budget_snapshots_single_record check (id = 'primary-budget')
);

create index if not exists budget_snapshots_updated_at_idx
  on public.budget_snapshots (updated_at desc);

drop trigger if exists set_budget_snapshots_updated_at on public.budget_snapshots;

create trigger set_budget_snapshots_updated_at
before update on public.budget_snapshots
for each row
execute function public.set_current_timestamp_updated_at();

alter table public.budget_snapshots disable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.budget_snapshots to anon, authenticated;
