-- ============================================
-- Migration: Fix get_cashflow_projected to exclude converted payables/receivables
-- Date: 2026-03-29
-- Purpose: Ensure that payables/receivables whose forecast has been converted
--          do not appear in the projected cashflow view.
--
-- Analysis: The current implementation already filters:
--   AND r.status IN ('pendente', 'parcial')   -- for receivables
--   AND p.status IN ('pendente', 'parcial')   -- for payables
--
-- Migration 20260329210000_fix_convert_forecast_rpc.sql updates the linked
-- payable/receivable status to 'pago' when a forecast is converted (p_keep_forecast=TRUE).
-- A record with status='pago' will not match the IN ('pendente', 'parcial') filter,
-- so it is already excluded from this view — no additional filter is required.
--
-- This migration re-creates the function verbatim to:
--   a) Document the intentional safety of the existing filter
--   b) Add an explicit comment in the function body as a permanent note
-- ============================================

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
  -- NOTE: status IN ('pendente', 'parcial') intentionally excludes 'pago' records.
  -- When convert_forecast_to_actual runs, it sets status = 'pago' on the linked
  -- receivable, so converted items will never appear here.
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
    AND r.is_deleted = false
    AND r.status IN ('pendente', 'parcial')
    AND r.due_date::date BETWEEN p_start_date AND p_end_date
    AND (r.total_amount - r.paid_amount) > 0

  UNION ALL

  -- Pending payables
  -- NOTE: status IN ('pendente', 'parcial') intentionally excludes 'pago' records.
  -- When convert_forecast_to_actual runs, it sets status = 'pago' on the linked
  -- payable, so converted items will never appear here.
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
    AND p.is_deleted = false
    AND p.status IN ('pendente', 'parcial')
    AND p.due_date::date BETWEEN p_start_date AND p_end_date
    AND (p.total_amount - p.paid_amount) > 0

  ORDER BY 2;
$$;
