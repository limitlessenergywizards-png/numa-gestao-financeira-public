-- ============================================================================
-- Migration: Audit partition lifecycle management via pg_cron
-- Date: 2026-03-18
-- Purpose: Auto-create future partitions monthly and drop old partitions
--          after 6 months, archiving summaries for compliance.
-- Depends on: 20260318000000_partition_audit_logs.sql
-- ============================================================================

-- ============================================================
-- 1. Archive table for compliance (lightweight summaries)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.audit_logs_archive (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partition_name TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  record_count BIGINT NOT NULL,
  summary JSONB NOT NULL,  -- {action_counts, table_counts, company_ids}
  archived_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. Function: Create upcoming partitions
-- ============================================================
-- Creates partitions for current month + 2 months ahead.
-- Safe to run multiple times (idempotent).

CREATE OR REPLACE FUNCTION public.create_audit_partition_if_needed()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start DATE;
  v_end DATE;
  v_partition_name TEXT;
BEGIN
  FOR i IN 0..2 LOOP
    v_start := date_trunc('month', CURRENT_DATE + (i || ' month')::interval)::date;
    v_end := (v_start + interval '1 month')::date;
    v_partition_name := 'audit_logs_y' || to_char(v_start, 'YYYY') || 'm' || to_char(v_start, 'MM');

    IF NOT EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = v_partition_name
    ) THEN
      EXECUTE format(
        'CREATE TABLE public.%I PARTITION OF public.audit_logs FOR VALUES FROM (%L) TO (%L)',
        v_partition_name, v_start, v_end
      );
      RAISE NOTICE 'Created audit partition: %', v_partition_name;
    END IF;
  END LOOP;
END;
$$;

-- ============================================================
-- 3. Function: Archive + drop old partitions (> 6 months)
-- ============================================================
-- Before dropping, saves a summary row to audit_logs_archive.
-- Uses DETACH (instant) + DROP.

CREATE OR REPLACE FUNCTION public.cleanup_old_audit_partitions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cutoff DATE;
  v_partition RECORD;
  v_count BIGINT;
  v_partition_start DATE;
  v_year TEXT;
  v_month TEXT;
BEGIN
  v_cutoff := date_trunc('month', CURRENT_DATE - interval '6 months')::date;

  FOR v_partition IN
    SELECT c.relname AS partition_name
    FROM pg_inherits i
    JOIN pg_class c ON c.oid = i.inhrelid
    JOIN pg_class parent ON parent.oid = i.inhparent
    JOIN pg_namespace n ON n.oid = parent.relnamespace
    WHERE n.nspname = 'public'
      AND parent.relname = 'audit_logs'
      AND c.relname != 'audit_logs_default'
      AND c.relname LIKE 'audit_logs_y%'
    ORDER BY c.relname
  LOOP
    -- Parse date from partition name: audit_logs_yYYYYmMM
    v_year := substring(v_partition.partition_name from 'y(\d{4})');
    v_month := substring(v_partition.partition_name from 'm(\d{2})$');

    IF v_year IS NULL OR v_month IS NULL THEN
      CONTINUE; -- Skip non-standard partition names
    END IF;

    v_partition_start := to_date(v_year || v_month, 'YYYYMM');

    IF v_partition_start < v_cutoff THEN
      -- Count rows before archiving
      EXECUTE format('SELECT count(*) FROM public.%I', v_partition.partition_name)
        INTO v_count;

      -- Archive summary
      EXECUTE format(
        $q$
        INSERT INTO public.audit_logs_archive
          (partition_name, period_start, period_end, record_count, summary)
        SELECT
          %L,
          %L::date,
          (%L::date + interval '1 month')::date,
          %s,
          jsonb_build_object(
            'action_counts',
            COALESCE(
              (SELECT jsonb_object_agg(action, cnt)
               FROM (SELECT action, count(*) cnt FROM public.%I GROUP BY action) a),
              '{}'::jsonb
            ),
            'table_counts',
            COALESCE(
              (SELECT jsonb_object_agg(table_name, cnt)
               FROM (SELECT table_name, count(*) cnt FROM public.%I GROUP BY table_name) t),
              '{}'::jsonb
            ),
            'company_ids',
            COALESCE(
              (SELECT jsonb_agg(DISTINCT company_id) FROM public.%I),
              '[]'::jsonb
            )
          )
        $q$,
        v_partition.partition_name,
        v_partition_start,
        v_partition_start,
        v_count,
        v_partition.partition_name,
        v_partition.partition_name,
        v_partition.partition_name
      );

      -- Detach (instant, no lock on parent) then drop
      EXECUTE format(
        'ALTER TABLE public.audit_logs DETACH PARTITION public.%I',
        v_partition.partition_name
      );
      EXECUTE format('DROP TABLE public.%I', v_partition.partition_name);

      RAISE NOTICE 'Archived and dropped partition: % (% rows)', v_partition.partition_name, v_count;
    END IF;
  END LOOP;
END;
$$;

-- ============================================================
-- 4. Schedule pg_cron jobs
-- ============================================================

-- Create future partitions on the 25th of each month at 03:00 UTC
SELECT cron.schedule(
  'audit-create-partitions',
  '0 3 25 * *',
  $$SELECT public.create_audit_partition_if_needed()$$
);

-- Archive + drop old partitions on the 1st of each month at 04:00 UTC
SELECT cron.schedule(
  'audit-cleanup-old-partitions',
  '0 4 1 * *',
  $$SELECT public.cleanup_old_audit_partitions()$$
);
