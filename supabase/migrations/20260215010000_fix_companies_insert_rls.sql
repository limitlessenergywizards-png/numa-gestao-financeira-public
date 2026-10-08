-- Fix: Allow any authenticated user to create companies (not just first-time users)
-- The previous policy blocked users who already had a company from creating additional ones.

DROP POLICY IF EXISTS "Allow first company creation or admin insert" ON public.companies;

CREATE POLICY "Authenticated users can create companies"
  ON public.companies
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
  );
