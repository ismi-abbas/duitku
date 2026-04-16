create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop function if exists public.get_budget_data();
drop function if exists public.save_budget_data(jsonb);
drop table if exists public.budget_snapshots cascade;

create table if not exists public.budget_settings (
  singleton boolean primary key default true,
  selected_month text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint budget_settings_singleton check (singleton = true)
);

create table if not exists public.budget_months (
  month_key text primary key,
  notes text not null default '',
  statement_outstanding_balance numeric not null default 0,
  statement_minimum_payment numeric not null default 0,
  statement_total_payment numeric not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.budget_income (
  id text primary key,
  month_key text not null references public.budget_months(month_key) on delete cascade,
  sort_order integer not null default 0,
  name text not null,
  amount numeric not null default 0,
  gross numeric not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.budget_expenses (
  id text primary key,
  month_key text not null references public.budget_months(month_key) on delete cascade,
  sort_order integer not null default 0,
  name text not null,
  budget numeric not null default 0,
  actual numeric not null default 0,
  done boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.budget_credit_card_items (
  id text primary key,
  month_key text not null references public.budget_months(month_key) on delete cascade,
  sort_order integer not null default 0,
  name text not null,
  estimate numeric not null default 0,
  actual numeric not null default 0,
  done boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.budget_installments (
  id text primary key,
  month_key text not null references public.budget_months(month_key) on delete cascade,
  sort_order integer not null default 0,
  name text not null,
  amount numeric not null default 0,
  done boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists budget_income_month_key_idx
  on public.budget_income (month_key, sort_order);

create index if not exists budget_expenses_month_key_idx
  on public.budget_expenses (month_key, sort_order);

create index if not exists budget_credit_card_items_month_key_idx
  on public.budget_credit_card_items (month_key, sort_order);

create index if not exists budget_installments_month_key_idx
  on public.budget_installments (month_key, sort_order);

drop trigger if exists set_budget_settings_updated_at on public.budget_settings;
create trigger set_budget_settings_updated_at
before update on public.budget_settings
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists set_budget_months_updated_at on public.budget_months;
create trigger set_budget_months_updated_at
before update on public.budget_months
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists set_budget_income_updated_at on public.budget_income;
create trigger set_budget_income_updated_at
before update on public.budget_income
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists set_budget_expenses_updated_at on public.budget_expenses;
create trigger set_budget_expenses_updated_at
before update on public.budget_expenses
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists set_budget_credit_card_items_updated_at on public.budget_credit_card_items;
create trigger set_budget_credit_card_items_updated_at
before update on public.budget_credit_card_items
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists set_budget_installments_updated_at on public.budget_installments;
create trigger set_budget_installments_updated_at
before update on public.budget_installments
for each row
execute function public.set_current_timestamp_updated_at();

create or replace function public.get_budget_data()
returns jsonb
language sql
as $$
  with month_payload as (
    select
      bm.month_key,
      jsonb_build_object(
        'income', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', bi.id,
            'name', bi.name,
            'amount', bi.amount,
            'gross', bi.gross
          ) order by bi.sort_order)
          from public.budget_income bi
          where bi.month_key = bm.month_key
        ), '[]'::jsonb),
        'expenses', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', be.id,
            'name', be.name,
            'budget', be.budget,
            'actual', be.actual,
            'done', be.done
          ) order by be.sort_order)
          from public.budget_expenses be
          where be.month_key = bm.month_key
        ), '[]'::jsonb),
        'creditCard', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', bc.id,
            'name', bc.name,
            'estimate', bc.estimate,
            'actual', bc.actual,
            'done', bc.done
          ) order by bc.sort_order)
          from public.budget_credit_card_items bc
          where bc.month_key = bm.month_key
        ), '[]'::jsonb),
        'installments', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', bi2.id,
            'name', bi2.name,
            'amount', bi2.amount,
            'done', bi2.done
          ) order by bi2.sort_order)
          from public.budget_installments bi2
          where bi2.month_key = bm.month_key
        ), '[]'::jsonb),
        'statement', jsonb_build_object(
          'outstandingBalance', bm.statement_outstanding_balance,
          'minimumPayment', bm.statement_minimum_payment,
          'totalPayment', bm.statement_total_payment
        ),
        'notes', bm.notes
      ) as payload
    from public.budget_months bm
  )
  select case
    when exists(select 1 from public.budget_settings)
    then jsonb_build_object(
      'selectedMonth', (select selected_month from public.budget_settings where singleton = true),
      'months', coalesce((
        select jsonb_object_agg(month_key, payload)
        from month_payload
      ), '{}'::jsonb)
    )
    else null
  end;
