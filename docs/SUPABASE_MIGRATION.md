# Guia de Migração Supabase - Numa

## Informações do Novo Projeto
- **Project ID**: `wqbbdortsqqglujgechi`
- **URL**: `https://wqbbdortsqqglujgechi.supabase.co`

---

## PASSO 1: Criar ENUMs (Execute primeiro!)

```sql
-- =============================================
-- ENUMS - Execute este bloco primeiro
-- =============================================

-- 1. app_role - Papéis de usuário
CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'viewer');

-- 2. account_entry_type - Tipos de conta no plano de contas
CREATE TYPE public.account_entry_type AS ENUM ('receita', 'despesa', 'custo');

-- 3. bank_account_type - Tipos de conta bancária
CREATE TYPE public.bank_account_type AS ENUM ('corrente', 'poupanca', 'investimento', 'caixa');

-- 4. payable_status - Status de contas a pagar
CREATE TYPE public.payable_status AS ENUM ('pendente', 'parcial', 'pago', 'cancelado');

-- 5. receivable_status - Status de contas a receber
CREATE TYPE public.receivable_status AS ENUM ('pendente', 'parcial', 'pago', 'cancelado');

-- 6. payment_method - Métodos de pagamento
CREATE TYPE public.payment_method AS ENUM ('dinheiro', 'pix', 'transferencia', 'boleto', 'cartao', 'cheque');

-- 7. transaction_type - Tipos de transação
CREATE TYPE public.transaction_type AS ENUM ('entrada', 'saida');
```

---

## PASSO 2: Criar Funções Auxiliares

```sql
-- =============================================
-- FUNÇÕES AUXILIARES - Execute segundo
-- =============================================

-- Função: has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Função: user_belongs_to_company
CREATE OR REPLACE FUNCTION public.user_belongs_to_company(_user_id UUID, _company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_companies
    WHERE user_id = _user_id
      AND company_id = _company_id
  )
$$;

-- Função: is_company_owner
CREATE OR REPLACE FUNCTION public.is_company_owner(_user_id UUID, _company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.companies
    WHERE id = _company_id
      AND created_by = _user_id
  )
$$;

-- Função: can_create_first_company
CREATE OR REPLACE FUNCTION public.can_create_first_company(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM public.user_companies
    WHERE user_id = _user_id
  )
$$;

-- Função: update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Função: set_company_created_by
CREATE OR REPLACE FUNCTION public.set_company_created_by()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.created_by := auth.uid();
  RETURN NEW;
END;
$$;
```

---

## PASSO 3: Criar Tabelas Base

```sql
-- =============================================
-- TABELAS BASE - Execute terceiro
-- =============================================

-- companies (central)
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  trading_name TEXT,
  document TEXT,
  email TEXT,
  phone TEXT,
  mobile_phone TEXT,
  address TEXT,
  number TEXT,
  complement TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  logo_url TEXT,
  currency TEXT NOT NULL DEFAULT 'BRL',
  currency_symbol TEXT NOT NULL DEFAULT 'R$',
  is_headquarters BOOLEAN NOT NULL DEFAULT false,
  parent_company_id UUID REFERENCES public.companies(id),
  created_by UUID DEFAULT auth.uid(),
  tax_regime TEXT DEFAULT 'simples_nacional',
  segment TEXT DEFAULT 'micro_empresa',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  job_title TEXT,
  trial_started_at TIMESTAMPTZ,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  total_xp INTEGER DEFAULT 0,
  guardian_level INTEGER DEFAULT 1,
  current_title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- user_roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- user_companies
CREATE TABLE public.user_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'viewer',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id)
);

-- subscriptions
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  plan_name TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'inactive',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- mrr_history
CREATE TABLE public.mrr_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recorded_date DATE NOT NULL,
  mrr NUMERIC NOT NULL DEFAULT 0,
  arr NUMERIC NOT NULL DEFAULT 0,
  total_subscribers INTEGER NOT NULL DEFAULT 0,
  active_trials INTEGER NOT NULL DEFAULT 0,
  churned_count INTEGER NOT NULL DEFAULT 0,
  new_subscribers INTEGER NOT NULL DEFAULT 0,
  plan_breakdown JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- weekly_challenges
CREATE TABLE public.weekly_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT NOT NULL DEFAULT 'financial',
  target_metric TEXT NOT NULL,
  target_value NUMERIC NOT NULL,
  reward_xp INTEGER DEFAULT 100,
  reward_badge TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## PASSO 4: Criar Tabelas com Dependências

```sql
-- =============================================
-- TABELAS COM DEPENDÊNCIAS - Execute quarto
-- =============================================

-- bank_accounts
CREATE TABLE public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bank_name TEXT,
  agency TEXT,
  account_number TEXT,
  account_type bank_account_type NOT NULL DEFAULT 'corrente',
  initial_balance NUMERIC NOT NULL DEFAULT 0,
  current_balance NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- customers
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  document TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- suppliers
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  document TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  notes TEXT,
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  type VARCHAR NOT NULL,
  icon VARCHAR DEFAULT 'tag',
  color VARCHAR DEFAULT '#6366f1',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- cost_centers
