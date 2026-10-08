# STATE — Numa SEO Cascata

Estado persistente do runbook. Atualizar após cada prompt.

---

## Prompt atual

`prompts/fase_1_paginas_chave/07_arquitetura_publica.md` — bloqueado pelo CHECKPOINT FASE 0 (aguardando aprovação humana de Thierre após Lighthouse).

## Concluídos

Pre-step (setup + alinhamento com realidade do produto):

| # | Tarefa | Commit | Data |
|---|--------|--------|------|
| pre-0 | `rm -rf marketing-site/` (sub-projeto abortado; nada commitado) | — (sem commit) | 2026-05-13 |
| pre-1 | `context/01` — auth via Supabase (não Clerk) | `d0ccebe1` | 2026-05-13 |
| pre-2 | `context/01` — sem ORM (Supabase direto, não Prisma) | `27832b51` | 2026-05-13 |
| pre-3 | `context/01` — gateway sem nome em copy | `f9586557` | 2026-05-13 |
| pre-4 | `context/01` — brand colors via CSS vars HSL | `7997e06c` | 2026-05-13 |
| pre-5 | `context/01` — fontes Syne + Manrope | `3d2d8c62` | 2026-05-13 |
| pre-6 | `context/01` — Next 16 + React 19 | `bae1b048` | 2026-05-13 |
| pre-7 | `context/01` — mobile Capacitor / SSR só em build web | `70f0c8e1` | 2026-05-13 |
| 00 | `fase_0/00_branch_e_setup` — verificações do setup root | `140cc3db` | 2026-05-13 |
| 01 | `fase_0/01_metadata_e_renderizacao` — Metadata API completa + typography plugin | `9226fd43` | 2026-05-13 |
| 02 | `fase_0/02_sitemap_e_robots` — sitemap.ts + robots.ts dinâmicos | `8fd051c4` | 2026-05-13 |
| 03 | `fase_0/03_manifest_icones_og` — manifest.ts + opengraph-image.tsx + retrofit T18 | `cc242293` | 2026-05-13 |
| 04 | `fase_0/04_schemas_globais` — Organization + WebSite JSON-LD via JsonLd helper | `0b684cf7` | 2026-05-13 |
| 05 | `fase_0/05_analytics_e_web_vitals` — PostHog + Speed Insights + track helper | `ff77b327` | 2026-05-13 |
| 06 | `fase_0/06_search_console_e_bing` — verification env vars + IndexNow helper + seo:check script | (próximo commit) | 2026-05-13 |

## Em andamento

— Fase 0 completa (prompts 00-06). Aguardando aprovação de Thierre no checkpoint Lighthouse antes de iniciar Fase 1.

### Notas do prompt 01

- Editado `app/layout.tsx`: adicionado `metadataBase`, Open Graph completo, Twitter Card, robots, verification placeholders, alternates (canonical + languages), applicationName, authors/creator/publisher, keywords, formatDetection. Preservadas configs existentes (icons, manifest, appleWebApp, viewport, themeColor split dark/light, fontes Syne+Manrope, Providers).
- Title default: `Numa — Gestão financeira para contadores brasileiros` (52 chars; contém "gestão financeira" + "contadores")
- Description default: 154 chars; usa N3 tagline + benefício "CNPJ e usuários ilimitados"
- OG image: `/og-image.png` existente (1200×630, verificado via `file`)
- Verification: `TODO_GOOGLE_SITE_VERIFICATION` e `TODO_BING_VERIFICATION` placeholders — substituir no prompt 06
- ThemeColor preservado split dark/light (`#ffffff`/`#0a0a0a`) — runbook pedia `#080808` único, mas A2 prevalece (manter tokens existentes)
- **Candidato para prompt futuro**: substituir título da home pelo SinglePricePage atual quando criar nova home SEO no prompt 08 (A5)
- Instalado `@tailwindcss/typography` (devDep)
- Atualizado `tailwind.config.ts`: import ES do typography plugin (evita novo lint error `no-require-imports`); config `typography.DEFAULT.css` mapeia prose vars para tokens HSL do produto (`--foreground`, `--primary`, `--muted-foreground`, `--border`, `--muted`) por A2
- Lint: 0 erros novos (2 pré-existentes em `tailwind.config.ts:412/415` permanecem; já estavam em `main`)
- Typecheck: 0 erros novos (16 pré-existentes em `handleError.test.ts` + `routes.test.ts` permanecem; já estavam em `main`)
- Build: ✅ verde (52 rotas)
- Smoke test via curl em `http://127.0.0.1:3002/`: HTTP 200, 48291 bytes, HTML contém `<html lang="pt-BR">`, `<title>` (52 chars), description (154 chars), keywords, robots, canonical, og:image (1200×630), twitter:card=summary_large_image, theme-color split light/dark

