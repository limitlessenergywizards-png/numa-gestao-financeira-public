# Numa - Auditoria Completa de Validacao

**Data:** 2026-03-27
**Branch:** numa-next-js-migration (23 commits recentes)
**Testes existentes:** 44 arquivos, 1033 testes, todos passando
**Framework:** Vitest + jsdom + MSW + @testing-library

---

## Resumo Executivo

| Severidade | Gaps |
|-----------|------|
| CRITICAL | 5 |
| HIGH | 8 |
| MEDIUM | 12 |
| LOW | 7 |
| **Total** | **32** |

**Cobertura estimada geral:** ~15-20% (1033 testes, mas concentrados em libs/utils; fluxos criticos de negocio sem cobertura)

---

## R1: Autenticacao End-to-End

**Cobertura de teste:** ~0% (nenhum teste para auth)
**Testes existentes:** Nenhum

### Gaps Identificados

| # | Gap | Risco | Evidencia | Recomendacao |
|---|-----|-------|-----------|--------------|
| 1 | Middleware session refresh nao testado | HIGH | `middleware.ts:4-6`, `src/lib/supabase/middleware.ts:9-65` | Teste unitario com mock de NextRequest para verificar: (a) rotas protegidas redirecionam sem user, (b) rotas auth redirecionam com user, (c) cookies sao propagados |
| 2 | AuthContext nao testado | HIGH | `src/contexts/AuthContext.tsx` | Teste de integracao: verificar signIn/signOut mudam state, timeout funciona, hasRole verifica user_roles E companies |
| 3 | Client-side redirect em OnboardingPage depende de `useEffect` (flash de conteudo possivel) | MEDIUM | `src/modules/onboarding/pages/OnboardingPage.tsx:20-37` | Onboarding esta em `(public)` route group; middleware NAO protege `/onboarding`. Um usuario nao-logado ve loading spinner antes do redirect. Mover para `(authenticated)` ou adicionar `/onboarding` ao `protectedPrefixes` no middleware |
| 4 | `AuthenticatedLayout` tem redundancia com middleware (ambos redirecionam) | LOW | `src/components/layout/AuthenticatedLayout.tsx:108-118` vs `src/lib/supabase/middleware.ts:47-51` | Redundancia segura, mas gera redirect duplo em edge cases |

### Analise Detalhada

- **Middleware:** Usa `getUser()` (correto, nao `getSession()`). Protege 12 prefixos. Faltam: `/onboarding` (depende de client-side guard).
- **AuthContext:** Catch silencioso em `getSession().catch(() => {})` (linha 132) -- nao loga o erro. Aceitavel pois seta `isAuthLoading = false`, mas perde diagnostico.
- **Safety timeout:** 8s timeout (`AUTH_LOADING_TIMEOUT_MS`) para RPC pendurado -- bom padrao.

---

## R2: Onboarding Cria Empresa

**Cobertura de teste:** ~5% (2 testes em services: achievementDefinitions + personalityAnalyzer, nao cobrem fluxo principal)
**Testes existentes:** `src/modules/onboarding/services/__tests__/achievementDefinitions.test.ts`, `personalityAnalyzer.test.ts`

### Gaps Identificados

| # | Gap | Risco | Evidencia | Recomendacao |
|---|-----|-------|-----------|--------------|
| 5 | RPC `create_company_and_associate` nao testado | CRITICAL | `src/modules/onboarding/hooks/useOnboardingSubmit.ts:346-364` | Teste de integracao mockando supabase.rpc para verificar: (a) payload correto, (b) tratamento de rpcError, (c) tratamento de rpcResult null |
| 6 | `createBankAccounts` nao valida `initial_balance` NaN | HIGH | `useOnboardingSubmit.ts:135-137` | Se `initial_balance` for string invalida (ex: "abc"), `parseFloat` retorna NaN que vai pro banco. Adicionar validacao |
| 7 | Logo upload falha silenciosamente (retorna null sem erro ao usuario) | MEDIUM | `useOnboardingSubmit.ts:67-71` | `uploadOnboardingLogo` retorna null em erro sem toast. Empresa e criada sem logo e usuario nao sabe |
| 8 | Onboarding nao e atomico: RPC cria empresa, mas steps subsequentes (bank accounts, categories, transaction) podem falhar parcialmente | MEDIUM | `useOnboardingSubmit.ts:377-407` | Errors em bank accounts/categories sao logged via console.error mas nao impedem conclusao. Design intencional mas sem rollback |

