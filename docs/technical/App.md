# Alexandria Project: App.tsx

> **"A Fundação do Edifício."**

---

## 5W2H Matrix: The Essence

| Dimension | Description |
| :--- | :--- |
| **WHO** (Quem) | O navegador. É o primeiro componente React montado após o `main.tsx`. |
| **WHAT** (O Que) | O **Root Component**. Ele não renderiza UI visível diretamente (apenas providers e layouts), mas configura todo o ambiente: Cache, Router, Temas, Autenticação e Gestão de Erros. |
| **WHY** (Por Que) | **Estabilidade & Performance**. Configura o `QueryClient` para ser "Offline-First", ativa o `LazyMotion` para reduzir o bundle size inicial e envolve tudo em `ErrorBoundaries` para que o app nunca quebre totalmente ("Tela Branca"). |
| **WHERE** (Onde) | Arquivo: `src/App.tsx`.<br>Origem: Chamado por `src/main.tsx`. |
| **WHEN** (Quando) | No milissegundo zero da inicialização do app. |
| **HOW** (Como) | Compõe diversos Higher-Order Components (HOCs) e Providers. Define estratégias de *retry* para falhas de rede e *persistence* para salvar dados no LocalStorage (evitando telas de loading desnecessárias ao recarregar a página). |
| **HOW MUCH** (Quanto) | **Peso**: Crítico. Qualquer erro aqui derruba o site inteiro. |

---

## Seção A: Manual de Operações (User Guide)

### 1. Offline-First Strategy
O App é configurado para funcionar mesmo se a internet oscilar.
*   `networkMode: 'offlineFirst'`: Se a conexão cair, o app não exibe erro imediatamente; ele mostra os dados do cache e tenta reconectar silenciosamente.
*   **Persistência**: Dados vitais (como a lista de transações recentes) são salvos no `localStorage`. Se o usuário fechar a aba e voltar amanhã, o app abre instantaneamente com os dados de ontem enquanto baixa os novos.

### 2. Smooth Scrolling
O componente `<SmoothScroll>` envolve todo o conteúdo.
*   Ele intercepta o scroll nativo do navegador e aplica uma física suave (amortecimento).
*   Isso dá ao app uma sensação "App Nativo/iOS", eliminando a rolagem travada típica da web.

### 3. Motion Optimization
Ao invés de carregar a biblioteca de animação inteira (`framer-motion`) de uma vez (~30kb), usamos `<LazyMotion features={loadFeatures}>`.
*   As animações complexas só são baixadas quando necessárias.
*   Isso melhora drasticamente o **LCP** (Largest Contentful Paint) no Google Lighthouse.

---

## Seção B: A Engenharia Profunda (Technical Docs)

### 1. Query Client Configuration
O `new QueryClient()` não é padrão. Ele foi tunado para resiliência:
*   **Retry Logic**: Ignora erros 4xx (Client Error) pois retentar não vai consertar (ex: "Sem Permissão"). Mas retenta erros 5xx (Server Error) ou falhas de rede.
*   **Exponential Backoff**: Se falhar, espera 1s, depois 2s, depois 4s... até 10s. Isso evita bombardear o servidor (DDoS acidental).
*   **GC Time / Stale Time**: Configurados via `CACHE` constants para equilibrar frescor de dados vs performance.

### 2. Cache Clearing Strategy
O componente `<CacheClearOnLogout />` é um **Observer**.
*   Ele vigia o estado `user`.
*   Se `user` mudar para `null` (Logout), ele executa `clearQueryCache()`.
*   *Motivo*: Segurança. Garante que se eu sair e outra pessoa entrar no mesmo PC, ela não verá meus dados em cache (Flash of ghost content).

### 3. Provider Composition
Para evitar o "Pyramid of Doom" (Providers aninhados infinitamente), usamos o componente `<AppProviders>`.
*   Ele agrupa `ThemeProvider`, `AuthProvider`, `CompanyContext`, `TooltipProvider`, etc.
*   Isso mantém o `App.tsx` limpo e legível.

---

## Seção C: Arquitetura e Fluxo

```mermaid
graph TD
    Browser -->|Load| Main[main.tsx]
    Main --> App[App.tsx]
    
    subgraph "Provider Shell"
        App --> Query[QueryClientProvider]
        Query --> Persister[PersistQueryClientProvider]
        Persister --> Smooth[SmoothScroll]
        Smooth --> Motion[LazyMotion]
    end
    
    Motion -->|Authentication| Auth[CacheClearOnLogout]
    Motion -->|Safety| Boundary[LazyLoadErrorBoundary]
    
    Boundary -->|Hydration| Suspense
    Suspense -->|Routing| Routes[AppRoutes]
    
    Routes --> Modules[Pages (Login, Dashboard, DRE...)]
```