### Notas do prompt 02

- Criado `app/sitemap.ts` com 24 URLs (4 core + 5 profissões + 6 competidores + 7 hub reforma + 2 legais). **Discrepância no runbook**: o header do prompt 02 diz "26 URLs" mas a lista detalhada soma 24. Implementado conforme a lista detalhada (autoritativa)
- URLs no sitemap apontam para páginas que ainda não existem (criadas em prompts 08-29). Aceitável: branch não merge para `main` até a Fase ser revisada; portanto URLs 404 não chegam à produção até serem implementadas
- Home no sitemap usa `https://numagestaofinanceira.com` (sem trailing slash) — bate com canonical declarado no layout
- `lastmod` usa `new Date()` (timestamp do build). Aceitável no MVP; depois pode ser refinado por página
- `changeFrequency`: home=weekly; precos/para-contadores=monthly; profissões=monthly; competidores=monthly; hub reforma=weekly; legais=yearly
- `priority`: home=1.0; pilares=0.9; sub-páginas=0.7-0.8; legais=0.3
- Criado `app/robots.ts` com 9 regras (1 universal + 8 crawlers de IA explícitos: GPTBot, ClaudeBot, anthropic-ai, PerplexityBot, Google-Extended, Bingbot, CCBot, Applebot-Extended)
- Disallow paths adaptados à realidade do repo (não copiados literalmente do runbook): `/api/`, `/admin/`, `/dashboard/`, `/inicio/`, `/configuracoes/`, `/perfil/`, `/auth/`, `/aceitar-convite/`, `/ativar-conta/`, `/esqueci-senha/`, `/redefinir-senha/`, `/plano-expirado/`, `/pagamento/`, `/onboarding/`, `/clear-cache/`, `/_next/`
- `Host` directive: `https://numagestaofinanceira.com`
- `Sitemap` reference no final: `https://numagestaofinanceira.com/sitemap.xml`
- **Apagado** `public/robots.txt` estático (conforme A7) — `app/robots.ts` agora é fonte única
- `public/manifest.json` permanece como está; substituição para `app/manifest.ts` será no prompt 03
- Build: ✅ `/sitemap.xml` e `/robots.txt` como rotas estáticas (○)
- Smoke test em `http://127.0.0.1:3003/`:
  - `/sitemap.xml` HTTP 200, 4385 bytes, 24 `<loc>` entries, XML válido
  - `/robots.txt` HTTP 200, 3607 bytes, todos os 8 crawlers IA presentes, Sitemap+Host no final
- Typecheck: 0 erros novos
- Lint: 0 erros novos
- **Candidato para prompt futuro**: também listar `/lgpd` no sitemap (existe na app mas não está na lista do runbook); decidir quando page for retrabalhada

### Notas do prompt 03

- Criado `app/manifest.ts` substituindo `public/manifest.json` (apagado, conforme A7). Theme_color e background_color: `#1B3B34` (mantido — não `#080808` do runbook, conforme A2)
- Icons no manifest: `purpose: 'any'` (Next type não aceita `'any maskable'` da JSON antiga; perda menor — ícones já têm safe area)
- Criado `app/opengraph-image.tsx` com `next/og` `ImageResponse`, 1200×630, layout brand-aligned (gradient `#0F201D → #1B3B34`, "N" badge, tagline N2 canonical, sub-text "R$ 197/mês · Trial de 3 dias sem cartão · Sem fidelidade")
- Runtime **Node.js** (não edge) — runbook pedia edge, mas edge quebra build mobile (`NEXT_STATIC_EXPORT=true`). T18 prevalece
- `export const dynamic = 'force-static'` em opengraph-image.tsx — sem isso, `output: export` falha em "Failed to collect page data"
- **Retrofit T18** (fix de regressão dos prompts anteriores no mesmo commit):
  - `app/robots.ts`: adicionado `export const dynamic = 'force-static'`
  - `app/sitemap.ts`: adicionado `export const dynamic = 'force-static'`
  - Sem isso, build mobile quebrava também nas rotas do prompt 02. Decisão pragmática: incluir o fix neste commit em vez de criar commit isolado (1 linha cada)
