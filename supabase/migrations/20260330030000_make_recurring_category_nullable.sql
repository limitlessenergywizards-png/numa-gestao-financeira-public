-- ============================================
-- Migration: Make category_id nullable on recurring_transactions
-- Date: 2026-03-30
-- Purpose: The transaction form allows creating without a category,
--          but recurring_transactions.category_id was NOT NULL.
--          This caused "violates not-null constraint" errors.
--          Aligning with transactions table where category_id is nullable.
-- ============================================

ALTER TABLE public.recurring_transactions
  ALTER COLUMN category_id DROP NOT NULL;
