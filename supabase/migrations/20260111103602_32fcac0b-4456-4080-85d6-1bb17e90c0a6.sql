-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Service role can insert email logs" ON public.dre_email_logs;
DROP POLICY IF EXISTS "Service role can update email logs" ON public.dre_email_logs;

-- Create proper INSERT policy - only for users who belong to the company
CREATE POLICY "Users can insert email logs for their companies"
ON public.dre_email_logs
FOR INSERT
WITH CHECK (user_belongs_to_company(auth.uid(), company_id));

-- Create proper UPDATE policy - only for users who belong to the company  
CREATE POLICY "Users can update email logs for their companies"
ON public.dre_email_logs
FOR UPDATE
USING (user_belongs_to_company(auth.uid(), company_id));