---

## R3: CRUD de Transacoes

**Cobertura de teste:** ~0% para mutacoes (nenhum teste cobre insert/update/delete de transacoes)
**Testes existentes:** Nenhum para transactionMutations.ts

### Gaps Identificados

| # | Gap | Risco | Evidencia | Recomendacao |
|---|-----|-------|-----------|--------------|
| 9 | **BUG IMPLEMENTACAO**: `syncPayableOnUpdate` usa `is_active: false` em `payment_records` -- coluna NAO EXISTE | CRITICAL | `src/modules/finance/transactions/services/transactionMutations.ts:421` | Tabela `payment_records` tem `is_deleted` (boolean), nao `is_active`. Linha 421 envia campo inexistente ao Supabase. O update provavelmente e ignorado silenciosamente pelo PostgREST (unknown columns are dropped), mas o registro NAO e marcado como deletado. **ESCALAR PARA FIX.** |
| 10 | **Inconsistencia soft-delete**: `syncPayableOnUpdate` usa `is_active: false` (L421) vs `syncReceivableOnUpdate` usa `is_deleted: true` (L472) | CRITICAL | `transactionMutations.ts:417-432` vs `transactionMutations.ts:468-476` | Payable path e receivable path divergem. Receivable esta correto. Payable tem bug |
| 11 | TransactionFormDialog nao tem validacao Zod/client-side | HIGH | `src/modules/finance/transactions/components/TransactionFormDialog.tsx` | Formulario nao valida: description vazia, amount zero/negativo, bank_account_id ausente. Depende 100% do banco/RLS para rejeitar dados invalidos |
| 12 | `parseCurrencyValue` pode retornar NaN se input for invalido | MEDIUM | `transactionMutations.ts:343` | `parseCurrencyValue(formData.amount)` -- se amount for string invalida, NaN vai pro banco. `parseCurrencyValueSafe` existe e retorna 0 para invalidos, mas nao e usada aqui |

---

## R4: CRM (Clientes/Fornecedores)

**Cobertura de teste:** 0%
**Testes existentes:** Nenhum

### Gaps Identificados

| # | Gap | Risco | Evidencia | Recomendacao |
|---|-----|-------|-----------|--------------|
| 13 | CRUD de customers nao testado | MEDIUM | `src/modules/crm/customers/hooks/useCustomersQuery.ts` | Testar: fetchCustomers, createCustomer, updateCustomer, deactivateCustomer com mocks do Supabase |
| 14 | QuickAddClientDialog nao valida nome vazio | MEDIUM | `src/modules/finance/transactions/components/QuickAddClientDialog.tsx:53` | `handleSave` nao verifica se nome esta vazio antes do insert |
| 15 | Search injection em `useCustomersQuery` via `.or()` | LOW | `useCustomersQuery.ts:61` | `search` e interpolado diretamente em `.or(\`name.ilike.%${search}%\`)`. PostgREST sanitiza, mas e um pattern fragil |

---

## R5: Contas a Pagar/Receber

**Cobertura de teste:** ~5% (handleSave.test.tsx cobre double-click prevention, nao CRUD)
**Testes existentes:** `src/modules/finance/payables/__tests__/handleSave.test.tsx`

### Gaps Identificados

| # | Gap | Risco | Evidencia | Recomendacao |
|---|-----|-------|-----------|--------------|
| 16 | CRUD de payables/receivables nao testado | HIGH | `src/modules/finance/payables/index.tsx`, `receivables/index.tsx` | Testar: create, update, payment recording, status transitions |
| 17 | Sync bidirecional transaction<->payable nao testado | HIGH | `transactionMutations.ts:329-484` | Fluxo complexo com multiplos DB calls. Se um falha no meio, dados ficam inconsistentes. Precisa de testes unitarios |

---

## R6: Dashboard

**Cobertura de teste:** ~0%
**Testes existentes:** `src/hooks/__tests__/useCashFlowProjection.test.ts` (projecao, nao dashboard)

### Gaps Identificados

| # | Gap | Risco | Evidencia | Recomendacao |
|---|-----|-------|-----------|--------------|
| 18 | Queries agregadas do dashboard nao testadas | MEDIUM | `src/modules/analytics/dashboard/hooks/useDashboardQueries.ts` | Smoke test: verificar que queries executam sem erro com dados vazios |
| 19 | Dashboard prefetch pode servir dados stale de outra empresa | LOW | `src/components/shared/DashboardPrefetchProvider.tsx:60-67` | Ja tem guard de `optimisticId !== currentCompany.id`, mas nao invalida se empresa muda durante prefetch |

