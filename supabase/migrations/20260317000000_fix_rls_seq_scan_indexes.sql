-- ============================================================================
-- Migration: Fix RLS Sequential Scan Performance
-- Data: 2026-03-17
--
-- PROBLEMA: user_companies com 398k seq scans (89%), user_roles com 20k (96%),
-- profiles com 1.5k (90%). Causa raiz: funcoes user_belongs_to_company() e
-- has_role() foram migradas de LANGUAGE sql para LANGUAGE plpgsql em
-- 20260301080012. PL/pgSQL + SECURITY DEFINER nunca e inlined pelo PostgreSQL,
-- gerando sub-queries opacas por linha na avaliacao RLS.
--
-- SOLUCAO: Indices covering que forcam index-only scan mesmo em contexto opaco.
-- Complementa a migration 20260317100000_rls_session_cache.sql que otimiza
-- as funcoes RLS com cache por transacao via _rls_ensure_cache().
-- ============================================================================


-- ============================================================================
-- SECAO 1: INDICES PARA TABELAS RLS (MAIOR IMPACTO)
-- Corrige 398k+ seq scans em user_companies e 20k+ em user_roles
-- ============================================================================

-- 1a. user_companies: Covering index para user_belongs_to_company() + is_company_admin()
-- Padrao: WHERE user_id = X AND company_id = Y
-- INCLUDE (role, is_default) permite index-only scan sem acessar o heap.
-- Diferente do UNIQUE constraint (user_id, company_id) que NAO tem INCLUDE.
CREATE INDEX IF NOT EXISTS idx_user_companies_lookup
  ON public.user_companies (user_id, company_id)
  INCLUDE (role, is_default);

-- 1b. user_companies: Reverse lookup para listar membros de uma empresa
-- Padrao: WHERE company_id = X (UsersTab.tsx, admin views)
CREATE INDEX IF NOT EXISTS idx_user_companies_company_id
  ON public.user_companies (company_id)
  INCLUDE (user_id, role);

-- 1c. user_roles: Para has_role() - 20k seq scans atuais
-- Padrao: WHERE user_id = X AND role = Y
-- UNIQUE(user_id, role) existe mas nao esta sendo usado dentro do contexto
-- SECURITY DEFINER plpgsql. Indice explicito forca a mao do planner.
CREATE INDEX IF NOT EXISTS idx_user_roles_lookup
  ON public.user_roles (user_id, role);

-- 1d. profiles: Para get_user_context() e lookups de perfil
-- Padrao: WHERE user_id = X
-- INCLUDE cobre os campos mais buscados (full_name, avatar_url)
CREATE INDEX IF NOT EXISTS idx_profiles_user_id
  ON public.profiles (user_id)
  INCLUDE (full_name, avatar_url);


-- ============================================================================
-- SECAO 2: INDICES PARCIAIS PARA TABELAS FINANCEIRAS
-- Otimiza queries com is_deleted = false (99% das queries de listagem)
-- ============================================================================

-- 2a. payables: Listagem principal
-- Padrao: WHERE company_id = X AND is_deleted = false ORDER BY due_date ASC
-- idx_payables_company_status existe mas NAO filtra is_deleted
CREATE INDEX IF NOT EXISTS idx_payables_active_by_company
  ON public.payables (company_id, due_date ASC)
  WHERE is_deleted = false;

-- 2b. payables: Projecoes de cashflow (apenas pendentes)
-- Padrao: WHERE company_id = X AND status IN ('pendente','parcial')
--         AND due_date BETWEEN Y AND Z AND is_deleted = false
CREATE INDEX IF NOT EXISTS idx_payables_pending_by_company
  ON public.payables (company_id, status, due_date)
  WHERE is_deleted = false AND status IN ('pendente', 'parcial');

-- 2c. receivables: Listagem principal
-- Padrao: WHERE company_id = X AND is_deleted = false ORDER BY due_date ASC
CREATE INDEX IF NOT EXISTS idx_receivables_active_by_company
  ON public.receivables (company_id, due_date ASC)
  WHERE is_deleted = false;

-- 2d. receivables: Projecoes de cashflow (apenas pendentes)
-- Padrao: WHERE company_id = X AND status IN ('pendente','parcial')
--         AND due_date BETWEEN Y AND Z AND is_deleted = false
CREATE INDEX IF NOT EXISTS idx_receivables_pending_by_company
  ON public.receivables (company_id, status, due_date)
  WHERE is_deleted = false AND status IN ('pendente', 'parcial');


-- ============================================================================
-- SECAO 3: INDICES SUPLEMENTARES PARA TRANSACTIONS
-- ============================================================================

-- 3a. forecast_basis: Usado por triggers de orphan cleanup, sync payable/receivable,
-- DRE hooks. Atualmente sem indice - full table scan em cada operacao.
-- Padrao: WHERE forecast_basis = 'payable:UUID' ou 'receivable:UUID'
CREATE INDEX IF NOT EXISTS idx_transactions_forecast_basis
  ON public.transactions (forecast_basis)
  WHERE forecast_basis IS NOT NULL;

-- 3b. customer_id: Count de transacoes por customer (verificacao antes de deletar)
-- Padrao: WHERE customer_id = X
CREATE INDEX IF NOT EXISTS idx_transactions_customer
  ON public.transactions (customer_id)
  WHERE customer_id IS NOT NULL;


-- ============================================================================
-- SECAO 4: REFRESH DE ESTATISTICAS
-- Apos criar indices, o planner precisa de estatisticas atualizadas
-- ============================================================================

ANALYZE public.user_companies;
ANALYZE public.user_roles;
ANALYZE public.profiles;
ANALYZE public.transactions;
ANALYZE public.payables;
ANALYZE public.receivables;


-- ============================================================================
-- QUERIES DE MONITORAMENTO (executar manualmente apos deploy)
-- ============================================================================
--
-- 1. Resetar contadores:
-- SELECT pg_stat_reset_single_table_counters(c.oid)
-- FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
-- WHERE n.nspname = 'public'
-- AND c.relname IN ('user_companies','user_roles','profiles',
--                    'transactions','payables','receivables');
--
-- 2. Verificar apos 24h:
-- SELECT relname, seq_scan, idx_scan,
--        ROUND(100.0 * idx_scan / NULLIF(seq_scan + idx_scan, 0), 1) AS idx_pct
-- FROM pg_stat_user_tables
-- WHERE relname IN ('user_companies','user_roles','profiles',
--                    'transactions','payables','receivables')
-- ORDER BY seq_scan DESC;
-- ============================================================================
