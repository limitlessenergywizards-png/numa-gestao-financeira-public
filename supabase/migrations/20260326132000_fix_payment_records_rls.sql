-- Fix payment_records RLS policies
-- Add company_id column if missing, then simplify policies

-- Step 1: Add company_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_records' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE public.payment_records ADD COLUMN company_id uuid REFERENCES public.companies(id);

    -- Backfill from receivables
    UPDATE public.payment_records pr
    SET company_id = r.company_id
    FROM public.receivables r
    WHERE pr.receivable_id = r.id AND pr.company_id IS NULL;

    -- Backfill from payables
    UPDATE public.payment_records pr
    SET company_id = p.company_id
    FROM public.payables p
    WHERE pr.payable_id = p.id AND pr.company_id IS NULL;
  END IF;
END $$;

-- Step 2: Replace policies with simpler company_id-based ones
DROP POLICY IF EXISTS "Admins and editors can insert payment_records" ON public.payment_records;
DROP POLICY IF EXISTS "Users can view payment_records of their companies" ON public.payment_records;
DROP POLICY IF EXISTS "Admins can delete payment_records" ON public.payment_records;
DROP POLICY IF EXISTS "Admins and editors can update payment_records" ON public.payment_records;

CREATE POLICY "Admins and editors can insert payment_records"
  ON public.payment_records FOR INSERT
  TO authenticated
  WITH CHECK (
    CASE
      WHEN company_id IS NOT NULL THEN
        user_belongs_to_company(auth.uid(), company_id)
        AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role))
      WHEN receivable_id IS NOT NULL THEN
        EXISTS (SELECT 1 FROM receivables r WHERE r.id = receivable_id
          AND user_belongs_to_company(auth.uid(), r.company_id)
          AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role)))
      WHEN payable_id IS NOT NULL THEN
        EXISTS (SELECT 1 FROM payables p WHERE p.id = payable_id
          AND user_belongs_to_company(auth.uid(), p.company_id)
          AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role)))
      ELSE false
    END
  );

CREATE POLICY "Users can view payment_records of their companies"
  ON public.payment_records FOR SELECT
  TO authenticated
  USING (
    CASE
      WHEN company_id IS NOT NULL THEN
        user_belongs_to_company(auth.uid(), company_id)
      WHEN receivable_id IS NOT NULL THEN
        EXISTS (SELECT 1 FROM receivables r WHERE r.id = receivable_id AND user_belongs_to_company(auth.uid(), r.company_id))
      WHEN payable_id IS NOT NULL THEN
        EXISTS (SELECT 1 FROM payables p WHERE p.id = payable_id AND user_belongs_to_company(auth.uid(), p.company_id))
      ELSE false
    END
  );

CREATE POLICY "Admins can delete payment_records"
  ON public.payment_records FOR DELETE
  TO authenticated
  USING (
    CASE
      WHEN company_id IS NOT NULL THEN
        user_belongs_to_company(auth.uid(), company_id) AND has_role(auth.uid(), 'admin'::app_role)
      WHEN receivable_id IS NOT NULL THEN
        EXISTS (SELECT 1 FROM receivables r WHERE r.id = receivable_id
          AND user_belongs_to_company(auth.uid(), r.company_id) AND has_role(auth.uid(), 'admin'::app_role))
      WHEN payable_id IS NOT NULL THEN
        EXISTS (SELECT 1 FROM payables p WHERE p.id = payable_id
          AND user_belongs_to_company(auth.uid(), p.company_id) AND has_role(auth.uid(), 'admin'::app_role))
      ELSE false
    END
  );

CREATE POLICY "Admins and editors can update payment_records"
  ON public.payment_records FOR UPDATE
  TO authenticated
  USING (
    CASE
      WHEN company_id IS NOT NULL THEN
        user_belongs_to_company(auth.uid(), company_id)
        AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role))
      WHEN receivable_id IS NOT NULL THEN
        EXISTS (SELECT 1 FROM receivables r WHERE r.id = receivable_id
          AND user_belongs_to_company(auth.uid(), r.company_id)
          AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role)))
      WHEN payable_id IS NOT NULL THEN
        EXISTS (SELECT 1 FROM payables p WHERE p.id = payable_id
          AND user_belongs_to_company(auth.uid(), p.company_id)
          AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role)))
      ELSE false
    END
  );