---

## R7: Configuracoes e Perfil

**Cobertura de teste:** 0%
**Testes existentes:** Nenhum

### Gaps Identificados

| # | Gap | Risco | Evidencia | Recomendacao |
|---|-----|-------|-----------|--------------|
| 20 | `updateProfile` nao testado | MEDIUM | `src/contexts/AuthContext.tsx:183-198` | Testar: update com user null retorna erro, update com dados invalidos |
| 21 | UsersTab (gerenciamento de membros) nao testado | MEDIUM | `src/modules/iam/settings/components/UsersTab.tsx` | Funcionalidade critica: convidar, alterar role, remover membro |

---

## R8: Build e Deploy

**Cobertura de teste:** ~5% (smoke test Playwright)
**Testes existentes:** `e2e/smoke.spec.ts` (verifica titulo da pagina)

### Gaps Identificados

| # | Gap | Risco | Evidencia | Recomendacao |
|---|-----|-------|-----------|--------------|
| 22 | Build nao e testado no CI (nao verificamos se `next build` passa) | HIGH | Sem CI pipeline visivel | Adicionar `next build` ao CI. Build pode falhar por type errors ocultos (`strict: false`) |
| 23 | Smoke test minimo (so verifica titulo) | MEDIUM | `e2e/smoke.spec.ts:4-8` | Expandir: verificar /auth carrega, /inicio redireciona para /auth, form de login renderiza |

---

## Gaps Transversais (Cross-Cutting)

### Tratamento de Erros

| # | Gap | Risco | Evidencia | Recomendacao |
|---|-----|-------|-----------|--------------|
| 24 | 3 `.catch(() => {})` silenciosos | LOW | `AuthContext.tsx:132`, `useWeeklyChallenges.ts:198`, `OnlineUsersWidget.tsx:134` | AuthContext ja seta `isAuthLoading = false` (aceitavel). Outros 2 perdem erros de realtime/subscriptions |
| 25 | Error boundaries cobrem `(public)` e `(company)` mas nao `(settings)` | LOW | `app/(authenticated)/(settings)/` nao tem `error.tsx` | Adicionar `error.tsx` em `(settings)` |

### Validacao de Dados

| # | Gap | Risco | Evidencia | Recomendacao |
|---|-----|-------|-----------|--------------|
| 26 | Apenas 7 formularios (de ~20+) usam Zod | HIGH | Auth (3), Checkout (1), Recurrence (1), CostCenter (1), Category (1) | Formularios criticos sem validacao: transacoes, payables, receivables, bank accounts, clientes, fornecedores. Depende 100% do banco |
| 27 | Nenhuma server-side validation nas Edge Functions | MEDIUM | `src/lib/supabase/edge-functions.ts` | Edge functions recebem payload sem schema validation |

### TypeScript Safety

| # | Gap | Risco | Evidencia | Recomendacao |
|---|-----|-------|-----------|--------------|
| 28 | `strict: false` + `strictNullChecks: false` + `noImplicitAny: false` | CRITICAL | `tsconfig.json:17-21` | Esconde bugs de null/undefined. Com `strictNullChecks: false`, `currentCompany.id` pode crashar em runtime se `currentCompany` for null. Embora guards existam na maioria dos lugares, e facil introduzir bugs |
| 29 | 29 usos de `signal!` (non-null assertion) | LOW | 12 arquivos de queries | React Query sempre provee signal, entao e seguro na pratica. Mas `signal!` mascara a tipagem |

### Race Conditions

| # | Gap | Risco | Evidencia | Recomendacao |
|---|-----|-------|-----------|--------------|
| 30 | Invalidacao de cache apos mutacoes esta bem implementada | OK | `useTransactionsActions.ts` | Cada mutacao chama `invalidateFinancialQueries`. Pattern correto |
| 31 | Double-click prevention testado para payables mas nao para transacoes | MEDIUM | `handleSave.test.tsx` testa payables; `TransactionFormDialog.tsx:359` usa `disabled={isSaving}` | Botao desabilitado e suficiente para UI, mas sem `useRef` guard no handler |

### Migrations vs Banco Real

