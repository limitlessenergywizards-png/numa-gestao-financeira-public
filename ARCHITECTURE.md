# ARCHITECTURAL SINGULARITY: The Numa Manifesto

> "Chaos is not an option. Latency is the enemy. Structure is our weapon."

## 1. The Philosophy: Screaming Architecture
This project follows a strict **Domain-Driven Design (DDD)** approach utilizing **Screaming Architecture**. When you look at the root folder, it should scream **FINANCE MANAGEMENT**, not "React App".

### Core Principles
1.  **Fractal Structure**: Every module should look like a mini-application with its own Routes, Components, Hooks, and Services.
2.  **Unidirectional Data Flow**: UI -> Controller (Hook) -> Service (Logic) -> Repository (Supabase) -> Database.
3.  **Bounded Contexts**: A `Customer` in the `CRM` context is different from a `Payer` in the `Finance` context. Keep them decoupled.
4.  **Cohesion over DRY**: It is better to duplicate a small utility than to couple two unrelated domains.

---

## 2. The Tree of Life (Directory Structure)

The implementation uses a `src/modules` strategy to encapsulate domains.

```
/src
  /app                  # App-wide routing, providers, and global config
    /routes             # Centralized route definitions
    /providers          # Context providers (Theme, Auth, Query)
  
  /modules              # THE CORE - Separated by Bounded Contexts
    /finance            # Context: Financial Management
      /payables         # Sub-domain: Accounts Payable
        /components     # UI Components specific to Payables
        /hooks          # React Hooks (Controllers)
        /services       # Supabase interactions (Data Access)
        /types          # Domain Models & DTOs
        /routes.tsx     # Internal routing for this module
      /receivables      # Sub-domain: Accounts Receivable
      /treasury         # Sub-domain: Bank Accounts & Reconciliation
      /ledger           # Sub-domain: Chart of Accounts & DRE
    
    /crm                # Context: Customer Relationship Management
      /customers
      /suppliers
    
    /iam                # Context: Identity & Access Management
      /auth             # Authentication logic
      /users            # User management
      /companies        # Tenant management
    
    /analytics          # Context: BI & Reporting
      /dashboards
      /reports
    
    /subscription       # Context: Billing & Plans
      /plans
      /payments

  /shared               # True shared utilities (Use sparingly!)
    /ui                 # Design System (Shadcn/UI)
    /utils              # Pure functions (Date util, Currency util)
    /hooks              # Generic hooks (useDebounce, useClickOutside)
    /api                # Base Supabase Client
```

---

## 3. Data Flow Protocol

Every feature request must act through these layers:

1.  **Presentation (View)**: The React Layer. Dumb components that render data.
    *   *Rule*: No `useEffect` with data fetching logic here.
    *   *Rule*: Calls Hooks (`useCreatePayable`).

2.  **Application (Controller)**: The Custom Hook Layer.
    *   *Rule*: Orchestrates the flow. Handles `onSuccess`, `onError`, `Invalidation`.
    *   *Rule*: Uses `react-query` to manage client-state.

3.  **Domain (Service)**: The Business Logic Layer.
    *   *Rule*: Pure TypeScript functions. No React hooks here.
    *   *Rule*: Performs validation, data transformation, and calculations.
    *   *Example*: `calculateBreakevenPoint(data)`.

4.  **Infrastructure (Repository)**: The Data Access Layer.
    *   *Rule*: The ONLY place that calls `supabase`.
    *   *Rule*: Returns usage-agnostic types (DTOs).

---

## 4. Database Strategy (PostgreSQL + Supabase)

### Multi-Tenancy
*   **Strict Rule**: EVERY table must have `company_id`.
*   **RLS Policy**: Row-Level Security must be enabled and enforced on ALL tables.

### Performance
*   **Indexes**:
    *   `BTREE(company_id)` on ALL tables.
    *   `BTREE(company_id, created_at DESC)` for activity feeds.
    *   `GIN` on all `JSONB` columns (`audit_logs`).
*   **Types**:
    *   Use `DECIMAL(10,2)` for currency (Never `FLOAT`).
    *   Use `TIMESTAMPTZ` for dates.

---

## 5. Route Canonization

Routes must be resourceful and hierarchical.

*   **Bad**: `/customer-list`, `/add-transaction`
*   **Good**: 
    *   `/crm/customers` (List)
    *   `/crm/customers/new` (Create)
    *   `/finance/transactions` (List)
    *   `/finance/payables/:id` (Detail)

---

**This document is the law. Deviations require written justification.**
