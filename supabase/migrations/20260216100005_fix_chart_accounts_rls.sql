-- Fix RLS policies to ensuring Company Owners can always VIEW their data
-- Even if the user_companies link is missing or broken (which shouldn't happen, but apparently does).
-- We use the existing `is_company_owner` function which checks the `companies` table directly.

-- =============================================
-- CHART_OF_ACCOUNTS
-- =============================================
DROP POLICY IF EXISTS "Users can view chart_of_accounts of their companies" ON public.chart_of_accounts;

CREATE POLICY "Users can view chart_of_accounts of their companies"
ON public.chart_of_accounts FOR SELECT
USING (
  public.user_belongs_to_company(auth.uid(), company_id)
  OR
  public.is_company_owner(auth.uid(), company_id)
);

-- =============================================
-- TRANSACTIONS
-- =============================================
DROP POLICY IF EXISTS "Users can view transactions of their companies" ON public.transactions;

CREATE POLICY "Users can view transactions of their companies"
ON public.transactions FOR SELECT
USING (
  public.user_belongs_to_company(auth.uid(), company_id)
  OR
  public.is_company_owner(auth.uid(), company_id)
);

-- =============================================
-- BANK_ACCOUNTS
-- =============================================
DROP POLICY IF EXISTS "Users can view bank_accounts of their companies" ON public.bank_accounts;

CREATE POLICY "Users can view bank_accounts of their companies"
ON public.bank_accounts FOR SELECT
USING (
  public.user_belongs_to_company(auth.uid(), company_id)
  OR
  public.is_company_owner(auth.uid(), company_id)
);

-- =============================================
-- COST_CENTERS
-- =============================================
DROP POLICY IF EXISTS "Users can view cost_centers of their companies" ON public.cost_centers;

CREATE POLICY "Users can view cost_centers of their companies"
ON public.cost_centers FOR SELECT
USING (
  public.user_belongs_to_company(auth.uid(), company_id)
  OR
  public.is_company_owner(auth.uid(), company_id)
);

-- =============================================
-- CUSTOMERS
-- =============================================
DROP POLICY IF EXISTS "Users can view customers of their companies" ON public.customers;

CREATE POLICY "Users can view customers of their companies"
ON public.customers FOR SELECT
USING (
  public.user_belongs_to_company(auth.uid(), company_id)
  OR
  public.is_company_owner(auth.uid(), company_id)
);

-- =============================================
-- SUPPLIERS
-- =============================================
DROP POLICY IF EXISTS "Users can view suppliers of their companies" ON public.suppliers;

CREATE POLICY "Users can view suppliers of their companies"
ON public.suppliers FOR SELECT
USING (
  public.user_belongs_to_company(auth.uid(), company_id)
  OR
  public.is_company_owner(auth.uid(), company_id)
);
