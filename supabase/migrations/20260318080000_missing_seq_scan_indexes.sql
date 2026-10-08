-- ============================================================================
-- Migration: Missing indexes for tables with high sequential scan ratios
-- Date: 2026-03-18
-- Purpose: Add covering indexes for 5 tables still showing 70-99% seq scans
-- ============================================================================

-- recurrence_templates (99.3% seq scans)
CREATE INDEX IF NOT EXISTS idx_recurrence_templates_company_status
  ON public.recurrence_templates (company_id, status)
  WHERE is_deleted = false;

-- transaction_rules (98.3% seq scans)
CREATE INDEX IF NOT EXISTS idx_transaction_rules_company_active
  ON public.transaction_rules (company_id)
  WHERE is_active = true;

-- bank_statements (78.1% seq scans)
CREATE INDEX IF NOT EXISTS idx_bank_statements_company_account_date
  ON public.bank_statements (company_id, bank_account_id, transaction_date DESC);

-- transactions — bank account reports (existing idx doesn't filter is_deleted)
CREATE INDEX IF NOT EXISTS idx_transactions_bank_date
  ON public.transactions (bank_account_id, transaction_date DESC)
  WHERE is_deleted = false;

-- leads (82.1% seq scans)
CREATE INDEX IF NOT EXISTS idx_leads_company
  ON public.leads (company_id)
  WHERE company_id IS NOT NULL;

-- Force planner stats refresh
ANALYZE public.recurrence_templates;
ANALYZE public.transaction_rules;
ANALYZE public.bank_statements;
ANALYZE public.leads;