| # | Gap | Risco | Evidencia | Recomendacao |
|---|-----|-------|-----------|--------------|
| 32 | Bug 4 (BUGS.md) diz que fixes foram aplicados "via SQL Editor no Supabase Dashboard" | HIGH | `BUGS.md:60-64` | SQL aplicado diretamente no Dashboard pode nao estar nas migrations versionadas. Risco de divergencia schema se banco for recreado. Verificar se migration `20260326132000_fix_payment_records_rls.sql` cobre tudo |

---

## Top 5 Gaps Mais Criticos (Corrigir AGORA)

1. **BUG #9/#10 - `is_active: false` em `payment_records`** (CRITICAL)
   - Arquivo: `src/modules/finance/transactions/services/transactionMutations.ts:421`
   - Impacto: Quando usuario edita transacao vinculada a payable e muda de "realizado" para "previsao", o payment_record NAO e marcado como deletado. Dado fica orfao.
   - Fix: Trocar `is_active: false` por `is_deleted: true` na linha 421

2. **TypeScript `strict: false`** (CRITICAL)
   - Impacto: Bugs de null/undefined nao sao detectados em tempo de compilacao. Qualquer novo codigo pode introduzir crash de runtime.
   - Fix: Ligar `strictNullChecks: true` incrementalmente (por diretorio)

3. **Onboarding RPC sem testes** (CRITICAL)
   - Impacto: Fluxo critico de primeiro uso. Se quebrar, nenhum novo usuario consegue usar o app.
   - Fix: Adicionar testes unitarios para `useOnboardingSubmit`

4. **Formularios sem validacao Zod** (HIGH)
   - Impacto: Dados invalidos podem chegar ao banco. `parseCurrencyValue` pode retornar NaN.
   - Fix: Adicionar Zod schemas para os 4 formularios mais usados (transacoes, payables, receivables, bank accounts)

5. **Migrations vs banco real** (HIGH)
   - Impacto: Schema drift entre codigo e producao.
   - Fix: Executar `supabase db diff` para verificar divergencias. Versionar todo SQL aplicado via Dashboard.

---

## Modulos com Testes vs Sem Testes

### COM testes (libs/utils - boa cobertura):
- `src/lib/__tests__/` - 29 arquivos: money, masks, formatters, dateUtils, csvParser, ofxParser, xmlParser, routes, config, safeAsync, etc.
- `src/modules/finance/debts/services/` - 2 arquivos: debtCalculationEngine, debtPayoffPlanner
- `src/modules/finance/financial-health/services/` - 1 arquivo: breakEvenEngine
- `src/modules/finance/ledger/services/` - 3 arquivos: chartOfAccountsService, exportSped, exportTotvs
- `src/modules/finance/ocr/services/` - 1 arquivo: ocrExtractors
- `src/modules/finance/payables/` - 1 arquivo: handleSave (double-click)
- `src/modules/finance/reconciliation/services/` - 1 arquivo: transactionRules
- `src/modules/finance/recurrence/` - 2 arquivos: recurringEngine, dateUtils
- `src/modules/finance/treasury/` - 1 arquivo: bankBalanceConsistency
- `src/modules/onboarding/services/` - 2 arquivos: achievementDefinitions, personalityAnalyzer
- `src/hooks/` - 1 arquivo: useCashFlowProjection

### SEM testes (modulos criticos):
- `src/contexts/AuthContext.tsx` - ZERO testes
- `src/contexts/CompanyContext.tsx` - ZERO testes
- `src/lib/supabase/middleware.ts` - ZERO testes
- `src/modules/finance/transactions/services/transactionMutations.ts` - ZERO testes
- `src/modules/finance/transactions/hooks/useTransactionsActions.ts` - ZERO testes
- `src/modules/onboarding/hooks/useOnboardingSubmit.ts` - ZERO testes
- `src/modules/crm/customers/` - ZERO testes
- `src/modules/crm/suppliers/` - ZERO testes
- `src/modules/finance/payables/` (exceto double-click) - ZERO testes
- `src/modules/finance/receivables/` - ZERO testes
- `src/modules/analytics/dashboard/` - ZERO testes
- `src/modules/iam/settings/` - ZERO testes
- `app/` (route handlers/pages) - ZERO testes

---

## Status dos Testes Existentes

**Todos 44 arquivos / 1033 testes: PASSANDO** (verificado 2026-03-27)
**Comando:** `npx vitest run`
**Duracao:** ~91s (setup pesado por jsdom/MSW)
**Coverage thresholds:** Extremamente baixos (branches 5%, functions 1%, lines 0.5%) - nao servem como gate de qualidade
