-- ============================================
-- Migration: P3 — Atomic Transaction Creation + P4 — Audit Trail gaps
-- Date: 2026-02-16
-- Purpose: Stored procedure for atomic transaction + payable/receivable
--          creation, reconciliation guard, and missing audit triggers.
-- ============================================

-- ============================================
-- P3: STORED PROCEDURE — create_transaction_with_account
-- Atomically creates a transaction and its associated payable OR receivable
-- in a single DB transaction — eliminating orphan records on partial failure.
-- ============================================

CREATE OR REPLACE FUNCTION public.create_transaction_with_account(
  p_company_id UUID,
  p_bank_account_id UUID,
  p_chart_account_id UUID DEFAULT NULL,
  p_category_id UUID DEFAULT NULL,
  p_customer_id UUID DEFAULT NULL,
  p_supplier_id UUID DEFAULT NULL,
  p_type TEXT DEFAULT 'saida',
  p_amount NUMERIC(15,2) DEFAULT 0,
  p_description TEXT DEFAULT '',
  p_transaction_date DATE DEFAULT CURRENT_DATE,
  p_payment_method TEXT DEFAULT NULL,
  p_document_number TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_nature TEXT DEFAULT 'realizado',
  p_forecast_type TEXT DEFAULT NULL,
  p_forecast_confidence NUMERIC DEFAULT NULL,
  p_forecast_basis TEXT DEFAULT NULL,
  p_forecast_notes TEXT DEFAULT NULL,
  p_recurrence TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transaction_id UUID;
BEGIN
  -- 1. Insert the transaction
  INSERT INTO public.transactions (
    company_id, bank_account_id, chart_account_id, category_id,
    customer_id, supplier_id, type, amount, description,
    transaction_date, payment_method, document_number, notes,
    nature, forecast_type, forecast_confidence, forecast_basis,
    forecast_notes, recurrence
  ) VALUES (
    p_company_id, p_bank_account_id, p_chart_account_id, p_category_id,
    p_customer_id, p_supplier_id, p_type::transaction_type, p_amount, p_description,
    p_transaction_date, p_payment_method, p_document_number, p_notes,
    p_nature, p_forecast_type::forecast_type, p_forecast_confidence, p_forecast_basis,
    p_forecast_notes, p_recurrence
  )
  RETURNING id INTO v_transaction_id;

  -- 2. Create associated payable (saida + supplier + realizado)
  IF p_nature = 'realizado' AND p_type = 'saida' AND p_supplier_id IS NOT NULL THEN
    INSERT INTO public.payables (
      company_id, supplier_id, chart_account_id, category_id,
      description, document_number, due_date, issue_date,
      total_amount, paid_amount, status, notes
    ) VALUES (
      p_company_id, p_supplier_id, p_chart_account_id, p_category_id,
      p_description, p_document_number, p_transaction_date, p_transaction_date,
      p_amount, 0, 'pendente', p_notes
    );
  END IF;

  -- 3. Create associated receivable (entrada + customer + realizado)
  IF p_nature = 'realizado' AND p_type = 'entrada' AND p_customer_id IS NOT NULL THEN
    INSERT INTO public.receivables (
      company_id, customer_id, chart_account_id, category_id,
      description, document_number, due_date, issue_date,
      total_amount, paid_amount, status, notes
    ) VALUES (
      p_company_id, p_customer_id, p_chart_account_id, p_category_id,
      p_description, p_document_number, p_transaction_date, p_transaction_date,
      p_amount, 0, 'pendente', p_notes
    );
  END IF;

  RETURN v_transaction_id;
END;
$$;

-- ============================================
-- P3: RECONCILIATION GUARD
-- Prevents UPDATE on reconciled transactions (except for soft-delete)
-- ============================================

CREATE OR REPLACE FUNCTION public.guard_reconciled_transactions()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow soft-delete on reconciled transactions (is_deleted change)
  IF NEW.is_deleted = true AND OLD.is_deleted = false THEN
    RETURN NEW;
  END IF;

  -- Block all other edits on reconciled transactions
  IF OLD.reconciled = true AND NEW.reconciled = OLD.reconciled THEN
    -- Check if meaningful financial fields are being changed
    IF OLD.amount != NEW.amount
       OR OLD.type != NEW.type
       OR OLD.bank_account_id != NEW.bank_account_id
       OR OLD.transaction_date != NEW.transaction_date
       OR OLD.description != NEW.description
    THEN
      RAISE EXCEPTION 'Transação conciliada não pode ser editada. Use estorno + novo lançamento.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS guard_reconciled_edit ON public.transactions;

CREATE TRIGGER guard_reconciled_edit
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.guard_reconciled_transactions();

-- ============================================
-- P3: REVERSE TRANSACTION (estorno)
-- Creates an inverse transaction referencing the original
-- ============================================

CREATE OR REPLACE FUNCTION public.reverse_transaction(
  p_transaction_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_reason TEXT DEFAULT 'Estorno'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_original RECORD;
  v_reversal_id UUID;
  v_reverse_type TEXT;
BEGIN
  -- Fetch original transaction
  SELECT * INTO v_original FROM public.transactions
    WHERE id = p_transaction_id AND is_deleted = false;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transação não encontrada ou já deletada: %', p_transaction_id;
  END IF;

  -- Determine reverse type
  IF v_original.type = 'entrada' THEN
    v_reverse_type := 'saida';
  ELSE
    v_reverse_type := 'entrada';
  END IF;

  -- Create reversal transaction
  INSERT INTO public.transactions (
    company_id, bank_account_id, chart_account_id, category_id,
    customer_id, supplier_id, type, amount, description,
    transaction_date, payment_method, document_number,
    notes, nature, reversal_of
  ) VALUES (
    v_original.company_id, v_original.bank_account_id, v_original.chart_account_id,
    v_original.category_id, v_original.customer_id, v_original.supplier_id,
    v_reverse_type::transaction_type, v_original.amount,
    p_reason || ': ' || v_original.description,
    CURRENT_DATE, v_original.payment_method, v_original.document_number,
    'Estorno de transação ' || p_transaction_id || '. Motivo: ' || p_reason,
    'realizado', p_transaction_id
  )
  RETURNING id INTO v_reversal_id;

  RETURN v_reversal_id;
END;
$$;

-- ============================================
-- P4: MISSING AUDIT TRIGGERS
-- Add audit triggers for tables not covered by the original migration
-- ============================================

-- Check and create trigger only if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'audit_debts'
  ) THEN
    CREATE TRIGGER audit_debts
      AFTER INSERT OR UPDATE OR DELETE ON public.debts
      FOR EACH ROW EXECUTE FUNCTION public.log_audit();
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'audit_payment_records'
  ) THEN
    CREATE TRIGGER audit_payment_records
      AFTER INSERT OR UPDATE OR DELETE ON public.payment_records
      FOR EACH ROW EXECUTE FUNCTION public.log_audit();
  END IF;
END$$;

-- Also add to categories if exists and has no trigger
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories' AND table_schema = 'public') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_categories') THEN
      CREATE TRIGGER audit_categories
        AFTER INSERT OR UPDATE OR DELETE ON public.categories
        FOR EACH ROW EXECUTE FUNCTION public.log_audit();
    END IF;
  END IF;
END$$;
