-- Fix audit_logs to allow actions from service_role (like the AI Agent)
-- Migration: 20260309000000_fix_audit_log_service_role.sql

-- 1. Allow user_id to be NULL in audit_logs (represents system/bot action)
ALTER TABLE public.audit_logs ALTER COLUMN user_id DROP NOT NULL;

-- 2. Update log_audit function to be more robust
CREATE OR REPLACE FUNCTION public.log_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Try to get current user ID
  v_user_id := auth.uid();
  
  -- If v_user_id is NULL, we allow it (the column is now nullable)
  -- This allows service_role operations (like Edge Functions) to succeed
  
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (
      company_id, user_id, action, table_name, 
      record_id, new_data
    ) VALUES (
      NEW.company_id, v_user_id, 'INSERT', TG_TABLE_NAME,
      NEW.id, to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (
      company_id, user_id, action, table_name,
      record_id, old_data, new_data
    ) VALUES (
      NEW.company_id, v_user_id, 'UPDATE', TG_TABLE_NAME,
      NEW.id, to_jsonb(OLD), to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (
      company_id, user_id, action, table_name,
      record_id, old_data
    ) VALUES (
      OLD.company_id, v_user_id, 'DELETE', TG_TABLE_NAME,
      OLD.id, to_jsonb(OLD)
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;
