-- ============================================================================
-- ROLLBACK: Recriar indices removidos por 20260317200000_drop_unused_indexes.sql
-- Date: 2026-03-17
--
-- USO: Este arquivo NAO e aplicado automaticamente. Execute manualmente via:
--   supabase db execute --file supabase/migrations/20260317200000_drop_unused_indexes_rollback.sql
--
-- NOTA: idx_profiles_whatsapp_number e idx_dre_notes_not_deleted NAO sao
-- recriados aqui pois nunca existiram.
-- ============================================================================


-- ============================================================================
-- SECAO 1: chart_of_accounts
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_is_analytical
  ON public.chart_of_accounts(is_analytical);

CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_nature
  ON public.chart_of_accounts(nature);


-- ============================================================================
-- SECAO 2: hotmart_webhook_logs
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_hotmart_logs_event
  ON public.hotmart_webhook_logs(event);

CREATE INDEX IF NOT EXISTS idx_hotmart_logs_email
  ON public.hotmart_webhook_logs(buyer_email);

CREATE INDEX IF NOT EXISTS idx_hotmart_logs_created
  ON public.hotmart_webhook_logs(created_at DESC);


-- ============================================================================
-- SECAO 3: profiles
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_hotmart_subscriber
  ON public.profiles(hotmart_subscriber_code)
  WHERE hotmart_subscriber_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_hotmart_status
  ON public.profiles(hotmart_status)
  WHERE hotmart_status IS NOT NULL;


-- ============================================================================
-- SECAO 4: onboarding_progress
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_onboarding_user
  ON public.onboarding_progress(user_id);


-- ============================================================================
-- SECAO 5: dre_email_logs + dre_report_schedules
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_dre_email_logs_schedule_id
  ON public.dre_email_logs(schedule_id);

CREATE INDEX IF NOT EXISTS idx_dre_email_logs_sent_at
  ON public.dre_email_logs(sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_dre_report_schedules_next_send
  ON public.dre_report_schedules(next_send_at)
  WHERE is_active = true;


-- ============================================================================
-- SECAO 6: user_sessions
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_sessions_active
  ON public.user_sessions(last_heartbeat DESC);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user
  ON public.user_sessions(user_id);


-- ============================================================================
-- SECAO 7: notification_logs
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at
  ON public.notification_logs(sent_at DESC);


-- ============================================================================
-- SECAO 8: Atualizar estatisticas
-- ============================================================================

ANALYZE public.chart_of_accounts;
ANALYZE public.hotmart_webhook_logs;
ANALYZE public.profiles;
ANALYZE public.onboarding_progress;
ANALYZE public.dre_email_logs;
ANALYZE public.dre_report_schedules;
ANALYZE public.user_sessions;
ANALYZE public.notification_logs;