$$;

create or replace function public.save_budget_data(input_payload jsonb)
returns void
language plpgsql
as $$
declare
  month_record record;
begin
  if input_payload is null then
    raise exception 'input_payload is required';
  end if;

  if coalesce(jsonb_typeof(input_payload->'months'), '') <> 'object' then
    raise exception 'input_payload.months must be an object';
  end if;

  insert into public.budget_settings (singleton, selected_month)
  values (true, coalesce(input_payload->>'selectedMonth', ''))
  on conflict (singleton)
  do update set selected_month = excluded.selected_month;

  delete from public.budget_months;

  for month_record in
    select key as month_key, value as month_data
    from jsonb_each(input_payload->'months')
  loop
    insert into public.budget_months (
      month_key,
      notes,
      statement_outstanding_balance,
      statement_minimum_payment,
      statement_total_payment
    )
    values (
      month_record.month_key,
      coalesce(month_record.month_data->>'notes', ''),
      coalesce((month_record.month_data->'statement'->>'outstandingBalance')::numeric, 0),
      coalesce((month_record.month_data->'statement'->>'minimumPayment')::numeric, 0),
      coalesce((month_record.month_data->'statement'->>'totalPayment')::numeric, 0)
    );

    insert into public.budget_income (id, month_key, sort_order, name, amount, gross)
    select
      coalesce(item.value->>'id', month_record.month_key || '-income-' || item.ordinality::text),
      month_record.month_key,
      item.ordinality::integer,
      coalesce(item.value->>'name', ''),
      coalesce((item.value->>'amount')::numeric, 0),
      coalesce((item.value->>'gross')::numeric, 0)
    from jsonb_array_elements(coalesce(month_record.month_data->'income', '[]'::jsonb)) with ordinality as item(value, ordinality);

    insert into public.budget_expenses (id, month_key, sort_order, name, budget, actual, done)
    select
      coalesce(item.value->>'id', month_record.month_key || '-expense-' || item.ordinality::text),
      month_record.month_key,
      item.ordinality::integer,
      coalesce(item.value->>'name', ''),
      coalesce((item.value->>'budget')::numeric, 0),
      coalesce((item.value->>'actual')::numeric, 0),
      coalesce((item.value->>'done')::boolean, false)
    from jsonb_array_elements(coalesce(month_record.month_data->'expenses', '[]'::jsonb)) with ordinality as item(value, ordinality);

    insert into public.budget_credit_card_items (id, month_key, sort_order, name, estimate, actual, done)
    select
      coalesce(item.value->>'id', month_record.month_key || '-card-' || item.ordinality::text),
      month_record.month_key,
      item.ordinality::integer,
      coalesce(item.value->>'name', ''),
      coalesce((item.value->>'estimate')::numeric, 0),
      coalesce((item.value->>'actual')::numeric, 0),
      coalesce((item.value->>'done')::boolean, false)
    from jsonb_array_elements(coalesce(month_record.month_data->'creditCard', '[]'::jsonb)) with ordinality as item(value, ordinality);

    insert into public.budget_installments (id, month_key, sort_order, name, amount, done)
    select
      coalesce(item.value->>'id', month_record.month_key || '-installment-' || item.ordinality::text),
      month_record.month_key,
      item.ordinality::integer,
      coalesce(item.value->>'name', ''),
      coalesce((item.value->>'amount')::numeric, 0),
      coalesce((item.value->>'done')::boolean, false)
    from jsonb_array_elements(coalesce(month_record.month_data->'installments', '[]'::jsonb)) with ordinality as item(value, ordinality);
  end loop;
end;
$$;

alter table public.budget_settings disable row level security;
alter table public.budget_months disable row level security;
alter table public.budget_income disable row level security;
alter table public.budget_expenses disable row level security;
alter table public.budget_credit_card_items disable row level security;
alter table public.budget_installments disable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.budget_settings to anon, authenticated;
grant select, insert, update, delete on public.budget_months to anon, authenticated;
grant select, insert, update, delete on public.budget_income to anon, authenticated;
grant select, insert, update, delete on public.budget_expenses to anon, authenticated;
grant select, insert, update, delete on public.budget_credit_card_items to anon, authenticated;
grant select, insert, update, delete on public.budget_installments to anon, authenticated;
grant execute on function public.get_budget_data() to anon, authenticated;
grant execute on function public.save_budget_data(jsonb) to anon, authenticated;
