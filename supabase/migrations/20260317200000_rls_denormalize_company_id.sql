--------------------------------------------------------------------------------
-- Migration: Denormalize company_id into child tables for RLS performance
--
-- Problem: payment_records, recurring_occurrences, and whatsapp_messages lack
-- a direct company_id column, forcing RLS policies to JOIN parent tables on
-- every row evaluation. The recurring_occurrences case is worst: 3-level nested
-- IN subquery that bypasses the session cache entirely.
--
-- Solution: Add company_id to each table, backfill from parent FK, rewrite
-- policies to use the direct column with cached user_belongs_to_company().
--
-- Depends on: 20260317100000_rls_session_cache.sql (cache functions)
--------------------------------------------------------------------------------

BEGIN;

--------------------------------------------------------------------------------
-- Phase A: ADD COLUMN (instant in PG 11+, no table rewrite)
--------------------------------------------------------------------------------

ALTER TABLE public.payment_records
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.recurring_occurrences
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.whatsapp_messages
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;


--------------------------------------------------------------------------------
-- Phase B: Backfill existing data
--------------------------------------------------------------------------------

-- payment_records: derive from payable OR receivable parent
UPDATE public.payment_records pr
SET company_id = COALESCE(
  (SELECT p.company_id FROM public.payables p WHERE p.id = pr.payable_id),
  (SELECT r.company_id FROM public.receivables r WHERE r.id = pr.receivable_id)
)
WHERE pr.company_id IS NULL;

-- recurring_occurrences: derive from recurring_transactions
UPDATE public.recurring_occurrences ro
SET company_id = (
  SELECT rt.company_id FROM public.recurring_transactions rt WHERE rt.id = ro.recurring_id
)
WHERE ro.company_id IS NULL;

-- whatsapp_messages: derive from leads (leads.company_id is nullable)
UPDATE public.whatsapp_messages wm
SET company_id = (
  SELECT l.company_id FROM public.leads l WHERE l.id = wm.lead_id
)
WHERE wm.company_id IS NULL;


--------------------------------------------------------------------------------
-- Phase C: NOT NULL constraints (except whatsapp_messages, leads.company_id is nullable)
--------------------------------------------------------------------------------

ALTER TABLE public.payment_records
  ALTER COLUMN company_id SET NOT NULL;

ALTER TABLE public.recurring_occurrences
  ALTER COLUMN company_id SET NOT NULL;

-- whatsapp_messages: company_id stays nullable (leads.company_id can be NULL)


--------------------------------------------------------------------------------
-- Phase D: Consistency triggers (BEFORE INSERT OR UPDATE)
-- Safety net: auto-derive company_id from parent FK if not provided
--------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_payment_record_company_id()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.company_id IS NULL THEN
    IF NEW.payable_id IS NOT NULL THEN
      SELECT p.company_id INTO NEW.company_id
      FROM public.payables p WHERE p.id = NEW.payable_id;
    ELSIF NEW.receivable_id IS NOT NULL THEN
      SELECT r.company_id INTO NEW.company_id
      FROM public.receivables r WHERE r.id = NEW.receivable_id;
    END IF;
  END IF;

  IF NEW.company_id IS NULL THEN
    RAISE EXCEPTION 'payment_records: cannot derive company_id from parent';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_payment_records_set_company_id
  BEFORE INSERT ON public.payment_records
  FOR EACH ROW
  EXECUTE FUNCTION public.set_payment_record_company_id();


CREATE OR REPLACE FUNCTION public.set_recurring_occurrence_company_id()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.company_id IS NULL THEN
    SELECT rt.company_id INTO NEW.company_id
    FROM public.recurring_transactions rt WHERE rt.id = NEW.recurring_id;
  END IF;

  IF NEW.company_id IS NULL THEN
    RAISE EXCEPTION 'recurring_occurrences: cannot derive company_id from parent';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_recurring_occurrences_set_company_id
  BEFORE INSERT ON public.recurring_occurrences
  FOR EACH ROW
  EXECUTE FUNCTION public.set_recurring_occurrence_company_id();


