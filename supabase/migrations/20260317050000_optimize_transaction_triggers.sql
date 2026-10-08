-- ============================================
-- Migration: Optimize Transaction Triggers
-- Date: 2026-03-17
-- Purpose: Reduce trigger overhead on transactions table from 6 triggers to
--          3 optimized triggers with WHEN clauses, consolidated BEFORE logic,
--          net-delta bank balance, diff-only audit, and bulk import bypass.
-- Expected impact: 50-91% reduction in trigger overhead depending on operation type.
-- ============================================

-- ============================================================
-- PHASE 1: Create optimized functions (replaces existing ones)
-- ============================================================

-- 1A. Consolidated BEFORE UPDATE trigger (replaces 3 separate triggers)
-- Order: guard_reconciled → save_original_dates → set updated_at
CREATE OR REPLACE FUNCTION public.transactions_before_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- 1. GUARD: Reject edits to reconciled transactions (cheapest check, can abort early)
  --    Allow soft-delete even for reconciled rows
  IF NOT (NEW.is_deleted = true AND OLD.is_deleted = false) THEN
    IF OLD.reconciled = true AND NEW.reconciled = OLD.reconciled THEN
      IF OLD.amount IS DISTINCT FROM NEW.amount
         OR OLD.type IS DISTINCT FROM NEW.type
         OR OLD.bank_account_id IS DISTINCT FROM NEW.bank_account_id
         OR OLD.transaction_date IS DISTINCT FROM NEW.transaction_date
         OR OLD.description IS DISTINCT FROM NEW.description
      THEN
        RAISE EXCEPTION 'Transacao conciliada nao pode ser editada. Use estorno + novo lancamento.';
      END IF;
    END IF;
  END IF;

  -- 2. SAVE ORIGINAL DATES (only on first change)
  IF OLD.original_transaction_date IS NULL
     AND NEW.transaction_date IS DISTINCT FROM OLD.transaction_date THEN
    NEW.original_transaction_date := OLD.transaction_date;
  END IF;
  IF OLD.original_created_at IS NULL
     AND NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    NEW.original_created_at := OLD.created_at;
  END IF;

  -- 3. UPDATED_AT (always set on any update)
  NEW.updated_at := now();

  RETURN NEW;
END;
$$;


-- 1B. Optimized bank balance trigger (net-delta for same-account UPDATEs)
CREATE OR REPLACE FUNCTION public.update_bank_balance_on_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_effect NUMERIC := 0;
  v_new_effect NUMERIC := 0;
BEGIN
  -- Bulk import bypass: skip per-row trigger, caller will recalculate
  IF current_setting('app.bulk_import', true) = 'true' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Guard: Skip for payable/receivable-linked transactions (payment_records handles balance)
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    IF NEW.forecast_basis LIKE 'payable:%' OR NEW.forecast_basis LIKE 'receivable:%' THEN
      RETURN COALESCE(NEW, OLD);
    END IF;
  END IF;
  IF TG_OP = 'DELETE' THEN
    IF OLD.forecast_basis LIKE 'payable:%' OR OLD.forecast_basis LIKE 'receivable:%' THEN
      RETURN OLD;
    END IF;
  END IF;

  -- Soft-delete handling: reverse the old balance effect
  IF TG_OP = 'UPDATE' AND NEW.is_deleted = true AND OLD.is_deleted = false THEN
    v_old_effect := CASE WHEN OLD.type = 'entrada' THEN OLD.amount ELSE -OLD.amount END;
    UPDATE public.bank_accounts
      SET current_balance = current_balance - v_old_effect
      WHERE id = OLD.bank_account_id;
    RETURN NEW;
  END IF;

  -- Skip already-deleted inserts
  IF TG_OP = 'INSERT' AND NEW.is_deleted = true THEN
    RETURN NEW;
  END IF;

  -- Calculate old effect (what to revert)
  IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
    v_old_effect := CASE WHEN OLD.type = 'entrada' THEN OLD.amount ELSE -OLD.amount END;
  END IF;

  -- Calculate new effect (what to apply)
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.is_deleted = false THEN
      v_new_effect := CASE WHEN NEW.type = 'entrada' THEN NEW.amount ELSE -NEW.amount END;
    END IF;
  END IF;

  -- OPTIMIZED: Single UPDATE when bank_account_id is unchanged
  IF TG_OP = 'UPDATE' AND OLD.bank_account_id = NEW.bank_account_id THEN
    -- Net delta: skip entirely if no change
    IF v_new_effect - v_old_effect <> 0 THEN
      UPDATE public.bank_accounts
        SET current_balance = current_balance + (v_new_effect - v_old_effect)
        WHERE id = NEW.bank_account_id;
    END IF;
  ELSE
    -- Different bank accounts (or INSERT/DELETE): separate operations
    IF v_old_effect <> 0 AND TG_OP IN ('DELETE', 'UPDATE') THEN
      UPDATE public.bank_accounts
        SET current_balance = current_balance - v_old_effect
        WHERE id = OLD.bank_account_id;
    END IF;
    IF v_new_effect <> 0 AND TG_OP IN ('INSERT', 'UPDATE') THEN
      UPDATE public.bank_accounts
        SET current_balance = current_balance + v_new_effect
        WHERE id = NEW.bank_account_id;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;


