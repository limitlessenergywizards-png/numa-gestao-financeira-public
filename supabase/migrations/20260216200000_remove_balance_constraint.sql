-- ============================================
-- Migration: Remove Negative Balance Constraint
-- Date: 2026-02-16
-- Purpose: Allow bank accounts to have negative balances (overdraft support).
-- ============================================

ALTER TABLE public.bank_accounts 
  DROP CONSTRAINT IF EXISTS chk_current_balance_non_negative;
