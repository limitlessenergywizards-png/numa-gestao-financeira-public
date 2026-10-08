-- Create SQL functions for CashFlow data consolidation
-- Reduces 5 sequential queries to 2 parallel RPC calls

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
  -- Direct transactions
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
    AND p.company_id = p_company_id
    AND pr.payment_date::date BETWEEN p_start_date AND p_end_date
    AND (p_bank_account_id IS NULL OR pr.bank_account_id = p_bank_account_id)

  ORDER BY 2;
$$;

CREATE OR REPLACE FUNCTION public.get_cashflow_projected(
  p_company_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS TABLE (
  id text,
  entry_date date,
  description text,
  amount numeric,
  entry_type text,
  source text,
  category_name text,
  category_code text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  -- Pending receivables
  SELECT
    'proj-rec-' || r.id::text,
    r.due_date::date,
    COALESCE(r.description, 'A receber'),
    (r.total_amount - r.paid_amount)::numeric,
    'entrada',
    'projected_receivable'::text,
    c.name,
    c.code
  FROM receivables r
  LEFT JOIN chart_of_accounts c ON c.id = r.chart_account_id
  WHERE r.company_id = p_company_id
    AND r.status IN ('pendente', 'parcial')
    AND r.due_date::date BETWEEN p_start_date AND p_end_date
    AND (r.total_amount - r.paid_amount) > 0

  UNION ALL

  -- Pending payables
  SELECT
    'proj-pay-' || p.id::text,
    p.due_date::date,
    COALESCE(p.description, 'A pagar'),
    (p.total_amount - p.paid_amount)::numeric,
    'saida',
    'projected_payable'::text,
    c.name,
    c.code
  FROM payables p
  LEFT JOIN chart_of_accounts c ON c.id = p.chart_account_id
  WHERE p.company_id = p_company_id
    AND p.status IN ('pendente', 'parcial')
    AND p.due_date::date BETWEEN p_start_date AND p_end_date
    AND (p.total_amount - p.paid_amount) > 0

  ORDER BY 2;
$$;
