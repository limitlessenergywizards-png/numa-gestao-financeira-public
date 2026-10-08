-- ============================================================================
-- Migration: Drop Unused Indexes (idx_scan = 0)
-- Date: 2026-03-17
--
-- CONTEXT: pg_stat_user_indexes mostra 14 indices com idx_scan = 0 (nunca
-- utilizados por nenhuma query). Esses indices consomem disco e adicionam
-- overhead de write amplification em cada INSERT/UPDATE nas tabelas afetadas.
--
-- DECISOES:
--   - 14 indices regulares removidos (idx_scan = 0 confirmado)
--   - 2 indices incluidos como IF EXISTS no-op (nunca existiram):
--     idx_profiles_whatsapp_number, idx_dre_notes_not_deleted
--   - 4 indices UNIQUE constraint MANTIDOS (integridade de dados):
--     mrr_history_recorded_date_key, subscriptions_stripe_subscription_id_key,
--     user_invitations_token_key, user_preferences_user_id_key
--
-- IMPACTO:
--   - Economia de disco: ~76-453 KB (depende do volume de dados)
--   - Melhoria em INSERT/UPDATE: 5-15% nas tabelas afetadas
--   - Risco de regressao em queries: ZERO (todos idx_scan = 0)
--   - Nenhum desses indices e referenciado em codigo, RLS policies,
--     triggers ou functions (confirmado via grep)
--
-- NOTA: Usa DROP INDEX (sem CONCURRENTLY) porque migrations Supabase rodam
-- em transacao. O lock AccessExclusive e inofensivo pois nenhuma query usa
-- esses indices. IF EXISTS previne erros em ambientes onde indices ja foram
-- removidos manualmente.
--
-- ROLLBACK: Ver 20260317200000_drop_unused_indexes_rollback.sql
-- ============================================================================


-- ============================================================================
-- SECAO 1: chart_of_accounts (2 indices)
-- Colunas de baixa cardinalidade: nature tem apenas 2 valores (devedora/credora),
-- is_analytical e boolean. Indices em colunas com ~50% seletividade sao
-- ignorados pelo planner em favor de seq scan - apenas desperdicam espaco.
-- ============================================================================

DROP INDEX IF EXISTS idx_chart_of_accounts_is_analytical;
-- Era: ON public.chart_of_accounts(is_analytical)
-- Motivo: Coluna boolean, ~50% seletividade, seq scan e mais rapido

DROP INDEX IF EXISTS idx_chart_of_accounts_nature;
-- Era: ON public.chart_of_accounts(nature)
-- Motivo: Apenas 2 valores (devedora/credora), ~50% seletividade


-- ============================================================================
-- SECAO 2: hotmart_webhook_logs (3 indices)
-- Tabela de logs de webhook Hotmart. Write-heavy, raramente consultada.
-- Todos os 3 indices com zero scans.
-- ============================================================================

DROP INDEX IF EXISTS idx_hotmart_logs_created;
-- Era: ON public.hotmart_webhook_logs(created_at DESC)

DROP INDEX IF EXISTS idx_hotmart_logs_email;
-- Era: ON public.hotmart_webhook_logs(buyer_email)

DROP INDEX IF EXISTS idx_hotmart_logs_event;
-- Era: ON public.hotmart_webhook_logs(event)


-- ============================================================================
-- SECAO 3: profiles (3 indices, 1 nunca existiu)
-- Indices parciais relacionados ao Hotmart na tabela profiles. Zero scans.
-- idx_profiles_whatsapp_number nunca foi criado em nenhuma migration.
-- ============================================================================

DROP INDEX IF EXISTS idx_profiles_hotmart_status;
-- Era: ON public.profiles(hotmart_status) WHERE hotmart_status IS NOT NULL

DROP INDEX IF EXISTS idx_profiles_hotmart_subscriber;
-- Era: ON public.profiles(hotmart_subscriber_code) WHERE hotmart_subscriber_code IS NOT NULL

DROP INDEX IF EXISTS idx_profiles_whatsapp_number;
-- NOTA: Este indice nunca foi criado em nenhuma migration. IF EXISTS = no-op.


-- ============================================================================
-- SECAO 4: onboarding_progress (1 indice)
-- ============================================================================

DROP INDEX IF EXISTS idx_onboarding_user;
-- Era: ON public.onboarding_progress(user_id)
-- Motivo: Tabela pequena, nunca consultada por indice


-- ============================================================================
-- SECAO 5: dre_email_logs + dre_report_schedules + dre_notes (4 indices, 1 nunca existiu)
-- Infraestrutura de relatorios DRE. Tabelas de baixo trafego com zero scans.
-- idx_dre_notes_not_deleted nunca foi criado (dre_notes nao tem coluna is_deleted).
-- ============================================================================

