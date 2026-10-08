# CRM Domain Context

## Responsibility
Manages relationships with external entities (Customers and Suppliers).

## Bounded Contexts
1.  **Customers**: Entities that pay us (linked to Receivables).
2.  **Suppliers**: Entities we pay (linked to Payables).

## Key Decisions
-   **Shared Identity**: A single database entity `entities` could be used, but we currently separate `customers` and `suppliers` tables for strict typing.
-   **Soft Delete**: Entities are never truly deleted, only marked `active: false`.