- `app/layout.tsx`: removido `manifest: '/manifest.json'` da metadata (file convention assume); removidas `openGraph.images` e `twitter.images` (file convention assume — Next propaga OG image para Twitter automaticamente)
- Apagado `public/manifest.json` (substituído por `app/manifest.ts`)
- **NÃO criados `app/icon.tsx` / `app/apple-icon.tsx`**: V9 do context/01 manda usar `public/numa-logo.png` existente em vez de gerar placeholders. Os arquivos em `public/favicon.ico`, `public/favicon.png`, `public/icons/apple-touch-icon.png` continuam servindo os ícones via `metadata.icons` da layout.tsx
- Verificações:
  - Web build (`next build`): ✅ verde, 56 páginas
  - **Mobile build (`NEXT_STATIC_EXPORT=true next build`): ✅ verde**, todas rotas SEO geradas como estáticas
  - Smoke test em `http://127.0.0.1:3004/`:
    - `/manifest.webmanifest` HTTP 200, 564 bytes, JSON válido completo
    - `/opengraph-image` HTTP 200, 77622 bytes, PNG 1200×630 ✓
    - HTML home: `<link rel="manifest" href="/manifest.webmanifest"/>`, `<meta property="og:image" content=".../opengraph-image?<hash>"/>`, `<meta name="twitter:image" content=".../opengraph-image?<hash>"/>` (Next propaga OG → Twitter automaticamente)
- **Observação OneDrive**: durante o build inicial do prompt 03, `node_modules/next/og.js` (60 bytes, OneDrive cloud-only placeholder) deu "cloud operation timeout (os error 426)". Resolvido após `npm install next` re-touchando o arquivo. Risco recorrente em qualquer build futuro — provável que precise reativar com `npm install` se reaparecer

### Notas do prompt 04

- Criado `src/lib/seo/schemas.ts` exportando 3 schemas: `organizationSchema`, `websiteSchema`, `softwareApplicationSchema`. Também exporta IDs estáveis (`ORG_ID`, `WEBSITE_ID`, `SOFTWARE_ID`) para cross-reference
- Criado `src/lib/seo/JsonLd.tsx` — Server Component que renderiza `<script type="application/ld+json">`. Aceita schema único (objeto) ou array. Quando array, envelopa em `{ "@context": "https://schema.org", "@graph": [...] }`. Escapa `<` para evitar injeção de fechamento de tag
- `app/layout.tsx`: adicionada injeção de `<JsonLd data={[organizationSchema, websiteSchema]} id="ld-org-website" />` antes do fechamento do `<body>`. Schemas globais aparecem em TODAS as páginas (públicas e autenticadas — autenticadas são noindex via robots, sem prejuízo)
- **Organization**: `@id` estável; logo aponta para `/numa-logo.png` (1280×853, dimensões reais — não 512×512 do template, V9 manda usar arquivo existente); founders Thierre + Cassiano; parentOrganization Būma; endereço Fortaleza/CE/BR; 2 ContactPoints (suporte + privacy); sameAs LinkedIn + Instagram (URLs canônicas mesmo que ainda não verificadas)
- **WebSite**: `@id` estável; publisher referencia `ORG_ID`; inLanguage pt-BR; **SEM** `potentialAction SearchAction` (não há `/buscar` funcional)
- **SoftwareApplication** (exportado mas NÃO injetado ainda): será usado em prompts 08 (home) e 09 (`/precos`). FeatureList contém apenas features REAIS em produção (NFS-e, Open Finance, WhatsApp support omitidos até live). Sem `aggregateRating` (zero reviews verificáveis hoje)
- Observação técnica: cada schema tem seu próprio `@context` mesmo quando dentro de `@graph` (redundante mas válido). Validators aceitam. Posso simplificar depois removendo `@context` interno e deixando só o do wrapper, mas não bloqueia critério de aceitação
- Verificações:
  - Build (`next build`): ✅ verde, 56 páginas
  - Smoke test home em `http://127.0.0.1:3005/`: HTTP 200, 48741 bytes, HTML contém `<script type="application/ld+json" id="ld-org-website">` com `@graph` listando Organization + WebSite completos
  - Schema types encontrados na home: Organization, ImageObject, Person×2, parentOrganization, PostalAddress, ContactPoint×2, WebSite ✓
  - Typecheck: 16 erros pré-existentes apenas (sem novos)
  - Lint: 0 erros novos (2 warnings pré-existentes em `app/layout.tsx`)
