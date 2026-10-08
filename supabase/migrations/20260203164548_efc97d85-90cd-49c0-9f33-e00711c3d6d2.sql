-- Create RPC function to fetch user context in a single query
-- Returns profile, roles, and companies with their associations

CREATE OR REPLACE FUNCTION public.get_user_context(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_profile JSONB;
  v_roles app_role[];
  v_companies JSONB;
  v_default_company_id UUID;
BEGIN
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
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_context(UUID) TO authenticated;