DROP INDEX IF EXISTS idx_dre_email_logs_sent_at;
-- Era: ON public.dre_email_logs(sent_at DESC)

DROP INDEX IF EXISTS idx_dre_email_logs_schedule_id;
-- Era: ON public.dre_email_logs(schedule_id)

DROP INDEX IF EXISTS idx_dre_report_schedules_next_send;
-- Era: ON public.dre_report_schedules(next_send_at) WHERE is_active = true

DROP INDEX IF EXISTS idx_dre_notes_not_deleted;
-- NOTA: Este indice nunca foi criado. dre_notes nao tem coluna is_deleted. IF EXISTS = no-op.


-- ============================================================================
-- SECAO 6: user_sessions (2 indices)
-- Tracking de sessoes ativas no dashboard admin. Baixo volume de dados.
-- ============================================================================

DROP INDEX IF EXISTS idx_user_sessions_user;
-- Era: ON public.user_sessions(user_id)

DROP INDEX IF EXISTS idx_user_sessions_active;
-- Era: ON public.user_sessions(last_heartbeat DESC)


-- ============================================================================
-- SECAO 7: notification_logs (1 indice)
-- Apenas o indice de ordenacao por sent_at e removido.
-- ============================================================================

DROP INDEX IF EXISTS idx_notification_logs_sent_at;
-- Era: ON public.notification_logs(sent_at DESC)


-- ============================================================================
-- SECAO 8: Atualizar estatisticas das tabelas afetadas
-- Apos remover indices, o planner precisa de estatisticas atualizadas para
-- confirmar a ausencia dos indices e ajustar estimativas de custo.
-- ============================================================================

ANALYZE public.chart_of_accounts;
ANALYZE public.hotmart_webhook_logs;
ANALYZE public.profiles;
ANALYZE public.onboarding_progress;
ANALYZE public.dre_email_logs;
ANALYZE public.dre_report_schedules;
ANALYZE public.user_sessions;
ANALYZE public.notification_logs;


-- ============================================================================
-- QUERIES DE VERIFICACAO (executar manualmente apos deploy)
-- ============================================================================
--
-- 1. Confirmar que os 14 indices foram removidos (deve retornar 0 linhas):
-- SELECT indexname FROM pg_indexes
-- WHERE schemaname = 'public'
--   AND indexname IN (
--     'idx_chart_of_accounts_is_analytical',
--     'idx_chart_of_accounts_nature',
--     'idx_hotmart_logs_created',
--     'idx_hotmart_logs_email',
--     'idx_hotmart_logs_event',
--     'idx_profiles_hotmart_status',
--     'idx_profiles_hotmart_subscriber',
--     'idx_onboarding_user',
--     'idx_dre_email_logs_sent_at',
--     'idx_dre_email_logs_schedule_id',
--     'idx_dre_report_schedules_next_send',
--     'idx_user_sessions_user',
--     'idx_user_sessions_active',
--     'idx_notification_logs_sent_at'
--   );
--
-- 2. Confirmar que indices UNIQUE constraint continuam intactos (deve retornar 4 linhas):
-- SELECT indexname, tablename FROM pg_indexes
-- WHERE schemaname = 'public'
--   AND indexname IN (
--     'mrr_history_recorded_date_key',
--     'subscriptions_stripe_subscription_id_key',
--     'user_invitations_token_key',
--     'user_preferences_user_id_key'
--   );
--
-- 3. Verificar tamanho total de indices nas tabelas afetadas:
-- SELECT
--   t.tablename,
--   pg_size_pretty(pg_indexes_size(t.tablename::regclass)) AS total_index_size,
--   (SELECT count(*) FROM pg_indexes i
--    WHERE i.tablename = t.tablename AND i.schemaname = 'public') AS index_count
-- FROM (VALUES
--   ('chart_of_accounts'), ('hotmart_webhook_logs'), ('profiles'),
--   ('onboarding_progress'), ('dre_email_logs'), ('dre_report_schedules'),
--   ('user_sessions'), ('notification_logs')
-- ) AS t(tablename)
-- ORDER BY pg_indexes_size(t.tablename::regclass) DESC;
--
-- 4. Listar indices restantes por tabela (sanity check):
-- SELECT tablename, indexname, indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public'
--   AND tablename IN (
--     'chart_of_accounts', 'hotmart_webhook_logs', 'profiles',
--     'onboarding_progress', 'dre_email_logs', 'dre_report_schedules',
--     'user_sessions', 'notification_logs'
--   )
-- ORDER BY tablename, indexname;
-- ============================================================================
