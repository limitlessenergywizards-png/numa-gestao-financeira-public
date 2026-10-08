-- SECURITY FIX: Replace dangerously permissive USING(true) policy on whatsapp_messages
-- The old policy "Service role can do everything" used USING(true) WITH CHECK(true),
-- which means ANY authenticated user could read/write ALL WhatsApp messages from ALL companies.
-- Service role already bypasses RLS entirely, so that policy only affected regular users.

-- Drop the permissive policy
DROP POLICY IF EXISTS "Service role can do everything" ON public.whatsapp_messages;

-- Users can only SELECT messages for leads belonging to their companies
CREATE POLICY "Users can view their company messages"
  ON public.whatsapp_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = whatsapp_messages.lead_id
        AND public.user_belongs_to_company(auth.uid(), l.company_id)
    )
  );

-- No INSERT/UPDATE/DELETE policies for regular users.
-- Only the whatsapp-agent Edge Function writes to this table using SERVICE_ROLE_KEY,
-- which bypasses RLS entirely.
