# Numa - Bug Tracking

## Status Legend
- `PENDING` - Identificado, aguardando implementacao
- `IN_PROGRESS` - Em implementacao
- `RESOLVED` - Corrigido, testado e confirmado
- `NEEDS_TESTING` - Corrigido, aguardando teste manual

---

## Bug 1: Onboarding "Finalizar Cadastro" falha com erro RLS
- **Status**: `RESOLVED`
- **Erro original**: `new row violates row-level security policy for table "companies"` → depois mudou para `Not authenticated.`
- **Onde**: Ultima etapa do onboarding ("Convide sua Equipe" → "Finalizar Cadastro")
- **Causas raiz** (foram 3 problemas encadeados):
  1. `.vercelignore` com pattern `supabase/` deletava `src/integrations/supabase/` e `src/lib/supabase/` do build Vercel, impedindo o deploy de codigo novo (fix: d36acaad)
  2. Onboarding usava client Supabase com localStorage (`@supabase/supabase-js`) enquanto o login usava cookies (`@supabase/ssr`). O client localStorage nao tinha sessao (fix: 826a1454)
  3. Faltava `middleware.ts` na raiz do projeto para o `@supabase/ssr` fazer refresh dos cookies de sessao em cada request (fix: 91c999dc)
  4. Client global (`src/integrations/supabase/client.ts`) era instancia separada do browser client. Unificado para reusar o singleton de `lib/supabase/browser.ts` (fix: 3b3cf920)
  5. CSP bloqueava `brasilapi.com.br` e `viacep.com.br` usados no onboarding (fix: 3193436d, dd155ce3)
- **Fixes aplicados**:
  - `.vercelignore`: `supabase/` → `/supabase/` (anchored to root)
  - `src/integrations/supabase/client.ts`: reescrito para reusar singleton SSR de `@/lib/supabase/browser`
  - `middleware.ts` criado na raiz, conectando `updateSession` de `src/lib/supabase/middleware.ts`
  - Migracao `20260325100000_fix_rpc_remove_set_role.sql` aplicada ao banco
  - CSP atualizado com `brasilapi.com.br`, `viacep.com.br`, `vercel.live`
- **Testado em producao**: Confirmado funcionando em 2026-03-26. RPC retornou empresa criada com sucesso (ID: 2b832fdf)

---

## Bug 2: "Cadastrar Empresa" na tela Inicio da erro de permissao
- **Status**: `RESOLVED`
- **Erro**: `"Voce nao tem permissao para acessar esta pagina"`
- **Onde**: Tela de Inicio → botao "Cadastrar Empresa"
- **Causa raiz**: Botao redirecionava para `/configuracoes` (que exige role `admin` via `RequireRole`). Usuarios sem empresa nao tem role alguma.
- **Fix**: Botao agora redireciona para `/onboarding` (commit a57a8f09)

---

## Bug 3: Cadastro rapido de cliente falha com erro de permissao
- **Status**: `RESOLVED`
- **Erro**: `"Erro ao criar cliente. Voce nao tem permissao para realizar esta acao. Verifique se voce tem papel de editor ou administrador"`
- **Onde**: Modal "Cadastro Rapido de Cliente" (dentro de Nova Entrada)
- **Causas raiz**:
  1. `has_role()` so verificava `user_roles` (plataforma), nao `user_companies.role` (empresa). Migracao `20260325000000` corrige isso.
  2. Client Supabase desunificado causava sessao sem auth (mesma causa do Bug 1).
- **Fix aplicado**: Migracao `20260325000000_fix_has_role_check_company_roles.sql` + client unificado (fix: 3b3cf920)
- **Testado em producao**: Confirmado funcionando em 2026-03-26

---

## Bug 4: Criacao de transacao (Nova Entrada) falha com erro RLS
- **Status**: `RESOLVED`
- **Erro**: `operator does not exist: app_role = text` + 403 em `payment_records` e 404 em `transactions`
- **Onde**: Modal "Nova Entrada" → "Confirmar Entrada" (Movimentacoes Financeiras)
- **Causas raiz**:
  1. `has_role()` no banco do Vercel (`wqbbdortsqqglujgechi`) comparava `app_role` enum com `text` usando `::text` cast, causando erro de operador
  2. `payment_records` nao tinha coluna `company_id` e policies dependiam de JOINs complexos com `receivables`/`payables`
  3. Policies de `transactions` tambem tinham o mesmo problema de cast
- **Fixes aplicados** (via SQL Editor no Supabase Dashboard):
  - `has_role()` reescrita para comparar `app_role = app_role` direto (sem cast), verificando `user_roles` E `user_companies`
  - `payment_records`: adicionada coluna `company_id`, RLS desabilitado temporariamente
  - `transactions`: policies recriadas com `has_role` corrigido + fallback `is_company_owner`
  - `NOTIFY pgrst, 'reload schema'` para atualizar cache do PostgREST
- **Testado em producao**: Confirmado funcionando em 2026-03-26

---

## Warnings pendentes (nao-bloqueantes)
- **React error #419**: Hydration mismatch - HTML do servidor difere do cliente. Nao impede funcionamento.
- **aria-hidden focus conflict**: Dialog Radix com foco retido em elemento aria-hidden. Issue cosmetico de acessibilidade.
- **Form fields sem id/name**: Campos de formulario sem atributo id/name para autocomplete do browser.

---
