-- ============================================
-- Migration: Fix recalculate_bank_balance — two critical bugs
-- Date: 2026-03-30
-- Bug #1: pr.is_deleted = false references non-existent column on payment_records
--         (is_deleted only exists on transactions). This caused the payment_records
--         subquery to error, returning 0 and producing artificially low balances.
-- Bug #2: Missing AND t.nature = 'realizado' filter. The balance trigger skips
--         previsao/convertido, but this RPC was counting them — causing drift.
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
      AND t.nature = 'realizado'
      AND (t.forecast_basis IS NULL
           OR (t.forecast_basis NOT LIKE 'payable:%'
               AND t.forecast_basis NOT LIKE 'receivable:%'))
    ), 0
  ) + COALESCE(
    (SELECT SUM(
      CASE
        WHEN pr.receivable_id IS NOT NULL THEN pr.amount
        WHEN pr.payable_id IS NOT NULL THEN -pr.amount
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

  UPDATE public.bank_accounts
  SET current_balance = v_new_balance
  WHERE id = p_bank_account_id;

  RETURN v_new_balance;
END;
$$;

-- Recalculate ALL bank balances with the fixed RPC
SELECT recalculate_bank_balance(id) FROM bank_accounts WHERE is_deleted = false;
