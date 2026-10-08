-- SECURITY FIX: Remove dangerously permissive INSERT/UPDATE policies on dre_email_logs
-- The old policies used WITH CHECK(true) and USING(true), allowing any authenticated user
-- to insert fake email log entries and modify the audit trail.
-- The send-dre-report Edge Function uses SERVICE_ROLE_KEY which bypasses RLS,
-- so these policies only affected regular users (who should NOT write to this table).

-- Drop the permissive INSERT policy
DROP POLICY IF EXISTS "Service role can insert email logs" ON public.dre_email_logs;

-- Drop the permissive UPDATE policy
DROP POLICY IF EXISTS "Service role can update email logs" ON public.dre_email_logs;

-- The existing SELECT policy ("Users can view email logs for their companies")
-- is already properly scoped with user_belongs_to_company and remains unchanged.
