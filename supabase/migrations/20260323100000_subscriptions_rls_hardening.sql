-- ═══════════════════════════════════════════════════════════════
-- Subscriptions RLS hardening
--
-- Subscriptions are ONLY updated by edge functions (stripe-webhook,
-- hotmart-webhook) using service_role which bypasses RLS.
-- These policies ensure that even if a user-token code path is
-- accidentally introduced, users can only update/delete their own
-- subscription — defense in depth.
-- ═══════════════════════════════════════════════════════════════

-- UPDATE: Users can only update their own subscription
CREATE POLICY "Users can update their own subscription"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Explicit deny — no user should delete subscriptions
-- (no policy = deny by default with RLS enabled, but being explicit)
-- Stripe/Hotmart webhooks use service_role to handle cancellation.
