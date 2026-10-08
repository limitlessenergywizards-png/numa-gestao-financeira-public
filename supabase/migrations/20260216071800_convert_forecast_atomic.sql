-- Migration: Atomic forecast-to-actual conversion
-- Eliminates race condition where concurrent conversions or network failures
-- could leave orphaned transactions or unconverted forecasts.
-- Uses pessimistic locking (SELECT ... FOR UPDATE) to prevent double-conversion.

CREATE OR REPLACE FUNCTION public.convert_forecast_to_actual(
  p_forecast_id UUID,
  p_actual_amount NUMERIC,
  p_keep_forecast BOOLEAN DEFAULT TRUE,
  p_transaction_date DATE DEFAULT CURRENT_DATE,
  p_converted_by UUID DEFAULT NULL
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
BEGIN
  -- 1. Lock and fetch the forecast (prevents concurrent conversion)
  SELECT * INTO v_forecast
  FROM transactions
  WHERE id = p_forecast_id
    AND nature = 'previsao'
    AND converted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Previsão não encontrada ou já convertida'
      USING ERRCODE = 'P0002';
  END IF;

  -- 2. Validate amount
  IF p_actual_amount <= 0 THEN
    RAISE EXCEPTION 'O valor deve ser maior que zero'
      USING ERRCODE = 'check_violation';
  END IF;

  -- 3. Insert the realized transaction (atomic with the lock)
  INSERT INTO transactions (
    company_id, bank_account_id, chart_account_id,
    category_id, customer_id, supplier_id,
    type, amount, description, transaction_date,
    payment_method, document_number,
    notes, nature, linked_forecast_id
  ) VALUES (
    v_forecast.company_id, v_forecast.bank_account_id,
    v_forecast.chart_account_id, v_forecast.category_id,
    v_forecast.customer_id, v_forecast.supplier_id,
    v_forecast.type, p_actual_amount, v_forecast.description,
    p_transaction_date, v_forecast.payment_method,
    v_forecast.document_number,
    format('Convertido de previsão. Valor previsto: R$ %s', v_forecast.amount::TEXT),
    'realizado', p_forecast_id
  ) RETURNING id INTO v_new_id;

  -- 4. Handle forecast: keep as history or delete (still atomic)
  IF p_keep_forecast THEN
    UPDATE transactions
    SET converted_at = NOW(),
        converted_by = p_converted_by
    WHERE id = p_forecast_id;
  ELSE
    DELETE FROM transactions WHERE id = p_forecast_id;
  END IF;

  -- 5. Calculate deviation (safe against division by zero)
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.convert_forecast_to_actual TO authenticated;
