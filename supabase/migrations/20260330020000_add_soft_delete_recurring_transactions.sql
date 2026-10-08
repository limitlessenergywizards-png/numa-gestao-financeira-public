-- ============================================
-- Migration: Add soft-delete columns to recurring_transactions
-- Date: 2026-03-30
-- Purpose: The types.ts declares is_deleted, deleted_at, deleted_by on
--          recurring_transactions but the columns were never created.
--          This causes PostgREST 400 on SELECT * queries.
-- ============================================

ALTER TABLE public.recurring_transactions
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID;

CREATE INDEX IF NOT EXISTS idx_recurring_transactions_not_deleted
  ON public.recurring_transactions (company_id)
  WHERE is_deleted = false;
