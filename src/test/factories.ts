/**
 * Test Data Factories
 *
 * Factory functions returning valid objects with sensible defaults.
 * Override only the fields you care about in each test.
 */

let counter = 0;
function nextId(): string {
  counter++;
  return `00000000-0000-0000-0000-${String(counter).padStart(12, "0")}`;
}

export function resetFactoryCounter(): void {
  counter = 0;
}

// ============================================
// COMPANY
// ============================================

export function createCompany(overrides: Record<string, unknown> = {}) {
  return {
    id: nextId(),
    name: "Empresa Teste",
    trading_name: null,
    document: "12.345.678/0001-90",
    email: "contato@empresa.com",
    phone: null,
    address: null,
    city: null,
    state: null,
    zip_code: null,
    logo_url: null,
    currency: "BRL",
    currency_symbol: "R$",
    is_headquarters: true,
    parent_company_id: null,
    created_by: nextId(),
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================
// USER / PROFILE
// ============================================

export function createUser(overrides: Record<string, unknown> = {}) {
  const id = nextId();
  return {
    id,
    email: `user-${id.slice(-4)}@test.com`,
    app_metadata: {},
    user_metadata: { full_name: "Usuário Teste" },
    aud: "authenticated",
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createProfile(overrides: Record<string, unknown> = {}) {
  const userId = nextId();
  return {
    id: nextId(),
    user_id: userId,
    full_name: "Usuário Teste",
    avatar_url: null,
    phone: null,
    whatsapp_number: null,
    job_title: null,
    ...overrides,
  };
}

// ============================================
// BANK ACCOUNT
// ============================================

export function createBankAccount(overrides: Record<string, unknown> = {}) {
  return {
    id: nextId(),
    company_id: nextId(),
    name: "Conta Principal",
    bank_name: "Banco do Brasil",
    account_type: "corrente" as const,
    initial_balance: 1000,
    current_balance: 1000,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================
// SUPPLIER
// ============================================

export function createSupplier(overrides: Record<string, unknown> = {}) {
  return {
    id: nextId(),
    company_id: nextId(),
    name: "Fornecedor Teste",
    document: "12.345.678/0001-90",
    email: "fornecedor@test.com",
    phone: null,
    is_active: true,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================
// CUSTOMER
// ============================================

export function createCustomer(overrides: Record<string, unknown> = {}) {
  return {
    id: nextId(),
    company_id: nextId(),
    name: "Cliente Teste",
    document: null,
    email: "cliente@test.com",
    phone: null,
    is_active: true,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================
// CATEGORY
// ============================================

export function createCategory(overrides: Record<string, unknown> = {}) {
  return {
    id: nextId(),
    company_id: nextId(),
    name: "Categoria Teste",
    type: "despesa" as const,
    cost_type: "variavel" as const,
    color: "#4A90D9",
    icon: "tag",
    is_active: true,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================
// CHART OF ACCOUNTS
// ============================================

export function createChartAccount(overrides: Record<string, unknown> = {}) {
  return {
    id: nextId(),
    company_id: nextId(),
    code: "1.0",
    name: "Ativo",
    type: "ativo" as const,
    nature: "devedora",
    is_analytical: false,
    dre_category: null,
    parent_id: null,
    is_active: true,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================
// PAYABLE
// ============================================

export function createPayable(overrides: Record<string, unknown> = {}) {
  const companyId = nextId();
  return {
    id: nextId(),
    company_id: companyId,
    description: "Conta a Pagar Teste",
    total_amount: 500,
    paid_amount: 0,
    status: "pendente" as const,
    due_date: new Date().toISOString().split("T")[0],
    payment_date: null,
    supplier_id: null,
    category_id: null,
    bank_account_id: null,
    chart_account_id: null,
    boleto_number: null,
    notes: null,
    is_deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================
// RECEIVABLE
// ============================================

export function createReceivable(overrides: Record<string, unknown> = {}) {
  const companyId = nextId();
  return {
    id: nextId(),
    company_id: companyId,
    description: "Conta a Receber Teste",
    total_amount: 1000,
    paid_amount: 0,
    status: "pendente" as const,
    due_date: new Date().toISOString().split("T")[0],
    payment_date: null,
    customer_id: null,
    category_id: null,
    bank_account_id: null,
    chart_account_id: null,
    notes: null,
    is_deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================
// TRANSACTION
// ============================================

export function createTransaction(overrides: Record<string, unknown> = {}) {
  return {
    id: nextId(),
    company_id: nextId(),
    description: "Transacao Teste",
    amount: 100,
    type: "entrada" as const,
    transaction_date: new Date().toISOString().split("T")[0],
    bank_account_id: nextId(),
    category_id: null,
    supplier_id: null,
    customer_id: null,
    notes: null,
    is_forecast: false,
    forecast_basis: null,
    is_deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================
// PAYMENT RECORD
// ============================================

export function createPaymentRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: nextId(),
    company_id: nextId(),
    payable_id: null,
    receivable_id: null,
    bank_account_id: nextId(),
    amount: 100,
    payment_date: new Date().toISOString().split("T")[0],
    payment_method: "pix" as const,
    notes: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}