CREATE TABLE public.cost_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#C5A059',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- chart_of_accounts
CREATE TABLE public.chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.chart_of_accounts(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type account_entry_type NOT NULL,
  dre_category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- transactions
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  bank_account_id UUID NOT NULL REFERENCES public.bank_accounts(id),
  chart_account_id UUID REFERENCES public.chart_of_accounts(id),
  customer_id UUID REFERENCES public.customers(id),
  supplier_id UUID REFERENCES public.suppliers(id),
  cost_center_id UUID REFERENCES public.cost_centers(id),
  type transaction_type NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT NOT NULL,
  document_number TEXT,
  notes TEXT,
  payment_method TEXT DEFAULT 'dinheiro',
  bank_statement_ref TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reconciled BOOLEAN DEFAULT false,
  reconciled_at TIMESTAMPTZ,
  reconciled_by UUID,
  original_transaction_date DATE,
  original_created_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- receivables
CREATE TABLE public.receivables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  chart_account_id UUID REFERENCES public.chart_of_accounts(id),
  parent_id UUID REFERENCES public.receivables(id),
  description TEXT NOT NULL,
  document_number TEXT,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  total_amount NUMERIC NOT NULL,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  status receivable_status NOT NULL DEFAULT 'pendente',
  installment_number INTEGER DEFAULT 1,
  total_installments INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- payables
CREATE TABLE public.payables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
  chart_account_id UUID REFERENCES public.chart_of_accounts(id),
  cost_center_id UUID REFERENCES public.cost_centers(id),
  parent_id UUID REFERENCES public.payables(id),
  description TEXT NOT NULL,
  document_number TEXT,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  total_amount NUMERIC NOT NULL,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  status payable_status NOT NULL DEFAULT 'pendente',
  installment_number INTEGER DEFAULT 1,
  total_installments INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- payment_records
CREATE TABLE public.payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receivable_id UUID REFERENCES public.receivables(id) ON DELETE CASCADE,
  payable_id UUID REFERENCES public.payables(id) ON DELETE CASCADE,
  bank_account_id UUID NOT NULL REFERENCES public.bank_accounts(id),
  amount NUMERIC NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method payment_method NOT NULL DEFAULT 'pix',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- bank_statement_imports
CREATE TABLE public.bank_statement_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  bank_account_id UUID NOT NULL REFERENCES public.bank_accounts(id),
  filename TEXT NOT NULL,
  detected_bank_name TEXT,
  import_date TIMESTAMPTZ DEFAULT now(),
  period_start DATE,
  period_end DATE,
  total_transactions INTEGER NOT NULL DEFAULT 0,
  total_credits NUMERIC DEFAULT 0,
  total_debits NUMERIC DEFAULT 0,
  imported_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- bank_statements
CREATE TABLE public.bank_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  bank_account_id UUID NOT NULL REFERENCES public.bank_accounts(id),
  import_id UUID REFERENCES public.bank_statement_imports(id),
  fitid TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  transaction_date DATE NOT NULL,
  memo TEXT,
  check_number TEXT,
  source_file TEXT,
  reconciled BOOLEAN DEFAULT false,
  reconciled_transaction_id UUID REFERENCES public.transactions(id),
  reconciled_at TIMESTAMPTZ,
  reconciled_by UUID,
  imported_at TIMESTAMPTZ DEFAULT now(),
  imported_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- user_invitations
CREATE TABLE public.user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'viewer',
  token TEXT NOT NULL,
  invited_by UUID NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- audit_logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- tenant_metrics
CREATE TABLE public.tenant_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  transactions_count INTEGER NOT NULL DEFAULT 0,
  last_transaction_at TIMESTAMPTZ,
  last_user_activity_at TIMESTAMPTZ,
  active_users_count INTEGER NOT NULL DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  total_expenses NUMERIC DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ocr_scans
CREATE TABLE public.ocr_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  extracted_text TEXT NOT NULL,
  source_type TEXT NOT NULL,
  extracted_data JSONB DEFAULT '{}',
  linked_record_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- dre_report_schedules
CREATE TABLE public.dre_report_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  recipient_emails TEXT[] NOT NULL,
  schedule_type TEXT NOT NULL DEFAULT 'monthly',
  day_of_month INTEGER DEFAULT 5,
  report_period TEXT DEFAULT 'previous_month',
  is_active BOOLEAN DEFAULT true,
  include_pdf BOOLEAN DEFAULT true,
  include_excel BOOLEAN DEFAULT false,
  last_sent_at TIMESTAMPTZ,
  next_send_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- dre_email_logs
CREATE TABLE public.dre_email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES public.dre_report_schedules(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  recipient_emails TEXT[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  resend_id TEXT,
  error_message TEXT,
  report_period TEXT,
  sent_at TIMESTAMPTZ DEFAULT now(),
  opened_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- dre_budget
CREATE TABLE public.dre_budget (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  category_code TEXT NOT NULL,
  category_name TEXT NOT NULL,
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL,
  budgeted_value NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- dre_notes
CREATE TABLE public.dre_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  chart_account_id UUID REFERENCES public.chart_of_accounts(id),
  dre_line_id TEXT NOT NULL,
  note TEXT NOT NULL,
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL,
  is_important BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- impersonate_logs
CREATE TABLE public.impersonate_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  target_user_id UUID NOT NULL,
  target_company_id UUID REFERENCES public.companies(id),
  reason TEXT,
  ip_address TEXT,
  user_agent TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ
);

-- notification_logs
CREATE TABLE public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  related_id UUID,
  sent_at TIMESTAMPTZ DEFAULT now(),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- onboarding_progress
CREATE TABLE public.onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  segment TEXT,
  step_empresa BOOLEAN DEFAULT false,
  step_contas_bancarias BOOLEAN DEFAULT false,
  step_categorias BOOLEAN DEFAULT false,
  step_primeiro_lancamento BOOLEAN DEFAULT false,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  skipped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- financial_personality
CREATE TABLE public.financial_personality (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  archetype TEXT NOT NULL DEFAULT 'unknown',
  archetype_score JSONB,
  quiz_answers JSONB,
  strengths TEXT[],
  growth_areas TEXT[],
  last_analysis_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- daily_activity_log
CREATE TABLE public.daily_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL,
  activities_count INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- daily_missions
CREATE TABLE public.daily_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  mission_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_value NUMERIC DEFAULT 1,
  current_value NUMERIC DEFAULT 0,
  reward_xp INTEGER DEFAULT 10,
  status TEXT DEFAULT 'active',
  expires_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- journey_milestones
CREATE TABLE public.journey_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  narrative TEXT,
  icon TEXT,
  xp_earned INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  unlocked_at TIMESTAMPTZ DEFAULT now()
);

-- leaderboard
CREATE TABLE public.leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL,
  period_key TEXT NOT NULL,
  total_xp INTEGER DEFAULT 0,
  achievements_count INTEGER DEFAULT 0,
  missions_completed INTEGER DEFAULT 0,
  challenges_won INTEGER DEFAULT 0,
  rank INTEGER,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, company_id, period_type, period_key)
);

-- user_achievements
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT now()
);

