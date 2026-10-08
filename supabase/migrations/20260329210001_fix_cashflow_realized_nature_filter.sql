-- ============================================
-- Migration: Fix get_cashflow_realized to filter by nature
-- Date: 2026-03-29
-- Purpose: In the direct transactions branch, add:
--   - AND t.nature = 'realizado'   — only realized transactions (not previsao/convertido)
--   - AND t.converted_at IS NULL   — safety net: converted forecasts should not appear
-- ============================================

CREATE OR REPLACE FUNCTION public.get_cashflow_realized(
  p_company_id uuid,
  p_start_date date,
  p_end_date date,
  p_bank_account_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  entry_date date,
  description text,
  amount numeric,
  entry_type text,
  source text,
  category_name text,
  category_code text,
  forecast_basis text,
  nature text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  -- Direct transactions: only realized nature, safety net on converted_at
  SELECT
    t.id,
    t.transaction_date::date,
    t.description,
    t.amount::numeric,
    t.type,
    'transaction'::text,
    c.name,
    c.code,
    t.forecast_basis,
    t.nature
  FROM transactions t
  LEFT JOIN chart_of_accounts c ON c.id = t.chart_account_id
  WHERE t.company_id = p_company_id
    AND t.is_deleted = false
    AND t.nature = 'realizado'
    AND t.converted_at IS NULL
    AND t.transaction_date::date BETWEEN p_start_date AND p_end_date
    AND (p_bank_account_id IS NULL OR t.bank_account_id = p_bank_account_id)

  UNION ALL

  -- Receivable payments
  SELECT
    pr.id,
    pr.payment_date::date,
    COALESCE(r.description, 'Recebimento'),
    pr.amount::numeric,
    'entrada',
    'receivable_payment'::text,
    c.name,
    c.code,
    pr.receivable_id::text,
    'realizado'::text
  FROM payment_records pr
  INNER JOIN receivables r ON r.id = pr.receivable_id
  LEFT JOIN chart_of_accounts c ON c.id = r.chart_account_id
  WHERE pr.receivable_id IS NOT NULL
    AND pr.is_deleted = false
    AND r.is_deleted = false
    AND r.company_id = p_company_id
    AND pr.payment_date::date BETWEEN p_start_date AND p_end_date
    AND (p_bank_account_id IS NULL OR pr.bank_account_id = p_bank_account_id)

  UNION ALL

  -- Payable payments
  SELECT
    pr.id,
    pr.payment_date::date,
    COALESCE(p.description, 'Pagamento'),
    pr.amount::numeric,
    'saida',
    'payable_payment'::text,
    c.name,
    c.code,
    pr.payable_id::text,
    'realizado'::text
  FROM payment_records pr
  INNER JOIN payables p ON p.id = pr.payable_id
  LEFT JOIN chart_of_accounts c ON c.id = p.chart_account_id
  WHERE pr.payable_id IS NOT NULL
    AND pr.is_deleted = false
    AND p.is_deleted = false
    AND p.company_id = p_company_id
    AND pr.payment_date::date BETWEEN p_start_date AND p_end_date
    AND (p_bank_account_id IS NULL OR pr.bank_account_id = p_bank_account_id)

  ORDER BY 2;
$$;
