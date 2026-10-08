# Alexandria Project: DashboardPage

> **"O Palco onde a ópera financeira acontece."**

---

## 5W2H Matrix: The Essence

| Dimension | Description |
| :--- | :--- |
| **WHO** (Quem) | O ponto de entrada do **Usuário Logado**. É a primeira tela que o CEO/Gestor vê ao entrar no sistema. |
| **WHAT** (O Que) | A **Página Principal** (`/dashboard`) que orquestra todos os widgets (Gráficos, KPIs, Listas). Ela não busca dados diretamente; ela delega para hooks e apenas "monta" o LEGO visual. |
| **WHY** (Por Que) | **Centralização e Controle**. O usuário precisa de uma visão "Cockpit" (tudo em um lugar) para tomar decisões rápidas sem navegar por 10 menus diferentes. |
| **WHERE** (Onde) | Arquivo: `src/modules/analytics/dashboard/DashboardPage.tsx`.<br>Rota: `/dashboard` (Protegida por `AppLayout`). |
| **WHEN** (Quando) | Renderizado imediatamente após a autenticação bem-sucedida. |
| **HOW** (Como) | Combina 3 super-poderes: **Dados** (`useDashboardQueries`), **Layout Flexível** (`useDashboardLayout` com Drag & Drop) e **Histórico** (`useFinancialHistory`). Ele calcula derivadas locais (como "recebíveis do mês") e injeta propriedades nos widgets filhos. |
| **HOW MUCH** (Quanto) | **Custo de Renderização**: Médio (muitos componentes filhos). Utiliza `useMemo` agressivamente para evitar re-renders desnecessários quando o mouse mexe ou o timer roda. |

---

## Seção A: Manual de Operações (User Guide)

### 1. Como Usar (The Happy Path)
Ao acessar a página, o usuário vê:
1.  **Header**: Saudação personalizada e Seletor de Período (Dia, Semana, Mês, Ano).
2.  **Grid**: Widgets organizados (KPIs, Gráficos, Metas).
3.  **Ações Rápidas**: Botões "Receber" e "Pagar" (apenas para quem tem permissão `canEdit`).

O usuário pode **arrastar e soltar** os widgets para personalizar a ordem. Essa preferência é salva localmente ou no banco (via `useDashboardLayout`).

### 2. Como NÃO Usar (The Danger Zone)
*   **Não confie no "Hoje" do Servidor**: A página calcula datas (`today`, `monthStart`) baseada no horário do navegador do cliente. Se o PC do usuário estiver com a data errada, os filtros iniciais podem parecer estranhos.
*   **Mobile Limitations**: O Drag & Drop é otimizado para Desktop. Em Mobile, a ordem visual pode ser "linearizada" (empilhada) para caber na tela.

### 3. KPIs & Fórmulas (Client-Side Derivations)
Embora os dados venham do hook, a página refina alguns números no `useMemo`:

$$
\text{Saldo Atual} = \sum (\text{saldo de todas as contas bancárias ativas})
$$

$$
\text{Projeção de Recebíveis (Mês)} = \sum (\text{total\_amount}) \text{ onde } \text{vencimento} \in [\text{Início Mês}, \text{Fim Mês}]
$$

> *Nota*: Diferente do hook que soma tudo, aqui filtramos *no cliente* para reagir instantaneamente ao seletor de "Período" sem sempre refazer a query principal.

---

## Seção B: A Engenharia Profunda (Technical Docs)

### 1. Hooks & State (A Trindade)
A página é governada por três hooks principais que separam responsabilidades:
1.  `useDashboardLayout`: "O Decorador". Cuida de onde cada widget fica (posições X/Y, ordem).
2.  `useDashboardQueries`: "O Provedor". Traz os dados brutos do Supabase.
3.  `useFinancialHistory`: "O Historiador". Traz os dados de tendência para o gráfico.

*Analogia Feynman*:
*   **Queries** trazem a mobília (Sofá, TV).
*   **Layout** decide onde colocar (Sofá na parede, TV na frente).
*   **Page** é a sala vazia que recebe tudo isso e convida as pessoas (Widgets) para entrar.

### 2. Componentização (O Lego)
Para evitar um arquivo gigante, os widgets são definidos em um objeto `widgetComponents`.
Isso permite que o `DashboardGrid` apenas "peça" o widget pelo ID (`key`), sem saber o que tem dentro.
```tsx
const widgetComponents = {
  metrics: <GlassMetricCard ... />,
  chart: <GlassAreaChart ... />,
  // ...
};
```
Isso facilita adicionar novos widgets: crie o componente, adicione no objeto e no layout padrão. Zero impacto no resto da lógica.

### 3. Performance Guards
*   `useMemo` nos KPIs: Evita recalcular somas de arrays (que podem ter 1000+ itens) a cada render simples.
*   `Skeleton Loading`: Se `authLoading` ou `companyLoading` forem true, exibe um esqueleto elegante ao invés de uma tela branca ou "piscar" de dados.

---

## Seção C: Arquitetura e Fluxo

```mermaid
graph TD
    Auth[AuthContext] --> Page
    Company[CompanyContext] --> Page
    
    subgraph "Data Layer"
        Q[useDashboardQueries] --> Page
        H[useFinancialHistory] --> Page
    end
    
    subgraph "UI Layer"
        Page --> Header[Header & Filters]
        Page --> Grid[DashboardGrid (Drag & Drop)]
        
        Grid --> W1[Metrics Cards]
        Grid --> W2[Area Chart]
        Grid --> W3[Recent Transactions]
        Grid --> W4[Situation Card]
    end
    
    User -->|Change Period| Page
    Page -->|New DateRange| Q
    Q -->|Refetch Data| Page
```
