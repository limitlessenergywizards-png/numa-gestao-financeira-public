-- ============================================
-- Migration: Fix bank balance trigger to skip previsao/convertido transactions
-- Date: 2026-03-29
-- Purpose: Add a guard so that transactions with nature <> 'realizado' do not
--          affect the bank balance. Forecasts (previsao) and converted forecasts
--          (convertido) are planning entries and must never touch real balances.
--          Guard is inserted after the existing forecast_basis guard.
-- ============================================

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

  -- Guard: Skip for non-realized transactions (previsao/convertido don't affect balance)
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    IF NEW.nature IS NOT NULL AND NEW.nature <> 'realizado' THEN
      RETURN COALESCE(NEW, OLD);
    END IF;
  END IF;
  IF TG_OP = 'DELETE' THEN
    IF OLD.nature IS NOT NULL AND OLD.nature <> 'realizado' THEN
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
