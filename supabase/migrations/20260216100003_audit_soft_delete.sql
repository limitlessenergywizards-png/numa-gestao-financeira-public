-- ============================================
-- Migration: Audit Remediation — Soft Delete & Financial Guards
-- Date: 2026-02-16
-- Purpose: Add soft delete columns to financial tables,
--          add CHECK constraints for balance integrity,
--          standardize NUMERIC precision.
-- ============================================

-- 1. Add soft delete columns to transactions
ALTER TABLE public.transactions 
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID;

-- 2. Add reversal tracking (estorno)
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS reversal_of UUID REFERENCES public.transactions(id);

-- 3. Guard: prevent bank balance from going negative
ALTER TABLE public.bank_accounts 
  DROP CONSTRAINT IF EXISTS chk_current_balance_non_negative;

ALTER TABLE public.bank_accounts 
  ADD CONSTRAINT chk_current_balance_non_negative CHECK (current_balance >= 0) NOT VALID;

-- 4. Standardize monetary column precision
ALTER TABLE public.transactions
  ALTER COLUMN amount TYPE NUMERIC(15,2);

ALTER TABLE public.receivables
  ALTER COLUMN total_amount TYPE NUMERIC(15,2),
  ALTER COLUMN paid_amount TYPE NUMERIC(15,2);

ALTER TABLE public.payables
  ALTER COLUMN total_amount TYPE NUMERIC(15,2),
  ALTER COLUMN paid_amount TYPE NUMERIC(15,2);

ALTER TABLE public.payment_records
  ALTER COLUMN amount TYPE NUMERIC(15,2);

-- 5. Index for soft delete filter (most queries will filter is_deleted = false)
CREATE INDEX IF NOT EXISTS idx_transactions_not_deleted 
  ON public.transactions (company_id, transaction_date DESC) 
  WHERE is_deleted = false;

-- 6. Index for reversal lookups
CREATE INDEX IF NOT EXISTS idx_transactions_reversal 
  ON public.transactions (reversal_of) 
  WHERE reversal_of IS NOT NULL;

-- 7. Update the balance trigger to skip soft-deleted transactions
CREATE OR REPLACE FUNCTION public.update_bank_balance_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip soft-deleted transactions
  IF TG_OP = 'UPDATE' AND NEW.is_deleted = true AND OLD.is_deleted = false THEN
    -- This is a soft delete — reverse the balance effect
    IF OLD.type = 'entrada' THEN
      UPDATE public.bank_accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.bank_account_id;
    ELSIF OLD.type = 'saida' THEN
      UPDATE public.bank_accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.bank_account_id;
    END IF;
    RETURN NEW;
  END IF;
  
  -- Skip if already deleted
  IF TG_OP = 'INSERT' AND NEW.is_deleted = true THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'entrada' THEN
      UPDATE public.bank_accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.bank_account_id;
    ELSIF NEW.type = 'saida' THEN
      UPDATE public.bank_accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.bank_account_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Reverse old effect
    IF OLD.type = 'entrada' THEN
      UPDATE public.bank_accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.bank_account_id;
    ELSIF OLD.type = 'saida' THEN
      UPDATE public.bank_accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.bank_account_id;
    END IF;
    -- Apply new effect (only if not deleted)
    IF NEW.is_deleted = false THEN
      IF NEW.type = 'entrada' THEN
        UPDATE public.bank_accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.bank_account_id;
      ELSIF NEW.type = 'saida' THEN
        UPDATE public.bank_accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.bank_account_id;
      END IF;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.type = 'entrada' THEN
      UPDATE public.bank_accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.bank_account_id;
    ELSIF OLD.type = 'saida' THEN
      UPDATE public.bank_accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.bank_account_id;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
