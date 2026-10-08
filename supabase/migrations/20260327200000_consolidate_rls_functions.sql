-- Consolidation Migration: Version all RLS functions and policies applied via Dashboard
--
-- Background: Bug 4 fixes (has_role rewrite, payment_records company_id, transactions policies)
-- were applied directly via Supabase SQL Editor. This migration captures the production state
-- so the codebase matches what's deployed.
--
-- NOTE: This migration is idempotent (CREATE OR REPLACE, IF NOT EXISTS, DROP IF EXISTS).
-- It is safe to run on a fresh database or on production where these changes already exist.
--
-- Functions consolidated:
--   1. _rls_ensure_cache() - loads user context into session vars (from 20260323000001)
--   2. has_role() - checks platform + company roles (from Dashboard fix for Bug 4)
--   3. has_effective_role() - alias behavior, checks both role sources (from 20260323000001)
--   4. is_company_admin() - checks ownership + admin role from cache (from 20260317100000)
--
-- Schema changes consolidated:
--   5. payment_records.company_id column + backfill + policies (from Dashboard fix for Bug 4)
--   6. transactions policies with owner fallback (from Dashboard fix for Bug 4)

--------------------------------------------------------------------------------
-- 1. _rls_ensure_cache() — current production version
--    Loads company_ids, admin_company_ids, company_roles, platform roles, owned companies
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._rls_ensure_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid;
  v_company_ids text;
  v_admin_company_ids text;
  v_company_roles text;
BEGIN
  -- Already loaded this transaction? Skip.
  IF current_setting('app.rls.loaded', true) = 'true' THEN
    RETURN;
  END IF;

  v_uid := auth.uid();

  -- No authenticated user
  IF v_uid IS NULL THEN
    PERFORM set_config('app.rls.loaded', 'true', true);
    PERFORM set_config('app.rls.uid', '', true);
    PERFORM set_config('app.rls.is_service_role', 'false', true);
    RETURN;
  END IF;

  -- Service role bypasses all checks
  IF auth.role() = 'service_role' THEN
    PERFORM set_config('app.rls.loaded', 'true', true);
    PERFORM set_config('app.rls.is_service_role', 'true', true);
    RETURN;
  END IF;

  PERFORM set_config('app.rls.is_service_role', 'false', true);
  PERFORM set_config('app.rls.uid', v_uid::text, true);

  -- Load company memberships, admin companies, and company roles in ONE query
  SELECT
    COALESCE(string_agg(company_id::text, ','), ''),
    COALESCE(string_agg(CASE WHEN role = 'admin' THEN company_id::text END, ','), ''),
    COALESCE(string_agg(DISTINCT role::text, ','), '')
  INTO v_company_ids, v_admin_company_ids, v_company_roles
  FROM user_companies
  WHERE user_id = v_uid;

  PERFORM set_config('app.rls.company_ids', v_company_ids, true);
  PERFORM set_config('app.rls.admin_company_ids', v_admin_company_ids, true);
  PERFORM set_config('app.rls.company_roles', v_company_roles, true);

  -- Load all platform-level roles (1 query)
  PERFORM set_config('app.rls.roles',
    COALESCE(
      (SELECT string_agg(role::text, ',') FROM user_roles WHERE user_id = v_uid),
      ''
    ), true);

  -- Load all owned company IDs (1 query)
  PERFORM set_config('app.rls.owned_company_ids',
    COALESCE(
      (SELECT string_agg(id::text, ',') FROM companies WHERE created_by = v_uid),
      ''
    ), true);

  PERFORM set_config('app.rls.loaded', 'true', true);
END;
$$;

