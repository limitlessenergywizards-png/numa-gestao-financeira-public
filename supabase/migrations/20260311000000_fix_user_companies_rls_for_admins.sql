-- Fix: Enable company admins to view all company members

-- Helper function to check if user is admin of a company
-- SECURITY DEFINER prevents infinite recursion in RLS policies
CREATE OR REPLACE FUNCTION public.is_company_admin(target_company_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_companies
    WHERE user_id = auth.uid() AND company_id = target_company_id AND role = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM companies
    WHERE id = target_company_id AND created_by = auth.uid()
  );
$$;

-- Add policy: Company admins can view all members of their company
CREATE POLICY "Company admins can view all company members"
  ON public.user_companies FOR SELECT
  USING (auth.uid() = user_id OR public.is_company_admin(company_id));