-- 1C. Optimized audit function (diff-only for UPDATEs, bulk bypass)
CREATE OR REPLACE FUNCTION public.log_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_old_data jsonb;
  v_new_data jsonb;
  v_changes jsonb;
  v_key text;
BEGIN
  -- Bulk import bypass
  IF current_setting('app.bulk_import', true) = 'true' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  v_user_id := auth.uid();

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (
      company_id, user_id, action, table_name,
      record_id, new_data
    ) VALUES (
      NEW.company_id, v_user_id, 'INSERT', TG_TABLE_NAME,
      NEW.id, to_jsonb(NEW)
    );
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Build diff: only store changed columns (saves ~70-90% storage)
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
    v_changes := '{}'::jsonb;

    FOR v_key IN SELECT jsonb_object_keys(v_new_data)
    LOOP
      -- Skip updated_at since it always changes via BEFORE trigger
      IF v_key = 'updated_at' THEN CONTINUE; END IF;

      IF (v_new_data -> v_key) IS DISTINCT FROM (v_old_data -> v_key) THEN
        v_changes := v_changes || jsonb_build_object(
          v_key, jsonb_build_object(
            'old', v_old_data -> v_key,
            'new', v_new_data -> v_key
          )
        );
      END IF;
    END LOOP;

    -- If only updated_at changed, skip audit entirely
    IF v_changes = '{}'::jsonb THEN
      RETURN NEW;
    END IF;

    -- Store diff in old_data column, new_data = NULL signals diff format
    INSERT INTO public.audit_logs (
      company_id, user_id, action, table_name,
      record_id, old_data, new_data
    ) VALUES (
      NEW.company_id, v_user_id, 'UPDATE', TG_TABLE_NAME,
      NEW.id, v_changes, NULL
    );
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (
      company_id, user_id, action, table_name,
      record_id, old_data
    ) VALUES (
      OLD.company_id, v_user_id, 'DELETE', TG_TABLE_NAME,
      OLD.id, to_jsonb(OLD)
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;


-- 1D. Tenant metrics function (unchanged logic, bulk bypass added)
CREATE OR REPLACE FUNCTION public.update_tenant_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Bulk import bypass
  IF current_setting('app.bulk_import', true) = 'true' THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.tenant_metrics (company_id, transactions_count, last_transaction_at, updated_at)
  VALUES (NEW.company_id, 1, NEW.created_at, now())
  ON CONFLICT (company_id)
  DO UPDATE SET
    transactions_count = tenant_metrics.transactions_count + 1,
    last_transaction_at = GREATEST(tenant_metrics.last_transaction_at, NEW.created_at),
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- ============================================================
-- PHASE 2: Drop old triggers and create optimized ones (atomic)
-- ============================================================

-- Drop all 6 existing triggers
DROP TRIGGER IF EXISTS guard_reconciled_edit ON public.transactions;
DROP TRIGGER IF EXISTS tr_save_original_dates ON public.transactions;
DROP TRIGGER IF EXISTS update_transactions_updated_at ON public.transactions;
DROP TRIGGER IF EXISTS update_bank_balance_transaction ON public.transactions;
DROP TRIGGER IF EXISTS audit_transactions ON public.transactions;
DROP TRIGGER IF EXISTS trigger_update_tenant_metrics ON public.transactions;

-- BEFORE UPDATE: Single consolidated trigger (guard + dates + updated_at)
CREATE TRIGGER tr_transactions_before_update
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.transactions_before_update();

-- AFTER INSERT/DELETE: Bank balance (always fires - named 'aa_' to fire first)
CREATE TRIGGER aa_update_bank_balance_transaction
  AFTER INSERT OR DELETE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_bank_balance_on_transaction();

-- AFTER UPDATE: Bank balance with WHEN clause (skips non-financial edits)
CREATE TRIGGER aa_update_bank_balance_transaction_upd
  AFTER UPDATE ON public.transactions
  FOR EACH ROW
  WHEN (
    OLD.amount IS DISTINCT FROM NEW.amount
    OR OLD.type IS DISTINCT FROM NEW.type
    OR OLD.bank_account_id IS DISTINCT FROM NEW.bank_account_id
    OR OLD.is_deleted IS DISTINCT FROM NEW.is_deleted
  )
  EXECUTE FUNCTION public.update_bank_balance_on_transaction();

-- AFTER INSERT/DELETE: Audit (deferred - named 'ab_' to fire second)
CREATE CONSTRAINT TRIGGER ab_audit_transactions
  AFTER INSERT OR DELETE ON public.transactions
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION public.log_audit();

-- AFTER UPDATE: Audit with WHEN clause (skips trivial updates)
CREATE CONSTRAINT TRIGGER ab_audit_transactions_upd
  AFTER UPDATE ON public.transactions
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  WHEN (
    OLD.amount IS DISTINCT FROM NEW.amount
    OR OLD.type IS DISTINCT FROM NEW.type
    OR OLD.bank_account_id IS DISTINCT FROM NEW.bank_account_id
    OR OLD.description IS DISTINCT FROM NEW.description
    OR OLD.transaction_date IS DISTINCT FROM NEW.transaction_date
    OR OLD.is_deleted IS DISTINCT FROM NEW.is_deleted
    OR OLD.reconciled IS DISTINCT FROM NEW.reconciled
    OR OLD.nature IS DISTINCT FROM NEW.nature
    OR OLD.category_id IS DISTINCT FROM NEW.category_id
    OR OLD.chart_account_id IS DISTINCT FROM NEW.chart_account_id
    OR OLD.customer_id IS DISTINCT FROM NEW.customer_id
    OR OLD.supplier_id IS DISTINCT FROM NEW.supplier_id
    OR OLD.notes IS DISTINCT FROM NEW.notes
    OR OLD.document_number IS DISTINCT FROM NEW.document_number
    OR OLD.payment_method IS DISTINCT FROM NEW.payment_method
  )
  EXECUTE FUNCTION public.log_audit();

-- AFTER INSERT: Tenant metrics (deferred - named 'ac_' to fire last)
CREATE CONSTRAINT TRIGGER ac_update_tenant_metrics
  AFTER INSERT ON public.transactions
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  WHEN (NEW.is_deleted = false)
  EXECUTE FUNCTION public.update_tenant_metrics();


-- ============================================================
-- PHASE 3: Bulk soft-delete RPC (new, no existing callers)
-- ============================================================

CREATE OR REPLACE FUNCTION public.bulk_soft_delete_transactions(
  p_ids UUID[],
  p_company_id UUID,
  p_user_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_affected_bank_ids UUID[];
BEGIN
  -- Enable bulk mode: skips audit + bank_balance + metrics per-row triggers
  SET LOCAL app.bulk_import = 'true';

  -- Collect affected bank account IDs before update
  SELECT ARRAY_AGG(DISTINCT bank_account_id) INTO v_affected_bank_ids
  FROM public.transactions
  WHERE id = ANY(p_ids)
    AND company_id = p_company_id
    AND is_deleted = false;

  -- Perform the bulk soft-delete
  UPDATE public.transactions
  SET is_deleted = true,
      deleted_at = now(),
      deleted_by = p_user_id,
      updated_at = now()
  WHERE id = ANY(p_ids)
    AND company_id = p_company_id
    AND is_deleted = false;

  -- Recalculate bank balances from scratch for affected accounts
  IF v_affected_bank_ids IS NOT NULL AND array_length(v_affected_bank_ids, 1) > 0 THEN
    UPDATE public.bank_accounts ba
    SET current_balance = ba.initial_balance + COALESCE(sub.net_effect, 0)
    FROM (
      SELECT
        t.bank_account_id,
        SUM(
          CASE
            WHEN t.type = 'entrada' THEN t.amount
            WHEN t.type = 'saida' THEN -t.amount
            ELSE 0
          END
        ) AS net_effect
      FROM public.transactions t
      WHERE t.bank_account_id = ANY(v_affected_bank_ids)
        AND t.is_deleted = false
        AND t.forecast_basis NOT LIKE 'payable:%'
        AND t.forecast_basis NOT LIKE 'receivable:%'
      GROUP BY t.bank_account_id
    ) sub
    WHERE ba.id = sub.bank_account_id;

    -- Handle accounts with zero remaining transactions
    UPDATE public.bank_accounts ba
    SET current_balance = ba.initial_balance
    WHERE ba.id = ANY(v_affected_bank_ids)
      AND NOT EXISTS (
        SELECT 1 FROM public.transactions t
        WHERE t.bank_account_id = ba.id
          AND t.is_deleted = false
          AND t.forecast_basis NOT LIKE 'payable:%'
          AND t.forecast_basis NOT LIKE 'receivable:%'
      );
  END IF;

  -- Write a single summary audit entry instead of N individual ones
  INSERT INTO public.audit_logs (
    company_id, user_id, action, table_name, record_id, new_data
  ) VALUES (
    p_company_id, p_user_id, 'BULK_DELETE', 'transactions', NULL,
    jsonb_build_object('ids', to_jsonb(p_ids), 'count', array_length(p_ids, 1))
  );

  -- SET LOCAL auto-resets at transaction end, but be explicit
  SET LOCAL app.bulk_import = 'false';
END;
$$;
