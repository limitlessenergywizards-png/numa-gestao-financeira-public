-- ============================================================================
-- Migration: Per-table autovacuum tuning
-- Date: 2026-03-18
-- Purpose: Override PostgreSQL default autovacuum settings for high-write
--          financial tables. Uses ALTER TABLE SET (storage_parameters)
--          which works on Supabase without postgresql.conf access.
--
-- PostgreSQL defaults:
--   autovacuum_vacuum_threshold = 50
--   autovacuum_vacuum_scale_factor = 0.2 (20%)
--   autovacuum_analyze_threshold = 50
--   autovacuum_analyze_scale_factor = 0.1 (10%)
--   autovacuum_vacuum_cost_delay = 2ms (PG15+)
-- ============================================================================

-- TRANSACTIONS: High UPDATE (reconciliation, status changes, soft-delete)
-- Default triggers at: 50 + 0.2 * 1723 = ~394 dead tuples
-- Custom triggers at:  50 + 0.05 * 1723 = ~136 dead tuples (3x more frequent)
ALTER TABLE public.transactions SET (
  autovacuum_vacuum_threshold = 50,
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_threshold = 50,
  autovacuum_analyze_scale_factor = 0.05,
  autovacuum_vacuum_cost_delay = 10,
  autovacuum_vacuum_cost_limit = 1000
);

-- PAYABLES: Moderate write (inserts + status updates from payment_records)
ALTER TABLE public.payables SET (
  autovacuum_vacuum_threshold = 25,
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_threshold = 25,
  autovacuum_analyze_scale_factor = 0.1,
  autovacuum_vacuum_cost_delay = 10
);

-- RECEIVABLES: Same pattern as payables
ALTER TABLE public.receivables SET (
  autovacuum_vacuum_threshold = 25,
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_threshold = 25,
  autovacuum_analyze_scale_factor = 0.1,
  autovacuum_vacuum_cost_delay = 10
);

-- PAYMENT_RECORDS: INSERT-heavy during payment processing
ALTER TABLE public.payment_records SET (
  autovacuum_vacuum_threshold = 25,
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_threshold = 25,
  autovacuum_analyze_scale_factor = 0.1
);

-- AUDIT_LOGS: INSERT-only but high volume from triggers on 10 tables.
-- Cannot set storage params on partitioned parent — apply to each leaf partition.
-- New partitions created by create_audit_partition_if_needed() use PG defaults,
-- which are sufficient since each monthly partition is small.
DO $$
DECLARE
  v_partition RECORD;
BEGIN
  FOR v_partition IN
    SELECT c.relname
    FROM pg_inherits i
    JOIN pg_class c ON c.oid = i.inhrelid
    JOIN pg_class parent ON parent.oid = i.inhparent
    JOIN pg_namespace n ON n.oid = parent.relnamespace
    WHERE n.nspname = 'public' AND parent.relname = 'audit_logs'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.%I SET (
        autovacuum_vacuum_threshold = 100,
        autovacuum_vacuum_scale_factor = 0.1,
        autovacuum_analyze_threshold = 100,
        autovacuum_analyze_scale_factor = 0.1,
        autovacuum_vacuum_cost_delay = 10
      )', v_partition.relname
    );
  END LOOP;
END$$;

-- BANK_ACCOUNTS: Frequent UPDATE from balance triggers on every transaction
ALTER TABLE public.bank_accounts SET (
  autovacuum_vacuum_threshold = 10,
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_threshold = 10,
  autovacuum_analyze_scale_factor = 0.1
);
