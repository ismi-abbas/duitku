alter table public.budget_months
  add column if not exists statement_closing_date date,
  add column if not exists statement_payment_due_date date;

alter table public.budget_income
  add column if not exists category text not null default '',
  add column if not exists tags text[] not null default '{}'::text[],
  add column if not exists recurring boolean not null default false;

alter table public.budget_expenses
  add column if not exists category text not null default '',
  add column if not exists tags text[] not null default '{}'::text[],
  add column if not exists due_date date,
  add column if not exists recurring boolean not null default false;

alter table public.budget_credit_card_items
  add column if not exists category text not null default '',
  add column if not exists tags text[] not null default '{}'::text[],
  add column if not exists due_date date,
  add column if not exists recurring boolean not null default false;

alter table public.budget_installments
  add column if not exists category text not null default '',
  add column if not exists tags text[] not null default '{}'::text[],
  add column if not exists due_date date,
  add column if not exists recurring boolean not null default false;

create table if not exists public.budget_savings_goals (
  id text primary key,
  month_key text not null references public.budget_months(month_key) on delete cascade,
  sort_order integer not null default 0,
  name text not null,
  target numeric not null default 0,
  saved numeric not null default 0,
  due_date date,
  category text not null default '',
  tags text[] not null default '{}'::text[],
  recurring boolean not null default false,
  done boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists budget_savings_goals_month_key_idx
  on public.budget_savings_goals (month_key, sort_order);

drop trigger if exists set_budget_savings_goals_updated_at on public.budget_savings_goals;
create trigger set_budget_savings_goals_updated_at
before update on public.budget_savings_goals
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
  end loop;
end;
$$;

create or replace function public.reset_budget_data()
returns void
language plpgsql
as $$
begin
  delete from public.budget_months
  where month_key is not null;

  delete from public.budget_settings
  where singleton = true;

  insert into public.budget_settings (singleton, selected_month)
  values (true, '2026-05');

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
    '2026-05',
    'Imported from My Budget - May 2026.csv',
    5008.74,
    250.44,
    250.44,
    null,
    null
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
  values
    ('seed-income-1', '2026-05', 1, 'Gaji bersih', 5864.15, 6048, '', '{}'::text[], false),
    ('seed-income-2', '2026-05', 2, 'Partime', 0, 0, '', '{}'::text[], false),
    ('seed-income-3', '2026-05', 3, 'Gaji Sayang', 2750, 5800, '', '{}'::text[], false),
    ('seed-income-4', '2026-05', 4, 'Saving ngarut', 1900, 0, '', '{}'::text[], false),
    ('seed-income-5', '2026-05', 5, 'Saving ngarut sayang', 3000, 0, '', '{}'::text[], false);

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
  values
    ('seed-expense-1', '2026-05', 1, 'Sewa rumah', 700, 0, false, '', '{}'::text[], null, false),
    ('seed-expense-2', '2026-05', 2, 'Credit card installment', 648.49, 0, false, '', '{}'::text[], null, false),
    ('seed-expense-3', '2026-05', 3, 'PTPTN', 200, 0, false, '', '{}'::text[], null, false),
    ('seed-expense-4', '2026-05', 4, 'Wifi', 252.3, 0, false, '', '{}'::text[], null, false),
    ('seed-expense-5', '2026-05', 5, 'Takaful', 193, 0, false, '', '{}'::text[], null, false),
    ('seed-expense-6', '2026-05', 6, 'Mobile internet', 68, 0, false, '', '{}'::text[], null, false),
    ('seed-expense-7', '2026-05', 7, 'Coway', 65, 0, false, '', '{}'::text[], null, false),
    ('seed-expense-8', '2026-05', 8, 'Mak ayah', 350, 0, false, '', '{}'::text[], null, false),
    ('seed-expense-9', '2026-05', 9, 'Zakat', 69.32, 0, false, '', '{}'::text[], null, false),
    ('seed-expense-10', '2026-05', 10, 'Youtube Premium', 40, 0, false, '', '{}'::text[], null, false),
    ('seed-expense-11', '2026-05', 11, 'Google One', 8.49, 0, false, '', '{}'::text[], null, false),
    ('seed-expense-12', '2026-05', 12, 'Nafkah', 300, 0, false, '', '{}'::text[], null, false),
    ('seed-expense-13', '2026-05', 13, 'Minyak moto', 60, 0, false, '', '{}'::text[], null, false),
    ('seed-expense-14', '2026-05', 14, 'Groceries', 0, 0, false, '', '{}'::text[], null, false),
    ('seed-expense-15', '2026-05', 15, 'Makan (office)', 0, 0, false, '', '{}'::text[], null, false),
    ('seed-expense-16', '2026-05', 16, 'Makan (lain-lain)', 240, 0, false, '', '{}'::text[], null, false),
    ('seed-expense-17', '2026-05', 17, 'Bil elektrik', 200, 0, false, '', '{}'::text[], null, false),
    ('seed-expense-18', '2026-05', 18, 'Saving', 0, 0, false, '', '{}'::text[], null, false),
    ('seed-expense-19', '2026-05', 19, 'S70', 1200, 0, false, '', '{}'::text[], null, false),
    ('seed-expense-20', '2026-05', 20, 'Taska', 0, 0, false, '', '{}'::text[], null, false),
    ('seed-expense-21', '2026-05', 21, 'Pampers', 100, 0, false, '', '{}'::text[], null, false),
    ('seed-expense-22', '2026-05', 22, 'Commitment Sayang', 2000, 0, false, '', '{}'::text[], null, false);

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
  values
    ('seed-card-1', '2026-05', 1, 'Wifi', 648.49, 0, false, '', '{}'::text[], null, false),
    ('seed-card-2', '2026-05', 2, 'Takaful', 193, 0, false, '', '{}'::text[], null, false),
    ('seed-card-3', '2026-05', 3, 'Mobile Internet (Include Kakak)', 111, 0, false, '', '{}'::text[], null, false),
    ('seed-card-4', '2026-05', 4, 'Coway', 65, 0, false, '', '{}'::text[], null, false),
    ('seed-card-5', '2026-05', 5, 'Youtube Premium', 40, 0, false, '', '{}'::text[], null, false),
    ('seed-card-6', '2026-05', 6, 'Google One', 8.49, 0, false, '', '{}'::text[], null, false),
    ('seed-card-7', '2026-05', 7, 'Others', 215.25, 0, false, '', '{}'::text[], null, false);

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
  values
    ('seed-installment-1', '2026-05', 1, 'Aircond', 398.05, false, '', '{}'::text[], null, false);
end;
$$;

create or replace function public.populate_budget_month(input_month_key text)
returns void
language plpgsql
as $$
begin
  if input_month_key is null or input_month_key = '' then
    raise exception 'input_month_key is required';
  end if;

  insert into public.budget_settings (singleton, selected_month)
  values (true, input_month_key)
  on conflict (singleton)
  do update set selected_month = excluded.selected_month;

  delete from public.budget_months
  where month_key = input_month_key;

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
    input_month_key,
    'Imported from My Budget - May 2026.csv',
    5008.74,
    250.44,
    250.44,
    null,
    null
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
  values
    (input_month_key || '-income-1', input_month_key, 1, 'Gaji bersih', 5864.15, 6048, '', '{}'::text[], false),
    (input_month_key || '-income-2', input_month_key, 2, 'Partime', 0, 0, '', '{}'::text[], false),
    (input_month_key || '-income-3', input_month_key, 3, 'Gaji Sayang', 2750, 5800, '', '{}'::text[], false),
    (input_month_key || '-income-4', input_month_key, 4, 'Saving ngarut', 1900, 0, '', '{}'::text[], false),
    (input_month_key || '-income-5', input_month_key, 5, 'Saving ngarut sayang', 3000, 0, '', '{}'::text[], false);

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
  values
    (input_month_key || '-expense-1', input_month_key, 1, 'Sewa rumah', 700, 0, false, '', '{}'::text[], null, false),
    (input_month_key || '-expense-2', input_month_key, 2, 'Credit card installment', 648.49, 0, false, '', '{}'::text[], null, false),
    (input_month_key || '-expense-3', input_month_key, 3, 'PTPTN', 200, 0, false, '', '{}'::text[], null, false),
    (input_month_key || '-expense-4', input_month_key, 4, 'Wifi', 252.3, 0, false, '', '{}'::text[], null, false),
    (input_month_key || '-expense-5', input_month_key, 5, 'Takaful', 193, 0, false, '', '{}'::text[], null, false),
    (input_month_key || '-expense-6', input_month_key, 6, 'Mobile internet', 68, 0, false, '', '{}'::text[], null, false),
    (input_month_key || '-expense-7', input_month_key, 7, 'Coway', 65, 0, false, '', '{}'::text[], null, false),
    (input_month_key || '-expense-8', input_month_key, 8, 'Mak ayah', 350, 0, false, '', '{}'::text[], null, false),
    (input_month_key || '-expense-9', input_month_key, 9, 'Zakat', 69.32, 0, false, '', '{}'::text[], null, false),
    (input_month_key || '-expense-10', input_month_key, 10, 'Youtube Premium', 40, 0, false, '', '{}'::text[], null, false),
    (input_month_key || '-expense-11', input_month_key, 11, 'Google One', 8.49, 0, false, '', '{}'::text[], null, false),
    (input_month_key || '-expense-12', input_month_key, 12, 'Nafkah', 300, 0, false, '', '{}'::text[], null, false),
    (input_month_key || '-expense-13', input_month_key, 13, 'Minyak moto', 60, 0, false, '', '{}'::text[], null, false),
    (input_month_key || '-expense-14', input_month_key, 14, 'Groceries', 0, 0, false, '', '{}'::text[], null, false),
    (input_month_key || '-expense-15', input_month_key, 15, 'Makan (office)', 0, 0, false, '', '{}'::text[], null, false),
    (input_month_key || '-expense-16', input_month_key, 16, 'Makan (lain-lain)', 240, 0, false, '', '{}'::text[], null, false),
    (input_month_key || '-expense-17', input_month_key, 17, 'Bil elektrik', 200, 0, false, '', '{}'::text[], null, false),
    (input_month_key || '-expense-18', input_month_key, 18, 'Saving', 0, 0, false, '', '{}'::text[], null, false),
    (input_month_key || '-expense-19', input_month_key, 19, 'S70', 1200, 0, false, '', '{}'::text[], null, false),
    (input_month_key || '-expense-20', input_month_key, 20, 'Taska', 0, 0, false, '', '{}'::text[], null, false),
    (input_month_key || '-expense-21', input_month_key, 21, 'Pampers', 100, 0, false, '', '{}'::text[], null, false),
    (input_month_key || '-expense-22', input_month_key, 22, 'Commitment Sayang', 2000, 0, false, '', '{}'::text[], null, false);

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
  values
    (input_month_key || '-card-1', input_month_key, 1, 'Wifi', 648.49, 0, false, '', '{}'::text[], null, false),
    (input_month_key || '-card-2', input_month_key, 2, 'Takaful', 193, 0, false, '', '{}'::text[], null, false),
    (input_month_key || '-card-3', input_month_key, 3, 'Mobile Internet (Include Kakak)', 111, 0, false, '', '{}'::text[], null, false),
    (input_month_key || '-card-4', input_month_key, 4, 'Coway', 65, 0, false, '', '{}'::text[], null, false),
    (input_month_key || '-card-5', input_month_key, 5, 'Youtube Premium', 40, 0, false, '', '{}'::text[], null, false),
    (input_month_key || '-card-6', input_month_key, 6, 'Google One', 8.49, 0, false, '', '{}'::text[], null, false),
    (input_month_key || '-card-7', input_month_key, 7, 'Others', 215.25, 0, false, '', '{}'::text[], null, false);

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
  values
    (input_month_key || '-installment-1', input_month_key, 1, 'Aircond', 398.05, false, '', '{}'::text[], null, false);
end;
$$;

grant select, insert, update, delete on public.budget_savings_goals to anon, authenticated;
grant execute on function public.get_budget_data() to anon, authenticated;
grant execute on function public.save_budget_data(jsonb) to anon, authenticated;
grant execute on function public.reset_budget_data() to anon, authenticated;
grant execute on function public.populate_budget_month(text) to anon, authenticated;