- **Candidato para prompt futuro** (não-bloqueante): refatorar JsonLd helper para remover `@context` redundante dos schemas individuais quando dentro de `@graph`. Schemas individuais podem manter `@context` para uso standalone

### Notas do prompt 05

- Instalado `posthog-js` ^1.373.4 e `@vercel/speed-insights` ^2.0.0
- Criado `src/lib/seo/posthog/PostHogProvider.tsx` — Client Component. Inicializa PostHog com:
  - `api_host: '/ingest'` (reverse proxy)
  - `ui_host: 'https://eu.posthog.com'`
  - `person_profiles: 'identified_only'`
  - `capture_pageview: false` (manual em PageView tracker)
  - `capture_pageleave: true`
  - autocapture limitado a `a/button/form` + eventos `click/submit`
  - No-op silencioso se env vars ausentes (dev local)
- Criado `src/lib/seo/posthog/PostHogPageView.tsx` — Suspense-wrapped Client Component. Dispara `$pageview` em mudanças de `pathname` + `searchParams`. Suspense obrigatório por `useSearchParams` (Next 14+ App Router)
- Criado `src/lib/seo/track.ts` — exports tipados: `ctaTrialClicked(location)`, `ctaComparativoClicked(concorrente)`, `faqExpanded(question, page)`, `calculatorStarted()`, `calculatorCompleted(result)`, `scrollDepth(page, depth)`. Cada um faz `safeCapture` que checa `posthog.__loaded` antes; no-op se PostHog ainda não inicializou
- `next.config.ts`:
  - `skipTrailingSlashRedirect: true`
  - `rewrites()`: `/ingest/static/:path*` → eu-assets, `/ingest/decide` → eu/decide, `/ingest/:path*` → eu/:path*
  - Static export (mobile) ignora rewrites — documentado no comentário. Analytics SEO só funciona em build web/Vercel (T18)
- `app/layout.tsx`: PostHogProvider envolve Providers + PostHogPageView. SpeedInsights renderiza no fim do `<body>`. JsonLd permanece
- CSP existente já cobre `'self'` para `connect-src`; PostHog via proxy `/ingest/*` é same-origin. Sem necessidade de atualizar CSP
- **NÃO** instalado Microsoft Clarity (env var `NEXT_PUBLIC_CLARITY_ID` ausente — runbook diz "se não está em env, não injete")
- Verificações:
  - Web build (`next build`): ✅ verde
  - **Mobile build (`NEXT_STATIC_EXPORT=true next build`): ✅ verde** (rewrites silenciosamente ignoradas em export)
  - Smoke test home em `http://127.0.0.1:3006/`: HTTP 200, 52312 bytes, HTML contém refs a `posthog` e `speed-insights`, JSON-LD presente. Sem erros no console (apenas warnings pré-existentes do Tailwind sobre classes ambíguas)
  - Lint: 0 erros novos
  - Typecheck: 0 erros novos
- **Limitação conhecida**: sem `.env.local` local com credenciais PostHog, dev local não captura eventos. Vercel deploy capturará normalmente. Decisão pragmática: aceitável; analytics é para uso em produção

### Notas do prompt 06

