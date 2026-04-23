-- Reapply debt/lend relational storage and save/load RPCs for already-migrated environments.
-- This migration is intentionally idempotent: tables use IF NOT EXISTS and functions use CREATE OR REPLACE.

create table if not exists public.budget_debts (
  id text primary key,
  month_key text not null references public.budget_months(month_key) on delete cascade,
  sort_order integer not null default 0,
  name text not null,
  amount numeric not null default 0,
  paid numeric not null default 0,
  due_date date,
  category text not null default '',
  tags text[] not null default '{}'::text[],
  recurring boolean not null default false,
  done boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.budget_lends (
  id text primary key,
  month_key text not null references public.budget_months(month_key) on delete cascade,
  sort_order integer not null default 0,
  name text not null,
  amount numeric not null default 0,
  collected numeric not null default 0,
  due_date date,
  category text not null default '',
  tags text[] not null default '{}'::text[],
  recurring boolean not null default false,
  done boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists budget_debts_month_key_idx
  on public.budget_debts (month_key, sort_order);

create index if not exists budget_lends_month_key_idx
  on public.budget_lends (month_key, sort_order);

drop trigger if exists set_budget_debts_updated_at on public.budget_debts;
create trigger set_budget_debts_updated_at
before update on public.budget_debts
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists set_budget_lends_updated_at on public.budget_lends;
create trigger set_budget_lends_updated_at
before update on public.budget_lends
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
            'gross', bi.gross,
            'category', bi.category,
            'tags', coalesce(to_jsonb(bi.tags), '[]'::jsonb),
            'recurring', bi.recurring
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
            'done', be.done,
            'category', be.category,
            'tags', coalesce(to_jsonb(be.tags), '[]'::jsonb),
            'dueDate', coalesce(be.due_date::text, ''),
            'recurring', be.recurring
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
            'done', bc.done,
            'category', bc.category,
            'tags', coalesce(to_jsonb(bc.tags), '[]'::jsonb),
            'dueDate', coalesce(bc.due_date::text, ''),
            'recurring', bc.recurring
          ) order by bc.sort_order)
          from public.budget_credit_card_items bc
          where bc.month_key = bm.month_key
        ), '[]'::jsonb),
        'installments', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', bi2.id,
            'name', bi2.name,
            'amount', bi2.amount,
            'done', bi2.done,
            'category', bi2.category,
            'tags', coalesce(to_jsonb(bi2.tags), '[]'::jsonb),
            'dueDate', coalesce(bi2.due_date::text, ''),
            'recurring', bi2.recurring
          ) order by bi2.sort_order)
          from public.budget_installments bi2
          where bi2.month_key = bm.month_key
        ), '[]'::jsonb),
        'savingsGoals', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', sg.id,
            'name', sg.name,
            'target', sg.target,
            'saved', sg.saved,
            'dueDate', coalesce(sg.due_date::text, ''),
            'category', sg.category,
            'tags', coalesce(to_jsonb(sg.tags), '[]'::jsonb),
            'recurring', sg.recurring,
            'done', sg.done
          ) order by sg.sort_order)
          from public.budget_savings_goals sg
          where sg.month_key = bm.month_key
        ), '[]'::jsonb),
        'debts', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', bd.id,
            'name', bd.name,
            'amount', bd.amount,
            'paid', bd.paid,
            'dueDate', coalesce(bd.due_date::text, ''),
            'category', bd.category,
            'tags', coalesce(to_jsonb(bd.tags), '[]'::jsonb),
            'recurring', bd.recurring,
            'done', bd.done
          ) order by bd.sort_order)
          from public.budget_debts bd
          where bd.month_key = bm.month_key
        ), '[]'::jsonb),
        'lends', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', bl.id,
            'name', bl.name,
            'amount', bl.amount,
            'collected', bl.collected,
            'dueDate', coalesce(bl.due_date::text, ''),
            'category', bl.category,
            'tags', coalesce(to_jsonb(bl.tags), '[]'::jsonb),
            'recurring', bl.recurring,
            'done', bl.done
          ) order by bl.sort_order)
          from public.budget_lends bl
          where bl.month_key = bm.month_key
        ), '[]'::jsonb),
        'statement', jsonb_build_object(
          'outstandingBalance', bm.statement_outstanding_balance,
          'minimumPayment', bm.statement_minimum_payment,
          'totalPayment', bm.statement_total_payment,
          'closingDate', coalesce(bm.statement_closing_date::text, ''),
          'paymentDueDate', coalesce(bm.statement_payment_due_date::text, '')
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

  delete from public.budget_months
  where month_key is not null;

  for month_record in
    select key as month_key, value as month_data
    from jsonb_each(input_payload->'months')
  loop
    insert into public.budget_months (
      month_key,
      notes,
      statement_outstanding_balance,
      statement_minimum_payment,
      statement_total_payment,
      statement_closing_date,
      statement_payment_due_date
    )
    values (
      month_record.month_key,
      coalesce(month_record.month_data->>'notes', ''),
      coalesce((month_record.month_data->'statement'->>'outstandingBalance')::numeric, 0),
      coalesce((month_record.month_data->'statement'->>'minimumPayment')::numeric, 0),
      coalesce((month_record.month_data->'statement'->>'totalPayment')::numeric, 0),
      nullif(month_record.month_data->'statement'->>'closingDate', '')::date,
      nullif(month_record.month_data->'statement'->>'paymentDueDate', '')::date
    );

    insert into public.budget_income (
      id,
      month_key,
      sort_order,
      name,
      amount,
      gross,
      category,
      tags,
      recurring
    )
    select
      coalesce(item.value->>'id', month_record.month_key || '-income-' || item.ordinality::text),
      month_record.month_key,
      item.ordinality::integer,
      coalesce(item.value->>'name', ''),
      coalesce((item.value->>'amount')::numeric, 0),
      coalesce((item.value->>'gross')::numeric, 0),
      coalesce(item.value->>'category', ''),
      coalesce((select array_agg(tag) from jsonb_array_elements_text(coalesce(item.value->'tags', '[]'::jsonb)) as tag(tag)), '{}'::text[]),
      coalesce((item.value->>'recurring')::boolean, false)
    from jsonb_array_elements(coalesce(month_record.month_data->'income', '[]'::jsonb)) with ordinality as item(value, ordinality);

    insert into public.budget_expenses (
      id,
      month_key,
      sort_order,
      name,
      budget,
      actual,
      done,
      category,
      tags,
      due_date,
      recurring
    )
    select
      coalesce(item.value->>'id', month_record.month_key || '-expense-' || item.ordinality::text),
      month_record.month_key,
      item.ordinality::integer,
      coalesce(item.value->>'name', ''),
      coalesce((item.value->>'budget')::numeric, 0),
      coalesce((item.value->>'actual')::numeric, 0),
      coalesce((item.value->>'done')::boolean, false),
      coalesce(item.value->>'category', ''),
      coalesce((select array_agg(tag) from jsonb_array_elements_text(coalesce(item.value->'tags', '[]'::jsonb)) as tag(tag)), '{}'::text[]),
      nullif(item.value->>'dueDate', '')::date,
      coalesce((item.value->>'recurring')::boolean, false)
    from jsonb_array_elements(coalesce(month_record.month_data->'expenses', '[]'::jsonb)) with ordinality as item(value, ordinality);

    insert into public.budget_credit_card_items (
      id,
      month_key,
      sort_order,
      name,
      estimate,
      actual,
      done,
      category,
      tags,
      due_date,
      recurring
    )
    select
      coalesce(item.value->>'id', month_record.month_key || '-card-' || item.ordinality::text),
      month_record.month_key,
      item.ordinality::integer,
      coalesce(item.value->>'name', ''),
      coalesce((item.value->>'estimate')::numeric, 0),
      coalesce((item.value->>'actual')::numeric, 0),
      coalesce((item.value->>'done')::boolean, false),
      coalesce(item.value->>'category', ''),
      coalesce((select array_agg(tag) from jsonb_array_elements_text(coalesce(item.value->'tags', '[]'::jsonb)) as tag(tag)), '{}'::text[]),
      nullif(item.value->>'dueDate', '')::date,
      coalesce((item.value->>'recurring')::boolean, false)
    from jsonb_array_elements(coalesce(month_record.month_data->'creditCard', '[]'::jsonb)) with ordinality as item(value, ordinality);

    insert into public.budget_installments (
      id,
      month_key,
      sort_order,
      name,
      amount,
      done,
      category,
      tags,
      due_date,
      recurring
    )
    select
      coalesce(item.value->>'id', month_record.month_key || '-installment-' || item.ordinality::text),
      month_record.month_key,
      item.ordinality::integer,
      coalesce(item.value->>'name', ''),
      coalesce((item.value->>'amount')::numeric, 0),
      coalesce((item.value->>'done')::boolean, false),
      coalesce(item.value->>'category', ''),
      coalesce((select array_agg(tag) from jsonb_array_elements_text(coalesce(item.value->'tags', '[]'::jsonb)) as tag(tag)), '{}'::text[]),
      nullif(item.value->>'dueDate', '')::date,
      coalesce((item.value->>'recurring')::boolean, false)
    from jsonb_array_elements(coalesce(month_record.month_data->'installments', '[]'::jsonb)) with ordinality as item(value, ordinality);

    insert into public.budget_savings_goals (
      id,
      month_key,
      sort_order,
      name,
      target,
      saved,
      due_date,
      category,
      tags,
      recurring,
      done
    )
    select
      coalesce(item.value->>'id', month_record.month_key || '-goal-' || item.ordinality::text),
      month_record.month_key,
      item.ordinality::integer,
      coalesce(item.value->>'name', ''),
      coalesce((item.value->>'target')::numeric, 0),
      coalesce((item.value->>'saved')::numeric, 0),
      nullif(item.value->>'dueDate', '')::date,
      coalesce(item.value->>'category', ''),
      coalesce((select array_agg(tag) from jsonb_array_elements_text(coalesce(item.value->'tags', '[]'::jsonb)) as tag(tag)), '{}'::text[]),
      coalesce((item.value->>'recurring')::boolean, false),
      coalesce((item.value->>'done')::boolean, false)
    from jsonb_array_elements(coalesce(month_record.month_data->'savingsGoals', '[]'::jsonb)) with ordinality as item(value, ordinality);

    insert into public.budget_debts (
      id,
      month_key,
      sort_order,
      name,
      amount,
      paid,
      due_date,
      category,
      tags,
      recurring,
      done
    )
    select
      coalesce(item.value->>'id', month_record.month_key || '-debt-' || item.ordinality::text),
      month_record.month_key,
      item.ordinality::integer,
      coalesce(item.value->>'name', ''),
      coalesce((item.value->>'amount')::numeric, 0),
      coalesce((item.value->>'paid')::numeric, 0),
      nullif(item.value->>'dueDate', '')::date,
      coalesce(item.value->>'category', ''),
      coalesce((select array_agg(tag) from jsonb_array_elements_text(coalesce(item.value->'tags', '[]'::jsonb)) as tag(tag)), '{}'::text[]),
      coalesce((item.value->>'recurring')::boolean, false),
      coalesce((item.value->>'done')::boolean, false)
    from jsonb_array_elements(coalesce(month_record.month_data->'debts', '[]'::jsonb)) with ordinality as item(value, ordinality);

    insert into public.budget_lends (
      id,
      month_key,
      sort_order,
      name,
      amount,
      collected,
      due_date,
      category,
      tags,
      recurring,
      done
    )
    select
      coalesce(item.value->>'id', month_record.month_key || '-lend-' || item.ordinality::text),
      month_record.month_key,
      item.ordinality::integer,
      coalesce(item.value->>'name', ''),
      coalesce((item.value->>'amount')::numeric, 0),
      coalesce((item.value->>'collected')::numeric, 0),
      nullif(item.value->>'dueDate', '')::date,
      coalesce(item.value->>'category', ''),
      coalesce((select array_agg(tag) from jsonb_array_elements_text(coalesce(item.value->'tags', '[]'::jsonb)) as tag(tag)), '{}'::text[]),
      coalesce((item.value->>'recurring')::boolean, false),
      coalesce((item.value->>'done')::boolean, false)
    from jsonb_array_elements(coalesce(month_record.month_data->'lends', '[]'::jsonb)) with ordinality as item(value, ordinality);
  end loop;
end;
$$;

grant select, insert, update, delete on public.budget_debts to anon, authenticated;
grant select, insert, update, delete on public.budget_lends to anon, authenticated;
grant execute on function public.get_budget_data() to anon, authenticated;
grant execute on function public.save_budget_data(jsonb) to anon, authenticated;

-- Re-grant existing RPCs explicitly for environments where privileges drifted.
grant execute on function public.reset_budget_data() to anon, authenticated;
grant execute on function public.populate_budget_month(text) to anon, authenticated;
