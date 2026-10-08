-- ============================================
-- Migration: Fix recalculate_bank_balance to filter is_deleted on payment_records
-- Date: 2026-03-29
-- Purpose: Add AND pr.is_deleted = false to the payment_records subquery so that
--          soft-deleted payment records do not contribute to the recalculated balance.
-- ============================================

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
      AND pr.is_deleted = false
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