--------------------------------------------------------------------------------
-- 2. has_role() — checks BOTH platform roles AND company-level roles
--    This is the Dashboard fix for Bug 4: previously only checked user_roles,
--    now also checks user_companies.role via cached app.rls.company_roles
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public._rls_ensure_cache();

  -- Service role bypass
  IF current_setting('app.rls.is_service_role', true) = 'true' THEN
    RETURN TRUE;
  END IF;

  -- Zero-trust: must be querying own data
  IF current_setting('app.rls.uid', true) <> _user_id::text THEN
    RETURN FALSE;
  END IF;

  -- Check platform-level roles (user_roles table)
  IF _role::text = ANY(
    string_to_array(current_setting('app.rls.roles', true), ',')
  ) THEN
    RETURN TRUE;
  END IF;

  -- Check company-level roles (user_companies.role column)
  RETURN _role::text = ANY(
    string_to_array(current_setting('app.rls.company_roles', true), ',')
  );
END;
$$;

--------------------------------------------------------------------------------
-- 3. has_effective_role() — same logic as has_role (kept for API compatibility)
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_effective_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public._rls_ensure_cache();

  -- Service role bypass
  IF current_setting('app.rls.is_service_role', true) = 'true' THEN
    RETURN TRUE;
  END IF;

  -- Zero-trust: must be querying own data
  IF current_setting('app.rls.uid', true) <> _user_id::text THEN
    RETURN FALSE;
  END IF;

  -- Check platform-level roles (user_roles table)
  IF _role::text = ANY(
    string_to_array(current_setting('app.rls.roles', true), ',')
  ) THEN
    RETURN TRUE;
  END IF;

  -- Check company-level roles (user_companies.role column)
  RETURN _role::text = ANY(
    string_to_array(current_setting('app.rls.company_roles', true), ',')
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.has_effective_role(uuid, app_role) TO authenticated, anon, service_role;

--------------------------------------------------------------------------------
-- 4. is_company_admin() — checks ownership + admin role from cache
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_company_admin(target_company_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public._rls_ensure_cache();

  -- Service role bypass
  IF current_setting('app.rls.is_service_role', true) = 'true' THEN
    RETURN TRUE;
  END IF;

  -- Ownership check from cache
  IF target_company_id::text = ANY(
    string_to_array(current_setting('app.rls.owned_company_ids', true), ',')
  ) THEN
    RETURN TRUE;
  END IF;

  -- Admin role from cache
  RETURN target_company_id::text = ANY(
    string_to_array(current_setting('app.rls.admin_company_ids', true), ',')
  );
END;
$$;

--------------------------------------------------------------------------------
-- 5. payment_records: company_id column + backfill + RLS policies
--    RLS is currently DISABLED in production (relrowsecurity = false)
--    Policies exist but are not enforced until RLS is re-enabled
--------------------------------------------------------------------------------

-- Add company_id if it doesn't exist (idempotent)
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

-- Recreate policies (idempotent via DROP IF EXISTS)
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

--------------------------------------------------------------------------------
-- 6. transactions: policies with owner fallback (applied via Dashboard for Bug 4)
--------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Owners, admins and editors can insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can view transactions of their companies" ON public.transactions;
DROP POLICY IF EXISTS "Owners, admins and editors can update transactions" ON public.transactions;
DROP POLICY IF EXISTS "Owners and admins can delete transactions" ON public.transactions;

CREATE POLICY "Owners, admins and editors can insert transactions"
  ON public.transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    user_belongs_to_company(auth.uid(), company_id)
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'editor'::app_role)
      OR EXISTS (SELECT 1 FROM companies WHERE id = company_id AND created_by = auth.uid())
    )
  );

CREATE POLICY "Users can view transactions of their companies"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (
    user_belongs_to_company(auth.uid(), company_id)
  );

CREATE POLICY "Owners, admins and editors can update transactions"
  ON public.transactions FOR UPDATE
  TO authenticated
  USING (
    user_belongs_to_company(auth.uid(), company_id)
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'editor'::app_role)
      OR EXISTS (SELECT 1 FROM companies WHERE id = company_id AND created_by = auth.uid())
    )
  );

CREATE POLICY "Owners and admins can delete transactions"
  ON public.transactions FOR DELETE
  TO authenticated
  USING (
    user_belongs_to_company(auth.uid(), company_id)
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR EXISTS (SELECT 1 FROM companies WHERE id = company_id AND created_by = auth.uid())
    )
  );

-- Ensure PostgREST reloads schema cache
NOTIFY pgrst, 'reload schema';
