# Budgets (Orcamentos) Module

## Responsibility
Manages budget planning and tracking per category or chart of accounts, with configurable periods and real-time burn rate monitoring.

## Bounded Context
- **Table:** `orcamentos` (Supabase)
- **Enum:** `budget_target_type` ('category' | 'chart_account')
- **Related tables:** `transactions`, `categories`, `chart_of_accounts` (read-only for realized calculations)

## Key Design Decisions

### Dual-Target Budgets
Budgets can target either a simple `category` (by ID) or a `chart_account` (by code). Chart account matching is hierarchical: a budget on code `3.1` also captures transactions under `3.1.01`, `3.1.02`, etc.

### In-Memory Realized Calculations
Realized amounts are NOT stored in the database. The hook fetches budgets + transactions in two parallel queries, then computes `realized_amount`, `progress_percentage`, and `variance_amount` client-side. This avoids stale aggregates and leverages React Query caching.

### Soft Delete Only
Financial data is never hard-deleted. The `deleteBudget` operation sets `is_deleted=true` with timestamp and reason. RLS SELECT policy filters `is_deleted=false` at the database level.

### RLS
Uses `user_belongs_to_company()` function consistent with other financial tables. SELECT policy includes `is_deleted = false` filter for defense in depth.

## File Structure
```
budgets/
├── types.ts          - Budget, BudgetWithRealized, payloads
├── services/
│   └── budgetApi.ts  - Supabase CRUD (orcamentos table)
├── hooks/
│   └── useBudgets.ts - React Query wrapper + realized computation
├── components/
│   └── BudgetFormDialog.tsx - Create/edit form dialog
└── index.tsx         - BudgetsPage (cards grid with burn rate)
```

## Query Keys
Centralized at `@/lib/queryKeys.ts` as `BUDGETS_KEYS`.
