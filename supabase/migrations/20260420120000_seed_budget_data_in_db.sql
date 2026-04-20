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
    statement_total_payment
  )
  values (
    '2026-05',
    'Imported from My Budget - May 2026.csv',
    5008.74,
    250.44,
    250.44
  );

  insert into public.budget_income (id, month_key, sort_order, name, amount, gross)
  values
    ('seed-income-1', '2026-05', 1, 'Gaji bersih', 5864.15, 6048),
    ('seed-income-2', '2026-05', 2, 'Partime', 0, 0),
    ('seed-income-3', '2026-05', 3, 'Gaji Sayang', 2750, 5800),
    ('seed-income-4', '2026-05', 4, 'Saving ngarut', 1900, 0),
    ('seed-income-5', '2026-05', 5, 'Saving ngarut sayang', 3000, 0);

  insert into public.budget_expenses (id, month_key, sort_order, name, budget, actual, done)
  values
    ('seed-expense-1', '2026-05', 1, 'Sewa rumah', 700, 0, false),
    ('seed-expense-2', '2026-05', 2, 'Credit card installment', 648.49, 0, false),
    ('seed-expense-3', '2026-05', 3, 'PTPTN', 200, 0, false),
    ('seed-expense-4', '2026-05', 4, 'Wifi', 252.3, 0, false),
    ('seed-expense-5', '2026-05', 5, 'Takaful', 193, 0, false),
    ('seed-expense-6', '2026-05', 6, 'Mobile internet', 68, 0, false),
    ('seed-expense-7', '2026-05', 7, 'Coway', 65, 0, false),
    ('seed-expense-8', '2026-05', 8, 'Mak ayah', 350, 0, false),
    ('seed-expense-9', '2026-05', 9, 'Zakat', 69.32, 0, false),
    ('seed-expense-10', '2026-05', 10, 'Youtube Premium', 40, 0, false),
    ('seed-expense-11', '2026-05', 11, 'Google One', 8.49, 0, false),
    ('seed-expense-12', '2026-05', 12, 'Nafkah', 300, 0, false),
    ('seed-expense-13', '2026-05', 13, 'Minyak moto', 60, 0, false),
    ('seed-expense-14', '2026-05', 14, 'Groceries', 0, 0, false),
    ('seed-expense-15', '2026-05', 15, 'Makan (office)', 0, 0, false),
    ('seed-expense-16', '2026-05', 16, 'Makan (lain-lain)', 240, 0, false),
    ('seed-expense-17', '2026-05', 17, 'Bil elektrik', 200, 0, false),
    ('seed-expense-18', '2026-05', 18, 'Saving', 0, 0, false),
    ('seed-expense-19', '2026-05', 19, 'S70', 1200, 0, false),
    ('seed-expense-20', '2026-05', 20, 'Taska', 0, 0, false),
    ('seed-expense-21', '2026-05', 21, 'Pampers', 100, 0, false),
    ('seed-expense-22', '2026-05', 22, 'Commitment Sayang', 2000, 0, false);

  insert into public.budget_credit_card_items (id, month_key, sort_order, name, estimate, actual, done)
  values
    ('seed-card-1', '2026-05', 1, 'Wifi', 648.49, 0, false),
    ('seed-card-2', '2026-05', 2, 'Takaful', 193, 0, false),
    ('seed-card-3', '2026-05', 3, 'Mobile Internet (Include Kakak)', 111, 0, false),
    ('seed-card-4', '2026-05', 4, 'Coway', 65, 0, false),
    ('seed-card-5', '2026-05', 5, 'Youtube Premium', 40, 0, false),
    ('seed-card-6', '2026-05', 6, 'Google One', 8.49, 0, false),
    ('seed-card-7', '2026-05', 7, 'Others', 215.25, 0, false);

  insert into public.budget_installments (id, month_key, sort_order, name, amount, done)
  values
    ('seed-installment-1', '2026-05', 1, 'Aircond', 398.05, false);
end;
$$;

grant execute on function public.reset_budget_data() to anon, authenticated;

select public.reset_budget_data();