- `app/layout.tsx`: `verification.google` e `verification.other['msvalidate.01']` agora leem `process.env.GOOGLE_SITE_VERIFICATION` / `BING_SITE_VERIFICATION` com fallback `'PENDING_TOKEN'`
- Criado `.env.local.example` na raiz (não existia) com placeholders comentados para Supabase, PostHog, Clarity, GSC, Bing, IndexNow
- Criado `src/lib/seo/indexnow.ts` exportando `pingIndexNow(urls)`: POSTa para `https://api.indexnow.org/indexnow` com `host` + `key` + `keyLocation` + `urlList`. No-op se `NEXT_PUBLIC_INDEXNOW_KEY` ausente. Errors logados ao console; nunca propagados
- Criado `scripts/seo-check.mjs` (Node ESM puro — sem tsx): faz HTTP check de `/`, `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest`, `/opengraph-image`. Verifica `mustContain` strings em cada response. Exit 1 se qualquer rota falhar
- Adicionado `seo:check` em `package.json` scripts: `node scripts/seo-check.mjs`. Uso: `npm run seo:check [base-url]`
- Build verde (web e mobile)
- `npm run seo:check http://127.0.0.1:3007` rodado contra dev server: TODAS as 5 rotas retornaram OK 200 com conteúdo esperado

### TODO MANUAL (Thierre) — pós-Fase 0

Esses passos exigem acesso ao painel DNS, GSC, Bing Webmaster Tools, etc. Agente não consegue executar.

**Google Search Console**
- [ ] Acesse https://search.google.com/search-console
- [ ] Add Property → Domain → `numagestaofinanceira.com`
- [ ] Copie o TXT record gerado
- [ ] Adicione TXT no painel DNS (Cloudflare / Registro.br / onde estiver)
- [ ] Volte ao GSC e clique Verify (5-30min pra DNS propagar)
- [ ] Após verificado: GSC → Sitemaps → adicionar `sitemap.xml`
- [ ] Settings → Users → adicionar Cassiano como Full user
- [ ] Após verificação, atualize Vercel env: `GOOGLE_SITE_VERIFICATION=<token>` e re-deploy

**Bing Webmaster Tools**
- [ ] Acesse https://www.bing.com/webmasters
- [ ] Import from Google Search Console (3 cliques)
- [ ] Confirmar sitemap apareceu
- [ ] Settings → enable IndexNow
- [ ] Após verificação, atualize Vercel env: `BING_SITE_VERIFICATION=<token>` e re-deploy

**IndexNow** (opcional)
- [ ] Gere chave em https://www.bing.com/indexnow
- [ ] Adicione `NEXT_PUBLIC_INDEXNOW_KEY=<key>` em Vercel + `.env.local`
- [ ] Crie `public/[KEY].txt` com a key como conteúdo (validação Bing)
- [ ] Commit + push

**Deploy + DNS** (pré-condição de tudo acima)
- [ ] Confirme que `numagestaofinanceira.com` aponta para o deploy SSR Vercel desta branch
- [ ] HTTPS ativo (HSTS já configurado em next.config.ts)
- [ ] Sitemap acessível em https://numagestaofinanceira.com/sitemap.xml
- [ ] Robots acessível em https://numagestaofinanceira.com/robots.txt

### Lighthouse Mobile (Fim da Fase 0)

Rodado em `http://127.0.0.1:3007/` (dev server local — OneDrive slow filesystem). Production via Vercel deve ter Performance significativamente melhor.

| Categoria | Score | Target | Status |
|---|---|---|---|
| **SEO** | **100/100** | ≥ 95 | ✅ APROVADO |
| Performance | 55/100 | (sem target Fase 0) | ⚠ dev local; Vercel prod corrige |
| Accessibility | 89/100 | (sem target) | aceitável |
| Best Practices | 96/100 | (sem target) | ✅ |

**Web Vitals do dev local (não-canônico):**
- LCP: 6514ms (Vercel prod < 2500ms esperado)
- FCP: 1196ms
- CLS: 0.000 ✅
- TBT: 1063ms
- Speed Index: 1196ms

Audits SEO: 0 issues (todos passaram). Detalhes: title, meta description, viewport, lang, canonical, robots, sitemap, hreflang, JSON-LD, OG, anchors — todos OK.

