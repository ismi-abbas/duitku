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
    statement_total_payment
  )
  values (
    input_month_key,
    'Imported from My Budget - May 2026.csv',
    5008.74,
    250.44,
    250.44
  );

  insert into public.budget_income (id, month_key, sort_order, name, amount, gross)
  values
    (input_month_key || '-income-1', input_month_key, 1, 'Gaji bersih', 5864.15, 6048),
    (input_month_key || '-income-2', input_month_key, 2, 'Partime', 0, 0),
    (input_month_key || '-income-3', input_month_key, 3, 'Gaji Sayang', 2750, 5800),
    (input_month_key || '-income-4', input_month_key, 4, 'Saving ngarut', 1900, 0),
    (input_month_key || '-income-5', input_month_key, 5, 'Saving ngarut sayang', 3000, 0);

  insert into public.budget_expenses (id, month_key, sort_order, name, budget, actual, done)
  values
    (input_month_key || '-expense-1', input_month_key, 1, 'Sewa rumah', 700, 0, false),
    (input_month_key || '-expense-2', input_month_key, 2, 'Credit card installment', 648.49, 0, false),
    (input_month_key || '-expense-3', input_month_key, 3, 'PTPTN', 200, 0, false),
    (input_month_key || '-expense-4', input_month_key, 4, 'Wifi', 252.3, 0, false),
    (input_month_key || '-expense-5', input_month_key, 5, 'Takaful', 193, 0, false),
    (input_month_key || '-expense-6', input_month_key, 6, 'Mobile internet', 68, 0, false),
    (input_month_key || '-expense-7', input_month_key, 7, 'Coway', 65, 0, false),
    (input_month_key || '-expense-8', input_month_key, 8, 'Mak ayah', 350, 0, false),
    (input_month_key || '-expense-9', input_month_key, 9, 'Zakat', 69.32, 0, false),
    (input_month_key || '-expense-10', input_month_key, 10, 'Youtube Premium', 40, 0, false),
    (input_month_key || '-expense-11', input_month_key, 11, 'Google One', 8.49, 0, false),
    (input_month_key || '-expense-12', input_month_key, 12, 'Nafkah', 300, 0, false),
    (input_month_key || '-expense-13', input_month_key, 13, 'Minyak moto', 60, 0, false),
    (input_month_key || '-expense-14', input_month_key, 14, 'Groceries', 0, 0, false),
    (input_month_key || '-expense-15', input_month_key, 15, 'Makan (office)', 0, 0, false),
    (input_month_key || '-expense-16', input_month_key, 16, 'Makan (lain-lain)', 240, 0, false),
    (input_month_key || '-expense-17', input_month_key, 17, 'Bil elektrik', 200, 0, false),
    (input_month_key || '-expense-18', input_month_key, 18, 'Saving', 0, 0, false),
    (input_month_key || '-expense-19', input_month_key, 19, 'S70', 1200, 0, false),
    (input_month_key || '-expense-20', input_month_key, 20, 'Taska', 0, 0, false),
    (input_month_key || '-expense-21', input_month_key, 21, 'Pampers', 100, 0, false),
    (input_month_key || '-expense-22', input_month_key, 22, 'Commitment Sayang', 2000, 0, false);

  insert into public.budget_credit_card_items (id, month_key, sort_order, name, estimate, actual, done)
  values
    (input_month_key || '-card-1', input_month_key, 1, 'Wifi', 648.49, 0, false),
    (input_month_key || '-card-2', input_month_key, 2, 'Takaful', 193, 0, false),
    (input_month_key || '-card-3', input_month_key, 3, 'Mobile Internet (Include Kakak)', 111, 0, false),
    (input_month_key || '-card-4', input_month_key, 4, 'Coway', 65, 0, false),
    (input_month_key || '-card-5', input_month_key, 5, 'Youtube Premium', 40, 0, false),
    (input_month_key || '-card-6', input_month_key, 6, 'Google One', 8.49, 0, false),
    (input_month_key || '-card-7', input_month_key, 7, 'Others', 215.25, 0, false);

  insert into public.budget_installments (id, month_key, sort_order, name, amount, done)
  values
    (input_month_key || '-installment-1', input_month_key, 1, 'Aircond', 398.05, false);
end;
$$;

grant execute on function public.populate_budget_month(text) to anon, authenticated;
