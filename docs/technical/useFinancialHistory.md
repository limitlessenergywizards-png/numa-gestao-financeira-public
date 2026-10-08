# Alexandria Project: useFinancialHistory

> **"Um código sem documentação é um código morto."**

---

## 5W2H Matrix: The Essence

| Dimension | Description |
| :--- | :--- |
| **WHO** (Quem) | Utilizado primariamente pelo **Dashboard Financeiro** (`DashboardPage.tsx`). O consumidor final é o **Gestor/Admin** que visualiza a saúde financeira da empresa. |
| **WHAT** (O Que) | Um **Hook React** (`useFinancialHistory`) que busca, filtra e agrega as transações financeiras dos últimos 6 meses. Retorna um array ordenado pronto para consumo em gráficos. |
| **WHY** (Por Que) | Permitir a visualização de **Tendências de Fluxo de Caixa**. Números isolados não contam histórias; a evolução semestral revela sazonalidade, crescimento ou declínio. |
| **WHERE** (Onde) | Arquivo: `src/modules/analytics/dashboard/hooks/useFinancialHistory.ts`.<br>UI: Widget "Receitas e despesas do semestre" no Dashboard. |
| **WHEN** (Quando) | Disparado automaticamente ao **carregar o Dashboard** ou quando a **Empresa Selecionada** muda. O cache mantém os dados frescos por 5 minutos. |
| **HOW** (Como) | O Hook calcula um intervalo de datas (Hoje - 5 meses), consulta o banco de dados (Supabase) por transações *realizadas* e *não deletadas*, e então realiza uma **agregação client-side** para somar entradas e saídas mês a mês, preenchendo lacunas com zeros. |
| **HOW MUCH** (Quanto) | **Custo Computacional**: Baixo (O(N) onde N = transações do semestre). Agregação no cliente poupa CPU do banco.<br>**Custo de API**: 1 Request via `supabase-js`. |

---

## Seção A: Manual de Operações (User Guide)

### 1. Como Usar (The Happy Path)
Para integrar este hook em um componente:

```typescript
import { useFinancialHistory } from "./hooks/useFinancialHistory";

// Dentro do seu componente:
const { data: chartData, isLoading } = useFinancialHistory(companyId);

// chartData agora é um array ordenado:
// [
//   { month: "Jan", fullDate: "2023-01", receitas: 5000, despesas: 2000 },
//   ...
// ]
```

### 2. Como NÃO Usar (The Danger Zone)
*   **Não use para Balancete Contábil**: Este hook foca em *visibilidade* e *tendência*. Ele ignora transações deletadas (`soft delete`), mas a agregação no cliente pode divergir de relatórios contábeis complexos que consideram estornos parciais ou lógica fiscal avançada.
*   **Não assuma "Previsão"**: Este hook filtra estritamente por `nature = 'realizado'`. Boletos futuros ou previsões orçamentárias **não** aparecem aqui.

### 3. KPIs & Fórmulas
A mágica matemática é simples, mas vital.

$$
\text{Receitas}_{\text{mês}} = \sum (\text{amount}) \text{ onde } \text{type} = \text{'entrada'} \land \text{nature} = \text{'realizado'}
$$

$$
\text{Despesas}_{\text{mês}} = \sum (\text{amount}) \text{ onde } \text{type} = \text{'saida'} \land \text{nature} = \text{'realizado'}
$$

---

## Seção B: A Engenharia Profunda (Technical Docs)

### 1. Hooks & State (Ciclo de Vida)
O hook utiliza **TanStack Query** (`useQuery`) para gerenciar o estado assíncrono.
*   **Cache Strategy**: `staleTime: 5 * 60 * 1000` (5 minutos).
    *   *Analogia Feynman*: O Hook é como um fotógrafo. Ele tira uma foto do banco de dados. Se você pedir a foto novamente em menos de 5 minutos, ele te mostra a mesma foto (cache) instantaneamente. Se passar de 5 minutos, ele tira uma nova para garantir que nada mudou.

### 2. Database Interactions (O Porteiro e o Cofre)
O hook conversa diretamente com a tabela `public.transactions` no Supabase.

**Query Breakdown:**
1.  **Security Guards**:
    *   `eq("company_id", companyId)`: Garante o isolamento entre inquilinos (Multi-tenancy).
    *   `eq("is_deleted", false)`: Respeita o *Soft Delete* (O arquivo "lixeira" é ignorado).
2.  **Filter Logic**:
    *   `eq("nature", "realizado")`: Ignora sonhos (previsões) e foca na realidade (dinheiro no banco).
    *   `gte/lte("transaction_date")`: Recorta a precisão temporal para o semestre exato.

### 3. Algoritmo de Agregação (The Gap Filler)
O banco de dados pode não retornar nada para um mês vazio (Ex: Nenhuma venda em Fevereiro). Se plotarmos isso direto, o gráfico fica "banguela" ou deslocado.

**Solução:**
1.  Criamos um "esqueleto" (Map) com os últimos 6 meses preenchidos com Zeros.
2.  Iteramos sobre as transações vindas do banco e "somamos" nos meses correspondentes.
3.  Resultado: Um array contínuo e confiável, mesmo que o mês tenha zero movimento.

---

## Seção C: Arquitetura e Fluxo

```mermaid
graph TD
    A[Dashboard UI] -->|Call Hook| B(useFinancialHistory)
    B -->|Check Cache| C{Cache Fresco?}
    C -- Sim --> A
    C -- Não --> D[Supabase Client]
    D -->|Select * from Transactions| E[(PostgreSQL)]
    E -->|JSON Data| D
    D -->|Raw List| B
    B -->|Aggregation Logic (Map & Reduce)| B
    B -->|Sorted Charts Data| A
```
