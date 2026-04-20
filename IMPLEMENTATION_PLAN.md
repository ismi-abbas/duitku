# Implementation Plan

## Completed so far

### 1. Extended the frontend data model
Files:
- `src/features/budget/types.ts`
- `src/features/budget/constants.ts`
- `src/features/budget/lib/budget-utils.ts`

Added support for:
- categories
- tags
- due dates
- recurring rows
- savings goals
- statement close and payment dates
- budget alerts
- month-to-month comparison metrics
- savings totals

### 2. Updated the store logic
File:
- `src/features/budget/hooks/use-budget-store.tsx`

Added:
- normalized month handling for older data
- previous-month access
- carry-forward action
- month notes setter
- richer month selection behavior

### 3. Updated editing and table flows
Files:
- `src/features/budget/components/row-editor-dialog.tsx`
- `src/features/budget/components/section-table.tsx`
- `src/components/ui/textarea.tsx`

Added:
- boolean field editing
- tags and category support
- date fields
- broader table search
- savings goal row support

### 4. Updated overview and statement UI
Files:
- `src/features/budget/components/overview-panel.tsx`
- `src/features/budget/components/statement-panel.tsx`
- `src/features/budget/components/page-hero.tsx`
- `src/features/budget/components/month-picker.tsx`

Added:
- budget alerts
- month comparison cards
- month notes editor
- due soon list
- carry-forward button
- statement planning dates and progress
- savings summary in hero

### 5. Added a savings page and route
Files:
- `src/routes/savings.tsx`
- `src/app/router.tsx`
- `src/components/layout/app-shell.tsx`

Added:
- new `/savings` route
- navigation entry
- savings goals table

## Remaining work

### 1. Finish Supabase migration
Add a new SQL migration to keep persistence aligned with the new frontend shape.

Needed changes:
- add categories, tags, due dates, and recurring fields to existing row tables
- add a `savings goals` table
- add statement close and payment date fields to `budget_months`
- update `public.get_budget_data()`
- update `public.save_budget_data(jsonb)`
- likely update `public.reset_budget_data()`
- likely update `public.populate_budget_month(text)`

### 2. Run verification
Run:
- `pnpm typecheck`
- `pnpm build`

### 3. Fix compile and type issues
Resolve any TypeScript, runtime, or schema mismatches that show up after verification.

## Current risk

The frontend shape has changed, but the Supabase schema and RPC migration is not finished yet.
That means persistence is incomplete until the backend migration is added.

## Recommended next resume steps

1. Add the Supabase migration.
2. Run `pnpm typecheck` and `pnpm build`.
3. Fix remaining issues from the verification pass.
