-- Migration: Fix has_role() to check company-level roles
--
-- Problem: has_role() only checks user_roles table (platform-level roles).
-- Users created via create_company_and_associate() have their role stored
-- in user_companies.role (e.g. 'admin'), NOT in user_roles.
-- This causes ALL INSERT/UPDATE/DELETE operations to fail with:
--   "new row violates row-level security policy"
-- because every write policy uses has_role(auth.uid(), 'admin'|'editor').
--
-- Solution: Extend has_role() to also check app.rls.company_roles
-- (already cached by _rls_ensure_cache from migration 20260323000001).
-- This fixes all 62+ policy references in one change.
--
-- Depends on: 20260323000001_has_effective_role.sql (caches company_roles)

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
