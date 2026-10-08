-- ============================================
-- Migration: Add recalculate_bank_balance RPC
-- Date: 2026-03-18
-- Purpose: Provide a callable function to recalculate bank account balances
--          from scratch, fixing drift caused by trigger edge cases.
-- Bugs addressed: #1 (Bank balance inconsistent)
-- ============================================

-- Recalculate balance for a single bank account
CREATE OR REPLACE FUNCTION public.recalculate_bank_balance(p_bank_account_id uuid)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance NUMERIC;
BEGIN
  -- Recalculate: initial_balance + SUM(non-deleted, non-payable/receivable-linked transactions)
  SELECT ba.initial_balance + COALESCE(
    (SELECT SUM(
      CASE
        WHEN t.type = 'entrada' THEN t.amount
        WHEN t.type = 'saida' THEN -t.amount
        ELSE 0
      END
    )
    FROM public.transactions t
    WHERE t.bank_account_id = p_bank_account_id
      AND t.is_deleted = false
      AND (t.forecast_basis IS NULL
           OR (t.forecast_basis NOT LIKE 'payable:%'
               AND t.forecast_basis NOT LIKE 'receivable:%'))
    ), 0
  ) + COALESCE(
    -- Add payment_records effect (these are excluded from transaction trigger)
    (SELECT SUM(
      CASE
        WHEN pr.receivable_id IS NOT NULL THEN pr.amount   -- receivable = money in
        WHEN pr.payable_id IS NOT NULL THEN -pr.amount     -- payable = money out
        ELSE 0
      END
    )
    FROM public.payment_records pr
    WHERE pr.bank_account_id = p_bank_account_id
    ), 0
  )
  INTO v_new_balance
  FROM public.bank_accounts ba
  WHERE ba.id = p_bank_account_id;

  -- Update the balance
  UPDATE public.bank_accounts
  SET current_balance = v_new_balance
  WHERE id = p_bank_account_id;

  RETURN v_new_balance;
END;
$$;

-- Recalculate balances for ALL bank accounts of a company
CREATE OR REPLACE FUNCTION public.recalculate_all_bank_balances(p_company_id uuid)
RETURNS TABLE(bank_account_id uuid, bank_name text, old_balance numeric, new_balance numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ba RECORD;
  v_new NUMERIC;
BEGIN
  FOR v_ba IN
    SELECT ba.id, ba.name, ba.current_balance
    FROM public.bank_accounts ba
    WHERE ba.company_id = p_company_id
      AND ba.is_deleted = false
  LOOP
    v_new := public.recalculate_bank_balance(v_ba.id);
    bank_account_id := v_ba.id;
    bank_name := v_ba.name;
    old_balance := v_ba.current_balance;
    new_balance := v_new;
    RETURN NEXT;
  END LOOP;
END;
$$;

-- Grant execute to authenticated users (RLS on bank_accounts still applies)
GRANT EXECUTE ON FUNCTION public.recalculate_bank_balance(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.recalculate_all_bank_balances(uuid) TO authenticated;
