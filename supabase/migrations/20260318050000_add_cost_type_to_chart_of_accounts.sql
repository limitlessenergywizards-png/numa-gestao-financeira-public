-- Add missing cost_type column to chart_of_accounts
-- This column is referenced by receivables, payables, and ledger queries.
-- Without it, PostgREST returns an error causing empty lists in the UI.
ALTER TABLE public.chart_of_accounts
ADD COLUMN IF NOT EXISTS cost_type text DEFAULT 'variable';

COMMENT ON COLUMN public.chart_of_accounts.cost_type IS 'Cost classification: fixed or variable';