-- challenge_participants
CREATE TABLE public.challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.weekly_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  current_value NUMERIC DEFAULT 0,
  rank INTEGER,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## PASSO 5: Criar Funções Complexas

```sql
-- =============================================
-- FUNÇÕES COMPLEXAS - Execute quinto
-- =============================================

-- Função: get_user_context (RPC principal)
CREATE OR REPLACE FUNCTION public.get_user_context(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_profile JSONB;
  v_roles app_role[];
  v_companies JSONB;
  v_default_company_id UUID;
BEGIN
  SELECT jsonb_build_object(
    'id', p.id,
    'user_id', p.user_id,
    'full_name', p.full_name,
    'avatar_url', p.avatar_url,
    'phone', p.phone,
    'job_title', p.job_title,
    'trial_started_at', p.trial_started_at,
    'current_streak', p.current_streak,
    'total_xp', p.total_xp,
    'guardian_level', p.guardian_level,
    'current_title', p.current_title
  ) INTO v_profile
  FROM profiles p
  WHERE p.user_id = p_user_id;

  SELECT COALESCE(array_agg(role), ARRAY[]::app_role[])
  INTO v_roles
  FROM user_roles
  WHERE user_id = p_user_id;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'company_id', uc.company_id,
        'is_default', uc.is_default,
        'role', uc.role,
        'company', jsonb_build_object(
          'id', c.id,
          'name', c.name,
          'trading_name', c.trading_name,
          'document', c.document,
          'email', c.email,
          'phone', c.phone,
          'address', c.address,
          'city', c.city,
          'state', c.state,
          'zip_code', c.zip_code,
          'logo_url', c.logo_url,
          'currency', c.currency,
          'currency_symbol', c.currency_symbol,
          'is_headquarters', c.is_headquarters,
          'parent_company_id', c.parent_company_id,
          'created_by', c.created_by
        )
      )
    ),
    '[]'::jsonb
  ) INTO v_companies
  FROM user_companies uc
  JOIN companies c ON c.id = uc.company_id
  WHERE uc.user_id = p_user_id;

  SELECT company_id INTO v_default_company_id
  FROM user_companies
  WHERE user_id = p_user_id AND is_default = true
  LIMIT 1;

  v_result := jsonb_build_object(
    'profile', COALESCE(v_profile, '{}'::jsonb),
    'roles', to_jsonb(v_roles),
    'companies', v_companies,
    'default_company_id', v_default_company_id
  );

  RETURN v_result;
END;
$$;

-- Função: handle_new_user (trigger para novos usuários)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role app_role;
  v_admin_exists boolean;
BEGIN
  INSERT INTO public.profiles (user_id, full_name, trial_started_at)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', now());
  
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE role = 'admin' 
    FOR UPDATE SKIP LOCKED
  ) INTO v_admin_exists;
  
  IF NOT v_admin_exists THEN
    v_role := 'admin';
  ELSE
    v_role := 'viewer';
  END IF;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Função: update_bank_balance_on_transaction
CREATE OR REPLACE FUNCTION public.update_bank_balance_on_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.amount IS NULL OR NEW.amount <= 0 THEN
      RAISE EXCEPTION 'Transaction amount must be positive';
    END IF;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'entrada' THEN
      UPDATE public.bank_accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.bank_account_id;
    ELSE
      UPDATE public.bank_accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.bank_account_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.type = 'entrada' THEN
      UPDATE public.bank_accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.bank_account_id;
    ELSE
      UPDATE public.bank_accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.bank_account_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.type = 'entrada' THEN
      UPDATE public.bank_accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.bank_account_id;
    ELSE
      UPDATE public.bank_accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.bank_account_id;
    END IF;
    IF NEW.type = 'entrada' THEN
      UPDATE public.bank_accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.bank_account_id;
    ELSE
      UPDATE public.bank_accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.bank_account_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Função: update_bank_balance_on_payment
CREATE OR REPLACE FUNCTION public.update_bank_balance_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.amount IS NULL OR NEW.amount <= 0 THEN
      RAISE EXCEPTION 'Payment amount must be positive';
    END IF;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.receivable_id IS NOT NULL THEN
      UPDATE public.bank_accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.bank_account_id;
      UPDATE public.receivables 
      SET paid_amount = paid_amount + NEW.amount,
          status = CASE 
            WHEN paid_amount + NEW.amount >= total_amount THEN 'pago'::receivable_status
            WHEN paid_amount + NEW.amount > 0 THEN 'parcial'::receivable_status
            ELSE 'pendente'::receivable_status
          END
      WHERE id = NEW.receivable_id;
    ELSE
      UPDATE public.bank_accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.bank_account_id;
      UPDATE public.payables 
      SET paid_amount = paid_amount + NEW.amount,
          status = CASE 
            WHEN paid_amount + NEW.amount >= total_amount THEN 'pago'::payable_status
            WHEN paid_amount + NEW.amount > 0 THEN 'parcial'::payable_status
            ELSE 'pendente'::payable_status
          END
      WHERE id = NEW.payable_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.receivable_id IS NOT NULL THEN
      UPDATE public.bank_accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.bank_account_id;
      UPDATE public.receivables 
      SET paid_amount = paid_amount - OLD.amount,
          status = CASE 
            WHEN paid_amount - OLD.amount >= total_amount THEN 'pago'::receivable_status
            WHEN paid_amount - OLD.amount > 0 THEN 'parcial'::receivable_status
            ELSE 'pendente'::receivable_status
          END
      WHERE id = OLD.receivable_id;
    ELSE
      UPDATE public.bank_accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.bank_account_id;
      UPDATE public.payables 
      SET paid_amount = paid_amount - OLD.amount,
          status = CASE 
            WHEN paid_amount - OLD.amount >= total_amount THEN 'pago'::payable_status
            WHEN paid_amount - OLD.amount > 0 THEN 'parcial'::payable_status
            ELSE 'pendente'::payable_status
          END
      WHERE id = OLD.payable_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Função: log_audit
CREATE OR REPLACE FUNCTION public.log_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (
      company_id, user_id, action, table_name, 
      record_id, new_data
    ) VALUES (
      NEW.company_id, v_user_id, 'INSERT', TG_TABLE_NAME,
      NEW.id, to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (
      company_id, user_id, action, table_name,
      record_id, old_data, new_data
    ) VALUES (
      NEW.company_id, v_user_id, 'UPDATE', TG_TABLE_NAME,
      NEW.id, to_jsonb(OLD), to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (
      company_id, user_id, action, table_name,
      record_id, old_data
    ) VALUES (
      OLD.company_id, v_user_id, 'DELETE', TG_TABLE_NAME,
      OLD.id, to_jsonb(OLD)
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Função: save_original_dates
CREATE OR REPLACE FUNCTION public.save_original_dates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.original_transaction_date IS NULL 
     AND NEW.transaction_date IS DISTINCT FROM OLD.transaction_date THEN
    NEW.original_transaction_date = OLD.transaction_date;
  END IF;
  
  IF OLD.original_created_at IS NULL 
     AND NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    NEW.original_created_at = OLD.created_at;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Função: update_tenant_metrics
CREATE OR REPLACE FUNCTION public.update_tenant_metrics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    INSERT INTO public.tenant_metrics (company_id, transactions_count, last_transaction_at, updated_at)
    VALUES (NEW.company_id, 1, NEW.created_at, now())
    ON CONFLICT (company_id) 
    DO UPDATE SET 
      transactions_count = tenant_metrics.transactions_count + 1,
      last_transaction_at = GREATEST(tenant_metrics.last_transaction_at, NEW.created_at),
      updated_at = now();
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;
```

