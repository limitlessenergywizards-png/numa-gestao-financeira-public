# Roadmap de Correções — Numa Gestão Financeira
# COMPLETO — Todas as waves executadas em 2026-03-27

## Wave 1: CRITICAL (commit f60d8297)
- [x] **C1** — `is_active: false` → `is_deleted: true` em `transactionMutations.ts:421`
- [x] **C2** — Plugar `RequireCompany` + `RequireActiveSubscription` no layout `(company)`
- [x] **C3** — `_rls_ensure_cache`, `has_role`, `has_effective_role`, `is_company_admin` atualizados no banco

## Wave 2: HIGH (commit 7e27af2c)
- [x] **H1** — Race condition pós-onboarding: `await refreshCompanies()` antes de `router.replace`
- [x] **H2** — Centralizar `AuthenticatedLayout` em `(authenticated)/layout.tsx`

## Wave 3: MEDIUM (commit 9d53f0b6)
- [x] **M1** — `getSession()` → `getUser()` + `getSession()` no root `app/layout.tsx`
- [x] **M2** — Redirect pós-login: `/onboarding` → `/inicio` para usuários existentes
- [x] **M4** — Adicionar filtro `company_id` nos soft-deletes de payment_records

## Wave 4: MEDIUM + LOW (commits 95e11983, b9514878)
- [x] **M3** — Migrar `middleware.ts` → `proxy.ts` (Next.js 16 convention)
- [x] **M5** — Validação Zod nos 5 formulários financeiros críticos
- [x] **L1** — Suprimir console error de check-subscription para novos usuários
- [x] **L2** — Corrigir chartTemplateChoice type mismatch
- [x] **L3** — Consolidar SQL em migration versionada (20260327200000)
