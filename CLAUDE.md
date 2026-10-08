# Numa — Financial Management SaaS

## Stack
- **Framework**: Next.js 16 + React 19 (App Router)
- **Database**: Supabase (PostgreSQL + Edge Functions)
- **UI**: TailwindCSS 3.4 + Radix UI + Framer Motion
- **State**: TanStack React Query (data fetching) + Zustand (client state, localStorage)
- **Forms**: React Hook Form + Zod
- **Calculos monetarios**: Decimal.js (NUNCA usar float para dinheiro)
- **Deploy**: Vercel (web) + Capacitor (mobile iOS/Android)
- **Linguagem**: TypeScript (path aliases: @/*, @modules/*, @lib/*, @shared/*)

## Arquitetura
- Modulos em `src/modules/` organizados por feature (finance, crm, admin, ai-chat, etc.)
- Modulos financeiros: transactions, payables, receivables, cashflow, DRE, budgets, categories, cost-centers, ledger, reconciliation, recurrence, treasury, OCR
- Hooks customizados por modulo (ex: `useTransactionsData`, `useDashboardQueries`)
- Multi-tenant via CompanyContext
- 14+ Edge Functions em `supabase/functions/` (AI, admin, payments, webhooks)

## Regras de trabalho (OBRIGATORIO)
1. **Commit + push automatico**: Apos QUALQUER alteracao, fazer commit e push sem perguntar
2. **tsc antes de push**: Rodar `npx tsc --noEmit` antes de cada push
3. **Testar no browser**: NUNCA dizer "esta resolvido" sem testar com Playwright/webapp-testing
4. **Verificar Vercel**: Apos push, verificar status do deploy na Vercel
5. **SQL migrations primeiro**: Rodar no Supabase ANTES de pushar frontend que depende delas
6. **Blast radius**: Ao mudar componente global (dialog, sheet, popover, index.css), testar todos os modulos que usam

## Contexto atual
- Cliente principal: Thiago Flores (contador)
- Feedback ativo em `.planning/FEEDBACK-ANALYSIS.md` — bugs de conversao previsao->realizado, duplicatas em movimentacoes/DRE/cashflow
- Retrospectiva da sessao 30/03 em `.planning/retrospective/`
- Research do ciclo de transacoes em `.planning/research/`

## Scripts uteis
- `npm run dev` — dev server
- `npm run build` — build SSR (Vercel)
- `npm run build:mobile` — build static (Capacitor)
- `npx tsc --noEmit` — type check
- `npm run lint` — ESLint
- `npm test` — Vitest