---

## PASSO 6: Criar Triggers

```sql
-- =============================================
-- TRIGGERS - Execute sexto
-- =============================================

-- Trigger para novos usuários
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger para set created_by em companies
CREATE TRIGGER set_created_by_trigger
  BEFORE INSERT ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.set_company_created_by();

-- Trigger para atualizar saldos bancários em transações
CREATE TRIGGER update_balance_on_transaction
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_bank_balance_on_transaction();

-- Trigger para atualizar saldos em pagamentos
CREATE TRIGGER update_balance_on_payment
  AFTER INSERT OR DELETE ON public.payment_records
  FOR EACH ROW EXECUTE FUNCTION public.update_bank_balance_on_payment();

-- Triggers de updated_at
CREATE TRIGGER set_updated_at_companies BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_bank_accounts BEFORE UPDATE ON public.bank_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_transactions BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_customers BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_suppliers BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_receivables BEFORE UPDATE ON public.receivables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_payables BEFORE UPDATE ON public.payables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_chart_of_accounts BEFORE UPDATE ON public.chart_of_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_cost_centers BEFORE UPDATE ON public.cost_centers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_categories BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_subscriptions BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para métricas de tenant
CREATE TRIGGER update_tenant_metrics_on_transaction
  AFTER INSERT ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_tenant_metrics();

-- Trigger para salvar datas originais
CREATE TRIGGER save_original_dates_trigger
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.save_original_dates();
```

---

## PASSO 7: Habilitar RLS e Criar Políticas

