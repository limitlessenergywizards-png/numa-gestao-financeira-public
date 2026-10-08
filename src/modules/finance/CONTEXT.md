# Finance Domain Context

## Responsibility
Manages all financial transactions, including accounts payable, accounts receivable, bank accounts, and general ledger (DRE).

## Bounded Contexts
1.  **Payables**: Money leaving the company.
2.  **Receivables**: Money entering the company.
3.  **Transactions**: The atomic unit of money movement.
4.  **Treasury**: Bank accounts and reconciliation.
5.  **Ledger**: Chart of accounts and financial reports (DRE).

## Key Decisions
-   **Optimistic UI**: All CRUD operations in `payables` and `receivables` use optimistic updates.
-   **Virtualization**: Lists must be virtualized for performance (using `@tanstack/react-virtual`).
-   **Immutability**: Reconciled transactions cannot be edited, only reversed.
