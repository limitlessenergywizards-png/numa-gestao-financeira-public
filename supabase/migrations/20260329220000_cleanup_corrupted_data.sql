-- ============================================================
-- DATA CLEANUP: Fix existing corrupted data from before code fixes
-- Date: 2026-03-29
-- Purpose: One-time cleanup to fix data corruption caused by
--          the old convert_forecast_to_actual RPC which didn't
--          mark forecasts as 'convertido' or update linked payables.
-- ============================================================

-- STEP 1: Mark old converted forecasts as 'convertido'
-- These are previsão transactions that have converted_at set but
-- still have nature = 'previsao' (old RPC didn't change nature)
UPDATE public.transactions
SET nature = 'convertido'
WHERE nature = 'previsao'
  AND converted_at IS NOT NULL
  AND is_deleted = false;

-- STEP 2: Transfer forecast_basis from converted forecasts to their realized counterparts
-- The old RPC created realized transactions WITHOUT forecast_basis
UPDATE public.transactions t_realized
SET forecast_basis = t_forecast.forecast_basis
FROM public.transactions t_forecast
WHERE t_realized.linked_forecast_id = t_forecast.id
  AND t_realized.nature = 'realizado'
  AND t_realized.forecast_basis IS NULL
  AND t_forecast.forecast_basis IS NOT NULL
  AND t_forecast.nature = 'convertido'
  AND t_realized.is_deleted = false;

-- STEP 3: Clear forecast_basis from converted forecasts (prevent double-pointing)
UPDATE public.transactions
SET forecast_basis = NULL
WHERE nature = 'convertido'
  AND forecast_basis IS NOT NULL
  AND is_deleted = false;

-- STEP 4: Mark payables/receivables as 'pago' if their linked transaction was converted
-- Payables linked to converted forecasts
UPDATE public.payables p
SET status = 'pago'
FROM public.transactions t
WHERE t.forecast_basis = 'payable:' || p.id::text
  AND t.nature = 'realizado'
  AND t.is_deleted = false
  AND p.status IN ('pendente', 'parcial')
  AND p.is_deleted = false;

-- Receivables linked to converted forecasts
UPDATE public.receivables r
SET status = 'pago'
FROM public.transactions t
WHERE t.forecast_basis = 'receivable:' || r.id::text
  AND t.nature = 'realizado'
  AND t.is_deleted = false
  AND r.status IN ('pendente', 'parcial')
  AND r.is_deleted = false;

-- STEP 5: Recalculate ALL bank account balances from scratch
-- This fixes any balance drift caused by triggers counting previsão transactions
DO $$
DECLARE
  v_ba RECORD;
  v_new_balance NUMERIC;
BEGIN
  FOR v_ba IN
    SELECT id, name, current_balance, initial_balance
    FROM public.bank_accounts
    WHERE is_deleted = false
  LOOP
    -- Recalculate: initial_balance + realized transactions + payment_records
    SELECT v_ba.initial_balance + COALESCE(
      (SELECT SUM(
        CASE WHEN t.type = 'entrada' THEN t.amount
             WHEN t.type = 'saida' THEN -t.amount
             ELSE 0 END
      )
      FROM public.transactions t
      WHERE t.bank_account_id = v_ba.id
        AND t.is_deleted = false
        AND t.nature = 'realizado'
        AND (t.forecast_basis IS NULL
             OR (t.forecast_basis NOT LIKE 'payable:%'
                 AND t.forecast_basis NOT LIKE 'receivable:%'))
      ), 0
    ) + COALESCE(
      (SELECT SUM(
        CASE WHEN pr.receivable_id IS NOT NULL THEN pr.amount
             WHEN pr.payable_id IS NOT NULL THEN -pr.amount
             ELSE 0 END
      )
      FROM public.payment_records pr
      WHERE pr.bank_account_id = v_ba.id
        AND pr.is_deleted = false
      ), 0
    )
    INTO v_new_balance;

    IF v_new_balance IS DISTINCT FROM v_ba.current_balance THEN
      RAISE NOTICE 'Bank % (%): % -> %', v_ba.id, v_ba.name, v_ba.current_balance, v_new_balance;
      UPDATE public.bank_accounts
      SET current_balance = v_new_balance
      WHERE id = v_ba.id;
    END IF;
  END LOOP;
END;
$$;