CREATE OR REPLACE FUNCTION public.set_whatsapp_message_company_id()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.company_id IS NULL THEN
    SELECT l.company_id INTO NEW.company_id
    FROM public.leads l WHERE l.id = NEW.lead_id;
  END IF;
  -- Allow NULL: leads.company_id can be NULL
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_whatsapp_messages_set_company_id
  BEFORE INSERT ON public.whatsapp_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_whatsapp_message_company_id();


--------------------------------------------------------------------------------
-- Phase E: Indexes for RLS on new columns
--------------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_payment_records_company
  ON public.payment_records (company_id);

CREATE INDEX IF NOT EXISTS idx_recurring_occurrences_company
  ON public.recurring_occurrences (company_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_company
  ON public.whatsapp_messages (company_id);


--------------------------------------------------------------------------------
-- Phase F: Rewrite payment_records policies (3 old → 4 new, adds missing UPDATE)
--------------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view payment_records of their companies" ON public.payment_records;
DROP POLICY IF EXISTS "Admins and editors can insert payment_records" ON public.payment_records;
DROP POLICY IF EXISTS "Admins can delete payment_records" ON public.payment_records;

-- SELECT: direct company_id check, no JOINs (was: 2 EXISTS+JOIN per row)
CREATE POLICY "Users can view payment_records of their companies"
  ON public.payment_records FOR SELECT
  USING (public.user_belongs_to_company(auth.uid(), company_id));

-- INSERT: direct check + role
CREATE POLICY "Admins and editors can insert payment_records"
  ON public.payment_records FOR INSERT
  WITH CHECK (
    public.user_belongs_to_company(auth.uid(), company_id)
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
  );

-- UPDATE: NEW policy (was missing before — security gap for soft-delete)
CREATE POLICY "Admins and editors can update payment_records"
  ON public.payment_records FOR UPDATE
  USING (
    public.user_belongs_to_company(auth.uid(), company_id)
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
  );

-- DELETE: admin only
CREATE POLICY "Admins can delete payment_records"
  ON public.payment_records FOR DELETE
  USING (
    public.user_belongs_to_company(auth.uid(), company_id)
    AND public.has_role(auth.uid(), 'admin')
  );


--------------------------------------------------------------------------------
-- Phase G: Rewrite recurring_occurrences policies
-- Was: IN (SELECT id FROM recurring_transactions WHERE company_id IN (SELECT ...))
-- Now: direct cached check — eliminates 3-level subquery that bypassed cache
--------------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view occurrences of their company" ON public.recurring_occurrences;
DROP POLICY IF EXISTS "Users can insert occurrences for their company" ON public.recurring_occurrences;
DROP POLICY IF EXISTS "Users can update occurrences of their company" ON public.recurring_occurrences;

CREATE POLICY "Users can view occurrences of their company"
  ON public.recurring_occurrences FOR SELECT
  USING (public.user_belongs_to_company(auth.uid(), company_id));

CREATE POLICY "Users can insert occurrences for their company"
  ON public.recurring_occurrences FOR INSERT
  WITH CHECK (public.user_belongs_to_company(auth.uid(), company_id));

CREATE POLICY "Users can update occurrences of their company"
  ON public.recurring_occurrences FOR UPDATE
  USING (public.user_belongs_to_company(auth.uid(), company_id));


--------------------------------------------------------------------------------
-- Phase H: Rewrite whatsapp_messages policy
-- Was: EXISTS (SELECT 1 FROM leads l WHERE l.id = lead_id AND user_belongs_to_company(..., l.company_id))
-- Now: direct cached check
--------------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view their company messages" ON public.whatsapp_messages;

CREATE POLICY "Users can view their company messages"
  ON public.whatsapp_messages FOR SELECT
  USING (public.user_belongs_to_company(auth.uid(), company_id));


--------------------------------------------------------------------------------
-- Phase I: Refresh planner statistics
--------------------------------------------------------------------------------

ANALYZE public.payment_records;
ANALYZE public.recurring_occurrences;
ANALYZE public.whatsapp_messages;

COMMIT;
