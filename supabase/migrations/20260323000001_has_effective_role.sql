-- Migration: Add has_effective_role() and optimize _rls_ensure_cache()
--
-- Problem: has_role() only checks user_roles table (platform-level roles like superadmin).
-- Company-level admin role stored in user_companies.role is not checked by RLS,
-- causing a mismatch that the frontend patches with a workaround.
--
-- Solution:
-- 1. New has_effective_role() checks BOTH user_roles AND user_companies.role
-- 2. Optimize _rls_ensure_cache() to merge two user_companies queries into one CTE (4→3 queries)
-- 3. Keep has_role() unchanged (62+ policy references, correct for platform-level checks)

--------------------------------------------------------------------------------
-- Step 1: Optimize _rls_ensure_cache() — merge two user_companies queries
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

  -- Load company memberships, admin companies, and company roles in ONE query (was 2)
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
-- Step 2: New has_effective_role() — checks BOTH user_roles AND user_companies
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
  IF current_setting('app.rls.uid', true) != _user_id::text THEN
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
-- Step 3: Re-declare existing cached functions to use updated cache
-- (has_role, user_belongs_to_company, is_company_owner, is_company_admin
--  remain unchanged in behavior — they already call _rls_ensure_cache())
--------------------------------------------------------------------------------
-- No changes needed: these functions call _rls_ensure_cache() which now
-- loads app.rls.company_roles in addition to existing cache keys.
-- All existing cache keys (company_ids, admin_company_ids, roles, owned_company_ids)
-- are still populated with the same values, just more efficiently.