### Verificações do prompt 00 (baseline do root)

| Critério | Resultado | Observação |
|---|---|---|
| Branch `feature/seo-publico` ativa | ✅ | criada em pre-step |
| `npm run build` (next build) | ✅ verde | 52 rotas, todas dinâmicas (`ƒ`) |
| `npm run type-check` | ⚠ 5 erros pré-existentes | apenas `src/lib/__tests__/handleError.test.ts` e `routes.test.ts` — legacy, fora do escopo SEO; idênticos à `main`. Documentado em A8 |
| `npm run lint` | ⚠ 972 problemas pré-existentes | 789 errors + 183 warnings, todos em código autenticado/legacy (`src/`, `app/(authenticated)/`, `supabase/functions/`, `tailwind.config.ts`, `temp.js`). Zero em `app/(public)/` ou `.seo/`. Estado idêntico ao `main` |
| Node | v24.14.0 (engines pede 20.x) | `npm WARN EBADENGINE` — não-bloqueante (build passa) |
| Package manager | `npm` 10.5.2 | T13 do runbook permite npm como fallback |
| `.gitignore` raiz cobre `.env*.local`, `node_modules/`, `.next/`, `.vercel/`, `*.log`, `.DS_Store` | ✅ | linhas 3, 10, 17, 39, 33, 46 |
| STATE.md preenchido | ✅ | bootstrap em `1f3b714c` |

### Nota sobre `npm install` durante o prompt 00

Build inicial falhou com `Cannot find module 'baseline-browser-mapping'` no `node_modules/next/dist/compiled/browserslist/`. Causa: state do `node_modules` ficou inconsistente após `git restore package-lock.json` (revert da contaminação de swc-win32 do sub-projeto Next 14 abortado). `npm install` no root foi idempotente (`up to date, audited 836 packages`) e re-resolveu o módulo. Build verde após isso.

`npm install` também tentou adicionar `engines: { node: "20.x" }` ao root do `package-lock.json` — revertido com `git restore` para manter working tree limpo (auto-sync benigno, fora do escopo SEO).

## Falhados / Escalados

### Prompt 05 — escalation resolvido 2026-05-13

- **Decisão do Thierre (Opção A)**: PostHog adicionado em Vercel (3 ambientes) e `.env.local`. Em modo execução autônoma total.
- Implementação prosseguiu trust-but-verify: código usa `process.env.NEXT_PUBLIC_POSTHOG_*` em runtime. Funcional em Vercel deploy mesmo se `.env.local` local estiver vazio. Documentado.

---

## Decisões arquiteturais

### A0 — Onde mora o SEO

Rotas SEO públicas vivem **na raiz do repositório**, dentro do route group `app/(public)/` existente. **NÃO** há sub-projeto separado. Tentativa inicial de criar `/marketing-site/` foi abortada (era baseada em premissa errada de que o repo era Vite SPA — na verdade é Next.js 16 App Router desde o início).

**Consequências:**

- Reusa infra existente: Vercel deploy, tsc, lint (eslint), Tailwind, fontes, providers, husky.
- Compartilha brand tokens com produto autenticado (consistência visual).
- Working directory padrão: raiz do repo. Comandos `npm` (não pnpm — root usa npm).
- Toda rota SEO nova é Server Component puro (sem `'use client'`, sem `ssr: false`).
- Rotas existentes (`/preco-triade`, `/lp/*`, autenticadas) **não são tocadas**. Estão fora do escopo SEO.

### A1 — Branch

`feature/seo-publico` (criada do `origin/main` em 2026-05-13). Todo trabalho da cascata acontece nela. Não fazer merge para `main` automaticamente.

### A2 — Mapeamento de brand tokens (runbook ↔ produto)

Runbook original especifica paleta preto/prata/midnight (`#080808`, `#C0C0C0`, `#0A1F2F`). **Rejeitado.** Usar tokens semânticos HSL existentes em [src/index.css](src/index.css):