```sql
-- =============================================
-- ROW LEVEL SECURITY - Execute sétimo
-- =============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mrr_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receivables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_statement_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ocr_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dre_report_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dre_email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dre_budget ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dre_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impersonate_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_personality ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journey_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLÍTICAS RLS
-- =============================================

-- COMPANIES
CREATE POLICY "Users can view companies they belong to" ON public.companies FOR SELECT USING (user_belongs_to_company(auth.uid(), id));
CREATE POLICY "Users can view companies they created" ON public.companies FOR SELECT USING (created_by = auth.uid());
CREATE POLICY "Allow first company creation or admin insert" ON public.companies FOR INSERT WITH CHECK (((created_by = auth.uid()) AND NOT EXISTS (SELECT 1 FROM user_companies uc WHERE uc.user_id = auth.uid())) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update companies" ON public.companies FOR UPDATE USING (has_role(auth.uid(), 'admin') AND user_belongs_to_company(auth.uid(), id));
CREATE POLICY "Admins can delete companies" ON public.companies FOR DELETE USING (has_role(auth.uid(), 'admin') AND user_belongs_to_company(auth.uid(), id));

-- PROFILES
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- USER_ROLES
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- USER_COMPANIES
CREATE POLICY "Users can view their own company associations" ON public.user_companies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage company associations" ON public.user_companies FOR ALL USING (has_role(auth.uid(), 'admin'));

-- SUBSCRIPTIONS
CREATE POLICY "Users can view their own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own subscription" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- MRR_HISTORY
CREATE POLICY "No direct access to mrr_history" ON public.mrr_history FOR SELECT USING (false);

-- BANK_ACCOUNTS
CREATE POLICY "Users can view bank_accounts of their companies" ON public.bank_accounts FOR SELECT USING (user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY "Owners, admins and editors can insert bank_accounts" ON public.bank_accounts FOR INSERT WITH CHECK (user_belongs_to_company(auth.uid(), company_id) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor') OR is_company_owner(auth.uid(), company_id)));
CREATE POLICY "Owners, admins and editors can update bank_accounts" ON public.bank_accounts FOR UPDATE USING (user_belongs_to_company(auth.uid(), company_id) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor') OR is_company_owner(auth.uid(), company_id)));
CREATE POLICY "Owners and admins can delete bank_accounts" ON public.bank_accounts FOR DELETE USING (user_belongs_to_company(auth.uid(), company_id) AND (has_role(auth.uid(), 'admin') OR is_company_owner(auth.uid(), company_id)));

-- CUSTOMERS
CREATE POLICY "Users can view customers of their companies" ON public.customers FOR SELECT USING (user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY "Owners, admins and editors can insert customers" ON public.customers FOR INSERT WITH CHECK (user_belongs_to_company(auth.uid(), company_id) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor') OR is_company_owner(auth.uid(), company_id)));
CREATE POLICY "Owners, admins and editors can update customers" ON public.customers FOR UPDATE USING (user_belongs_to_company(auth.uid(), company_id) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor') OR is_company_owner(auth.uid(), company_id)));
CREATE POLICY "Owners and admins can delete customers" ON public.customers FOR DELETE USING (user_belongs_to_company(auth.uid(), company_id) AND (has_role(auth.uid(), 'admin') OR is_company_owner(auth.uid(), company_id)));

-- SUPPLIERS
CREATE POLICY "Users can view suppliers of their companies" ON public.suppliers FOR SELECT USING (user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY "Owners, admins and editors can insert suppliers" ON public.suppliers FOR INSERT WITH CHECK (user_belongs_to_company(auth.uid(), company_id) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor') OR is_company_owner(auth.uid(), company_id)));
CREATE POLICY "Owners, admins and editors can update suppliers" ON public.suppliers FOR UPDATE USING (user_belongs_to_company(auth.uid(), company_id) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor') OR is_company_owner(auth.uid(), company_id)));
CREATE POLICY "Owners and admins can delete suppliers" ON public.suppliers FOR DELETE USING (user_belongs_to_company(auth.uid(), company_id) AND (has_role(auth.uid(), 'admin') OR is_company_owner(auth.uid(), company_id)));

-- CATEGORIES
CREATE POLICY "Users can view categories of their company" ON public.categories FOR SELECT USING (user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY "Owners, admins and editors can insert categories" ON public.categories FOR INSERT WITH CHECK (user_belongs_to_company(auth.uid(), company_id) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor') OR is_company_owner(auth.uid(), company_id)));
CREATE POLICY "Owners, admins and editors can update categories" ON public.categories FOR UPDATE USING (user_belongs_to_company(auth.uid(), company_id) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor') OR is_company_owner(auth.uid(), company_id)));
CREATE POLICY "Owners and admins can delete categories" ON public.categories FOR DELETE USING (user_belongs_to_company(auth.uid(), company_id) AND (has_role(auth.uid(), 'admin') OR is_company_owner(auth.uid(), company_id)));

-- COST_CENTERS
CREATE POLICY "Users can view cost_centers of their companies" ON public.cost_centers FOR SELECT USING (user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY "Owners, admins and editors can insert cost_centers" ON public.cost_centers FOR INSERT WITH CHECK (user_belongs_to_company(auth.uid(), company_id) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor') OR is_company_owner(auth.uid(), company_id)));
CREATE POLICY "Owners, admins and editors can update cost_centers" ON public.cost_centers FOR UPDATE USING (user_belongs_to_company(auth.uid(), company_id) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor') OR is_company_owner(auth.uid(), company_id)));
CREATE POLICY "Owners and admins can delete cost_centers" ON public.cost_centers FOR DELETE USING (user_belongs_to_company(auth.uid(), company_id) AND (has_role(auth.uid(), 'admin') OR is_company_owner(auth.uid(), company_id)));

-- CHART_OF_ACCOUNTS
CREATE POLICY "Users can view chart_of_accounts of their companies" ON public.chart_of_accounts FOR SELECT USING (user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY "Owners, admins and editors can insert chart_of_accounts" ON public.chart_of_accounts FOR INSERT WITH CHECK (user_belongs_to_company(auth.uid(), company_id) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor') OR is_company_owner(auth.uid(), company_id)));
CREATE POLICY "Owners, admins and editors can update chart_of_accounts" ON public.chart_of_accounts FOR UPDATE USING (user_belongs_to_company(auth.uid(), company_id) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor') OR is_company_owner(auth.uid(), company_id)));
CREATE POLICY "Owners and admins can delete chart_of_accounts" ON public.chart_of_accounts FOR DELETE USING (user_belongs_to_company(auth.uid(), company_id) AND (has_role(auth.uid(), 'admin') OR is_company_owner(auth.uid(), company_id)));

-- TRANSACTIONS
CREATE POLICY "Users can view transactions of their companies" ON public.transactions FOR SELECT USING (user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY "Owners, admins and editors can insert transactions" ON public.transactions FOR INSERT WITH CHECK (user_belongs_to_company(auth.uid(), company_id) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor') OR is_company_owner(auth.uid(), company_id)));
CREATE POLICY "Owners, admins and editors can update transactions" ON public.transactions FOR UPDATE USING (user_belongs_to_company(auth.uid(), company_id) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor') OR is_company_owner(auth.uid(), company_id)));
CREATE POLICY "Owners and admins can delete transactions" ON public.transactions FOR DELETE USING (user_belongs_to_company(auth.uid(), company_id) AND (has_role(auth.uid(), 'admin') OR is_company_owner(auth.uid(), company_id)));

-- RECEIVABLES
CREATE POLICY "Users can view receivables of their companies" ON public.receivables FOR SELECT USING (user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY "Owners, admins and editors can insert receivables" ON public.receivables FOR INSERT WITH CHECK (user_belongs_to_company(auth.uid(), company_id) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor') OR is_company_owner(auth.uid(), company_id)));
CREATE POLICY "Owners, admins and editors can update receivables" ON public.receivables FOR UPDATE USING (user_belongs_to_company(auth.uid(), company_id) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor') OR is_company_owner(auth.uid(), company_id)));
CREATE POLICY "Owners and admins can delete receivables" ON public.receivables FOR DELETE USING (user_belongs_to_company(auth.uid(), company_id) AND (has_role(auth.uid(), 'admin') OR is_company_owner(auth.uid(), company_id)));

-- PAYABLES
CREATE POLICY "Users can view payables of their companies" ON public.payables FOR SELECT USING (user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY "Owners, admins and editors can insert payables" ON public.payables FOR INSERT WITH CHECK (user_belongs_to_company(auth.uid(), company_id) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor') OR is_company_owner(auth.uid(), company_id)));
CREATE POLICY "Owners, admins and editors can update payables" ON public.payables FOR UPDATE USING (user_belongs_to_company(auth.uid(), company_id) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor') OR is_company_owner(auth.uid(), company_id)));
CREATE POLICY "Owners and admins can delete payables" ON public.payables FOR DELETE USING (user_belongs_to_company(auth.uid(), company_id) AND (has_role(auth.uid(), 'admin') OR is_company_owner(auth.uid(), company_id)));

-- PAYMENT_RECORDS
CREATE POLICY "Users can view payment_records of their companies" ON public.payment_records FOR SELECT USING (((receivable_id IS NOT NULL) AND (EXISTS (SELECT 1 FROM receivables r WHERE r.id = payment_records.receivable_id AND user_belongs_to_company(auth.uid(), r.company_id)))) OR ((payable_id IS NOT NULL) AND (EXISTS (SELECT 1 FROM payables p WHERE p.id = payment_records.payable_id AND user_belongs_to_company(auth.uid(), p.company_id)))));
CREATE POLICY "Admins and editors can insert payment_records" ON public.payment_records FOR INSERT WITH CHECK (((receivable_id IS NOT NULL) AND (EXISTS (SELECT 1 FROM receivables r WHERE r.id = payment_records.receivable_id AND user_belongs_to_company(auth.uid(), r.company_id) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'))))) OR ((payable_id IS NOT NULL) AND (EXISTS (SELECT 1 FROM payables p WHERE p.id = payment_records.payable_id AND user_belongs_to_company(auth.uid(), p.company_id) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'))))));
CREATE POLICY "Admins can delete payment_records" ON public.payment_records FOR DELETE USING (((receivable_id IS NOT NULL) AND (EXISTS (SELECT 1 FROM receivables r WHERE r.id = payment_records.receivable_id AND user_belongs_to_company(auth.uid(), r.company_id) AND has_role(auth.uid(), 'admin')))) OR ((payable_id IS NOT NULL) AND (EXISTS (SELECT 1 FROM payables p WHERE p.id = payment_records.payable_id AND user_belongs_to_company(auth.uid(), p.company_id) AND has_role(auth.uid(), 'admin')))));

-- BANK_STATEMENT_IMPORTS
CREATE POLICY "Users can view imports of their companies" ON public.bank_statement_imports FOR SELECT USING (user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY "Admins and editors can insert imports" ON public.bank_statement_imports FOR INSERT WITH CHECK (user_belongs_to_company(auth.uid(), company_id) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor')));
CREATE POLICY "Admins can delete imports" ON public.bank_statement_imports FOR DELETE USING (user_belongs_to_company(auth.uid(), company_id) AND has_role(auth.uid(), 'admin'));

-- BANK_STATEMENTS
CREATE POLICY "Users can view bank_statements of their companies" ON public.bank_statements FOR SELECT USING (user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY "Admins and editors can insert bank_statements" ON public.bank_statements FOR INSERT WITH CHECK (user_belongs_to_company(auth.uid(), company_id) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor')));
CREATE POLICY "Admins and editors can update bank_statements" ON public.bank_statements FOR UPDATE USING (user_belongs_to_company(auth.uid(), company_id) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor')));
CREATE POLICY "Admins can delete bank_statements" ON public.bank_statements FOR DELETE USING (user_belongs_to_company(auth.uid(), company_id) AND has_role(auth.uid(), 'admin'));

-- USER_INVITATIONS
CREATE POLICY "Admins can view invitations of their companies" ON public.user_invitations FOR SELECT USING (user_belongs_to_company(auth.uid(), company_id) AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert invitations for their companies" ON public.user_invitations FOR INSERT WITH CHECK (user_belongs_to_company(auth.uid(), company_id) AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update invitations of their companies" ON public.user_invitations FOR UPDATE USING (user_belongs_to_company(auth.uid(), company_id) AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete invitations of their companies" ON public.user_invitations FOR DELETE USING (user_belongs_to_company(auth.uid(), company_id) AND has_role(auth.uid(), 'admin'));

-- AUDIT_LOGS
CREATE POLICY "Admins can view audit logs of their companies" ON public.audit_logs FOR SELECT USING (user_belongs_to_company(auth.uid(), company_id) AND has_role(auth.uid(), 'admin'));

-- TENANT_METRICS
CREATE POLICY "Users can view own company metrics" ON public.tenant_metrics FOR SELECT USING (user_belongs_to_company(auth.uid(), company_id));

-- OCR_SCANS
CREATE POLICY "Users can view ocr_scans of their companies" ON public.ocr_scans FOR SELECT USING (user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY "Admins and editors can insert ocr_scans" ON public.ocr_scans FOR INSERT WITH CHECK (user_belongs_to_company(auth.uid(), company_id) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor')));
CREATE POLICY "Admins can delete ocr_scans" ON public.ocr_scans FOR DELETE USING (user_belongs_to_company(auth.uid(), company_id) AND has_role(auth.uid(), 'admin'));

-- DRE_REPORT_SCHEDULES
CREATE POLICY "Users can view own company schedules" ON public.dre_report_schedules FOR SELECT USING (user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY "Users can insert own company schedules" ON public.dre_report_schedules FOR INSERT WITH CHECK (user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY "Users can update own company schedules" ON public.dre_report_schedules FOR UPDATE USING (user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY "Users can delete own company schedules" ON public.dre_report_schedules FOR DELETE USING (user_belongs_to_company(auth.uid(), company_id));

-- DRE_EMAIL_LOGS
CREATE POLICY "Users can view email logs for their companies" ON public.dre_email_logs FOR SELECT USING (user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY "Users can insert email logs for their companies" ON public.dre_email_logs FOR INSERT WITH CHECK (user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY "Users can update email logs for their companies" ON public.dre_email_logs FOR UPDATE USING (user_belongs_to_company(auth.uid(), company_id));

-- DRE_BUDGET
CREATE POLICY "Users can view dre_budget of their companies" ON public.dre_budget FOR SELECT USING (user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY "Owners, admins and editors can insert dre_budget" ON public.dre_budget FOR INSERT WITH CHECK (user_belongs_to_company(auth.uid(), company_id) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor') OR is_company_owner(auth.uid(), company_id)));
CREATE POLICY "Owners, admins and editors can update dre_budget" ON public.dre_budget FOR UPDATE USING (user_belongs_to_company(auth.uid(), company_id) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor') OR is_company_owner(auth.uid(), company_id)));
CREATE POLICY "Owners and admins can delete dre_budget" ON public.dre_budget FOR DELETE USING (user_belongs_to_company(auth.uid(), company_id) AND (has_role(auth.uid(), 'admin') OR is_company_owner(auth.uid(), company_id)));

-- DRE_NOTES
CREATE POLICY "Users can view dre_notes of their companies" ON public.dre_notes FOR SELECT USING (user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY "Owners, admins and editors can insert dre_notes" ON public.dre_notes FOR INSERT WITH CHECK (user_belongs_to_company(auth.uid(), company_id) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor') OR is_company_owner(auth.uid(), company_id)));
CREATE POLICY "Owners, admins and editors can update dre_notes" ON public.dre_notes FOR UPDATE USING (user_belongs_to_company(auth.uid(), company_id) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor') OR is_company_owner(auth.uid(), company_id)));
CREATE POLICY "Owners and admins can delete dre_notes" ON public.dre_notes FOR DELETE USING (user_belongs_to_company(auth.uid(), company_id) AND (has_role(auth.uid(), 'admin') OR is_company_owner(auth.uid(), company_id)));

-- IMPERSONATE_LOGS
CREATE POLICY "Admins can view impersonate logs" ON public.impersonate_logs FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert impersonate logs" ON public.impersonate_logs FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

-- NOTIFICATION_LOGS
CREATE POLICY "Users can view own notifications" ON public.notification_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notifications" ON public.notification_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notification_logs FOR UPDATE USING (auth.uid() = user_id);

-- ONBOARDING_PROGRESS
CREATE POLICY "Users can view own onboarding" ON public.onboarding_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own onboarding" ON public.onboarding_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own onboarding" ON public.onboarding_progress FOR UPDATE USING (auth.uid() = user_id);

-- FINANCIAL_PERSONALITY
CREATE POLICY "Users can view own personality" ON public.financial_personality FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own personality" ON public.financial_personality FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own personality" ON public.financial_personality FOR UPDATE USING (auth.uid() = user_id);

-- DAILY_ACTIVITY_LOG
CREATE POLICY "Users can view their own activity logs" ON public.daily_activity_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own activity logs" ON public.daily_activity_log FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own activity logs" ON public.daily_activity_log FOR UPDATE USING (auth.uid() = user_id);

-- DAILY_MISSIONS
CREATE POLICY "Users can view own missions" ON public.daily_missions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own missions" ON public.daily_missions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own missions" ON public.daily_missions FOR UPDATE USING (auth.uid() = user_id);

-- JOURNEY_MILESTONES
CREATE POLICY "Users can view own milestones" ON public.journey_milestones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own milestones" ON public.journey_milestones FOR INSERT WITH CHECK (auth.uid() = user_id);

-- LEADERBOARD
CREATE POLICY "Users can view leaderboard for their companies" ON public.leaderboard FOR SELECT USING (user_belongs_to_company(company_id, auth.uid()));
CREATE POLICY "Users can insert their own leaderboard entries" ON public.leaderboard FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own leaderboard entries" ON public.leaderboard FOR UPDATE USING (auth.uid() = user_id);

-- USER_ACHIEVEMENTS
CREATE POLICY "Users can view own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- WEEKLY_CHALLENGES
CREATE POLICY "Users can view active challenges" ON public.weekly_challenges FOR SELECT USING (is_active = true);

-- CHALLENGE_PARTICIPANTS
CREATE POLICY "Users can view challenge participants" ON public.challenge_participants FOR SELECT USING (user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY "Users can join challenges" ON public.challenge_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own participation" ON public.challenge_participants FOR UPDATE USING (auth.uid() = user_id);
```

