-- Update handle_new_user to automatically start 14-day trial
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_role app_role;
BEGIN
  -- Create profile with trial started
  INSERT INTO public.profiles (user_id, full_name, trial_started_at)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', now());
  
  -- Check if this is the first user (no admins exist yet)
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    v_role := 'admin';
  ELSE
    v_role := 'viewer';
  END IF;
  
  -- Assign role (avoid duplicates)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$function$;