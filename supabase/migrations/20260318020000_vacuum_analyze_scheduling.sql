-- ============================================================================
-- Migration: VACUUM ANALYZE scheduling via pg_cron
-- Date: 2026-03-18
-- Purpose: Targeted maintenance for high-write and reference tables.
--          Supplements autovacuum with deterministic scheduling.
-- Note: VACUUM cannot run inside a transaction block. pg_cron runs each
--       scheduled job in autocommit mode, so direct VACUUM SQL works.
-- ============================================================================

-- 1. Financial tables: VACUUM ANALYZE every 6 hours
--    transactions, payables, receivables, payment_records get heavy writes
--    during business hours (9-18 BRT = 12-21 UTC).
SELECT cron.schedule(
  'vacuum-analyze-financial-tables',
  '0 */6 * * *',
  $$
    VACUUM ANALYZE public.transactions;
    VACUUM ANALYZE public.payables;
    VACUUM ANALYZE public.receivables;
    VACUUM ANALYZE public.payment_records;
  $$
);

-- 2. Reference tables: ANALYZE-only daily at 05:00 UTC
--    These tables change infrequently but are used in JOINs and RLS functions.
--    ANALYZE-only is lightweight — updates planner statistics without reclaiming space.
SELECT cron.schedule(
  'analyze-reference-tables',
  '0 5 * * *',
  $$
    ANALYZE public.bank_accounts;
    ANALYZE public.chart_of_accounts;
    ANALYZE public.categories;
    ANALYZE public.customers;
    ANALYZE public.suppliers;
    ANALYZE public.companies;
    ANALYZE public.user_companies;
    ANALYZE public.user_roles;
    ANALYZE public.profiles;
  $$
);

-- 3. Audit logs: VACUUM ANALYZE weekly (Sunday 03:00 UTC)
--    With partitioning, each monthly partition is smaller and autovacuum
--    handles most cases. This is a safety net for the active partition.
SELECT cron.schedule(
  'vacuum-analyze-audit-logs',
  '0 3 * * 0',
  $$VACUUM ANALYZE public.audit_logs$$
);
