-- ============================================================================
-- Migration: Partition audit_logs by month (native declarative partitioning)
-- Date: 2026-03-18
-- Purpose: Convert monolithic audit_logs to monthly partitioned table.
--          Enables efficient retention (DROP PARTITION vs DELETE),
--          faster queries with partition pruning, and isolated VACUUM per month.
-- Strategy: Rename-swap with data copy. Brief lock on ~3,700 rows.
-- Rollback: Rename audit_logs_old back to audit_logs.
-- ============================================================================

BEGIN;

-- ============================================================
-- PHASE 1: Create the partitioned table structure
-- ============================================================
-- Partition key (created_at) must be in PRIMARY KEY for declarative partitioning.
-- All columns match the current live schema (including columns added outside migrations:
-- changed_fields, metadata, reason — reflected in Supabase generated types).

CREATE TABLE public.audit_logs_partitioned (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  company_id UUID,                 -- Nullable (some service_role operations lack company context)
  user_id UUID,                    -- Nullable (service_role/AI agent actions)
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  changed_fields TEXT[],           -- Array of changed field names
  metadata JSONB,                  -- Extensible metadata
  reason TEXT,                     -- User-provided reason for action
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Partition key must be part of any unique/PK constraint
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- ============================================================
-- PHASE 2: Create partitions for existing data + 3 months ahead
-- ============================================================
-- Data spans Jan 2026 to March 2026 (system started ~2026-01-09).
-- Creating through June 2026 + default for safety.

CREATE TABLE public.audit_logs_y2026m01 PARTITION OF public.audit_logs_partitioned
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE public.audit_logs_y2026m02 PARTITION OF public.audit_logs_partitioned
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE public.audit_logs_y2026m03 PARTITION OF public.audit_logs_partitioned
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE public.audit_logs_y2026m04 PARTITION OF public.audit_logs_partitioned
  FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE public.audit_logs_y2026m05 PARTITION OF public.audit_logs_partitioned
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE public.audit_logs_y2026m06 PARTITION OF public.audit_logs_partitioned
  FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

-- Default partition catches rows outside defined ranges
CREATE TABLE public.audit_logs_default PARTITION OF public.audit_logs_partitioned DEFAULT;

-- ============================================================
-- PHASE 3: Recreate indexes (auto-propagate to all partitions)
-- ============================================================

CREATE INDEX idx_audit_logs_part_company
  ON public.audit_logs_partitioned (company_id);

CREATE INDEX idx_audit_logs_part_created
  ON public.audit_logs_partitioned (created_at DESC);

-- Composite index for TransactionAuditDrawer queries:
--   WHERE table_name='transactions' AND record_id=? ORDER BY created_at DESC
CREATE INDEX idx_audit_logs_part_table_record
  ON public.audit_logs_partitioned (table_name, record_id, created_at DESC)
  WHERE record_id IS NOT NULL;

-- ============================================================
-- PHASE 4: Copy existing data
-- ============================================================

INSERT INTO public.audit_logs_partitioned
  (id, company_id, user_id, action, table_name, record_id,
   old_data, new_data, changed_fields, metadata, reason,
   ip_address, user_agent, created_at)
SELECT
  id, company_id, user_id, action, table_name, record_id,
  old_data, new_data, changed_fields, metadata, reason,
  ip_address, user_agent, created_at
FROM public.audit_logs;

-- ============================================================
-- PHASE 5: Atomic rename-swap
-- ============================================================
-- Brief ACCESS EXCLUSIVE lock. ~3,700 rows = sub-second.

ALTER TABLE public.audit_logs RENAME TO audit_logs_old;
ALTER TABLE public.audit_logs_partitioned RENAME TO audit_logs;

-- ============================================================
-- PHASE 6: Enable RLS + recreate policies
-- ============================================================

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- SELECT: Admins can view audit logs of their companies (same as original)
CREATE POLICY "Admins can view audit logs of their companies"
ON public.audit_logs FOR SELECT
USING (
  user_belongs_to_company(auth.uid(), company_id)
  AND has_role(auth.uid(), 'admin')
);

-- INSERT: Allow trigger function (SECURITY DEFINER) and service_role
CREATE POLICY "System can insert audit logs"
ON public.audit_logs FOR INSERT
WITH CHECK (true);

-- ============================================================
-- PHASE 7: Add to Supabase Realtime publication
-- ============================================================
-- AuditTab uses postgres_changes subscription on audit_logs.

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
EXCEPTION WHEN duplicate_object THEN
  NULL; -- Already in publication
END$$;

-- ============================================================
-- NOTE: FK constraint omitted. PostgreSQL does not support NOT VALID FK
-- on partitioned tables. Integrity is enforced by the log_audit() trigger
-- (SECURITY DEFINER) which always copies company_id from the source row.
-- ============================================================

-- ============================================================
-- PHASE 9: Data integrity verification
-- ============================================================

DO $$
DECLARE
  v_old_count BIGINT;
  v_new_count BIGINT;
BEGIN
  SELECT count(*) INTO v_old_count FROM public.audit_logs_old;
  SELECT count(*) INTO v_new_count FROM public.audit_logs;
  IF v_old_count != v_new_count THEN
    RAISE EXCEPTION 'Row count mismatch after partition migration: old=% new=%',
      v_old_count, v_new_count;
  END IF;
  RAISE NOTICE 'Partition migration verified: % rows migrated successfully', v_new_count;
END$$;

COMMIT;
