-- Fix: payment_records and recurring_transactions missing soft-delete columns
-- The types.ts and application code expect these columns but they were never
-- added to the database, causing HTTP 400 on any soft-delete operation.

ALTER TABLE public.payment_records
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID,
  ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

ALTER TABLE public.recurring_transactions
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID,
  ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_payment_records_is_deleted
  ON public.payment_records (is_deleted) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_is_deleted
  ON public.recurring_transactions (is_deleted) WHERE is_deleted = false;