---

## PASSO 8: Criar Storage Buckets

```sql
-- =============================================
-- STORAGE BUCKETS - Execute oitavo
-- =============================================

-- Criar buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('ocr_images', 'ocr_images', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('company_logos', 'company_logos', false);

-- Políticas para ocr_images
CREATE POLICY "Users can upload OCR images" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'ocr_images' AND 
  (storage.foldername(name))[1] IN (
    SELECT company_id::text FROM public.user_companies WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can view OCR images" ON storage.objects FOR SELECT USING (
  bucket_id = 'ocr_images' AND 
  (storage.foldername(name))[1] IN (
    SELECT company_id::text FROM public.user_companies WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete OCR images" ON storage.objects FOR DELETE USING (
  bucket_id = 'ocr_images' AND 
  (storage.foldername(name))[1] IN (
    SELECT company_id::text FROM public.user_companies WHERE user_id = auth.uid()
  )
);

-- Políticas para company_logos
CREATE POLICY "Users can upload company logos" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'company_logos' AND 
  (storage.foldername(name))[1] IN (
    SELECT company_id::text FROM public.user_companies WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can view company logos" ON storage.objects FOR SELECT USING (
  bucket_id = 'company_logos' AND 
  (storage.foldername(name))[1] IN (
    SELECT company_id::text FROM public.user_companies WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can delete company logos" ON storage.objects FOR DELETE USING (
  bucket_id = 'company_logos' AND 
  public.has_role(auth.uid(), 'admin')
);
```

