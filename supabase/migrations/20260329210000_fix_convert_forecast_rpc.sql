-- ============================================
-- Migration: Fix convert_forecast_to_actual RPC
-- Date: 2026-03-29
-- Purpose: When keeping the forecast (p_keep_forecast = TRUE):
--   1. Change nature to 'convertido' on the original forecast
--   2. Copy forecast_basis from original forecast to the new realized transaction
--   3. Clear forecast_basis on the original forecast (prevent dual-link to payable)
--   4. Update linked payable/receivable status to 'pago' if forecast_basis points to one
-- ============================================

CREATE OR REPLACE FUNCTION public.convert_forecast_to_actual(
  p_forecast_id UUID,
  p_actual_amount NUMERIC,
  p_keep_forecast BOOLEAN DEFAULT TRUE,
  p_transaction_date DATE DEFAULT CURRENT_DATE,
  p_converted_by UUID DEFAULT NULL -- Vulnerabilidade de Spoofing (Agora filtrada)
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_forecast RECORD;
  v_new_id UUID;
  v_deviation NUMERIC;
  v_auth_uid UUID;
  v_forecast_basis TEXT;
  v_basis_type TEXT;
  v_basis_id UUID;
BEGIN
  -- 0. PORTA DE FERRO
  v_auth_uid := auth.uid();
  IF v_auth_uid IS NULL THEN
     RAISE EXCEPTION 'Acesso negado.' USING ERRCODE = '42501';
  END IF;

  -- 0.1 OVERRIDE PAYLOAD: Destrói spoofing de autoria
  p_converted_by := v_auth_uid;

  -- 1. LOCK AND FETCH + OWNERSHIP (Composite Target Lock)
  SELECT t.* INTO v_forecast
  FROM public.transactions t
  JOIN public.user_companies uc ON uc.company_id = t.company_id
  WHERE t.id = p_forecast_id
    AND t.nature = 'previsao'
    AND t.converted_at IS NULL
    AND uc.user_id = v_auth_uid
  FOR UPDATE OF t;

  IF v_forecast IS NULL THEN
    RAISE EXCEPTION 'Item logístico inexistente.' USING ERRCODE = 'P0002';
  END IF;

  IF p_actual_amount <= 0 THEN
    RAISE EXCEPTION 'Falha de payload: valor ínfimo' USING ERRCODE = 'check_violation';
  END IF;

  -- 2. Capture forecast_basis before clearing it
  v_forecast_basis := v_forecast.forecast_basis;

  -- 3. INSERT the realized transaction, copying forecast_basis from the original forecast
  INSERT INTO public.transactions (
    company_id, bank_account_id, chart_account_id,
    category_id, customer_id, supplier_id,
    type, amount, description, transaction_date,
    payment_method, document_number,
    notes, nature, linked_forecast_id, forecast_basis
  ) VALUES (
    v_forecast.company_id, v_forecast.bank_account_id,
    v_forecast.chart_account_id, v_forecast.category_id,
    v_forecast.customer_id, v_forecast.supplier_id,
    v_forecast.type, p_actual_amount, v_forecast.description,
    p_transaction_date, v_forecast.payment_method,
    v_forecast.document_number,
    format('Convertido de previsão. Valor previsto: R$ %s', v_forecast.amount::TEXT),
    'realizado', p_forecast_id, v_forecast_basis
  ) RETURNING id INTO v_new_id;

  IF p_keep_forecast THEN
    -- Change nature to 'convertido', mark converted_at/by, clear forecast_basis
    UPDATE public.transactions
    SET converted_at = NOW(),
        converted_by = p_converted_by,
        nature = 'convertido',
        forecast_basis = NULL
    WHERE id = p_forecast_id;

    -- 4. If the forecast had a payable/receivable basis, mark it as 'pago'
    IF v_forecast_basis IS NOT NULL THEN
      IF v_forecast_basis LIKE 'payable:%' THEN
        v_basis_id := (regexp_match(v_forecast_basis, 'payable:(.+)'))[1]::UUID;
        UPDATE public.payables
        SET status = 'pago'
        WHERE id = v_basis_id;
      ELSIF v_forecast_basis LIKE 'receivable:%' THEN
        v_basis_id := (regexp_match(v_forecast_basis, 'receivable:(.+)'))[1]::UUID;
        UPDATE public.receivables
        SET status = 'pago'
        WHERE id = v_basis_id;
      END IF;
    END IF;
  ELSE
    DELETE FROM public.transactions WHERE id = p_forecast_id;
  END IF;

  v_deviation := CASE
    WHEN v_forecast.amount = 0 THEN
      CASE WHEN p_actual_amount > 0 THEN 100.0 ELSE 0.0 END
    ELSE ((p_actual_amount - v_forecast.amount) / v_forecast.amount) * 100
  END;

  RETURN json_build_object(
    'new_transaction_id', v_new_id,
    'deviation_percent', ROUND(v_deviation, 1),
    'forecast_amount', v_forecast.amount,
    'actual_amount', p_actual_amount
  );
END;
$$;
