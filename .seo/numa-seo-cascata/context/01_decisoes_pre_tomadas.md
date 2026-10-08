# 01 · Decisões Pré-Tomadas

**Fonte da verdade absoluta.** Toda decisão listada aqui é definitiva. O agente NUNCA contradiz nem pede confirmação sobre nada que esteja listado. Se aparecer um conflito, esta lista vence.

---

## Negócio e produto

| # | Decisão | Valor |
|---|---|---|
| N1 | Nome do produto | **Numa** |
| N2 | Tagline canônica | **Gestão financeira para contadores e profissionais liberais brasileiros** |
| N3 | Tagline curta (≤ 6 palavras) | **Financeiro descomplicado. Sem retrabalho.** |
| N4 | Plano único de lançamento | **R$ 197/mês** |
| N5 | Período de trial | **3 dias** (mantido até A/B test no mês 6) |
| N6 | Trial pede cartão? | **NÃO no lançamento** — usuário entra sem cartão, paga na expiração via Stripe Checkout |
| N7 | Pagamento | Gateway atual é **Hotmart**. Copy publica do site NUNCA cita o gateway por nome. Use termos genéricos: "cartão de crédito", "checkout seguro", "pagamento online". Gateway pode mudar (Hotmart → Stripe → outro) sem alterar copy |
| N8 | Emissão de NFS-e | **eNotas** (https://enotass.com.br) — R$137/mês, 2.000+ prefeituras |
| N9 | Garantia/reembolso | **7 dias após primeira cobrança** |
| N10 | Fidelidade | **Sem fidelidade**. Cancelamento end-of-period |
| N11 | Limite de CNPJs no plano | **Ilimitado** (diferencial competitivo vs Nibo) |
| N12 | Limite de usuários do escritório | **Ilimitado** |
| N13 | Domínio canônico | **`numagestaofinanceira.com`** (apex, sem www) |
| N14 | Redirect www → apex | Sim, 301 |
| N15 | HTTPS obrigatório | Sim, HSTS habilitado |

## SEO e arquitetura de URLs

| # | Decisão | Valor |
|---|---|---|
| S1 | Idioma do site | **PT-BR puro** (não multilíngue no MVP) |
| S2 | Estrutura de URL | **Plana, sem prefixos**. Ex: `/precos`, não `/pt-br/precos` |
| S3 | Slugs | **Português, sem acentos, sem stopwords**. Ex: `/para-medicos`, não `/para-os-medicos` |
| S4 | Subdomínio para blog | **Não.** Blog mora em `/blog/[slug]`, não `blog.numagestaofinanceira.com` |
| S5 | Subdomínio para calculadora | **Não.** Calculadora mora em `/reforma-tributaria/calculadora-impacto`, não `calc.numagestaofinanceira.com` |
| S6 | Trailing slash | **Sem** (consistente em todo o site) |
| S7 | Permitir crawlers IA | **Sim, explicitamente**: GPTBot, ClaudeBot, PerplexityBot, Google-Extended, anthropic-ai, Bingbot |
| S8 | Robots em `/dashboard/`, `/inicio/`, `/plano-expirado/` | **Disallow** |
| S9 | OG Image padrão | 1200×630, fundo `#1B3B34` (teal escuro — alinhado com `public/manifest.json:theme_color` do produto), logo Numa + tagline N2. Hex absoluto exigido porque `next/og` ImageResponse não resolve CSS vars |
| S10 | Favicon | SVG + PNG 512×512 |

## Stack técnico

| # | Decisão | Valor |
|---|---|---|
| T1 | Framework | **Next.js 16 (App Router) + React 19** (não Next 14 / React 18 como o runbook original assumia). App Router é estável e API é a mesma; Metadata API, `sitemap.ts`, `robots.ts`, `manifest.ts`, `next/font`, `next/image`, `next/og` ImageResponse — tudo funciona idêntico ou melhor |
| T2 | Style | **Tailwind CSS** com brand tokens (ver `02_brand_voice.md`) |
| T3 | UI components | **shadcn/ui** quando aplicável |
| T4 | Fonts | **Syne** (display, headings) e **Manrope** (body, UI). Ambas já carregadas em `app/layout.tsx` via `next/font/google`. Cormorant Garamond italic OPCIONAL e exclusivamente decorativo (pull quotes editoriais em páginas-pilar — Reforma Tributária); nunca para body. Inter NÃO adicionar (Manrope cumpre função body) |
| T5 | Imagens | **`next/image`** sempre. Formato preferido: AVIF → WebP fallback |
| T6 | Analytics | **PostHog EU cloud** (`eu.i.posthog.com`) com reverse proxy `/ingest` |
| T7 | Web Vitals | **Vercel Speed Insights** (grátis no plano Pro que já temos) |
| T8 | Heatmap | **Microsoft Clarity** (grátis, ilimitado) |
| T9 | Não usar | Google Analytics 4, Mixpanel, Hotjar |
| T10 | Reverse proxy PostHog | `/ingest/*` → `https://eu.i.posthog.com/*` via `next.config.js` rewrites |
| T11 | Schema validation | Sempre antes de commit, via `https://validator.schema.org` (manual) ou em CI futuro |
| T12 | Build target | Node 20 LTS |
| T13 | Package manager | **pnpm** (preferencial). Fallback: npm |
| T14 | Linter | ESLint config Next.js padrão |
| T15 | Type check | `tsc --noEmit` |
| T16 | Auth | **Supabase Auth** (`@supabase/ssr` + `@supabase/supabase-js`). Runbook original assumia Clerk — repo Numa NUNCA usou Clerk. Não instalar Clerk |
| T17 | ORM / camada de dados | **Supabase direto** (PostgREST via `@supabase/supabase-js`). NÃO há Prisma. Schema mora em `supabase/migrations/`, RLS controla acesso. Não instalar Prisma |
| T18 | Build mobile (Capacitor) | Repo Numa tem dual-build em `next.config.ts`: `next build` (SSR/Vercel) **vs** `NEXT_STATIC_EXPORT=true next build` (static export para iOS/Android via Capacitor). **Features SSR-only do SEO (Metadata dinâmico server-side, OG ImageResponse, `sitemap.ts`/`robots.ts` dinâmicos) rodam APENAS no build web Vercel**. Build mobile usa export estático — rotas SEO não são servidas no app. Toda rota nova precisa funcionar nos dois modos (não quebrar build mobile) |

## Conteúdo e copy

| # | Decisão | Valor |
|---|---|---|
| C1 | Voz | **Editorial, direta, sem hedging** (ver `02_brand_voice.md`) |
| C2 | Emoji | **Nunca** em nenhuma página pública |
| C3 | Pontos de exclamação | **Evitar** salvo em CTAs onde for natural |
| C4 | Capitalização de títulos | **Sentence case**. Ex: "Gestão financeira para médicos", não "Gestão Financeira Para Médicos" |
| C5 | "Você" ou "Senhor"? | **Você** sempre. Informal mas profissional |
| C6 | Comparativos nominais (Nibo, ContaAzul) | **Permitidos** desde que afirmações sejam demonstráveis (CDC art. 37) |
| C7 | Depoimentos | Foto + nome real + cargo + escritório/empresa. **Nunca** falsos |
| C8 | Aggregate ratings em schema | **Nunca sem reviews verificáveis** publicamente |
| C9 | Idioma de conteúdo técnico | PT-BR. Termos consagrados (BPO, DRE, NFS-e, Open Finance) sem tradução |
| C10 | Tamanho mínimo de página SEO útil | **800 palavras** de conteúdo real (não header/footer) |
| C11 | Tamanho de página pilar | **6.000-10.000 palavras** |

## Brand visual

| # | Decisão | Valor |
|---|---|---|
| V1 | Background principal | Token `bg-background` (HSL CSS var `--background`). Light: `40 15% 94%` (off-white); Dark: `168 37% 8%` (teal escuro). Runbook original especificava `#080808` preto absoluto — REJEITADO em favor dos tokens existentes do produto (mantém consistência visual). Mapeamento em `STATE.md` |
| V2 | Texto principal | Token `text-foreground` (HSL CSS var `--foreground`). Light: `168 37% 15%` (teal); Dark: `0 0% 90%` (off-white). Runbook original especificava `#C0C0C0` prata — REJEITADO |
| V3 | Accent / CTA | Token `bg-primary` (HSL CSS var `--primary`). Light: `168 37% 17%`; Dark: `168 30% 25%`. Runbook original especificava `#0A1F2F` midnight blue — REJEITADO |
| V4 | Display font | `Syne`, weights 400-800 (já carregadas no produto) |
| V5 | Editorial font (opcional) | `Cormorant Garamond Italic` weight 500 — APENAS em pull quotes editoriais de páginas-pilar. Carregar via `next/font/google` quando primeira página-pilar exigir |
| V6 | Body font | `Manrope`, weights 300-700 (já carregada no produto). NÃO usar Inter |
| V7 | Border radius padrão | `rounded-lg` (8px) |
| V8 | Sombras | Mínimas. Apenas em cards ou modais |
| V9 | Logo | Usar `public/numa-logo.png` (já alinhado com brand atual do produto). Não recriar; não impor cores específicas |
| V10 | OG card layout | Logo top-left, headline center, tagline bottom |

## Marca, legal e LGPD

| # | Decisão | Valor |
|---|---|---|
| L1 | Razão social | **L Energy Wizards LTDA** (CNPJ na Būma) |
| L2 | Endereço de footer | Endereço CE/Fortaleza da Būma |
| L3 | E-mail de privacidade | `privacidade@numagestaofinanceira.com` |
| L4 | E-mail de suporte | `suporte@numagestaofinanceira.com` |
| L5 | E-mail de from (Resend) | `Numa <ola@numagestaofinanceira.com>` |
| L6 | Termos de Uso | URL: `/termos`. Versão e `accepted_at` no signup |
| L7 | Política de Privacidade | URL: `/privacidade` |
| L8 | Cookies banner | Discreto, no rodapé. Apenas analytics (PostHog é cookie-free em modo default) |
| L9 | LGPD - operador | Numa é operador. Contador-cliente é controlador. Cláusula nos Termos |
| L10 | DPO | Não nomeado formalmente até crescer (≥ 5k usuários). Canal `privacidade@` atende |

## Comportamento do agente

| # | Decisão | Valor |
|---|---|---|
| A1 | Aprovação humana entre prompts | **Não pede.** Executa e segue |
| A2 | Aprovação humana entre fases | **Não pede.** Marca fase como concluída em STATE.md |
| A3 | Decisão de design não-coberta | **Decide e prossegue.** Documenta em STATE.md |
| A4 | Falta de imagem | **Gera placeholder SVG** ou usa `next/image` com `<svg>` inline |
| A5 | Copy precisa de redator B2B | **Escreve v1** decente, marca `{/* REVISAR_COPY */}`, segue |
| A6 | Lint warning | **Corrige** antes de commit |
| A7 | Build error | **Bloqueia commit.** Resolve até passar |
| A8 | Erro de schema validator | Schemas válidos sem campo opcional > schemas inválidos. Omita |
| A9 | Mensagem de commit | Padrão em CLAUDE.md, sempre referenciar prompt |
| A10 | Branch | `feature/seo-publico` para tudo |

---

## Decisões que NÃO foram tomadas e exigem escalação

- Mudança de preço (R$197)
- Mudança de duração de trial (3 dias)
- Adição de plano novo (sem isso, é plano único)
- Mudança de cor/tipografia brand
- Integração com serviço externo não-listado aqui (escala antes de instalar)
- Conteúdo que requer parecer técnico fiscal especializado (Reforma Tributária — pode escrever v1 SE a v1 estiver factualmente correta segundo Receita Federal; se incerto, marca `{/* REVISAR_FISCAL */}`)
