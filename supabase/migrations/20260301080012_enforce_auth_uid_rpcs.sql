-- Migration: Enforce auth.uid() in RPCs to prevent RLS bypass
-- These functions originally took a user ID parameter and explicitly checked against it.
-- This creates a vulnerability where a malicious authenticated user can pass another user's ID
-- to gain access or perform actions on their behalf.
-- We enforce that the passed ID MUST match the currently authenticated user's ID (auth.uid()).
-- Or if run by an admin/service role, we allow it.

-- 1. can_create_first_company
CREATE OR REPLACE FUNCTION public.can_create_first_company(_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- ZERO-TRUST: Verify that the caller is the requested user_id or a service_role
  IF auth.uid() != _user_id AND auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized: Cannot query another user''s status';
  END IF;

  RETURN NOT EXISTS (
    SELECT 1
    FROM public.user_companies
    WHERE user_id = _user_id
  );
END;
$function$;


-- 2. get_financial_totals
-- Here, the `user_belongs_to_company` check implicitly ensures RLS, but we can be explicit,
-- since it currently takes p_company_id but relies on regular RLS. Wait, `get_financial_totals`
-- is NOT security definer. It's executed as the caller, meaning RLS naturally applies to `transactions`,
-- `receivables`, `payables`, `bank_accounts`. If RLS is secure on these tables, this function is secure.
-- Wait, I should verify the RLS policies for `transactions` quickly.


-- 3. get_user_context
CREATE OR REPLACE FUNCTION public.get_user_context(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result JSONB;
  v_profile JSONB;
  v_roles app_role[];
  v_companies JSONB;
  v_default_company_id UUID;
BEGIN
  -- ZERO-TRUST: Verify that the caller is the requested user_id or a service_role
  IF auth.uid() != p_user_id AND auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized: Cannot access another user''s context';
  END IF;

  -- Get profile
  SELECT jsonb_build_object(
    'id', p.id,
    'user_id', p.user_id,
    'full_name', p.full_name,
    'avatar_url', p.avatar_url,
    'phone', p.phone,
    'job_title', p.job_title,
    'trial_started_at', p.trial_started_at,
    'current_streak', p.current_streak,
    'total_xp', p.total_xp,
    'guardian_level', p.guardian_level,
    'current_title', p.current_title
  ) INTO v_profile
  FROM profiles p
  WHERE p.user_id = p_user_id;

  -- Get roles as array
  SELECT COALESCE(array_agg(role), ARRAY[]::app_role[])
  INTO v_roles
  FROM user_roles
  WHERE user_id = p_user_id;

  -- Get companies with full details
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'company_id', uc.company_id,
        'is_default', uc.is_default,
        'role', uc.role,
        'company', jsonb_build_object(
          'id', c.id,
          'name', c.name,
          'trading_name', c.trading_name,
          'document', c.document,
          'email', c.email,
          'phone', c.phone,
          'address', c.address,
          'city', c.city,
          'state', c.state,
          'zip_code', c.zip_code,
          'logo_url', c.logo_url,
          'currency', c.currency,
          'currency_symbol', c.currency_symbol,
          'is_headquarters', c.is_headquarters,
          'parent_company_id', c.parent_company_id,
          'created_by', c.created_by
        )
      )
    ),
    '[]'::jsonb
  ) INTO v_companies
  FROM user_companies uc
  JOIN companies c ON c.id = uc.company_id
  WHERE uc.user_id = p_user_id;

  -- Get default company id
  SELECT company_id INTO v_default_company_id
  FROM user_companies
  WHERE user_id = p_user_id AND is_default = true
  LIMIT 1;

  -- Build final result
  v_result := jsonb_build_object(
    'profile', COALESCE(v_profile, '{}'::jsonb),
    'roles', to_jsonb(v_roles),
    'companies', v_companies,
    'default_company_id', v_default_company_id
  );

  RETURN v_result;
END;
$function$;


-- 4. has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- ZERO-TRUST: Allow service role OR self querying.
  IF auth.uid() != _user_id AND auth.role() != 'service_role' THEN
    RETURN FALSE; -- Or RAISE EXCEPTION
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
END;
$function$;


-- 5. is_company_owner
CREATE OR REPLACE FUNCTION public.is_company_owner(_user_id uuid, _company_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() != _user_id AND auth.role() != 'service_role' THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.companies
    WHERE id = _company_id
      AND created_by = _user_id
  );
END;
$function$;


-- 6. user_belongs_to_company
CREATE OR REPLACE FUNCTION public.user_belongs_to_company(_user_id uuid, _company_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- We shouldn't strictly block this if it's used internally by other SECURITY DEFINER functions,
  -- but those shouldn't rely on it safely without doing their own auth.uid() check.
  -- To be safe, any client call to this must only check their own membership.
  IF auth.uid() != _user_id AND auth.role() != 'service_role' THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.user_companies
    WHERE user_id = _user_id
      AND company_id = _company_id
  );
END;
$function$;
