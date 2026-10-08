
-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create debts table
CREATE TABLE IF NOT EXISTS debts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Identificação
  name TEXT NOT NULL,
  description TEXT,
  
  -- Credor
  creditor_name TEXT NOT NULL,
  creditor_type TEXT CHECK (creditor_type IN (
    'banco',
    'financeira',
    'cartao_credito',
    'fornecedor',
    'governo',
    'socio',
    'outro'
  )),
  
  -- Tipo de dívida
  debt_type TEXT NOT NULL CHECK (debt_type IN (
    'parcelamento_price', 
    'emprestimo_juros_compostos',
    'cartao_credito_rotativo',
    'cheque_especial',
    'parcelamento_impostos',
    'fornecedor_atraso',
    'financiamento_imovel',
    'leasing',
    'outro'
  )),
  
  -- Valores
  original_amount NUMERIC(15, 2) NOT NULL,
  current_balance NUMERIC(15, 2) NOT NULL,
  paid_amount NUMERIC(15, 2) DEFAULT 0,
  
  -- Juros e taxas
  interest_rate NUMERIC(8, 4) NOT NULL,
  interest_period TEXT NOT NULL CHECK (interest_period IN ('mensal', 'anual', 'diario')),
  interest_type TEXT NOT NULL CHECK (interest_type IN ('simples', 'composto', 'price', 'sac')),
  
  -- Taxas adicionais
  setup_fee NUMERIC(15, 2) DEFAULT 0,
  monthly_fee NUMERIC(15, 2) DEFAULT 0,
  insurance_fee NUMERIC(15, 2) DEFAULT 0,
  
  -- Parcelamento
  total_installments INTEGER,
  paid_installments INTEGER DEFAULT 0,
  installment_amount NUMERIC(15, 2),
  
  -- Datas
  contract_date DATE NOT NULL,
  first_due_date DATE NOT NULL,
  last_due_date DATE,
  due_day INTEGER CHECK (due_day >= 1 AND due_day <= 31),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'active',
    'overdue',
    'renegotiated',
    'paid_off',
    'cancelled'
  )),
  
  -- Priorização
  priority_score INTEGER,
  is_priority BOOLEAN DEFAULT false,
  
  -- Categorização
  category_id UUID REFERENCES categories(id),
  tags TEXT[],
  
  -- Vinculação
  recurring_transaction_id UUID REFERENCES recurring_transactions(id),
  
  -- Documentação
  contract_url TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  
  -- Notas
  notes TEXT,
  renegotiation_notes TEXT,
  
  -- Calculado automaticamente
  total_interest_paid NUMERIC(15, 2) DEFAULT 0,
  total_interest_projected NUMERIC(15, 2),
  months_remaining INTEGER,
  payoff_date DATE,
  
  -- Simulações
  early_payoff_discount NUMERIC(5, 2),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  paid_off_at TIMESTAMPTZ,
  
  -- Histórico
  change_log JSONB DEFAULT '[]'::jsonb
);

