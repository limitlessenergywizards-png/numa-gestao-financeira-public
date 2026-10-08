-- Migration: 20260301090000_apply_iron_gate_rpcs.sql
-- Enforces absolute ownership isolation (The Iron Gate Protocol) on SECURITY DEFINER RPCs

-- THE IRON GATE: 1. Proteção de Criação Atômica Mass-Assignment Bypass
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
  v_auth_uid UUID;
  v_is_authorized BOOLEAN;
BEGIN
  -- 0. PORTA DE FERRO: Extração de Sessão Servidor
  v_auth_uid := auth.uid();
  IF v_auth_uid IS NULL THEN
     RAISE EXCEPTION 'Acesso negado.' USING ERRCODE = '42501'; 
  END IF;

  -- 1. PROVA DE PROPRIEDADE (Ownership & Tenant Match)
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_companies uc
    JOIN public.bank_accounts ba ON ba.company_id = uc.company_id
    WHERE uc.user_id = v_auth_uid 
      AND uc.company_id = p_company_id
      AND ba.id = p_bank_account_id
  ) INTO v_is_authorized;

  IF NOT v_is_authorized THEN
    -- Erro obscuro p/ evitar ID Enumeration
    RAISE EXCEPTION 'Recurso não encontrado.' USING ERRCODE = 'P0002';
  END IF;

  -- Insert logic
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
  ) RETURNING id INTO v_transaction_id;

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


-- THE IRON GATE: 2. Proteção de Estorno Arbitrário
CREATE OR REPLACE FUNCTION public.reverse_transaction(
  p_transaction_id UUID,
  p_user_id UUID DEFAULT NULL, -- Flagjada: Antigo Mass Assignment (Agora ignorado)
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
  v_auth_uid UUID;
BEGIN
  -- 0. PORTA DE FERRO
  v_auth_uid := auth.uid();
  IF v_auth_uid IS NULL THEN
     RAISE EXCEPTION 'Acesso negado.' USING ERRCODE = '42501';
  END IF;

  -- 1. COMPOSITE QUERY (Ownership Interlock)
  SELECT t.* INTO v_original 
  FROM public.transactions t
  JOIN public.user_companies uc ON uc.company_id = t.company_id
  WHERE t.id = p_transaction_id 
    AND t.is_deleted = false
    AND uc.user_id = v_auth_uid;

  -- 2. TRATAMENTO OBSCURO (Oculta Pistas do Inimigo)
  IF v_original IS NULL THEN
    RAISE EXCEPTION 'Ativo financeiro não encontrado.' USING ERRCODE = 'P0002';
  END IF;

  IF v_original.type = 'entrada' THEN
    v_reverse_type := 'saida';
  ELSE
    v_reverse_type := 'entrada';
  END IF;

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
  ) RETURNING id INTO v_reversal_id;

  RETURN v_reversal_id;
END;
$$;


-- THE IRON GATE: 3. Proteção Atomic Forecast Update Bypass
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
BEGIN
  -- 0. PORTA DE FERRO
  v_auth_uid := auth.uid();
  IF v_auth_uid IS NULL THEN
     RAISE EXCEPTION 'Acesso negado.' USING ERRCODE = '42501';
  END IF;
  
  -- 0.1 OVERRIDE PAYLOAD: Destrói spoofing de autoria
  p_converted_by := v_auth_uid;

  -- 1. LOCK AND FETCH + OWNERSHIP (Composite Target Lock)
  -- Uses CTE or Subselect to lock rows precisely if exists
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

  INSERT INTO public.transactions (
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

  IF p_keep_forecast THEN
    UPDATE public.transactions
    SET converted_at = NOW(),
        converted_by = p_converted_by
    WHERE id = p_forecast_id; -- Seguro sem check de C_ID porque fechou lock restrito lá em cima
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
