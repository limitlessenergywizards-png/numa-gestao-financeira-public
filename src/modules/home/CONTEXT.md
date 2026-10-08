# Home Domain Context

## Responsibility
Serves as the primary post-login dashboard (InicioPage) showing financial overview, KPIs, cash flow projection, and income/expense distribution by category.

## Bounded Contexts
1. **Hero Metrics**: DRE summary with receitas, despesas, resultado.
2. **KPI Cards**: Key metrics with trends (overdue receivables, monthly payables, etc.).
3. **Cash Flow Chart**: 15-day projected cash flow visualization.
4. **Category Distribution**: Pie charts showing income/expense breakdown by chart account.

## Key Decisions
- Layout hierarchy follows: CONTEXTO -> RESULTADOS -> ANALISE -> PROJECOES.
- Uses `useDashboardQueries` for efficient data fetching with period filtering.
- Drag-and-drop `DashboardGrid` layout with reset-to-default option.
- Greeting based on time of day (morning/afternoon/evening).
