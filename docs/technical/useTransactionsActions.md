# Alexandria Project: useTransactionsActions

> **"O Executor de Negócios."**

---

## 5W2H Matrix: The Essence

| Dimension | Description |
| :--- | :--- |
| **WHO** (Quem) | O "Braço Direito" do `TransactionDialogs`. Enquanto o Dialog cuida da UI, este hook cuida da lógica de escrita no banco. |
| **WHAT** (O Que) | Um **Hook de Ações** que centraliza todas as mutações: Criar, Editar, Excluir, Conciliar, Estornar e Converter Previsão. Ele implementa padrões de **Saga (Client-Side)** para garantir consistência entre Transações e Contas a Pagar/Receber. |
| **WHY** (Por Que) | **Regras de Negócio Complexas**. Criar uma transação não é apenas um `INSERT`. É preciso verificar se é recorrente, se gerou dívida, se precisa criar um contas a pagar vinculado e se o valor é válido. |
| **WHERE** (Onde) | Arquivo: `src/modules/finance/transactions/hooks/useTransactionsActions.ts`. |
| **WHEN** (Quando) | No momento do "Submit". |
| **HOW** (Como) | Implementa uma lógica de **Transação Distribuída Manual**: 1. Valida dados. 2. Insere Transação. 3. Insere Recobrimento (Payable/Receivable). 4. Se falhar, faz **Rollback Manual** (Soft Delete da Transação órfã). |
| **HOW MUCH** (Quanto) | **Risco**: Alto. A consistência depende da internet do usuário não cair entre o passo 2 e 3. (Nota: Existe uma migration de Procedure ACID no banco, mas este hook ainda usa a lógica Legacy/Híbrida para criação padrão). |

---

## Seção A: Manual de Operações (User Guide)

### 1. Criando Transações (The Happy Path)
```typescript
const { createTransaction, isSaving } = useTransactionsActions();

await createTransaction({
  amount: "500,00",
  description: "Consultoria",
  type: "entrada",
  nature: "realizado",
  customer_id: "uuid-..." 
});
```

### 2. Funcionalidades Especiais
*   **Conversão de Previsão**: Transforma uma ideia ("Acho que vou ganhar 5k") em realidade ("Ganhei 4.8k"). Calcula automaticamente o **Desvio** (Ex: -4%) e atualiza os relatórios de orçado vs realizado.
*   **Estorno (Reversal)**: Ao invés de apagar uma transação errada (o que é proibido na contabilidade séria), cria uma transação espelho com valor negativo.

### 3. Validações de Segurança
*   **Conciliação Bloqueada**: Se você tentar editar uma transação que já tem `reconciled: true`, o hook rejeita e sugere Estorno.
*   **Data Sensível**: Se você tentar mudar a data de uma transação em mais de 7 dias, ele pausa e pede uma confirmação extra ("Tem certeza que quer mover isso para outra semana?").

---

## Seção B: A Engenharia Profunda (Technical Docs)

### 1. Client-Side Atomicity (The Saga Pattern)
O hook enfrenta o desafio de escrever em duas tabelas (`transactions` e `payables`) sem usar uma única query SQL (na criação padrão).
*   **Estratégia**:
    1.  `INSERT transaction` -> Recebe o ID.
    2.  `INSERT payable` (com o ID da transação).
    3.  **Catch Error**: Se o passo 2 falhar, dispara `UPDATE transaction SET is_deleted=true`.
    *   *Feynman*: É como comprar um ingresso de cinema e pipoca. Se você comprar o ingresso (Transação) mas a pipoca (Payable) acabar na hora, você devolve o ingresso e vai embora. Não fica com um "ingresso órfão" sem pipoca.

### 2. Recorrência Engine
Se `recurrenceConfig` estiver presente, o hook não cria uma transação simples.
*   Ele delega para `recurringEngine.materializeOccurrences`.
*   Isso calcula as datas futuras (ex: toda dia 5 por 12 meses) e insere na tabela `recurring_transactions`.

### 3. Integração com Dívidas
Se `debtPayment: true`, o hook realiza uma **Triangulação**:
1.  Cria a Transação (Saída de Caixa).
2.  Cria o Registro em `debt_payments` (Vinculo).
3.  Atualiza o Saldo da Dívida (`debts.current_balance -= amount`).

---

## Seção C: Arquitetura e Fluxo

```mermaid
graph TD
    UI[Dialog] -->|Form Data| Action(createTransaction)
    
    Action -->|Validations| Valid{OK?}
    Valid -- No --> Toast[Error Message]
    
    Valid -- Yes --> InsertTx[INSERT Transaction]
    
    InsertTx -- Success --> CheckNature{Realizado?}
    
    CheckNature -- Yes --> InsertAux[INSERT Payable/Receivable]
    CheckNature -- No --> Success
    
    InsertAux -- Error --> Rollback[DELETE Transaction (Soft)]
    InsertAux -- Success --> Invalidate[Refetch Queries]
    
    Rollback --> Toast
```