| Runbook (rejeitado) | Token produto (usar) | CSS var | Light mode (HSL) | Dark mode (HSL) |
|---|---|---|---|---|
| `#080808` (bg) | `bg-background` | `--background` | `40 15% 94%` (off-white) | `168 37% 8%` (teal escuro) |
| `#C0C0C0` (fg) | `text-foreground` | `--foreground` | `168 37% 15%` (teal) | `0 0% 90%` (off-white) |
| `#0A1F2F` (CTA) | `bg-primary` | `--primary` | `168 37% 17%` (teal) | `168 30% 25%` (teal) |
| `#080808` (OG image) | hex fixo `#1B3B34` | (não aplicável) | — | — (alinhado com `public/manifest.json:theme_color`) |

OG image precisa de hex absoluto porque `next/og` `ImageResponse` não resolve CSS vars (roda em edge serverless).

### A3 — Mapeamento de fontes

| Runbook original | Realidade no produto | Decisão |
|---|---|---|
| Syne (display) | Syne (já carregada em `app/layout.tsx`) | Manter |
| Cormorant Garamond Italic (editorial) | (não carregada) | Adicionar **apenas** se primeira página-pilar de Reforma Tributária pedir pull quote. Decorativa, nunca body |
| Inter (body) | (não carregada) | **Não adicionar.** Manrope cumpre função |
| — | Manrope (já carregada) | Usar como body |

### A4 — Pagamento na copy

Copy publica **NUNCA** cita gateway por nome. Use termos genéricos: "cartão de crédito", "checkout seguro", "pagamento online", "ativar plano".

Gateway atual em produção é Hotmart (webhook em Edge Function), mas pode mudar. Desacoplar copy do gateway evita retrabalho.

### A5 — Home `/`

Substituir [app/page.tsx](app/page.tsx) atual (que renderiza `SinglePricePage` com `ssr: false`) pela nova home SEO quando chegar o prompt 08. `SinglePricePage` continua em `/preco-triade` (já existe lá, confirmar antes do prompt 09).

### A6 — `/preco-triade` vs `/precos`

Coexistem após o runbook:

- `/precos` — criada no prompt 09. Página SEO canônica para a keyword "precos numa". Server Component, JSON-LD `Product`, copy completa.
- `/preco-triade` — continua como LP de campanha (`SinglePricePage` atual com `ssr: false`). Fora do escopo SEO; permanece intocada.

### A7 — `robots.txt` e `manifest.json` atuais

Existem em `public/robots.txt` e `public/manifest.json` como arquivos estáticos. **Substituir por `app/robots.ts` e `app/manifest.ts` dinâmicos** nos prompts 02 e 03 respectivamente. Após a substituição, **apagar os estáticos** para evitar conflito (`app/robots.ts` ganha precedência mas é mais limpo).

Observações:

- `public/robots.txt` atual **não permite explicitamente crawlers de IA** (GPTBot, ClaudeBot, Perplexity, etc.) — corrigir no prompt 02.
- `public/manifest.json` tem `theme_color: #1B3B34` — manter no novo `app/manifest.ts` (consistente com decisão A2; não usar `#080808` do runbook original).

### A8 — Toolchain (package manager + scripts)

| Decisão | Valor |
|---|---|
| Package manager | **npm** (root usa npm, não pnpm — `package-lock.json` é a fonte de verdade) |
| Comandos válidos | `npm run dev`, `npm run build`, `npm run type-check`, `npm run lint`, `npm run test`, `npm run quality` |
| Quality gate (pre-commit) | husky roda `npx lint-staged` (só dispara em `src/**/*.{ts,tsx}`) |
| TS check antes de push | `npx tsc --noEmit` (NB: erros pré-existentes em `src/lib/__tests__/handleError.test.ts` e `src/lib/__tests__/routes.test.ts` são legacy, ignorar se não foram introduzidos pelas mudanças SEO) |
| Build mobile | `npm run build:mobile` (`cross-env NEXT_STATIC_EXPORT=true next build`) — verificar antes do push de toda fase |

### A9 — Rotas existentes vs criar

