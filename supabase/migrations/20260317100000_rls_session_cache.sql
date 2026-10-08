-- Migration: RLS Session-Cache Optimization
-- Problem: RLS functions (user_belongs_to_company, has_role, is_company_owner) execute
-- SELECT queries per-row on every RLS-protected table. A dashboard load with 500+ rows
-- triggers 600+ redundant lookups against user_companies, user_roles, companies.
--
-- Solution: Lazy transaction-scoped caching via set_config(..., true).
-- First RLS call per transaction loads all user context into app.rls.* session vars.
-- Subsequent calls read from cache (string comparison) instead of querying tables.
-- set_config with is_local=true auto-discards on transaction end (no session bleed).
--
-- Impact: ~600 queries/request → 4 queries/request (99% reduction)
-- Security: Zero-trust maintained. auth.uid() validated from JWT. SECURITY DEFINER preserved.
-- Downtime: Zero. CREATE OR REPLACE keeps all 210 policy references valid.

--------------------------------------------------------------------------------
-- Step 1: Internal lazy-cache loader (new function, no existing references)
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._rls_ensure_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid;
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

  -- Load all company memberships (1 query)
  PERFORM set_config('app.rls.company_ids',
    COALESCE(
      (SELECT string_agg(company_id::text, ',') FROM user_companies WHERE user_id = v_uid),
      ''
    ), true);

  -- Load all roles (1 query)
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

  -- Load admin company IDs from user_companies (1 query)
  PERFORM set_config('app.rls.admin_company_ids',
    COALESCE(
      (SELECT string_agg(company_id::text, ',')
       FROM user_companies
       WHERE user_id = v_uid AND role = 'admin'),
      ''
    ), true);

  PERFORM set_config('app.rls.loaded', 'true', true);
END;
$$;


--------------------------------------------------------------------------------
-- Step 2: Replace user_belongs_to_company (118 policy references, signature unchanged)
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.user_belongs_to_company(_user_id uuid, _company_id uuid)
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
  IF current_setting('app.rls.uid', true) != _user_id::text THEN
    RETURN FALSE;
  END IF;

  -- Check membership from cached list (string comparison, no SQL)
  IF _company_id::text = ANY(
    string_to_array(current_setting('app.rls.company_ids', true), ',')
  ) THEN
    RETURN TRUE;
  END IF;

  -- Fallback: check ownership (handles edge case where user_companies link is broken)
  RETURN _company_id::text = ANY(
    string_to_array(current_setting('app.rls.owned_company_ids', true), ',')
  );
END;
$$;


--------------------------------------------------------------------------------
-- Step 3: Replace has_role (62 policy references, signature unchanged)
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
  IF current_setting('app.rls.uid', true) != _user_id::text THEN
    RETURN FALSE;
  END IF;

  -- Check role from cached list (string comparison, no SQL)
  RETURN _role::text = ANY(
    string_to_array(current_setting('app.rls.roles', true), ',')
  );
END;
$$;


--------------------------------------------------------------------------------
-- Step 4: Replace is_company_owner (30 policy references, signature unchanged)
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_company_owner(_user_id uuid, _company_id uuid)
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
  IF current_setting('app.rls.uid', true) != _user_id::text THEN
    RETURN FALSE;
  END IF;

  -- Check ownership from cached list (string comparison, no SQL)
  RETURN _company_id::text = ANY(
    string_to_array(current_setting('app.rls.owned_company_ids', true), ',')
  );
END;
$$;


--------------------------------------------------------------------------------
-- Step 5: Replace is_company_admin (1 policy reference)
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

  -- Ownership check from cache (no SQL)
  IF target_company_id::text = ANY(
    string_to_array(current_setting('app.rls.owned_company_ids', true), ',')
  ) THEN
    RETURN TRUE;
  END IF;

  -- Admin role from cache (no SQL)
  RETURN target_company_id::text = ANY(
    string_to_array(current_setting('app.rls.admin_company_ids', true), ',')
  );
END;
$$;


--------------------------------------------------------------------------------
-- Step 6: Add missing covering index + grant permissions
--------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_companies_id_created_by
  ON public.companies(id, created_by);

GRANT EXECUTE ON FUNCTION public._rls_ensure_cache() TO authenticated, anon, service_role;


--------------------------------------------------------------------------------
-- Step 7: Enable Realtime for permission tables (frontend cache invalidation)
--------------------------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE user_companies;
ALTER PUBLICATION supabase_realtime ADD TABLE user_roles;
