# Supabase setup

This app stores budget data in relational tables and syncs through two RPC functions.

## Apply the migration

If you use the Supabase CLI:

```bash
supabase db push
```

If you use the dashboard SQL editor, run the SQL from:

`supabase/migrations/20260417_000001_create_budget_relational_schema.sql`

## Data model

- `public.budget_settings`
- `public.budget_months`
- `public.budget_income`
- `public.budget_expenses`
- `public.budget_credit_card_items`
- `public.budget_installments`
- RPC read function: `public.get_budget_data()`
- RPC write function: `public.save_budget_data(jsonb)`
- RPC reset function: `public.reset_budget_data()`
- RPC populate-month function: `public.populate_budget_month(text)`

## Frontend env vars

Set these in `.env`:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_ANON_KEY=...
```

The frontend accepts either `VITE_SUPABASE_PUBLISHABLE_KEY` or `VITE_SUPABASE_ANON_KEY`.

## Important note

This setup has no user auth and row-level security is disabled so the browser can write directly.
That is convenient for a personal app, but anyone with your anon key and project URL can access these tables and functions.
