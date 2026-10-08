# Analytics Domain Context

## Responsibility
Delivers comprehensive financial analytics with customizable dashboards, KPI tracking, and advanced reporting on receivables, payables, cash flow, and DRE (Income Statement).

## Bounded Contexts
1. **Dashboard**: Main analytics view with drag-and-drop widgets, period filtering, and real-time metrics.
2. **Reports**: Advanced analytics including trend analysis, category breakdown, and 3D visualizations.
3. **Period Filtering**: Day, week, month, quarter, semester, year views; custom date ranges.

## Key Decisions
- `useDashboardLayout` hook persists drag-and-drop widget ordering per user/company.
- Implements atomic parallelization for query loading states (separate states per section).
- Calculates KPIs client-side to fix double-count bug in RPC; falls back to server totals when available.