-- Indexes for debts
CREATE INDEX IF NOT EXISTS idx_debts_company ON debts(company_id);
CREATE INDEX IF NOT EXISTS idx_debts_status ON debts(status);
CREATE INDEX IF NOT EXISTS idx_debts_creditor_type ON debts(creditor_type);
CREATE INDEX IF NOT EXISTS idx_debts_priority ON debts(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_debts_due_day ON debts(due_day);

-- Create debt_payments table
CREATE TABLE IF NOT EXISTS debt_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  debt_id UUID NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Vínculo com transaction
  transaction_id UUID REFERENCES transactions(id),
  
  -- Dados do pagamento
  payment_date DATE NOT NULL,
  due_date DATE NOT NULL,
  
  -- Valores
  installment_number INTEGER,
  principal_amount NUMERIC(15, 2) NOT NULL,
  interest_amount NUMERIC(15, 2) NOT NULL,
  fees_amount NUMERIC(15, 2) DEFAULT 0,
  total_amount NUMERIC(15, 2) NOT NULL,
  
  -- Status
  is_late BOOLEAN DEFAULT false,
  late_days INTEGER DEFAULT 0,
  late_fee NUMERIC(15, 2) DEFAULT 0,
  
  -- Balanço após pagamento
  balance_after NUMERIC(15, 2) NOT NULL,
  
  -- Metadata
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for debt_payments
CREATE INDEX IF NOT EXISTS idx_debt_payments_debt ON debt_payments(debt_id);
CREATE INDEX IF NOT EXISTS idx_debt_payments_date ON debt_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_debt_payments_transaction ON debt_payments(transaction_id);

-- Create debt_payoff_plans table
CREATE TABLE IF NOT EXISTS debt_payoff_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Identificação
  name TEXT NOT NULL,
  description TEXT,
  
  -- Estratégia
  strategy TEXT NOT NULL CHECK (strategy IN ('avalanche', 'snowball', 'hybrid', 'custom')),
  
  -- Parâmetros
  monthly_payment NUMERIC(15, 2) NOT NULL,
  start_date DATE NOT NULL,
  
  -- Dívidas incluídas e ordem
  debts_order JSONB NOT NULL,
  
  -- Resultados calculados
  total_debt_amount NUMERIC(15, 2) NOT NULL,
  total_interest_projected NUMERIC(15, 2) NOT NULL,
  months_to_debt_free INTEGER NOT NULL,
  debt_free_date DATE NOT NULL,
  
  -- Comparação
  current_scenario_months INTEGER,
  months_saved INTEGER,
  interest_saved NUMERIC(15, 2),
  
  -- Timeline
  payment_schedule JSONB,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'abandoned')),
  
  -- Progresso
  progress_percentage NUMERIC(5, 2) DEFAULT 0,
  on_track BOOLEAN,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  activated_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Indexes for debt_payoff_plans
CREATE INDEX IF NOT EXISTS idx_payoff_plans_company ON debt_payoff_plans(company_id);
CREATE INDEX IF NOT EXISTS idx_payoff_plans_status ON debt_payoff_plans(status);

-- Updates types for TS (This comment is for manual reference, the actual types generation happens client side)
-- RLS Policies
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_payoff_plans ENABLE ROW LEVEL SECURITY;

-- Policies for debts
CREATE POLICY "Users can view debts from their company" ON debts
  FOR SELECT USING (company_id IN (SELECT id FROM companies WHERE id = debts.company_id));

CREATE POLICY "Users can insert debts for their company" ON debts
  FOR INSERT WITH CHECK (company_id IN (SELECT id FROM companies WHERE id = debts.company_id));

CREATE POLICY "Users can update debts for their company" ON debts
  FOR UPDATE USING (company_id IN (SELECT id FROM companies WHERE id = debts.company_id));

CREATE POLICY "Users can delete debts for their company" ON debts
  FOR DELETE USING (company_id IN (SELECT id FROM companies WHERE id = debts.company_id));

-- Policies for debt_payments
CREATE POLICY "Users can view debt_payments from their company" ON debt_payments
  FOR SELECT USING (company_id IN (SELECT id FROM companies WHERE id = debt_payments.company_id));

CREATE POLICY "Users can insert debt_payments for their company" ON debt_payments
  FOR INSERT WITH CHECK (company_id IN (SELECT id FROM companies WHERE id = debt_payments.company_id));

CREATE POLICY "Users can update debt_payments for their company" ON debt_payments
  FOR UPDATE USING (company_id IN (SELECT id FROM companies WHERE id = debt_payments.company_id));

CREATE POLICY "Users can delete debt_payments for their company" ON debt_payments
  FOR DELETE USING (company_id IN (SELECT id FROM companies WHERE id = debt_payments.company_id));

-- Policies for debt_payoff_plans
CREATE POLICY "Users can view debt_payoff_plans from their company" ON debt_payoff_plans
  FOR SELECT USING (company_id IN (SELECT id FROM companies WHERE id = debt_payoff_plans.company_id));

CREATE POLICY "Users can insert debt_payoff_plans for their company" ON debt_payoff_plans
  FOR INSERT WITH CHECK (company_id IN (SELECT id FROM companies WHERE id = debt_payoff_plans.company_id));

CREATE POLICY "Users can update debt_payoff_plans for their company" ON debt_payoff_plans
  FOR UPDATE USING (company_id IN (SELECT id FROM companies WHERE id = debt_payoff_plans.company_id));

CREATE POLICY "Users can delete debt_payoff_plans for their company" ON debt_payoff_plans
  FOR DELETE USING (company_id IN (SELECT id FROM companies WHERE id = debt_payoff_plans.company_id));
