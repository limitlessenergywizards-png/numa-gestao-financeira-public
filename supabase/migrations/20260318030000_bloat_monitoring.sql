-- ============================================================================
-- Migration: Bloat monitoring views and health check function
-- Date: 2026-03-18
-- Purpose: On-demand visibility into table/index bloat, vacuum status,
--          and unused indexes. Callable from Supabase SQL Editor or RPCs.
-- ============================================================================

-- ============================================================
-- 1. View: Table bloat estimation
-- ============================================================
-- Uses dead-tuple ratio from pg_stat_user_tables as a proxy for bloat.
-- For precise measurement, pgstattuple extension can be used on Pro tier.

CREATE OR REPLACE VIEW public.v_table_bloat_monitor AS
SELECT
  schemaname,
  relname AS table_name,
  n_live_tup AS live_tuples,
  n_dead_tup AS dead_tuples,
  CASE
    WHEN n_live_tup + n_dead_tup = 0 THEN 0
    ELSE ROUND(100.0 * n_dead_tup / (n_live_tup + n_dead_tup), 2)
  END AS dead_tuple_pct,
  pg_size_pretty(pg_total_relation_size(schemaname || '.' || relname)) AS total_size,
  pg_size_pretty(pg_relation_size(schemaname || '.' || relname)) AS table_size,
  pg_size_pretty(
    pg_total_relation_size(schemaname || '.' || relname) -
    pg_relation_size(schemaname || '.' || relname)
  ) AS index_size,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze,
  vacuum_count + autovacuum_count AS total_vacuums,
  analyze_count + autoanalyze_count AS total_analyzes
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_dead_tup DESC;

-- ============================================================
-- 2. View: Index bloat estimation
-- ============================================================
-- Healthy index-to-table size ratio is typically 0.3-0.7.
-- Above 1.0 suggests index bloat. Also flags unused indexes.

CREATE OR REPLACE VIEW public.v_index_bloat_monitor AS
SELECT
  schemaname,
  relname AS table_name,
  indexrelname AS index_name,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
  pg_relation_size(indexrelid) AS index_size_bytes,
  idx_scan AS index_scans,
  idx_tup_read AS tuples_read,
  idx_tup_fetch AS tuples_fetched,
  CASE
    WHEN pg_relation_size(relid) = 0 THEN 0
    ELSE ROUND(
      pg_relation_size(indexrelid)::numeric /
      NULLIF(pg_relation_size(relid)::numeric, 0), 2
    )
  END AS index_to_table_ratio,
  CASE WHEN idx_scan = 0 THEN true ELSE false END AS potentially_unused
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- ============================================================
-- 3. View: Partition sizes (for audit_logs)
-- ============================================================

CREATE OR REPLACE VIEW public.v_audit_partition_sizes AS
SELECT
  c.relname AS partition_name,
  pg_size_pretty(pg_relation_size(c.oid)) AS size,
  pg_relation_size(c.oid) AS size_bytes,
  pg_stat_get_live_tuples(c.oid) AS live_tuples,
  pg_stat_get_dead_tuples(c.oid) AS dead_tuples
FROM pg_inherits i
JOIN pg_class c ON c.oid = i.inhrelid
JOIN pg_class parent ON parent.oid = i.inhparent
JOIN pg_namespace n ON n.oid = parent.relnamespace
WHERE n.nspname = 'public' AND parent.relname = 'audit_logs'
ORDER BY c.relname;

-- ============================================================
-- 4. Function: Health check with actionable alerts
-- ============================================================
-- Returns WARNING (>20% dead tuples) and CRITICAL (>40%) alerts,
-- stale vacuum warnings, and unused index flags.

CREATE OR REPLACE FUNCTION public.check_db_health()
RETURNS TABLE (
  severity TEXT,
  category TEXT,
  target_table TEXT,
  message TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  -- Tables with high dead tuple ratio
  SELECT
    CASE
      WHEN dead_tuple_pct > 40 THEN 'CRITICAL'
      ELSE 'WARNING'
    END,
    'BLOAT',
    table_name,
    format('Dead tuple ratio: %s%% (%s dead / %s live)',
           dead_tuple_pct, dead_tuples, live_tuples)
  FROM v_table_bloat_monitor
  WHERE dead_tuple_pct > 20

  UNION ALL

  -- Critical tables not vacuumed in >7 days
  SELECT
    'WARNING',
    'VACUUM',
    relname,
    format('Last vacuum: %s, last autovacuum: %s',
           COALESCE(last_vacuum::text, 'never'),
           COALESCE(last_autovacuum::text, 'never'))
  FROM pg_stat_user_tables
  WHERE schemaname = 'public'
    AND relname IN ('transactions', 'payables', 'receivables',
                    'audit_logs', 'payment_records', 'bank_accounts')
    AND (
      GREATEST(last_vacuum, last_autovacuum) < now() - interval '7 days'
      OR (last_vacuum IS NULL AND last_autovacuum IS NULL)
    )

  UNION ALL

  -- Unused indexes larger than 64KB
  SELECT
    'WARNING',
    'INDEX',
    table_name,
    format('Index "%s" has 0 scans since stats reset (size: %s)',
           index_name, index_size)
  FROM v_index_bloat_monitor
  WHERE potentially_unused = true
    AND index_size_bytes > 65536
    AND index_name NOT LIKE 'pg_%'

  ORDER BY 1, 2;
$$;