| Rota | Existe? | Ação do runbook |
|---|---|---|
| `/` | sim (client-only) | substituir no prompt 08 (Server Component) |
| `/precos` | não | criar no prompt 09 |
| `/preco-triade` | sim (LP campanha) | manter, fora do escopo |
| `/lp/*` | sim (LP) | manter, fora do escopo |
| `/auth`, `/esqueci-senha`, `/redefinir-senha` | sim | manter, fora do escopo |
| `/termos`, `/privacidade`, `/lgpd` | sim (client-only) | NÃO refatorar (fora do escopo); incluir no sitemap |
| `/onboarding`, `/ativar-conta`, `/aceitar-convite` | sim | manter, fora do escopo |
| `/pagamento/sucesso`, `/plano-expirado` | sim | excluir do sitemap (já noindex implícito) |
| `/para-medicos`, `/para-dentistas`, `/para-nutricionistas`, `/para-psicologos`, `/para-advogados` | não | criar nos prompts 16-20 |
| `/alternativa-nibo`, `/alternativa-contaazul`, `/alternativa-omie`, `/alternativa-xfin` | não | criar nos prompts 10/11/12/28/29/30 |
| `/xfin-vs-numa`, `/migrar-do-xfin`, `/para-contadores`, `/para-bpo-financeiro` | não | criar nos prompts 11/12/13/14 |
| `/reforma-tributaria` + sub-rotas | não | criar nos prompts 21-27 |
| `/blog` | não | criar no prompt 33 |

### A10 — Divergências entre runbook e produto (resolvidas)

Documentadas em `.seo/numa-seo-cascata/context/01_decisoes_pre_tomadas.md` via 7 commits acima. Resumo:

| # | Runbook original | Realidade Numa | Decisão |
|---|---|---|---|
| 1 | Next 14 + React 18 | Next 16 + React 19 | usar Next 16 (T1 atualizado) |
| 2 | Clerk | Supabase Auth | usar Supabase (T16 adicionado) |
| 3 | Prisma | Supabase direto | sem Prisma (T17 adicionado) |
| 4 | Stripe (N7) | Hotmart (atual) | copy não cita gateway (N7 reescrito) |
| 5 | `#080808`/`#C0C0C0`/`#0A1F2F` | tokens HSL teal | usar tokens semânticos (V1-V3 + S9 + V9 reescritos) |
| 6 | Syne + Cormorant + Inter | Syne + Manrope | manter Syne + Manrope (T4 + V4-V6 reescritos) |
| 7 | — | Capacitor mobile build | toda rota tem que funcionar nos 2 builds (T18 adicionado) |

---

## Decisões de runtime

- **Working directory padrão**: raiz do repo (`c:\Users\cmbso\OneDrive\Pictures\LIBERTECH\BUMA\projects\Numa\`). Comandos npm assumem cwd aqui.
- **Branch ativa**: `feature/seo-publico`.
- **Push policy**: pushes pra `origin/feature/seo-publico` permitidos a qualquer momento; pushes pra `main` proibidos até review humano.
- **Husky**: pre-commit OK (lint-staged não acha staged matches em `.seo/`). post-checkout dá warning não-fatal (`cannot spawn .husky/_/post-checkout`) — provável bug Windows/sh, não bloqueia.
- **Erros tsc pré-existentes**: `src/lib/__tests__/handleError.test.ts` e `routes.test.ts` têm erros TS legacy não relacionados ao SEO. Ignorar até que se mostre que minhas mudanças introduziram erro novo.
- **Encoding**: arquivos `.md` em LF; git converte para CRLF no working copy (warning benigno).

---

## Marcos de revisão humana (do INDEX.md)

- Após prompt 06 (fim fase 0): valida Lighthouse Mobile SEO ≥ 95
- Após prompt 14 (fim fase 1): revisão de copy comercial
- Antes do prompt 21 (início fase 3): confirma NFS-e funcional
- Após prompt 27 (fim fase 3): valida calculadora com Thiago Flores
- Após prompt 30 (fim fase 4): revisão jurídica leve das comparativas

---

## Como atualizar este arquivo

Após cada prompt concluído:

1. Adicionar linha na tabela "Concluídos" com `# prompt`, descrição curta, commit hash, data
2. Atualizar "Prompt atual" para o próximo
3. Se algo desviou, documentar em "Decisões de runtime" com data
4. Se escalou, mover para "Falhados / Escalados" com motivo

Nunca reescrever entradas antigas. Adicionar entradas novas.