---

## PASSO 9: Configurar Secrets

No dashboard do Supabase, vá em **Settings > Edge Functions > Secrets** e adicione:

| Nome | Descrição |
|------|-----------|
| `RESEND_API_KEY` | Chave da API Resend para envio de emails |
| `STRIPE_SECRET_KEY` | Chave secreta do Stripe |
| `STRIPE_WEBHOOK_SECRET` | Secret do webhook Stripe |
| `LOVABLE_API_KEY` | Chave da API Lovable (para AI) |

---

## PASSO 10: Deploy das Edge Functions

As edge functions precisam ser copiadas manualmente da pasta `supabase/functions/` do projeto:

1. `admin-create-demo-user`
2. `admin-global-data`
3. `admin-impersonate`
4. `analyze-cashflow-projection`
5. `analyze-dre`
6. `analyze-personality`
7. `check-subscription`
8. `create-checkout-session`
9. `create-portal-session`
10. `get-checkout-session`
11. `send-dre-report`
12. `send-invitation-email`
13. `stripe-webhook`

---

## PASSO 11: Migrar Dados (Opcional)

Se você quiser migrar os dados existentes:

```bash
# No terminal, conectado ao banco ANTIGO
pg_dump -h db.wqbbdortsqqglujgechi.supabase.co -U postgres -d postgres --data-only --no-owner --no-privileges > backup_data.sql

# Conectar ao banco NOVO e importar
psql -h db.wqbbdortsqqglujgechi.supabase.co -U postgres -d postgres < backup_data.sql
```

**Senha do banco**: você encontra em **Settings > Database > Connection string**

---

## Checklist Final

- [ ] ENUMs criados
- [ ] Funções auxiliares criadas
- [ ] Tabelas base criadas
- [ ] Tabelas com dependências criadas
- [ ] Funções complexas criadas
- [ ] Triggers criados
- [ ] RLS habilitado em todas as tabelas
- [ ] Políticas RLS criadas
- [ ] Storage buckets criados
- [ ] Secrets configurados
- [ ] Edge functions deployadas
- [ ] Dados migrados (se aplicável)
- [ ] Frontend atualizado com novas credenciais
