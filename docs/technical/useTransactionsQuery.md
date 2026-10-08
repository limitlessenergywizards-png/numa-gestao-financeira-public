# Alexandria Project: useTransactionsQuery

> **"O Carteiro Veloz."**

---

## 5W2H Matrix: The Essence

| Dimension | Description |
| :--- | :--- |
| **WHO** (Quem) | O nível mais baixo de acesso a dados. É consumido pelo `useTransactionsData` e puros componentes que precisam de acesso direto ao Cache. |
| **WHAT** (O Que) | Um conjunto de hooks (`useQuery` e `useMutation`) que envelopam as chamadas ao Supabase. Responsável por **Caching**, **Invalidação** e **Updates Otimistas**. |
| **WHY** (Por Que) | **Performance Percebida**. Quando o usuário deleta uma transação, ela desaparece da tela em 0ms (Otimista), mesmo que a internet leve 200ms para confirmar. Também garante que, ao alterar uma transação, o Saldo Bancário seja recalculado (Invalidação em Cascata). |
| **WHERE** (Onde) | Arquivo: `src/modules/finance/transactions/hooks/useTransactionsQuery.ts`. |
| **WHEN** (Quando) | Sempre que dados precisam ser lidos ou escritos. |
| **HOW** (Como) | Usa o TanStack Query.
*   **Queries**: `keepPreviousData` evita piscar a tela ao mudar de página.
*   **Mutations**: `onMutate` altera o cache manualmante antes do request sair. `onError` desfaz a alteração (Rollback visual). |
| **HOW MUCH** (Quanto) | **Cache Time**: `GC_TIMES.FINANCIAL` (Configurado globalmente). Evita requests duplicados se dois componentes pedirem a mesma transação. |

---

## Seção A: Manual de Operações (User Guide)

### 1. Entendendo a Camada de Dados
Este arquivo não contém lógica de negócio (validar valor, checar saldo). Ele contém lógica de **Sincronização**.
*   **Se você quer *regras***: Vá para `useTransactionsActions`.
*   **Se você quer *dados***: Vá para `useTransactionsData`.
*   **Se você quer *vazão*** (raw fetch): Use este arquivo.

### 2. Otimistic UI (A Mentira Benéfica)
Hooks como `useDeleteTransaction` mentem para o usuário.
1.  Usuário clica em "Deletar".
2.  Hook remove o item da lista (Cache) **imediatamente**.
3.  Usuário fica feliz ("Nossa, que rápido!").
4.  Hook envia o comando para o servidor em background.
    *   *Sucesso*: Tudo certo.
    *   *Erro*: O item reaparece magicamente e um Toast de erro é exibido.

---

## Seção B: A Engenharia Profunda (Technical Docs)

### 1. Server-Side Filtering
Diferente do `useTransactionsData` que filtra no cliente, este hook empurra o trabalho pesado para o Postgres:
```sql
.gte('transaction_date', filters.startDate)
.lte('transaction_date', filters.endDate)
.eq('is_deleted', false)
```
Isso garante que nunca baixamos 1 milhão de linhas. Baixamos apenas a "janela" de tempo necessária.

### 2. Dependency Graph (Invalidation Strategy)
A função `invalidateFinancialQueries` é o coração da consistência.
Ao criar/editar/deletar uma transação, invalidamos:
1.  `transactionsKeys`: A lista da tabela.
2.  `bankAccountsKeys`: O saldo lá no topo.
3.  `dashboardKeys`: Os gráficos da home.
4.  `dreKeys` & `cashFlowKeys`: Os relatórios gerenciais.

Isso garante que **nunca** teremos um relatório mostrando um saldo diferente da lista de transações. "Single Version of Truth".

### 3. Fetch em Paralelo
Exporta hooks auxiliares (`useBankAccountsForTransactions`, `useCustomersForTransactions`) que podem ser usados em paralelo.
*   *Nota*: Eles usam `STALE_TIMES.REFERENCE` (longo) porque nomes de bancos e clientes mudam pouco. Já transações usam `STALE_TIMES.FINANCIAL` (curto).

---

## Seção C: Arquitetura e Fluxo

```mermaid
graph TD
    UI[Component] -->|Call Mutation| Mut(useDeleteTransaction)
    
    Mut -->|1. Cancel Queries| QueryClient
    Mut -->|2. Set Cache (-1 Item)| QueryClient
    QueryClient -->|3. Re-render UI| UI
    
    Mut -->|4. DELETE Request| DB[(Supabase)]
    
    DB -- Success --> Inv[invalidateFinancialQueries]
    DB -- Error --> Rollback[Restore Previous Cache]
    
    Inv -->|Refetch All Related Data| QueryClient
```
