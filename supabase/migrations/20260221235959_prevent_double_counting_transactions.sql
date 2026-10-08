-- ============================================
-- Migration: Prevent Double Counting for Synced Payables
-- Date: 2026-02-21
-- Purpose: Update the `update_bank_balance_on_transaction` trigger to
--          ignore transactions that are synced from payables or receivables
--          preventing double deduction since `payment_records` handles it.
-- ============================================

CREATE OR REPLACE FUNCTION public.update_bank_balance_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- NEW GUARD: Skip balance update if transaction is linked to a payable/receivable
  -- The `update_bank_balance_on_payment` trigger will handle the balance change.
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.forecast_basis LIKE 'payable:%' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.forecast_basis LIKE 'receivable:%' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

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
