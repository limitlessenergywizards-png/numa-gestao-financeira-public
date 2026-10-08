-- ============================================
-- NUMA GESTAO FINANCEIRA - FULL MIGRATION
-- Para novo Supabase: wqbbdortsqqglujgechi
-- Gerado em: Wed Feb 11 18:35:45 -03 2026
-- ============================================

-- PASSO 1: Dropar todas as tabelas existentes (estao vazias)
DROP TABLE IF EXISTS public.chart_account_template_dre_mapping CASCADE;
DROP TABLE IF EXISTS public.chart_account_template_items CASCADE;
DROP TABLE IF EXISTS public.chart_account_templates CASCADE;
DROP TABLE IF EXISTS public.hotmart_webhook_logs CASCADE;
DROP TABLE IF EXISTS public.mrr_history CASCADE;
DROP TABLE IF EXISTS public.tenant_metrics CASCADE;
DROP TABLE IF EXISTS public.user_sessions CASCADE;
DROP TABLE IF EXISTS public.impersonate_logs CASCADE;
DROP TABLE IF EXISTS public.leaderboard CASCADE;
DROP TABLE IF EXISTS public.challenge_participants CASCADE;
DROP TABLE IF EXISTS public.weekly_challenges CASCADE;
DROP TABLE IF EXISTS public.user_achievements CASCADE;
DROP TABLE IF EXISTS public.daily_missions CASCADE;
DROP TABLE IF EXISTS public.daily_activity_log CASCADE;
DROP TABLE IF EXISTS public.journey_milestones CASCADE;
DROP TABLE IF EXISTS public.financial_personality CASCADE;
DROP TABLE IF EXISTS public.dre_email_logs CASCADE;
DROP TABLE IF EXISTS public.dre_report_schedules CASCADE;
DROP TABLE IF EXISTS public.dre_notes CASCADE;
DROP TABLE IF EXISTS public.dre_budget CASCADE;
DROP TABLE IF EXISTS public.onboarding_progress CASCADE;
DROP TABLE IF EXISTS public.ocr_scans CASCADE;
DROP TABLE IF EXISTS public.notification_logs CASCADE;
DROP TABLE IF EXISTS public.user_preferences CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.user_invitations CASCADE;
DROP TABLE IF EXISTS public.bank_statement_imports CASCADE;
DROP TABLE IF EXISTS public.bank_statements CASCADE;
DROP TABLE IF EXISTS public.payment_records CASCADE;
DROP TABLE IF EXISTS public.payables CASCADE;
DROP TABLE IF EXISTS public.receivables CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.cost_centers CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.chart_of_accounts CASCADE;
DROP TABLE IF EXISTS public.bank_accounts CASCADE;
DROP TABLE IF EXISTS public.suppliers CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.user_companies CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;

-- Dropar tipos customizados
DROP TYPE IF EXISTS public.app_role CASCADE;
DROP TYPE IF EXISTS public.account_entry_type CASCADE;
DROP TYPE IF EXISTS public.transaction_type CASCADE;
DROP TYPE IF EXISTS public.receivable_status CASCADE;
DROP TYPE IF EXISTS public.payable_status CASCADE;
DROP TYPE IF EXISTS public.payment_method CASCADE;
DROP TYPE IF EXISTS public.bank_account_type CASCADE;

-- Dropar funcoes existentes
DROP FUNCTION IF EXISTS public.has_role CASCADE;
DROP FUNCTION IF EXISTS public.user_belongs_to_company CASCADE;
DROP FUNCTION IF EXISTS public.can_create_first_company CASCADE;
DROP FUNCTION IF EXISTS public.is_company_owner CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;
DROP FUNCTION IF EXISTS public.set_company_created_by CASCADE;
DROP FUNCTION IF EXISTS public.log_audit CASCADE;
DROP FUNCTION IF EXISTS public.update_bank_balance_on_transaction CASCADE;
DROP FUNCTION IF EXISTS public.update_bank_balance_on_payment CASCADE;
DROP FUNCTION IF EXISTS public.save_original_dates CASCADE;
DROP FUNCTION IF EXISTS public.update_tenant_metrics CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_old_hotmart_logs CASCADE;
DROP FUNCTION IF EXISTS public.get_user_context CASCADE;

-- ============================================
-- PASSO 2: Aplicar todas as migrations em ordem
-- ============================================


-- ============================================
-- Migration: 20260109174443_8e03a170-3f73-4296-965e-f897528d4dd4.sql
-- ============================================
-- Enum para papéis de usuário
CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'viewer');

-- Tabela de perfis de usuário
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  job_title TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de papéis de usuário (separada para segurança)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Tabela de empresas (matriz/filiais)
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  trading_name TEXT,
  document TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  logo_url TEXT,
  currency TEXT NOT NULL DEFAULT 'BRL',
  currency_symbol TEXT NOT NULL DEFAULT 'R$',
  is_headquarters BOOLEAN NOT NULL DEFAULT false,
  parent_company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de associação usuário-empresa
CREATE TABLE public.user_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, company_id)
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_companies ENABLE ROW LEVEL SECURITY;

-- Função para verificar papel do usuário (SECURITY DEFINER para evitar recursão)
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

-- Função para verificar se usuário pertence a uma empresa
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

-- Políticas RLS para profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para user_roles (apenas admins podem gerenciar)
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Políticas RLS para companies
CREATE POLICY "Users can view companies they belong to"
  ON public.companies FOR SELECT
  USING (public.user_belongs_to_company(auth.uid(), id));

CREATE POLICY "Admins can insert companies"
  ON public.companies FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update companies"
  ON public.companies FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin') AND public.user_belongs_to_company(auth.uid(), id));

CREATE POLICY "Admins can delete companies"
  ON public.companies FOR DELETE
  USING (public.has_role(auth.uid(), 'admin') AND public.user_belongs_to_company(auth.uid(), id));

-- Políticas RLS para user_companies
CREATE POLICY "Users can view their own company associations"
  ON public.user_companies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage user company associations"
  ON public.user_companies FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger para criar perfil automaticamente quando usuário é criado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  
  -- Atribuir papel padrão de admin para o primeiro usuário
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Migration: 20260109174453_eef76d0c-fd4b-4206-9563-40dbd8e98da4.sql
-- ============================================
-- Corrigir função update_updated_at_column com search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================
-- Migration: 20260109175209_22a2c6ff-1d67-4422-9b5d-c059a1e15eb0.sql
-- ============================================
-- Create enums for account types
CREATE TYPE public.account_entry_type AS ENUM ('receita', 'despesa', 'custo');
CREATE TYPE public.bank_account_type AS ENUM ('corrente', 'poupanca', 'investimento');

-- Create customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
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
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create suppliers table
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
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
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chart_of_accounts table (hierarchical)
CREATE TABLE public.chart_of_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type account_entry_type NOT NULL,
  dre_category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, code)
);

-- Create bank_accounts table
CREATE TABLE public.bank_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bank_name TEXT,
  agency TEXT,
  account_number TEXT,
  account_type bank_account_type NOT NULL DEFAULT 'corrente',
  initial_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  current_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

-- RLS policies for customers
CREATE POLICY "Users can view customers of their companies"
ON public.customers FOR SELECT
USING (public.user_belongs_to_company(auth.uid(), company_id));

CREATE POLICY "Admins and editors can insert customers"
ON public.customers FOR INSERT
WITH CHECK (
  public.user_belongs_to_company(auth.uid(), company_id) AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
);

CREATE POLICY "Admins and editors can update customers"
ON public.customers FOR UPDATE
USING (
  public.user_belongs_to_company(auth.uid(), company_id) AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
);

CREATE POLICY "Admins can delete customers"
ON public.customers FOR DELETE
USING (
  public.user_belongs_to_company(auth.uid(), company_id) AND
  public.has_role(auth.uid(), 'admin')
);

-- RLS policies for suppliers
CREATE POLICY "Users can view suppliers of their companies"
ON public.suppliers FOR SELECT
USING (public.user_belongs_to_company(auth.uid(), company_id));

CREATE POLICY "Admins and editors can insert suppliers"
ON public.suppliers FOR INSERT
WITH CHECK (
  public.user_belongs_to_company(auth.uid(), company_id) AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
);

CREATE POLICY "Admins and editors can update suppliers"
ON public.suppliers FOR UPDATE
USING (
  public.user_belongs_to_company(auth.uid(), company_id) AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
);

CREATE POLICY "Admins can delete suppliers"
ON public.suppliers FOR DELETE
USING (
  public.user_belongs_to_company(auth.uid(), company_id) AND
  public.has_role(auth.uid(), 'admin')
);

-- RLS policies for chart_of_accounts
CREATE POLICY "Users can view chart_of_accounts of their companies"
ON public.chart_of_accounts FOR SELECT
USING (public.user_belongs_to_company(auth.uid(), company_id));

CREATE POLICY "Admins and editors can insert chart_of_accounts"
ON public.chart_of_accounts FOR INSERT
WITH CHECK (
  public.user_belongs_to_company(auth.uid(), company_id) AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
);

CREATE POLICY "Admins and editors can update chart_of_accounts"
ON public.chart_of_accounts FOR UPDATE
USING (
  public.user_belongs_to_company(auth.uid(), company_id) AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
);

CREATE POLICY "Admins can delete chart_of_accounts"
ON public.chart_of_accounts FOR DELETE
USING (
  public.user_belongs_to_company(auth.uid(), company_id) AND
  public.has_role(auth.uid(), 'admin')
);

-- RLS policies for bank_accounts
CREATE POLICY "Users can view bank_accounts of their companies"
ON public.bank_accounts FOR SELECT
USING (public.user_belongs_to_company(auth.uid(), company_id));

CREATE POLICY "Admins and editors can insert bank_accounts"
ON public.bank_accounts FOR INSERT
WITH CHECK (
  public.user_belongs_to_company(auth.uid(), company_id) AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
);

CREATE POLICY "Admins and editors can update bank_accounts"
ON public.bank_accounts FOR UPDATE
USING (
  public.user_belongs_to_company(auth.uid(), company_id) AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
);

CREATE POLICY "Admins can delete bank_accounts"
ON public.bank_accounts FOR DELETE
USING (
  public.user_belongs_to_company(auth.uid(), company_id) AND
  public.has_role(auth.uid(), 'admin')
);

-- Create triggers for updated_at
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at
BEFORE UPDATE ON public.suppliers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chart_of_accounts_updated_at
BEFORE UPDATE ON public.chart_of_accounts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bank_accounts_updated_at
BEFORE UPDATE ON public.bank_accounts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Migration: 20260109180118_13639875-c7a5-4709-b43c-f3b7976ef526.sql
-- ============================================

-- Create enums for financial operations
CREATE TYPE public.transaction_type AS ENUM ('entrada', 'saida');
CREATE TYPE public.receivable_status AS ENUM ('pendente', 'parcial', 'pago', 'cancelado');
CREATE TYPE public.payable_status AS ENUM ('pendente', 'parcial', 'pago', 'cancelado');
CREATE TYPE public.payment_method AS ENUM ('dinheiro', 'pix', 'transferencia', 'boleto', 'cartao', 'cheque');

-- Create transactions table (Quick entries)
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  bank_account_id UUID NOT NULL REFERENCES public.bank_accounts(id) ON DELETE RESTRICT,
  chart_account_id UUID REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  type transaction_type NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  document_number TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create receivables table (Accounts Receivable)
CREATE TABLE public.receivables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  chart_account_id UUID REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  document_number TEXT,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  total_amount NUMERIC NOT NULL CHECK (total_amount > 0),
  paid_amount NUMERIC NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  status receivable_status NOT NULL DEFAULT 'pendente',
  installment_number INTEGER DEFAULT 1,
  total_installments INTEGER DEFAULT 1,
  parent_id UUID REFERENCES public.receivables(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payables table (Accounts Payable)
CREATE TABLE public.payables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  chart_account_id UUID REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  document_number TEXT,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  total_amount NUMERIC NOT NULL CHECK (total_amount > 0),
  paid_amount NUMERIC NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  status payable_status NOT NULL DEFAULT 'pendente',
  installment_number INTEGER DEFAULT 1,
  total_installments INTEGER DEFAULT 1,
  parent_id UUID REFERENCES public.payables(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payment_records table (Payment history for both receivables and payables)
CREATE TABLE public.payment_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  receivable_id UUID REFERENCES public.receivables(id) ON DELETE CASCADE,
  payable_id UUID REFERENCES public.payables(id) ON DELETE CASCADE,
  bank_account_id UUID NOT NULL REFERENCES public.bank_accounts(id) ON DELETE RESTRICT,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method payment_method NOT NULL DEFAULT 'pix',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT payment_records_check CHECK (
    (receivable_id IS NOT NULL AND payable_id IS NULL) OR 
    (receivable_id IS NULL AND payable_id IS NOT NULL)
  )
);

-- Enable RLS on all tables
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receivables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;

-- Transactions RLS Policies
CREATE POLICY "Users can view transactions of their companies"
ON public.transactions FOR SELECT
USING (user_belongs_to_company(auth.uid(), company_id));

CREATE POLICY "Admins and editors can insert transactions"
ON public.transactions FOR INSERT
WITH CHECK (user_belongs_to_company(auth.uid(), company_id) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor')));

CREATE POLICY "Admins and editors can update transactions"
ON public.transactions FOR UPDATE
USING (user_belongs_to_company(auth.uid(), company_id) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor')));

CREATE POLICY "Admins can delete transactions"
ON public.transactions FOR DELETE
USING (user_belongs_to_company(auth.uid(), company_id) AND has_role(auth.uid(), 'admin'));

-- Receivables RLS Policies
CREATE POLICY "Users can view receivables of their companies"
ON public.receivables FOR SELECT
USING (user_belongs_to_company(auth.uid(), company_id));

CREATE POLICY "Admins and editors can insert receivables"
ON public.receivables FOR INSERT
WITH CHECK (user_belongs_to_company(auth.uid(), company_id) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor')));

CREATE POLICY "Admins and editors can update receivables"
ON public.receivables FOR UPDATE
USING (user_belongs_to_company(auth.uid(), company_id) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor')));

CREATE POLICY "Admins can delete receivables"
ON public.receivables FOR DELETE
USING (user_belongs_to_company(auth.uid(), company_id) AND has_role(auth.uid(), 'admin'));

-- Payables RLS Policies
CREATE POLICY "Users can view payables of their companies"
ON public.payables FOR SELECT
USING (user_belongs_to_company(auth.uid(), company_id));

CREATE POLICY "Admins and editors can insert payables"
ON public.payables FOR INSERT
WITH CHECK (user_belongs_to_company(auth.uid(), company_id) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor')));

CREATE POLICY "Admins and editors can update payables"
ON public.payables FOR UPDATE
USING (user_belongs_to_company(auth.uid(), company_id) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor')));

CREATE POLICY "Admins can delete payables"
ON public.payables FOR DELETE
USING (user_belongs_to_company(auth.uid(), company_id) AND has_role(auth.uid(), 'admin'));

-- Payment Records RLS Policies (access through parent receivable/payable)
CREATE POLICY "Users can view payment_records of their companies"
ON public.payment_records FOR SELECT
USING (
  (receivable_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.receivables r WHERE r.id = receivable_id AND user_belongs_to_company(auth.uid(), r.company_id)
  )) OR
  (payable_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.payables p WHERE p.id = payable_id AND user_belongs_to_company(auth.uid(), p.company_id)
  ))
);

CREATE POLICY "Admins and editors can insert payment_records"
ON public.payment_records FOR INSERT
WITH CHECK (
  (receivable_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.receivables r WHERE r.id = receivable_id 
    AND user_belongs_to_company(auth.uid(), r.company_id) 
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'))
  )) OR
  (payable_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.payables p WHERE p.id = payable_id 
    AND user_belongs_to_company(auth.uid(), p.company_id)
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'))
  ))
);

CREATE POLICY "Admins can delete payment_records"
ON public.payment_records FOR DELETE
USING (
  (receivable_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.receivables r WHERE r.id = receivable_id 
    AND user_belongs_to_company(auth.uid(), r.company_id) AND has_role(auth.uid(), 'admin')
  )) OR
  (payable_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.payables p WHERE p.id = payable_id 
    AND user_belongs_to_company(auth.uid(), p.company_id) AND has_role(auth.uid(), 'admin')
  ))
);

-- Create triggers for updated_at
CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_receivables_updated_at
BEFORE UPDATE ON public.receivables
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payables_updated_at
BEFORE UPDATE ON public.payables
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update bank account balance after transaction
CREATE OR REPLACE FUNCTION public.update_bank_balance_on_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
    -- Revert old transaction
    IF OLD.type = 'entrada' THEN
      UPDATE public.bank_accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.bank_account_id;
    ELSE
      UPDATE public.bank_accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.bank_account_id;
    END IF;
    -- Apply new transaction
    IF NEW.type = 'entrada' THEN
      UPDATE public.bank_accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.bank_account_id;
    ELSE
      UPDATE public.bank_accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.bank_account_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER update_bank_balance_transaction
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.update_bank_balance_on_transaction();

-- Function to update bank account balance after payment record
CREATE OR REPLACE FUNCTION public.update_bank_balance_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.receivable_id IS NOT NULL THEN
      -- Receivable payment = money coming in
      UPDATE public.bank_accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.bank_account_id;
      -- Update receivable paid_amount and status
      UPDATE public.receivables 
      SET paid_amount = paid_amount + NEW.amount,
          status = CASE 
            WHEN paid_amount + NEW.amount >= total_amount THEN 'pago'::receivable_status
            WHEN paid_amount + NEW.amount > 0 THEN 'parcial'::receivable_status
            ELSE 'pendente'::receivable_status
          END
      WHERE id = NEW.receivable_id;
    ELSE
      -- Payable payment = money going out
      UPDATE public.bank_accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.bank_account_id;
      -- Update payable paid_amount and status
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

CREATE TRIGGER update_bank_balance_payment
AFTER INSERT OR DELETE ON public.payment_records
FOR EACH ROW EXECUTE FUNCTION public.update_bank_balance_on_payment();

-- Create indexes for better performance
CREATE INDEX idx_transactions_company_date ON public.transactions(company_id, transaction_date);
CREATE INDEX idx_transactions_bank_account ON public.transactions(bank_account_id);
CREATE INDEX idx_receivables_company_status ON public.receivables(company_id, status);
CREATE INDEX idx_receivables_due_date ON public.receivables(due_date);
CREATE INDEX idx_receivables_customer ON public.receivables(customer_id);
CREATE INDEX idx_payables_company_status ON public.payables(company_id, status);
CREATE INDEX idx_payables_due_date ON public.payables(due_date);
CREATE INDEX idx_payables_supplier ON public.payables(supplier_id);
CREATE INDEX idx_payment_records_receivable ON public.payment_records(receivable_id);
CREATE INDEX idx_payment_records_payable ON public.payment_records(payable_id);


-- ============================================
-- Migration: 20260109192245_8268e50c-4729-4527-ae5c-1779b95e3b6a.sql
-- ============================================
-- Add new columns to companies table for complete address
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS neighborhood text,
ADD COLUMN IF NOT EXISTS number text,
ADD COLUMN IF NOT EXISTS complement text;

-- Create storage bucket for company logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('company_logos', 'company_logos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policy for logo uploads - authenticated users can upload
CREATE POLICY "Authenticated users can upload company logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'company_logos');

-- RLS policy for viewing logos - anyone authenticated can view
CREATE POLICY "Authenticated users can view company logos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'company_logos');

-- RLS policy for updating logos
CREATE POLICY "Authenticated users can update company logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'company_logos');

-- RLS policy for deleting logos
CREATE POLICY "Authenticated users can delete company logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'company_logos');

-- ============================================
-- Migration: 20260110022810_0325eb16-3bce-4adf-8093-381485097f77.sql
-- ============================================

-- SEED DATA: 10 Empresas com UUIDs válidos
-- Parte 1: Empresas, User Companies, Contas Bancárias e Plano de Contas

-- 1. INSERIR 10 EMPRESAS
INSERT INTO public.companies (id, name, trading_name, document, email, phone, address, number, neighborhood, city, state, zip_code, is_headquarters) VALUES
('a1111111-1111-1111-1111-111111111111', 'Tech Solutions Ltda', 'Tech Solutions', '12.345.678/0001-90', 'contato@techsolutions.com.br', '(11) 99999-1111', 'Av. Paulista', '1000', 'Bela Vista', 'São Paulo', 'SP', '01310-100', true),
('a2222222-2222-2222-2222-222222222222', 'Construtora Horizonte SA', 'Horizonte', '23.456.789/0001-01', 'contato@horizonte.com.br', '(21) 99999-2222', 'Av. Rio Branco', '500', 'Centro', 'Rio de Janeiro', 'RJ', '20040-002', true),
('a3333333-3333-3333-3333-333333333333', 'Distribuidora Alimenta Ltda', 'Alimenta', '34.567.890/0001-12', 'vendas@alimenta.com.br', '(31) 99999-3333', 'Av. Amazonas', '2500', 'Prado', 'Belo Horizonte', 'MG', '30110-150', true),
('a4444444-4444-4444-4444-444444444444', 'Clínica Saúde Total', 'Saúde Total', '45.678.901/0001-23', 'atendimento@saudetotal.com.br', '(41) 99999-4444', 'Rua XV de Novembro', '300', 'Centro', 'Curitiba', 'PR', '80020-310', true),
('a5555555-5555-5555-5555-555555555555', 'Auto Peças Express Ltda', 'Auto Express', '56.789.012/0001-34', 'vendas@autoexpress.com.br', '(51) 99999-5555', 'Av. Assis Brasil', '1500', 'Passo d''Areia', 'Porto Alegre', 'RS', '91010-001', true),
('a6666666-6666-6666-6666-666666666666', 'Agro Fazenda Verde SA', 'Fazenda Verde', '67.890.123/0001-45', 'contato@fazendaverde.com.br', '(62) 99999-6666', 'Av. Goiás', '800', 'Centro', 'Goiânia', 'GO', '74005-010', true),
('a7777777-7777-7777-7777-777777777777', 'Loja Moda Fashion', 'Moda Fashion', '78.901.234/0001-56', 'vendas@modafashion.com.br', '(71) 99999-7777', 'Av. Sete de Setembro', '1200', 'Vitória', 'Salvador', 'BA', '40080-001', true),
('a8888888-8888-8888-8888-888888888888', 'Restaurante Sabor e Arte', 'Sabor e Arte', '89.012.345/0001-67', 'reservas@saborarte.com.br', '(81) 99999-8888', 'Rua do Bom Jesus', '150', 'Recife Antigo', 'Recife', 'PE', '50030-170', true),
('a9999999-9999-9999-9999-999999999999', 'Escritório Contábil Precisão', 'Precisão Contábil', '90.123.456/0001-78', 'contato@precisaocontabil.com.br', '(48) 99999-9999', 'Av. Beira Mar Norte', '2000', 'Centro', 'Florianópolis', 'SC', '88015-200', true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Indústria Plásticos Brasil', 'Plásticos Brasil', '01.234.567/0001-89', 'comercial@plasticosbrasil.com.br', '(19) 99999-0000', 'Rod. Anhanguera', 'km 105', 'Distrito Industrial', 'Campinas', 'SP', '13054-750', true);

-- 2. VINCULAR USUÁRIO ÀS EMPRESAS
INSERT INTO public.user_companies (user_id, company_id, is_default) VALUES
('a496bc49-e02e-4f73-852e-9ff016604c82', 'a1111111-1111-1111-1111-111111111111', true),
('a496bc49-e02e-4f73-852e-9ff016604c82', 'a2222222-2222-2222-2222-222222222222', false),
('a496bc49-e02e-4f73-852e-9ff016604c82', 'a3333333-3333-3333-3333-333333333333', false),
('a496bc49-e02e-4f73-852e-9ff016604c82', 'a4444444-4444-4444-4444-444444444444', false),
('a496bc49-e02e-4f73-852e-9ff016604c82', 'a5555555-5555-5555-5555-555555555555', false),
('a496bc49-e02e-4f73-852e-9ff016604c82', 'a6666666-6666-6666-6666-666666666666', false),
('a496bc49-e02e-4f73-852e-9ff016604c82', 'a7777777-7777-7777-7777-777777777777', false),
('a496bc49-e02e-4f73-852e-9ff016604c82', 'a8888888-8888-8888-8888-888888888888', false),
('a496bc49-e02e-4f73-852e-9ff016604c82', 'a9999999-9999-9999-9999-999999999999', false),
('a496bc49-e02e-4f73-852e-9ff016604c82', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', false);

-- 3. CRIAR CONTAS BANCÁRIAS
INSERT INTO public.bank_accounts (company_id, name, bank_name, agency, account_number, account_type, initial_balance, current_balance, is_active) VALUES
('a1111111-1111-1111-1111-111111111111', 'Conta Corrente Principal', 'Banco do Brasil', '1234-5', '12345-6', 'corrente', 50000, 85000, true),
('a1111111-1111-1111-1111-111111111111', 'Poupança Reserva', 'Banco do Brasil', '1234-5', '12345-7', 'poupanca', 25000, 30000, true),
('a2222222-2222-2222-2222-222222222222', 'Conta Corrente Itaú', 'Itaú', '0567', '45678-9', 'corrente', 150000, 220000, true),
('a2222222-2222-2222-2222-222222222222', 'Investimentos', 'Itaú', '0567', '45678-0', 'investimento', 100000, 115000, true),
('a3333333-3333-3333-3333-333333333333', 'Conta Bradesco', 'Bradesco', '2345', '23456-7', 'corrente', 80000, 95000, true),
('a3333333-3333-3333-3333-333333333333', 'Poupança', 'Bradesco', '2345', '23456-8', 'poupanca', 40000, 45000, true),
('a4444444-4444-4444-4444-444444444444', 'Conta Santander', 'Santander', '3456', '34567-8', 'corrente', 60000, 72000, true),
('a4444444-4444-4444-4444-444444444444', 'Reserva Emergência', 'Santander', '3456', '34567-9', 'poupanca', 30000, 35000, true),
('a5555555-5555-5555-5555-555555555555', 'Conta Caixa', 'Caixa', '4567', '45678-0', 'corrente', 45000, 55000, true),
('a5555555-5555-5555-5555-555555555555', 'Poupança Caixa', 'Caixa', '4567', '45678-1', 'poupanca', 20000, 22000, true),
('a6666666-6666-6666-6666-666666666666', 'Conta Sicredi', 'Sicredi', '5678', '56789-1', 'corrente', 200000, 280000, true),
('a6666666-6666-6666-6666-666666666666', 'Investimento Agro', 'Sicredi', '5678', '56789-2', 'investimento', 150000, 180000, true),
('a7777777-7777-7777-7777-777777777777', 'Conta Inter', 'Banco Inter', '0001', '67890-2', 'corrente', 35000, 42000, true),
('a7777777-7777-7777-7777-777777777777', 'Poupança Inter', 'Banco Inter', '0001', '67890-3', 'poupanca', 15000, 18000, true),
('a8888888-8888-8888-8888-888888888888', 'Conta Nubank', 'Nubank', '0001', '78901-3', 'corrente', 25000, 32000, true),
('a8888888-8888-8888-8888-888888888888', 'Reserva', 'Nubank', '0001', '78901-4', 'poupanca', 10000, 12000, true),
('a9999999-9999-9999-9999-999999999999', 'Conta Original', 'Banco Original', '0001', '89012-4', 'corrente', 40000, 48000, true),
('a9999999-9999-9999-9999-999999999999', 'Poupança Original', 'Banco Original', '0001', '89012-5', 'poupanca', 20000, 24000, true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Conta Safra', 'Banco Safra', '0789', '90123-5', 'corrente', 120000, 145000, true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Investimento Safra', 'Banco Safra', '0789', '90123-6', 'investimento', 80000, 95000, true);

-- 4. CRIAR PLANO DE CONTAS (Tech Solutions como exemplo principal)
INSERT INTO public.chart_of_accounts (id, company_id, code, name, type, dre_category, is_active) VALUES
('ca111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', '1.1.01', 'Vendas de Software', 'receita', 'Receita Bruta', true),
('ca111111-1111-1111-1111-111111111112', 'a1111111-1111-1111-1111-111111111111', '1.1.02', 'Consultoria em TI', 'receita', 'Receita Bruta', true),
('ca111111-1111-1111-1111-111111111113', 'a1111111-1111-1111-1111-111111111111', '1.1.03', 'Suporte Técnico', 'receita', 'Receita Bruta', true),
('ca111111-1111-1111-1111-111111111114', 'a1111111-1111-1111-1111-111111111111', '2.1.01', 'Folha de Pagamento', 'despesa', 'Despesas Operacionais', true),
('ca111111-1111-1111-1111-111111111115', 'a1111111-1111-1111-1111-111111111111', '2.1.02', 'Aluguel', 'despesa', 'Despesas Operacionais', true),
('ca111111-1111-1111-1111-111111111116', 'a1111111-1111-1111-1111-111111111111', '2.1.03', 'Energia Elétrica', 'despesa', 'Despesas Operacionais', true),
('ca111111-1111-1111-1111-111111111117', 'a1111111-1111-1111-1111-111111111111', '2.1.04', 'Internet e Telecom', 'despesa', 'Despesas Operacionais', true),
('ca111111-1111-1111-1111-111111111118', 'a1111111-1111-1111-1111-111111111111', '2.1.05', 'Marketing Digital', 'despesa', 'Despesas Comerciais', true),
('ca111111-1111-1111-1111-111111111119', 'a1111111-1111-1111-1111-111111111111', '3.1.01', 'Licenças de Software', 'custo', 'Custos', true),
('ca111111-1111-1111-1111-11111111111a', 'a1111111-1111-1111-1111-111111111111', '3.1.02', 'Infraestrutura Cloud', 'custo', 'Custos', true);

-- 5. CRIAR CLIENTES (Tech Solutions)
INSERT INTO public.customers (company_id, name, document, email, phone, address, city, state, zip_code, is_active) VALUES
('a1111111-1111-1111-1111-111111111111', 'Empresa Alpha Tecnologia', '11.111.111/0001-11', 'contato@alpha.com.br', '(11) 3333-1111', 'Rua Augusta, 500', 'São Paulo', 'SP', '01304-000', true),
('a1111111-1111-1111-1111-111111111111', 'Beta Sistemas Ltda', '22.222.222/0001-22', 'contato@beta.com.br', '(11) 3333-2222', 'Av. Faria Lima, 1000', 'São Paulo', 'SP', '04538-132', true),
('a1111111-1111-1111-1111-111111111111', 'Gamma Consultoria', '33.333.333/0001-33', 'contato@gamma.com.br', '(11) 3333-3333', 'Rua Funchal, 200', 'São Paulo', 'SP', '04551-060', true),
('a1111111-1111-1111-1111-111111111111', 'Delta Informática SA', '44.444.444/0001-44', 'contato@delta.com.br', '(11) 3333-4444', 'Av. Berrini, 300', 'São Paulo', 'SP', '04571-000', true),
('a1111111-1111-1111-1111-111111111111', 'Epsilon Digital', '55.555.555/0001-55', 'contato@epsilon.com.br', '(11) 3333-5555', 'Rua Verbo Divino, 400', 'São Paulo', 'SP', '04719-002', true);

-- 6. CRIAR FORNECEDORES (Tech Solutions)
INSERT INTO public.suppliers (company_id, name, document, email, phone, address, city, state, zip_code, is_active) VALUES
('a1111111-1111-1111-1111-111111111111', 'Microsoft Brasil', '60.316.817/0001-03', 'vendas@microsoft.com.br', '(11) 4004-1234', 'Av. Nações Unidas, 12901', 'São Paulo', 'SP', '04578-000', true),
('a1111111-1111-1111-1111-111111111111', 'Amazon AWS', '13.134.060/0001-33', 'aws-br@amazon.com', '(11) 4004-5678', 'Av. Paulista, 2300', 'São Paulo', 'SP', '01310-300', true),
('a1111111-1111-1111-1111-111111111111', 'Dell Computadores', '72.381.189/0001-10', 'comercial@dell.com.br', '(11) 4004-9012', 'Av. Industrial, 700', 'Eldorado do Sul', 'RS', '92990-000', true),
('a1111111-1111-1111-1111-111111111111', 'Algar Telecom', '71.208.516/0001-74', 'empresas@algar.com.br', '(34) 3003-3456', 'Rua José Alves, 100', 'Uberlândia', 'MG', '38400-678', true),
('a1111111-1111-1111-1111-111111111111', 'Kalunga Escritório', '43.283.811/0001-50', 'corporativo@kalunga.com.br', '(11) 3003-7890', 'Av. Indianópolis, 2000', 'São Paulo', 'SP', '04063-000', true);


-- ============================================
-- Migration: 20260110024906_b55f1366-6ad5-4a90-ad43-69259102456a.sql
-- ============================================

-- Complete demo data using REAL company IDs:
-- a1111111-1111-1111-1111-111111111111 = Tech Solutions Ltda
-- a2222222-2222-2222-2222-222222222222 = Construtora Horizonte SA
-- a3333333-3333-3333-3333-333333333333 = Distribuidora Alimenta Ltda
-- a4444444-4444-4444-4444-444444444444 = Clínica Saúde Total
-- a5555555-5555-5555-5555-555555555555 = Auto Peças Express Ltda
-- a6666666-6666-6666-6666-666666666666 = Agro Fazenda Verde SA
-- a7777777-7777-7777-7777-777777777777 = Loja Moda Fashion
-- a8888888-8888-8888-8888-888888888888 = Restaurante Sabor e Arte
-- a9999999-9999-9999-9999-999999999999 = Escritório Contábil Precisão
-- aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa = Indústria Plásticos Brasil

-- =====================================================
-- 1. CHART OF ACCOUNTS for 9 companies (Tech Solutions already has)
-- =====================================================
INSERT INTO chart_of_accounts (company_id, code, name, type, dre_category, is_active) VALUES
-- Construtora Horizonte SA
('a2222222-2222-2222-2222-222222222222', '3.1.01', 'Receita de Obras', 'receita', 'receita_operacional', true),
('a2222222-2222-2222-2222-222222222222', '3.1.02', 'Consultoria Técnica', 'receita', 'receita_operacional', true),
('a2222222-2222-2222-2222-222222222222', '3.1.03', 'Juros Recebidos', 'receita', 'receitas_financeiras', true),
('a2222222-2222-2222-2222-222222222222', '3.1.04', 'Outras Receitas', 'receita', 'outras_receitas', true),
('a2222222-2222-2222-2222-222222222222', '4.1.01', 'Mão de Obra', 'despesa', 'despesas_operacionais', true),
('a2222222-2222-2222-2222-222222222222', '4.1.02', 'Materiais de Construção', 'despesa', 'custo_mercadorias', true),
('a2222222-2222-2222-2222-222222222222', '4.1.03', 'Equipamentos', 'despesa', 'despesas_operacionais', true),
('a2222222-2222-2222-2222-222222222222', '4.1.04', 'Transporte', 'despesa', 'despesas_operacionais', true),
('a2222222-2222-2222-2222-222222222222', '4.1.05', 'Seguros', 'despesa', 'despesas_operacionais', true),
('a2222222-2222-2222-2222-222222222222', '4.1.06', 'Impostos', 'despesa', 'impostos', true),
-- Distribuidora Alimenta Ltda
('a3333333-3333-3333-3333-333333333333', '3.1.01', 'Vendas de Mercadorias', 'receita', 'receita_operacional', true),
('a3333333-3333-3333-3333-333333333333', '3.1.02', 'Frete Cobrado', 'receita', 'receita_operacional', true),
('a3333333-3333-3333-3333-333333333333', '3.1.03', 'Juros Recebidos', 'receita', 'receitas_financeiras', true),
('a3333333-3333-3333-3333-333333333333', '3.1.04', 'Outras Receitas', 'receita', 'outras_receitas', true),
('a3333333-3333-3333-3333-333333333333', '4.1.01', 'Folha de Pagamento', 'despesa', 'despesas_operacionais', true),
('a3333333-3333-3333-3333-333333333333', '4.1.02', 'Custo de Mercadorias', 'despesa', 'custo_mercadorias', true),
('a3333333-3333-3333-3333-333333333333', '4.1.03', 'Frete Pago', 'despesa', 'despesas_operacionais', true),
('a3333333-3333-3333-3333-333333333333', '4.1.04', 'Armazenagem', 'despesa', 'despesas_operacionais', true),
('a3333333-3333-3333-3333-333333333333', '4.1.05', 'Combustível', 'despesa', 'despesas_operacionais', true),
('a3333333-3333-3333-3333-333333333333', '4.1.06', 'Impostos', 'despesa', 'impostos', true),
-- Clínica Saúde Total
('a4444444-4444-4444-4444-444444444444', '3.1.01', 'Consultas Médicas', 'receita', 'receita_operacional', true),
('a4444444-4444-4444-4444-444444444444', '3.1.02', 'Exames', 'receita', 'receita_operacional', true),
('a4444444-4444-4444-4444-444444444444', '3.1.03', 'Procedimentos', 'receita', 'receita_operacional', true),
('a4444444-4444-4444-4444-444444444444', '3.1.04', 'Outras Receitas', 'receita', 'outras_receitas', true),
('a4444444-4444-4444-4444-444444444444', '4.1.01', 'Folha de Pagamento', 'despesa', 'despesas_operacionais', true),
('a4444444-4444-4444-4444-444444444444', '4.1.02', 'Materiais Médicos', 'despesa', 'custo_mercadorias', true),
('a4444444-4444-4444-4444-444444444444', '4.1.03', 'Aluguel', 'despesa', 'despesas_operacionais', true),
('a4444444-4444-4444-4444-444444444444', '4.1.04', 'Equipamentos', 'despesa', 'despesas_operacionais', true),
('a4444444-4444-4444-4444-444444444444', '4.1.05', 'Seguros', 'despesa', 'despesas_operacionais', true),
('a4444444-4444-4444-4444-444444444444', '4.1.06', 'Impostos', 'despesa', 'impostos', true),
-- Auto Peças Express Ltda
('a5555555-5555-5555-5555-555555555555', '3.1.01', 'Vendas de Peças', 'receita', 'receita_operacional', true),
('a5555555-5555-5555-5555-555555555555', '3.1.02', 'Serviços de Instalação', 'receita', 'receita_operacional', true),
('a5555555-5555-5555-5555-555555555555', '3.1.03', 'Juros Recebidos', 'receita', 'receitas_financeiras', true),
('a5555555-5555-5555-5555-555555555555', '3.1.04', 'Outras Receitas', 'receita', 'outras_receitas', true),
('a5555555-5555-5555-5555-555555555555', '4.1.01', 'Folha de Pagamento', 'despesa', 'despesas_operacionais', true),
('a5555555-5555-5555-5555-555555555555', '4.1.02', 'Custo de Mercadorias', 'despesa', 'custo_mercadorias', true),
('a5555555-5555-5555-5555-555555555555', '4.1.03', 'Aluguel', 'despesa', 'despesas_operacionais', true),
('a5555555-5555-5555-5555-555555555555', '4.1.04', 'Marketing', 'despesa', 'despesas_operacionais', true),
('a5555555-5555-5555-5555-555555555555', '4.1.05', 'Frete', 'despesa', 'despesas_operacionais', true),
('a5555555-5555-5555-5555-555555555555', '4.1.06', 'Impostos', 'despesa', 'impostos', true),
-- Agro Fazenda Verde SA
('a6666666-6666-6666-6666-666666666666', '3.1.01', 'Vendas de Grãos', 'receita', 'receita_operacional', true),
('a6666666-6666-6666-6666-666666666666', '3.1.02', 'Vendas de Gado', 'receita', 'receita_operacional', true),
('a6666666-6666-6666-6666-666666666666', '3.1.03', 'Juros Recebidos', 'receita', 'receitas_financeiras', true),
('a6666666-6666-6666-6666-666666666666', '3.1.04', 'Outras Receitas', 'receita', 'outras_receitas', true),
('a6666666-6666-6666-6666-666666666666', '4.1.01', 'Mão de Obra Rural', 'despesa', 'despesas_operacionais', true),
('a6666666-6666-6666-6666-666666666666', '4.1.02', 'Insumos Agrícolas', 'despesa', 'custo_mercadorias', true),
('a6666666-6666-6666-6666-666666666666', '4.1.03', 'Combustível', 'despesa', 'despesas_operacionais', true),
('a6666666-6666-6666-6666-666666666666', '4.1.04', 'Manutenção Máquinas', 'despesa', 'despesas_operacionais', true),
('a6666666-6666-6666-6666-666666666666', '4.1.05', 'Veterinário', 'despesa', 'despesas_operacionais', true),
('a6666666-6666-6666-6666-666666666666', '4.1.06', 'Impostos', 'despesa', 'impostos', true),
-- Loja Moda Fashion
('a7777777-7777-7777-7777-777777777777', '3.1.01', 'Vendas de Roupas', 'receita', 'receita_operacional', true),
('a7777777-7777-7777-7777-777777777777', '3.1.02', 'Vendas Online', 'receita', 'receita_operacional', true),
('a7777777-7777-7777-7777-777777777777', '3.1.03', 'Juros Recebidos', 'receita', 'receitas_financeiras', true),
('a7777777-7777-7777-7777-777777777777', '3.1.04', 'Outras Receitas', 'receita', 'outras_receitas', true),
('a7777777-7777-7777-7777-777777777777', '4.1.01', 'Folha de Pagamento', 'despesa', 'despesas_operacionais', true),
('a7777777-7777-7777-7777-777777777777', '4.1.02', 'Custo de Mercadorias', 'despesa', 'custo_mercadorias', true),
('a7777777-7777-7777-7777-777777777777', '4.1.03', 'Aluguel Shopping', 'despesa', 'despesas_operacionais', true),
('a7777777-7777-7777-7777-777777777777', '4.1.04', 'Marketing', 'despesa', 'despesas_operacionais', true),
('a7777777-7777-7777-7777-777777777777', '4.1.05', 'Embalagens', 'despesa', 'despesas_operacionais', true),
('a7777777-7777-7777-7777-777777777777', '4.1.06', 'Impostos', 'despesa', 'impostos', true),
-- Restaurante Sabor e Arte
('a8888888-8888-8888-8888-888888888888', '3.1.01', 'Vendas Restaurante', 'receita', 'receita_operacional', true),
('a8888888-8888-8888-8888-888888888888', '3.1.02', 'Delivery', 'receita', 'receita_operacional', true),
('a8888888-8888-8888-8888-888888888888', '3.1.03', 'Eventos', 'receita', 'receita_operacional', true),
('a8888888-8888-8888-8888-888888888888', '3.1.04', 'Outras Receitas', 'receita', 'outras_receitas', true),
('a8888888-8888-8888-8888-888888888888', '4.1.01', 'Folha de Pagamento', 'despesa', 'despesas_operacionais', true),
('a8888888-8888-8888-8888-888888888888', '4.1.02', 'Insumos e Alimentos', 'despesa', 'custo_mercadorias', true),
('a8888888-8888-8888-8888-888888888888', '4.1.03', 'Aluguel', 'despesa', 'despesas_operacionais', true),
('a8888888-8888-8888-8888-888888888888', '4.1.04', 'Energia e Gás', 'despesa', 'despesas_operacionais', true),
('a8888888-8888-8888-8888-888888888888', '4.1.05', 'Marketing', 'despesa', 'despesas_operacionais', true),
('a8888888-8888-8888-8888-888888888888', '4.1.06', 'Impostos', 'despesa', 'impostos', true),
-- Escritório Contábil Precisão
('a9999999-9999-9999-9999-999999999999', '3.1.01', 'Honorários Contábeis', 'receita', 'receita_operacional', true),
('a9999999-9999-9999-9999-999999999999', '3.1.02', 'Consultoria Fiscal', 'receita', 'receita_operacional', true),
('a9999999-9999-9999-9999-999999999999', '3.1.03', 'Abertura de Empresas', 'receita', 'receita_operacional', true),
('a9999999-9999-9999-9999-999999999999', '3.1.04', 'Outras Receitas', 'receita', 'outras_receitas', true),
('a9999999-9999-9999-9999-999999999999', '4.1.01', 'Folha de Pagamento', 'despesa', 'despesas_operacionais', true),
('a9999999-9999-9999-9999-999999999999', '4.1.02', 'Software e Sistemas', 'despesa', 'despesas_operacionais', true),
('a9999999-9999-9999-9999-999999999999', '4.1.03', 'Aluguel', 'despesa', 'despesas_operacionais', true),
('a9999999-9999-9999-9999-999999999999', '4.1.04', 'Cursos e Treinamentos', 'despesa', 'despesas_operacionais', true),
('a9999999-9999-9999-9999-999999999999', '4.1.05', 'Material de Escritório', 'despesa', 'despesas_operacionais', true),
('a9999999-9999-9999-9999-999999999999', '4.1.06', 'Impostos', 'despesa', 'impostos', true),
-- Indústria Plásticos Brasil
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '3.1.01', 'Vendas de Produtos', 'receita', 'receita_operacional', true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '3.1.02', 'Serviços de Injeção', 'receita', 'receita_operacional', true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '3.1.03', 'Juros Recebidos', 'receita', 'receitas_financeiras', true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '3.1.04', 'Outras Receitas', 'receita', 'outras_receitas', true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '4.1.01', 'Folha de Pagamento', 'despesa', 'despesas_operacionais', true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '4.1.02', 'Matéria Prima', 'despesa', 'custo_mercadorias', true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '4.1.03', 'Energia Elétrica', 'despesa', 'despesas_operacionais', true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '4.1.04', 'Manutenção de Máquinas', 'despesa', 'despesas_operacionais', true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '4.1.05', 'Frete', 'despesa', 'despesas_operacionais', true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '4.1.06', 'Impostos', 'despesa', 'impostos', true);

-- =====================================================
-- 2. CUSTOMERS for 9 companies (Tech Solutions already has 5)
-- =====================================================
INSERT INTO customers (company_id, name, document, email, phone, city, state, is_active) VALUES
-- Construtora Horizonte SA customers
('a2222222-2222-2222-2222-222222222222', 'Incorporadora Vista Bela', '66.777.888/0001-66', 'projetos@vistabela.com.br', '(21) 6666-7777', 'Rio de Janeiro', 'RJ', true),
('a2222222-2222-2222-2222-222222222222', 'Condomínio Jardins', '77.888.999/0001-77', 'sindico@jardins.com.br', '(21) 7777-8888', 'Niterói', 'RJ', true),
('a2222222-2222-2222-2222-222222222222', 'Shopping Center Sul', '88.999.000/0001-88', 'expansao@shoppingsul.com.br', '(21) 8888-9999', 'Rio de Janeiro', 'RJ', true),
('a2222222-2222-2222-2222-222222222222', 'Hospital Regional', '99.000.111/0001-99', 'obras@hospitalregional.com.br', '(21) 9999-0000', 'Petrópolis', 'RJ', true),
('a2222222-2222-2222-2222-222222222222', 'Prefeitura Municipal', '00.111.222/0001-00', 'licitacoes@prefeitura.gov.br', '(21) 0000-1111', 'Teresópolis', 'RJ', true),
-- Distribuidora Alimenta Ltda customers
('a3333333-3333-3333-3333-333333333333', 'Rede de Farmácias Plus', '11.111.111/0001-11', 'compras@farmaciasplus.com.br', '(31) 1111-1111', 'Belo Horizonte', 'MG', true),
('a3333333-3333-3333-3333-333333333333', 'Supermercados Mineiro', '22.222.222/0001-22', 'abastecimento@smineiro.com.br', '(31) 2222-2222', 'Contagem', 'MG', true),
('a3333333-3333-3333-3333-333333333333', 'Lojas Americanas MG', '33.333.333/0001-33', 'distribuicao@americanasmg.com.br', '(31) 3333-3333', 'Betim', 'MG', true),
('a3333333-3333-3333-3333-333333333333', 'Atacarejo Popular', '44.444.444/0001-44', 'estoque@atacarejopopular.com.br', '(31) 4444-4444', 'Uberlândia', 'MG', true),
('a3333333-3333-3333-3333-333333333333', 'Drogaria Saúde', '55.555.555/0001-55', 'compras@drogariasaude.com.br', '(31) 5555-5555', 'Juiz de Fora', 'MG', true),
-- Clínica Saúde Total customers
('a4444444-4444-4444-4444-444444444444', 'Plano Saúde Unimed', '17.171.717/0001-17', 'credenciamento@unimed.com.br', '(41) 1717-1717', 'Curitiba', 'PR', true),
('a4444444-4444-4444-4444-444444444444', 'Bradesco Saúde', '18.181.818/0001-18', 'rede@bradescosaude.com.br', '(41) 1818-1818', 'Curitiba', 'PR', true),
('a4444444-4444-4444-4444-444444444444', 'SulAmérica Seguros', '19.191.919/0001-19', 'prestadores@sulamerica.com.br', '(41) 1919-1919', 'Curitiba', 'PR', true),
('a4444444-4444-4444-4444-444444444444', 'Amil Assistência Médica', '20.202.020/0001-20', 'credenciados@amil.com.br', '(41) 2020-2020', 'São José dos Pinhais', 'PR', true),
('a4444444-4444-4444-4444-444444444444', 'Particular - Maria Silva', '123.456.789-00', 'maria.silva@email.com', '(41) 99999-0000', 'Curitiba', 'PR', true),
-- Auto Peças Express customers
('a5555555-5555-5555-5555-555555555555', 'Oficina Mecânica Central', '66.666.666/0001-66', 'compras@oficina.com.br', '(11) 6666-6666', 'São Paulo', 'SP', true),
('a5555555-5555-5555-5555-555555555555', 'Auto Center Express', '77.777.777/0001-77', 'pedidos@autocenter.com.br', '(11) 7777-7777', 'Campinas', 'SP', true),
('a5555555-5555-5555-5555-555555555555', 'Concessionária Toyota', '88.888.888/0001-88', 'pecas@toyota.com.br', '(11) 8888-8888', 'São Paulo', 'SP', true),
('a5555555-5555-5555-5555-555555555555', 'Frota Transportes Ltda', '99.999.999/0001-99', 'manutencao@frota.com.br', '(11) 9999-9999', 'Guarulhos', 'SP', true),
('a5555555-5555-5555-5555-555555555555', 'Uber Brasil', '10.101.010/0001-10', 'fleet@uber.com.br', '(11) 1010-1010', 'São Paulo', 'SP', true),
-- Agro Fazenda Verde customers
('a6666666-6666-6666-6666-666666666666', 'Cargill Brasil', '12.121.212/0001-12', 'compras@cargill.com.br', '(11) 1212-1212', 'São Paulo', 'SP', true),
('a6666666-6666-6666-6666-666666666666', 'Bunge Alimentos', '13.131.313/0001-13', 'trading@bunge.com.br', '(11) 1313-1313', 'São Paulo', 'SP', true),
('a6666666-6666-6666-6666-666666666666', 'ADM Brasil', '14.141.414/0001-14', 'commodities@adm.com.br', '(11) 1414-1414', 'São Paulo', 'SP', true),
('a6666666-6666-6666-6666-666666666666', 'JBS Carnes', '15.151.515/0001-15', 'compras@jbs.com.br', '(11) 1515-1515', 'São Paulo', 'SP', true),
('a6666666-6666-6666-6666-666666666666', 'Minerva Foods', '16.161.616/0001-16', 'trading@minerva.com.br', '(11) 1616-1616', 'Barretos', 'SP', true),
-- Loja Moda Fashion customers
('a7777777-7777-7777-7777-777777777777', 'Maria Clara Santos', '111.222.333-44', 'maria.clara@email.com', '(51) 9999-1111', 'Porto Alegre', 'RS', true),
('a7777777-7777-7777-7777-777777777777', 'Ana Paula Oliveira', '222.333.444-55', 'ana.paula@email.com', '(51) 9999-2222', 'Porto Alegre', 'RS', true),
('a7777777-7777-7777-7777-777777777777', 'Empresa RH Fashion', '26.262.626/0001-26', 'uniformes@rhfashion.com.br', '(51) 2626-2626', 'Canoas', 'RS', true),
('a7777777-7777-7777-7777-777777777777', 'Boutique Elegance', '27.272.727/0001-27', 'compras@elegance.com.br', '(51) 2727-2727', 'Gramado', 'RS', true),
('a7777777-7777-7777-7777-777777777777', 'Shopping Iguatemi RS', '28.282.828/0001-28', 'lojistas@iguatemirs.com.br', '(51) 2828-2828', 'Porto Alegre', 'RS', true),
-- Restaurante Sabor e Arte customers
('a8888888-8888-8888-8888-888888888888', 'Empresa Tech Solutions', '12.121.212/0001-12', 'rh@techsolutions.com.br', '(51) 1212-1212', 'Porto Alegre', 'RS', true),
('a8888888-8888-8888-8888-888888888888', 'Banco Regional Sul', '13.131.313/0001-13', 'eventos@bancoregional.com.br', '(51) 1313-1313', 'Porto Alegre', 'RS', true),
('a8888888-8888-8888-8888-888888888888', 'Escritório Advocacia Silva', '14.141.414/0001-14', 'reunioes@silvaadvogados.com.br', '(51) 1414-1414', 'Canoas', 'RS', true),
('a8888888-8888-8888-8888-888888888888', 'Clínica Estética Bella', '15.151.515/0001-15', 'eventos@clinicabella.com.br', '(51) 1515-1515', 'Porto Alegre', 'RS', true),
('a8888888-8888-8888-8888-888888888888', 'iFood Delivery', '16.161.616/0001-16', 'parceiros@ifood.com.br', '(51) 1616-1616', 'Porto Alegre', 'RS', true),
-- Escritório Contábil Precisão customers
('a9999999-9999-9999-9999-999999999999', 'Padaria Pão Quente', '21.212.121/0001-21', 'contato@paoquente.com.br', '(71) 2121-2121', 'Salvador', 'BA', true),
('a9999999-9999-9999-9999-999999999999', 'Loja de Roupas Fashion', '22.232.232/0001-22', 'financeiro@fashionba.com.br', '(71) 2223-2232', 'Salvador', 'BA', true),
('a9999999-9999-9999-9999-999999999999', 'Oficina Mecânica Turbo', '23.232.323/0001-23', 'gerente@oficinaturbo.com.br', '(71) 2323-2323', 'Lauro de Freitas', 'BA', true),
('a9999999-9999-9999-9999-999999999999', 'Salão de Beleza Glamour', '24.242.424/0001-24', 'adm@salaoglamour.com.br', '(71) 2424-2424', 'Salvador', 'BA', true),
('a9999999-9999-9999-9999-999999999999', 'Petshop Animal Planet', '25.252.525/0001-25', 'dono@animalplanet.com.br', '(71) 2525-2525', 'Feira de Santana', 'BA', true),
-- Indústria Plásticos Brasil customers
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Fábrica de Brinquedos Fun', '26.262.626/0001-26', 'compras@brinquedosfun.com.br', '(11) 2626-2626', 'São Paulo', 'SP', true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Embalagens Plásticas SA', '27.272.727/0001-27', 'comercial@embalagens.com.br', '(11) 2727-2727', 'Guarulhos', 'SP', true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Utilidades Domésticas', '28.282.828/0001-28', 'compras@utilidades.com.br', '(11) 2828-2828', 'Osasco', 'SP', true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Indústria Automotiva XYZ', '29.292.929/0001-29', 'suprimentos@automotivaxyz.com.br', '(11) 2929-2929', 'São Bernardo', 'SP', true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Eletrodomésticos Plus', '30.303.030/0001-30', 'componentes@eletroplus.com.br', '(11) 3030-3030', 'Campinas', 'SP', true);

-- =====================================================
-- 3. SUPPLIERS for all 10 companies
-- =====================================================
INSERT INTO suppliers (company_id, name, document, email, phone, city, state, is_active) VALUES
-- Tech Solutions suppliers
('a1111111-1111-1111-1111-111111111111', 'AWS Brasil', '00.000.001/0001-01', 'vendas@aws.amazon.com', '(11) 0001-0001', 'São Paulo', 'SP', true),
('a1111111-1111-1111-1111-111111111111', 'Microsoft Brasil', '00.000.002/0001-02', 'licencas@microsoft.com', '(11) 0002-0002', 'São Paulo', 'SP', true),
('a1111111-1111-1111-1111-111111111111', 'Dell Technologies', '00.000.003/0001-03', 'vendas@dell.com.br', '(11) 0003-0003', 'São Paulo', 'SP', true),
('a1111111-1111-1111-1111-111111111111', 'Algar Telecom', '00.000.004/0001-04', 'corporativo@algar.com.br', '(11) 0004-0004', 'Uberlândia', 'MG', true),
('a1111111-1111-1111-1111-111111111111', 'Locaweb', '00.000.005/0001-05', 'comercial@locaweb.com.br', '(11) 0005-0005', 'São Paulo', 'SP', true),
-- Construtora Horizonte suppliers
('a2222222-2222-2222-2222-222222222222', 'Votorantim Cimentos', '00.000.016/0001-16', 'vendas@vcimentos.com.br', '(11) 0016-0016', 'São Paulo', 'SP', true),
('a2222222-2222-2222-2222-222222222222', 'Tigre S.A.', '00.000.017/0001-17', 'comercial@tigre.com.br', '(47) 0017-0017', 'Joinville', 'SC', true),
('a2222222-2222-2222-2222-222222222222', 'Lorenzetti', '00.000.018/0001-18', 'vendas@lorenzetti.com.br', '(11) 0018-0018', 'São Paulo', 'SP', true),
('a2222222-2222-2222-2222-222222222222', 'Quartzolit', '00.000.019/0001-19', 'comercial@quartzolit.com.br', '(11) 0019-0019', 'São Paulo', 'SP', true),
('a2222222-2222-2222-2222-222222222222', 'Portobello', '00.000.020/0001-20', 'vendas@portobello.com.br', '(48) 0020-0020', 'Tijucas', 'SC', true),
-- Distribuidora Alimenta suppliers
('a3333333-3333-3333-3333-333333333333', 'P&G Brasil', '00.000.021/0001-21', 'vendas@pg.com.br', '(11) 0021-0021', 'São Paulo', 'SP', true),
('a3333333-3333-3333-3333-333333333333', 'Unilever Brasil', '00.000.022/0001-22', 'comercial@unilever.com.br', '(11) 0022-0022', 'São Paulo', 'SP', true),
('a3333333-3333-3333-3333-333333333333', 'Colgate-Palmolive', '00.000.023/0001-23', 'vendas@colgate.com.br', '(11) 0023-0023', 'São Paulo', 'SP', true),
('a3333333-3333-3333-3333-333333333333', 'Nestlé Brasil', '00.000.024/0001-24', 'comercial@nestle.com.br', '(11) 0024-0024', 'São Paulo', 'SP', true),
('a3333333-3333-3333-3333-333333333333', 'Ambev', '00.000.025/0001-25', 'vendas@ambev.com.br', '(11) 0025-0025', 'São Paulo', 'SP', true),
-- Clínica Saúde Total suppliers
('a4444444-4444-4444-4444-444444444444', 'Medtronic Brasil', '00.000.036/0001-36', 'vendas@medtronic.com.br', '(11) 0036-0036', 'São Paulo', 'SP', true),
('a4444444-4444-4444-4444-444444444444', 'Philips Healthcare', '00.000.037/0001-37', 'comercial@philips.com.br', '(11) 0037-0037', 'Barueri', 'SP', true),
('a4444444-4444-4444-4444-444444444444', 'Siemens Healthineers', '00.000.038/0001-38', 'vendas@siemens.com.br', '(11) 0038-0038', 'São Paulo', 'SP', true),
('a4444444-4444-4444-4444-444444444444', 'Roche Diagnóstica', '00.000.039/0001-39', 'comercial@roche.com.br', '(11) 0039-0039', 'São Paulo', 'SP', true),
('a4444444-4444-4444-4444-444444444444', 'Eurofarma', '00.000.040/0001-40', 'vendas@eurofarma.com.br', '(11) 0040-0040', 'São Paulo', 'SP', true),
-- Auto Peças Express suppliers
('a5555555-5555-5555-5555-555555555555', 'Bosch Brasil', '00.000.041/0001-41', 'vendas@bosch.com.br', '(11) 0041-0041', 'Campinas', 'SP', true),
('a5555555-5555-5555-5555-555555555555', 'NGK do Brasil', '00.000.042/0001-42', 'comercial@ngk.com.br', '(11) 0042-0042', 'Mogi das Cruzes', 'SP', true),
('a5555555-5555-5555-5555-555555555555', 'Continental Pneus', '00.000.043/0001-43', 'vendas@continental.com.br', '(11) 0043-0043', 'Guarulhos', 'SP', true),
('a5555555-5555-5555-5555-555555555555', 'Mann Filter', '00.000.044/0001-44', 'comercial@mann.com.br', '(11) 0044-0044', 'Indaiatuba', 'SP', true),
('a5555555-5555-5555-5555-555555555555', 'Valeo Brasil', '00.000.045/0001-45', 'vendas@valeo.com.br', '(11) 0045-0045', 'Campinas', 'SP', true),
-- Agro Fazenda Verde suppliers
('a6666666-6666-6666-6666-666666666666', 'Syngenta Brasil', '00.000.046/0001-46', 'vendas@syngenta.com.br', '(11) 0046-0046', 'São Paulo', 'SP', true),
('a6666666-6666-6666-6666-666666666666', 'Bayer CropScience', '00.000.047/0001-47', 'comercial@bayer.com.br', '(11) 0047-0047', 'São Paulo', 'SP', true),
('a6666666-6666-6666-6666-666666666666', 'John Deere Brasil', '00.000.048/0001-48', 'vendas@johndeere.com.br', '(11) 0048-0048', 'Horizontina', 'RS', true),
('a6666666-6666-6666-6666-666666666666', 'Massey Ferguson', '00.000.049/0001-49', 'comercial@massey.com.br', '(11) 0049-0049', 'Canoas', 'RS', true),
('a6666666-6666-6666-6666-666666666666', 'Cargill Nutrição', '00.000.050/0001-50', 'vendas@cargill.com.br', '(11) 0050-0050', 'São Paulo', 'SP', true),
-- Loja Moda Fashion suppliers
('a7777777-7777-7777-7777-777777777777', 'Malwee Malhas', '00.000.051/0001-51', 'vendas@malwee.com.br', '(47) 0051-0051', 'Jaraguá do Sul', 'SC', true),
('a7777777-7777-7777-7777-777777777777', 'Hering', '00.000.052/0001-52', 'comercial@hering.com.br', '(47) 0052-0052', 'Blumenau', 'SC', true),
('a7777777-7777-7777-7777-777777777777', 'Renner S.A.', '00.000.053/0001-53', 'fornecedores@renner.com.br', '(51) 0053-0053', 'Porto Alegre', 'RS', true),
('a7777777-7777-7777-7777-777777777777', 'Lupo', '00.000.054/0001-54', 'vendas@lupo.com.br', '(16) 0054-0054', 'Araraquara', 'SP', true),
('a7777777-7777-7777-7777-777777777777', 'Dudalina', '00.000.055/0001-55', 'comercial@dudalina.com.br', '(47) 0055-0055', 'Blumenau', 'SC', true),
-- Restaurante Sabor e Arte suppliers
('a8888888-8888-8888-8888-888888888888', 'CEASA Porto Alegre', '00.000.031/0001-31', 'vendas@ceasars.com.br', '(51) 0031-0031', 'Porto Alegre', 'RS', true),
('a8888888-8888-8888-8888-888888888888', 'Frigorífico Marfrig', '00.000.032/0001-32', 'comercial@marfrig.com.br', '(51) 0032-0032', 'Porto Alegre', 'RS', true),
('a8888888-8888-8888-8888-888888888888', 'Vinícola Aurora', '00.000.033/0001-33', 'vendas@vinicolaaurora.com.br', '(54) 0033-0033', 'Bento Gonçalves', 'RS', true),
('a8888888-8888-8888-8888-888888888888', 'Distribuidora Bebidas Sul', '00.000.034/0001-34', 'comercial@bebidassul.com.br', '(51) 0034-0034', 'Porto Alegre', 'RS', true),
('a8888888-8888-8888-8888-888888888888', 'Copagaz', '00.000.035/0001-35', 'vendas@copagaz.com.br', '(51) 0035-0035', 'Porto Alegre', 'RS', true),
-- Escritório Contábil Precisão suppliers
('a9999999-9999-9999-9999-999999999999', 'TOTVS', '00.000.056/0001-56', 'vendas@totvs.com.br', '(11) 0056-0056', 'São Paulo', 'SP', true),
('a9999999-9999-9999-9999-999999999999', 'Domínio Sistemas', '00.000.057/0001-57', 'comercial@dominio.com.br', '(47) 0057-0057', 'Criciúma', 'SC', true),
('a9999999-9999-9999-9999-999999999999', 'Certisign', '00.000.058/0001-58', 'vendas@certisign.com.br', '(11) 0058-0058', 'São Paulo', 'SP', true),
('a9999999-9999-9999-9999-999999999999', 'Staples Brasil', '00.000.059/0001-59', 'comercial@staples.com.br', '(11) 0059-0059', 'São Paulo', 'SP', true),
('a9999999-9999-9999-9999-999999999999', 'IOB Informações', '00.000.060/0001-60', 'vendas@iob.com.br', '(11) 0060-0060', 'São Paulo', 'SP', true),
-- Indústria Plásticos Brasil suppliers
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Braskem', '00.000.061/0001-61', 'vendas@braskem.com.br', '(11) 0061-0061', 'São Paulo', 'SP', true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Dow Chemical', '00.000.062/0001-62', 'comercial@dow.com.br', '(11) 0062-0062', 'São Paulo', 'SP', true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'BASF Brasil', '00.000.063/0001-63', 'vendas@basf.com.br', '(11) 0063-0063', 'São Paulo', 'SP', true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Innova Petroquímica', '00.000.064/0001-64', 'comercial@innova.com.br', '(51) 0064-0064', 'Triunfo', 'RS', true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Kraton Polymers', '00.000.065/0001-65', 'vendas@kraton.com.br', '(11) 0065-0065', 'Paulínia', 'SP', true);


-- ============================================
-- Migration: 20260110033132_ebf2f709-27c2-4b91-81c3-6bd103f4e1a9.sql
-- ============================================

-- =========================================
-- COMPLETE DEMO DATA: RECEIVABLES, PAYABLES, TRANSACTIONS
-- =========================================

-- Helper: Get first customer, chart account, supplier, and bank for each company
-- Using subqueries to get consistent IDs

-- =========================================
-- RECEIVABLES (15 per company = 150 total)
-- Distribution: 3 overdue, 5 pending, 4 partial, 3 paid
-- =========================================

-- Tech Solutions Ltda (a1111111-1111-1111-1111-111111111111)
INSERT INTO receivables (company_id, customer_id, chart_account_id, description, document_number, issue_date, due_date, total_amount, paid_amount, status, installment_number, total_installments)
SELECT 
  'a1111111-1111-1111-1111-111111111111',
  (SELECT id FROM customers WHERE company_id = 'a1111111-1111-1111-1111-111111111111' LIMIT 1),
  (SELECT id FROM chart_of_accounts WHERE company_id = 'a1111111-1111-1111-1111-111111111111' AND type = 'receita' LIMIT 1),
  description, doc_num, issue, due, total, paid, status::receivable_status, 1, 1
FROM (VALUES
  ('Consultoria em TI - Janeiro', 'NF-1001', CURRENT_DATE - 45, CURRENT_DATE - 20, 15000.00, 0, 'pendente'),
  ('Suporte Técnico Mensal', 'NF-1002', CURRENT_DATE - 40, CURRENT_DATE - 15, 8500.00, 0, 'pendente'),
  ('Desenvolvimento Sistema ERP', 'NF-1003', CURRENT_DATE - 35, CURRENT_DATE - 10, 45000.00, 0, 'pendente'),
  ('Licença Software Anual', 'NF-1004', CURRENT_DATE - 30, CURRENT_DATE + 5, 12000.00, 0, 'pendente'),
  ('Treinamento Equipe', 'NF-1005', CURRENT_DATE - 25, CURRENT_DATE + 10, 6500.00, 0, 'pendente'),
  ('Consultoria Cloud', 'NF-1006', CURRENT_DATE - 20, CURRENT_DATE + 15, 18000.00, 0, 'pendente'),
  ('Manutenção Infraestrutura', 'NF-1007', CURRENT_DATE - 15, CURRENT_DATE + 20, 9500.00, 0, 'pendente'),
  ('Integração API', 'NF-1008', CURRENT_DATE - 10, CURRENT_DATE + 25, 7800.00, 0, 'pendente'),
  ('Projeto Mobile App', 'NF-1009', CURRENT_DATE - 60, CURRENT_DATE - 30, 35000.00, 15000.00, 'parcial'),
  ('Consultoria Segurança', 'NF-1010', CURRENT_DATE - 55, CURRENT_DATE - 25, 22000.00, 10000.00, 'parcial'),
  ('Outsourcing TI', 'NF-1011', CURRENT_DATE - 50, CURRENT_DATE - 20, 28000.00, 14000.00, 'parcial'),
  ('Suporte Premium', 'NF-1012', CURRENT_DATE - 45, CURRENT_DATE - 15, 11000.00, 5500.00, 'parcial'),
  ('Projeto Finalizado A', 'NF-1013', CURRENT_DATE - 90, CURRENT_DATE - 60, 25000.00, 25000.00, 'pago'),
  ('Serviço Concluído B', 'NF-1014', CURRENT_DATE - 80, CURRENT_DATE - 50, 18500.00, 18500.00, 'pago'),
  ('Entrega Sistema C', 'NF-1015', CURRENT_DATE - 70, CURRENT_DATE - 40, 32000.00, 32000.00, 'pago')
) AS t(description, doc_num, issue, due, total, paid, status);

-- Construtora Horizonte SA (a2222222-2222-2222-2222-222222222222)
INSERT INTO receivables (company_id, customer_id, chart_account_id, description, document_number, issue_date, due_date, total_amount, paid_amount, status, installment_number, total_installments)
SELECT 
  'a2222222-2222-2222-2222-222222222222',
  (SELECT id FROM customers WHERE company_id = 'a2222222-2222-2222-2222-222222222222' LIMIT 1),
  (SELECT id FROM chart_of_accounts WHERE company_id = 'a2222222-2222-2222-2222-222222222222' AND type = 'receita' LIMIT 1),
  description, doc_num, issue, due, total, paid, status::receivable_status, 1, 1
FROM (VALUES
  ('Obra Residencial Fase 1', 'NF-2001', CURRENT_DATE - 45, CURRENT_DATE - 20, 125000.00, 0, 'pendente'),
  ('Reforma Comercial', 'NF-2002', CURRENT_DATE - 40, CURRENT_DATE - 15, 85000.00, 0, 'pendente'),
  ('Construção Galpão', 'NF-2003', CURRENT_DATE - 35, CURRENT_DATE - 10, 250000.00, 0, 'pendente'),
  ('Projeto Arquitetônico', 'NF-2004', CURRENT_DATE - 30, CURRENT_DATE + 5, 35000.00, 0, 'pendente'),
  ('Fundação Edifício', 'NF-2005', CURRENT_DATE - 25, CURRENT_DATE + 10, 180000.00, 0, 'pendente'),
  ('Acabamento Interno', 'NF-2006', CURRENT_DATE - 20, CURRENT_DATE + 15, 95000.00, 0, 'pendente'),
  ('Instalações Elétricas', 'NF-2007', CURRENT_DATE - 15, CURRENT_DATE + 20, 45000.00, 0, 'pendente'),
  ('Paisagismo Condomínio', 'NF-2008', CURRENT_DATE - 10, CURRENT_DATE + 25, 28000.00, 0, 'pendente'),
  ('Obra Industrial', 'NF-2009', CURRENT_DATE - 60, CURRENT_DATE - 30, 320000.00, 160000.00, 'parcial'),
  ('Reforma Hospital', 'NF-2010', CURRENT_DATE - 55, CURRENT_DATE - 25, 175000.00, 87500.00, 'parcial'),
  ('Construção Escola', 'NF-2011', CURRENT_DATE - 50, CURRENT_DATE - 20, 420000.00, 200000.00, 'parcial'),
  ('Ampliação Fábrica', 'NF-2012', CURRENT_DATE - 45, CURRENT_DATE - 15, 280000.00, 140000.00, 'parcial'),
  ('Projeto Concluído X', 'NF-2013', CURRENT_DATE - 90, CURRENT_DATE - 60, 150000.00, 150000.00, 'pago'),
  ('Obra Finalizada Y', 'NF-2014', CURRENT_DATE - 80, CURRENT_DATE - 50, 95000.00, 95000.00, 'pago'),
  ('Entrega Casa Z', 'NF-2015', CURRENT_DATE - 70, CURRENT_DATE - 40, 220000.00, 220000.00, 'pago')
) AS t(description, doc_num, issue, due, total, paid, status);

-- Distribuidora Alimenta Ltda (a3333333-3333-3333-3333-333333333333)
INSERT INTO receivables (company_id, customer_id, chart_account_id, description, document_number, issue_date, due_date, total_amount, paid_amount, status, installment_number, total_installments)
SELECT 
  'a3333333-3333-3333-3333-333333333333',
  (SELECT id FROM customers WHERE company_id = 'a3333333-3333-3333-3333-333333333333' LIMIT 1),
  (SELECT id FROM chart_of_accounts WHERE company_id = 'a3333333-3333-3333-3333-333333333333' AND type = 'receita' LIMIT 1),
  description, doc_num, issue, due, total, paid, status::receivable_status, 1, 1
FROM (VALUES
  ('Venda Alimentos Lote 1', 'NF-3001', CURRENT_DATE - 45, CURRENT_DATE - 20, 45000.00, 0, 'pendente'),
  ('Distribuição Bebidas', 'NF-3002', CURRENT_DATE - 40, CURRENT_DATE - 15, 32000.00, 0, 'pendente'),
  ('Fornecimento Restaurante', 'NF-3003', CURRENT_DATE - 35, CURRENT_DATE - 10, 28500.00, 0, 'pendente'),
  ('Venda Produtos Secos', 'NF-3004', CURRENT_DATE - 30, CURRENT_DATE + 5, 18000.00, 0, 'pendente'),
  ('Distribuição Laticínios', 'NF-3005', CURRENT_DATE - 25, CURRENT_DATE + 10, 22500.00, 0, 'pendente'),
  ('Fornecimento Supermercado', 'NF-3006', CURRENT_DATE - 20, CURRENT_DATE + 15, 65000.00, 0, 'pendente'),
  ('Venda Congelados', 'NF-3007', CURRENT_DATE - 15, CURRENT_DATE + 20, 38000.00, 0, 'pendente'),
  ('Distribuição Hortifruti', 'NF-3008', CURRENT_DATE - 10, CURRENT_DATE + 25, 15500.00, 0, 'pendente'),
  ('Contrato Mensal Hotel', 'NF-3009', CURRENT_DATE - 60, CURRENT_DATE - 30, 85000.00, 42500.00, 'parcial'),
  ('Fornecimento Escola', 'NF-3010', CURRENT_DATE - 55, CURRENT_DATE - 25, 55000.00, 27500.00, 'parcial'),
  ('Venda Atacado', 'NF-3011', CURRENT_DATE - 50, CURRENT_DATE - 20, 120000.00, 60000.00, 'parcial'),
  ('Distribuição Padarias', 'NF-3012', CURRENT_DATE - 45, CURRENT_DATE - 15, 35000.00, 17500.00, 'parcial'),
  ('Pedido Quitado A', 'NF-3013', CURRENT_DATE - 90, CURRENT_DATE - 60, 42000.00, 42000.00, 'pago'),
  ('Venda Finalizada B', 'NF-3014', CURRENT_DATE - 80, CURRENT_DATE - 50, 28000.00, 28000.00, 'pago'),
  ('Entrega Completa C', 'NF-3015', CURRENT_DATE - 70, CURRENT_DATE - 40, 55000.00, 55000.00, 'pago')
) AS t(description, doc_num, issue, due, total, paid, status);

-- Clínica Saúde Total (a4444444-4444-4444-4444-444444444444)
INSERT INTO receivables (company_id, customer_id, chart_account_id, description, document_number, issue_date, due_date, total_amount, paid_amount, status, installment_number, total_installments)
SELECT 
  'a4444444-4444-4444-4444-444444444444',
  (SELECT id FROM customers WHERE company_id = 'a4444444-4444-4444-4444-444444444444' LIMIT 1),
  (SELECT id FROM chart_of_accounts WHERE company_id = 'a4444444-4444-4444-4444-444444444444' AND type = 'receita' LIMIT 1),
  description, doc_num, issue, due, total, paid, status::receivable_status, 1, 1
FROM (VALUES
  ('Consulta Especialista', 'NF-4001', CURRENT_DATE - 45, CURRENT_DATE - 20, 2500.00, 0, 'pendente'),
  ('Exames Laboratoriais', 'NF-4002', CURRENT_DATE - 40, CURRENT_DATE - 15, 4200.00, 0, 'pendente'),
  ('Procedimento Cirúrgico', 'NF-4003', CURRENT_DATE - 35, CURRENT_DATE - 10, 18000.00, 0, 'pendente'),
  ('Fisioterapia Pacote', 'NF-4004', CURRENT_DATE - 30, CURRENT_DATE + 5, 3600.00, 0, 'pendente'),
  ('Check-up Executivo', 'NF-4005', CURRENT_DATE - 25, CURRENT_DATE + 10, 5500.00, 0, 'pendente'),
  ('Tratamento Ortodôntico', 'NF-4006', CURRENT_DATE - 20, CURRENT_DATE + 15, 8500.00, 0, 'pendente'),
  ('Internação UTI', 'NF-4007', CURRENT_DATE - 15, CURRENT_DATE + 20, 45000.00, 0, 'pendente'),
  ('Consultas Retorno', 'NF-4008', CURRENT_DATE - 10, CURRENT_DATE + 25, 1800.00, 0, 'pendente'),
  ('Cirurgia Eletiva', 'NF-4009', CURRENT_DATE - 60, CURRENT_DATE - 30, 35000.00, 17500.00, 'parcial'),
  ('Tratamento Oncológico', 'NF-4010', CURRENT_DATE - 55, CURRENT_DATE - 25, 85000.00, 42500.00, 'parcial'),
  ('Reabilitação', 'NF-4011', CURRENT_DATE - 50, CURRENT_DATE - 20, 12000.00, 6000.00, 'parcial'),
  ('Exames Imagem', 'NF-4012', CURRENT_DATE - 45, CURRENT_DATE - 15, 7500.00, 3750.00, 'parcial'),
  ('Consulta Paga A', 'NF-4013', CURRENT_DATE - 90, CURRENT_DATE - 60, 2800.00, 2800.00, 'pago'),
  ('Procedimento Quitado', 'NF-4014', CURRENT_DATE - 80, CURRENT_DATE - 50, 15000.00, 15000.00, 'pago'),
  ('Tratamento Concluído', 'NF-4015', CURRENT_DATE - 70, CURRENT_DATE - 40, 9500.00, 9500.00, 'pago')
) AS t(description, doc_num, issue, due, total, paid, status);

-- Auto Peças Express Ltda (a5555555-5555-5555-5555-555555555555)
INSERT INTO receivables (company_id, customer_id, chart_account_id, description, document_number, issue_date, due_date, total_amount, paid_amount, status, installment_number, total_installments)
SELECT 
  'a5555555-5555-5555-5555-555555555555',
  (SELECT id FROM customers WHERE company_id = 'a5555555-5555-5555-5555-555555555555' LIMIT 1),
  (SELECT id FROM chart_of_accounts WHERE company_id = 'a5555555-5555-5555-5555-555555555555' AND type = 'receita' LIMIT 1),
  description, doc_num, issue, due, total, paid, status::receivable_status, 1, 1
FROM (VALUES
  ('Venda Peças Motor', 'NF-5001', CURRENT_DATE - 45, CURRENT_DATE - 20, 8500.00, 0, 'pendente'),
  ('Fornecimento Oficina', 'NF-5002', CURRENT_DATE - 40, CURRENT_DATE - 15, 12000.00, 0, 'pendente'),
  ('Peças Suspensão', 'NF-5003', CURRENT_DATE - 35, CURRENT_DATE - 10, 6500.00, 0, 'pendente'),
  ('Acessórios Veiculares', 'NF-5004', CURRENT_DATE - 30, CURRENT_DATE + 5, 4200.00, 0, 'pendente'),
  ('Peças Freio', 'NF-5005', CURRENT_DATE - 25, CURRENT_DATE + 10, 7800.00, 0, 'pendente'),
  ('Fornecimento Concessionária', 'NF-5006', CURRENT_DATE - 20, CURRENT_DATE + 15, 25000.00, 0, 'pendente'),
  ('Peças Elétrica', 'NF-5007', CURRENT_DATE - 15, CURRENT_DATE + 20, 5500.00, 0, 'pendente'),
  ('Óleo e Filtros', 'NF-5008', CURRENT_DATE - 10, CURRENT_DATE + 25, 3200.00, 0, 'pendente'),
  ('Pedido Grande', 'NF-5009', CURRENT_DATE - 60, CURRENT_DATE - 30, 45000.00, 22500.00, 'parcial'),
  ('Fornecimento Frota', 'NF-5010', CURRENT_DATE - 55, CURRENT_DATE - 25, 32000.00, 16000.00, 'parcial'),
  ('Peças Pesados', 'NF-5011', CURRENT_DATE - 50, CURRENT_DATE - 20, 55000.00, 27500.00, 'parcial'),
  ('Venda Atacado', 'NF-5012', CURRENT_DATE - 45, CURRENT_DATE - 15, 18000.00, 9000.00, 'parcial'),
  ('Pedido Quitado', 'NF-5013', CURRENT_DATE - 90, CURRENT_DATE - 60, 9800.00, 9800.00, 'pago'),
  ('Venda Concluída', 'NF-5014', CURRENT_DATE - 80, CURRENT_DATE - 50, 15500.00, 15500.00, 'pago'),
  ('Fornecimento Pago', 'NF-5015', CURRENT_DATE - 70, CURRENT_DATE - 40, 22000.00, 22000.00, 'pago')
) AS t(description, doc_num, issue, due, total, paid, status);

-- Agro Fazenda Verde SA (a6666666-6666-6666-6666-666666666666)
INSERT INTO receivables (company_id, customer_id, chart_account_id, description, document_number, issue_date, due_date, total_amount, paid_amount, status, installment_number, total_installments)
SELECT 
  'a6666666-6666-6666-6666-666666666666',
  (SELECT id FROM customers WHERE company_id = 'a6666666-6666-6666-6666-666666666666' LIMIT 1),
  (SELECT id FROM chart_of_accounts WHERE company_id = 'a6666666-6666-6666-6666-666666666666' AND type = 'receita' LIMIT 1),
  description, doc_num, issue, due, total, paid, status::receivable_status, 1, 1
FROM (VALUES
  ('Venda Safra Soja', 'NF-6001', CURRENT_DATE - 45, CURRENT_DATE - 20, 450000.00, 0, 'pendente'),
  ('Comercialização Milho', 'NF-6002', CURRENT_DATE - 40, CURRENT_DATE - 15, 280000.00, 0, 'pendente'),
  ('Venda Gado', 'NF-6003', CURRENT_DATE - 35, CURRENT_DATE - 10, 180000.00, 0, 'pendente'),
  ('Produção Leite Mensal', 'NF-6004', CURRENT_DATE - 30, CURRENT_DATE + 5, 85000.00, 0, 'pendente'),
  ('Venda Café Premium', 'NF-6005', CURRENT_DATE - 25, CURRENT_DATE + 10, 320000.00, 0, 'pendente'),
  ('Fornecimento Algodão', 'NF-6006', CURRENT_DATE - 20, CURRENT_DATE + 15, 195000.00, 0, 'pendente'),
  ('Venda Frutas', 'NF-6007', CURRENT_DATE - 15, CURRENT_DATE + 20, 45000.00, 0, 'pendente'),
  ('Produção Orgânica', 'NF-6008', CURRENT_DATE - 10, CURRENT_DATE + 25, 28000.00, 0, 'pendente'),
  ('Contrato Exportação', 'NF-6009', CURRENT_DATE - 60, CURRENT_DATE - 30, 850000.00, 425000.00, 'parcial'),
  ('Venda Cooperativa', 'NF-6010', CURRENT_DATE - 55, CURRENT_DATE - 25, 320000.00, 160000.00, 'parcial'),
  ('Comercialização Trigo', 'NF-6011', CURRENT_DATE - 50, CURRENT_DATE - 20, 180000.00, 90000.00, 'parcial'),
  ('Venda Gado Lote', 'NF-6012', CURRENT_DATE - 45, CURRENT_DATE - 15, 420000.00, 210000.00, 'parcial'),
  ('Safra Quitada', 'NF-6013', CURRENT_DATE - 90, CURRENT_DATE - 60, 550000.00, 550000.00, 'pago'),
  ('Venda Paga', 'NF-6014', CURRENT_DATE - 80, CURRENT_DATE - 50, 280000.00, 280000.00, 'pago'),
  ('Contrato Concluído', 'NF-6015', CURRENT_DATE - 70, CURRENT_DATE - 40, 195000.00, 195000.00, 'pago')
) AS t(description, doc_num, issue, due, total, paid, status);

-- Loja Moda Fashion (a7777777-7777-7777-7777-777777777777)
INSERT INTO receivables (company_id, customer_id, chart_account_id, description, document_number, issue_date, due_date, total_amount, paid_amount, status, installment_number, total_installments)
SELECT 
  'a7777777-7777-7777-7777-777777777777',
  (SELECT id FROM customers WHERE company_id = 'a7777777-7777-7777-7777-777777777777' LIMIT 1),
  (SELECT id FROM chart_of_accounts WHERE company_id = 'a7777777-7777-7777-7777-777777777777' AND type = 'receita' LIMIT 1),
  description, doc_num, issue, due, total, paid, status::receivable_status, 1, 1
FROM (VALUES
  ('Venda Coleção Verão', 'NF-7001', CURRENT_DATE - 45, CURRENT_DATE - 20, 15000.00, 0, 'pendente'),
  ('Fornecimento Loja', 'NF-7002', CURRENT_DATE - 40, CURRENT_DATE - 15, 22000.00, 0, 'pendente'),
  ('Venda Atacado', 'NF-7003', CURRENT_DATE - 35, CURRENT_DATE - 10, 45000.00, 0, 'pendente'),
  ('Acessórios Moda', 'NF-7004', CURRENT_DATE - 30, CURRENT_DATE + 5, 8500.00, 0, 'pendente'),
  ('Coleção Inverno', 'NF-7005', CURRENT_DATE - 25, CURRENT_DATE + 10, 35000.00, 0, 'pendente'),
  ('Venda Online', 'NF-7006', CURRENT_DATE - 20, CURRENT_DATE + 15, 12000.00, 0, 'pendente'),
  ('Roupas Fitness', 'NF-7007', CURRENT_DATE - 15, CURRENT_DATE + 20, 9500.00, 0, 'pendente'),
  ('Calçados', 'NF-7008', CURRENT_DATE - 10, CURRENT_DATE + 25, 18000.00, 0, 'pendente'),
  ('Pedido Grande', 'NF-7009', CURRENT_DATE - 60, CURRENT_DATE - 30, 65000.00, 32500.00, 'parcial'),
  ('Fornecimento Rede', 'NF-7010', CURRENT_DATE - 55, CURRENT_DATE - 25, 85000.00, 42500.00, 'parcial'),
  ('Coleção Exclusiva', 'NF-7011', CURRENT_DATE - 50, CURRENT_DATE - 20, 55000.00, 27500.00, 'parcial'),
  ('Venda Especial', 'NF-7012', CURRENT_DATE - 45, CURRENT_DATE - 15, 28000.00, 14000.00, 'parcial'),
  ('Pedido Quitado', 'NF-7013', CURRENT_DATE - 90, CURRENT_DATE - 60, 32000.00, 32000.00, 'pago'),
  ('Venda Paga', 'NF-7014', CURRENT_DATE - 80, CURRENT_DATE - 50, 18500.00, 18500.00, 'pago'),
  ('Fornecimento Concluído', 'NF-7015', CURRENT_DATE - 70, CURRENT_DATE - 40, 45000.00, 45000.00, 'pago')
) AS t(description, doc_num, issue, due, total, paid, status);

-- Restaurante Sabor e Arte (a8888888-8888-8888-8888-888888888888)
INSERT INTO receivables (company_id, customer_id, chart_account_id, description, document_number, issue_date, due_date, total_amount, paid_amount, status, installment_number, total_installments)
SELECT 
  'a8888888-8888-8888-8888-888888888888',
  (SELECT id FROM customers WHERE company_id = 'a8888888-8888-8888-8888-888888888888' LIMIT 1),
  (SELECT id FROM chart_of_accounts WHERE company_id = 'a8888888-8888-8888-8888-888888888888' AND type = 'receita' LIMIT 1),
  description, doc_num, issue, due, total, paid, status::receivable_status, 1, 1
FROM (VALUES
  ('Evento Corporativo', 'NF-8001', CURRENT_DATE - 45, CURRENT_DATE - 20, 25000.00, 0, 'pendente'),
  ('Buffet Casamento', 'NF-8002', CURRENT_DATE - 40, CURRENT_DATE - 15, 45000.00, 0, 'pendente'),
  ('Catering Empresa', 'NF-8003', CURRENT_DATE - 35, CURRENT_DATE - 10, 18000.00, 0, 'pendente'),
  ('Almoço Executivo Mensal', 'NF-8004', CURRENT_DATE - 30, CURRENT_DATE + 5, 12000.00, 0, 'pendente'),
  ('Jantar Especial', 'NF-8005', CURRENT_DATE - 25, CURRENT_DATE + 10, 8500.00, 0, 'pendente'),
  ('Buffet Aniversário', 'NF-8006', CURRENT_DATE - 20, CURRENT_DATE + 15, 15000.00, 0, 'pendente'),
  ('Delivery Corporativo', 'NF-8007', CURRENT_DATE - 15, CURRENT_DATE + 20, 6500.00, 0, 'pendente'),
  ('Coffee Break', 'NF-8008', CURRENT_DATE - 10, CURRENT_DATE + 25, 4200.00, 0, 'pendente'),
  ('Evento Grande', 'NF-8009', CURRENT_DATE - 60, CURRENT_DATE - 30, 85000.00, 42500.00, 'parcial'),
  ('Buffet Formatura', 'NF-8010', CURRENT_DATE - 55, CURRENT_DATE - 25, 55000.00, 27500.00, 'parcial'),
  ('Catering Semanal', 'NF-8011', CURRENT_DATE - 50, CURRENT_DATE - 20, 32000.00, 16000.00, 'parcial'),
  ('Festa Empresa', 'NF-8012', CURRENT_DATE - 45, CURRENT_DATE - 15, 28000.00, 14000.00, 'parcial'),
  ('Evento Pago', 'NF-8013', CURRENT_DATE - 90, CURRENT_DATE - 60, 35000.00, 35000.00, 'pago'),
  ('Buffet Quitado', 'NF-8014', CURRENT_DATE - 80, CURRENT_DATE - 50, 22000.00, 22000.00, 'pago'),
  ('Serviço Concluído', 'NF-8015', CURRENT_DATE - 70, CURRENT_DATE - 40, 18500.00, 18500.00, 'pago')
) AS t(description, doc_num, issue, due, total, paid, status);

-- Escritório Contábil Precisão (a9999999-9999-9999-9999-999999999999)
INSERT INTO receivables (company_id, customer_id, chart_account_id, description, document_number, issue_date, due_date, total_amount, paid_amount, status, installment_number, total_installments)
SELECT 
  'a9999999-9999-9999-9999-999999999999',
  (SELECT id FROM customers WHERE company_id = 'a9999999-9999-9999-9999-999999999999' LIMIT 1),
  (SELECT id FROM chart_of_accounts WHERE company_id = 'a9999999-9999-9999-9999-999999999999' AND type = 'receita' LIMIT 1),
  description, doc_num, issue, due, total, paid, status::receivable_status, 1, 1
FROM (VALUES
  ('Honorários Contábeis', 'NF-9001', CURRENT_DATE - 45, CURRENT_DATE - 20, 4500.00, 0, 'pendente'),
  ('Consultoria Fiscal', 'NF-9002', CURRENT_DATE - 40, CURRENT_DATE - 15, 6500.00, 0, 'pendente'),
  ('Declaração IRPJ', 'NF-9003', CURRENT_DATE - 35, CURRENT_DATE - 10, 8000.00, 0, 'pendente'),
  ('Folha de Pagamento', 'NF-9004', CURRENT_DATE - 30, CURRENT_DATE + 5, 3500.00, 0, 'pendente'),
  ('Auditoria Interna', 'NF-9005', CURRENT_DATE - 25, CURRENT_DATE + 10, 15000.00, 0, 'pendente'),
  ('Planejamento Tributário', 'NF-9006', CURRENT_DATE - 20, CURRENT_DATE + 15, 12000.00, 0, 'pendente'),
  ('Abertura Empresa', 'NF-9007', CURRENT_DATE - 15, CURRENT_DATE + 20, 2500.00, 0, 'pendente'),
  ('Consultoria Mensal', 'NF-9008', CURRENT_DATE - 10, CURRENT_DATE + 25, 5500.00, 0, 'pendente'),
  ('Projeto Reestruturação', 'NF-9009', CURRENT_DATE - 60, CURRENT_DATE - 30, 35000.00, 17500.00, 'parcial'),
  ('Due Diligence', 'NF-9010', CURRENT_DATE - 55, CURRENT_DATE - 25, 45000.00, 22500.00, 'parcial'),
  ('Auditoria Externa', 'NF-9011', CURRENT_DATE - 50, CURRENT_DATE - 20, 28000.00, 14000.00, 'parcial'),
  ('Consultoria Societária', 'NF-9012', CURRENT_DATE - 45, CURRENT_DATE - 15, 18000.00, 9000.00, 'parcial'),
  ('Serviço Quitado', 'NF-9013', CURRENT_DATE - 90, CURRENT_DATE - 60, 8500.00, 8500.00, 'pago'),
  ('Honorários Pagos', 'NF-9014', CURRENT_DATE - 80, CURRENT_DATE - 50, 12000.00, 12000.00, 'pago'),
  ('Consultoria Paga', 'NF-9015', CURRENT_DATE - 70, CURRENT_DATE - 40, 15000.00, 15000.00, 'pago')
) AS t(description, doc_num, issue, due, total, paid, status);

-- Indústria Plásticos Brasil (aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa)
INSERT INTO receivables (company_id, customer_id, chart_account_id, description, document_number, issue_date, due_date, total_amount, paid_amount, status, installment_number, total_installments)
SELECT 
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  (SELECT id FROM customers WHERE company_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' LIMIT 1),
  (SELECT id FROM chart_of_accounts WHERE company_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' AND type = 'receita' LIMIT 1),
  description, doc_num, issue, due, total, paid, status::receivable_status, 1, 1
FROM (VALUES
  ('Produção Embalagens', 'NF-A001', CURRENT_DATE - 45, CURRENT_DATE - 20, 85000.00, 0, 'pendente'),
  ('Fornecimento Indústria', 'NF-A002', CURRENT_DATE - 40, CURRENT_DATE - 15, 120000.00, 0, 'pendente'),
  ('Peças Injetadas', 'NF-A003', CURRENT_DATE - 35, CURRENT_DATE - 10, 65000.00, 0, 'pendente'),
  ('Componentes Automotivos', 'NF-A004', CURRENT_DATE - 30, CURRENT_DATE + 5, 95000.00, 0, 'pendente'),
  ('Embalagens Alimentícias', 'NF-A005', CURRENT_DATE - 25, CURRENT_DATE + 10, 45000.00, 0, 'pendente'),
  ('Produção Especial', 'NF-A006', CURRENT_DATE - 20, CURRENT_DATE + 15, 150000.00, 0, 'pendente'),
  ('Peças Customizadas', 'NF-A007', CURRENT_DATE - 15, CURRENT_DATE + 20, 35000.00, 0, 'pendente'),
  ('Fornecimento Mensal', 'NF-A008', CURRENT_DATE - 10, CURRENT_DATE + 25, 78000.00, 0, 'pendente'),
  ('Contrato Grande', 'NF-A009', CURRENT_DATE - 60, CURRENT_DATE - 30, 280000.00, 140000.00, 'parcial'),
  ('Produção Exportação', 'NF-A010', CURRENT_DATE - 55, CURRENT_DATE - 25, 350000.00, 175000.00, 'parcial'),
  ('Fornecimento Montadora', 'NF-A011', CURRENT_DATE - 50, CURRENT_DATE - 20, 220000.00, 110000.00, 'parcial'),
  ('Peças Série', 'NF-A012', CURRENT_DATE - 45, CURRENT_DATE - 15, 185000.00, 92500.00, 'parcial'),
  ('Pedido Quitado', 'NF-A013', CURRENT_DATE - 90, CURRENT_DATE - 60, 95000.00, 95000.00, 'pago'),
  ('Produção Paga', 'NF-A014', CURRENT_DATE - 80, CURRENT_DATE - 50, 125000.00, 125000.00, 'pago'),
  ('Contrato Concluído', 'NF-A015', CURRENT_DATE - 70, CURRENT_DATE - 40, 180000.00, 180000.00, 'pago')
) AS t(description, doc_num, issue, due, total, paid, status);


-- ============================================
-- Migration: 20260110034240_f1447110-6d90-4d12-b6c6-b1c1b9ba20d8.sql
-- ============================================
-- Create ocr_scans table for storing OCR history
CREATE TABLE public.ocr_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  extracted_text TEXT NOT NULL,
  extracted_data JSONB DEFAULT '{}',
  source_type TEXT NOT NULL CHECK (source_type IN ('receivable', 'payable')),
  linked_record_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ocr_scans ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view ocr_scans of their companies"
ON public.ocr_scans
FOR SELECT
USING (user_belongs_to_company(auth.uid(), company_id));

CREATE POLICY "Admins and editors can insert ocr_scans"
ON public.ocr_scans
FOR INSERT
WITH CHECK (
  user_belongs_to_company(auth.uid(), company_id) AND 
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role))
);

CREATE POLICY "Admins can delete ocr_scans"
ON public.ocr_scans
FOR DELETE
USING (
  user_belongs_to_company(auth.uid(), company_id) AND 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Create storage bucket for OCR images
INSERT INTO storage.buckets (id, name, public) VALUES ('ocr_images', 'ocr_images', true);

-- Storage policies for ocr_images bucket
CREATE POLICY "Anyone can view ocr images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'ocr_images');

CREATE POLICY "Authenticated users can upload ocr images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'ocr_images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own ocr images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'ocr_images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- Migration: 20260110040812_7a828816-6b12-4128-bc15-975b0fc7cf8a.sql
-- ============================================
-- ===================================================================
-- DEMO DATA: Insert sample payables and transactions for all companies
-- 15 payables per company + 20 transactions per company
-- ===================================================================

-- Get all company IDs and their related entities
DO $$
DECLARE
    company RECORD;
    supplier_id UUID;
    customer_id UUID;
    bank_account_id UUID;
    chart_receita_id UUID;
    chart_despesa_id UUID;
    chart_custo_id UUID;
    i INTEGER;
BEGIN
    -- Loop through each company
    FOR company IN 
        SELECT id FROM companies 
    LOOP
        -- Get first supplier for this company
        SELECT id INTO supplier_id 
        FROM suppliers 
        WHERE company_id = company.id 
        LIMIT 1;
        
        -- Get first customer for this company
        SELECT id INTO customer_id 
        FROM customers 
        WHERE company_id = company.id 
        LIMIT 1;
        
        -- Get first bank account for this company
        SELECT id INTO bank_account_id 
        FROM bank_accounts 
        WHERE company_id = company.id 
        LIMIT 1;
        
        -- Get chart accounts by type
        SELECT id INTO chart_receita_id 
        FROM chart_of_accounts 
        WHERE company_id = company.id AND type = 'receita' 
        LIMIT 1;
        
        SELECT id INTO chart_despesa_id 
        FROM chart_of_accounts 
        WHERE company_id = company.id AND type = 'despesa' 
        LIMIT 1;
        
        SELECT id INTO chart_custo_id 
        FROM chart_of_accounts 
        WHERE company_id = company.id AND type = 'custo' 
        LIMIT 1;
        
        -- Skip if no supplier or bank account exists
        IF supplier_id IS NULL OR bank_account_id IS NULL THEN
            CONTINUE;
        END IF;
        
        -- =============================================
        -- INSERT 15 PAYABLES (varied status and dates)
        -- =============================================
        
        -- 3 Overdue payables (10-30 days ago)
        INSERT INTO payables (company_id, supplier_id, description, total_amount, paid_amount, due_date, status, chart_account_id, issue_date)
        VALUES
            (company.id, supplier_id, 'Aluguel - vencido', 5000.00, 0, CURRENT_DATE - 15, 'pendente', chart_despesa_id, CURRENT_DATE - 45),
            (company.id, supplier_id, 'Energia - vencido', 850.00, 0, CURRENT_DATE - 22, 'pendente', chart_despesa_id, CURRENT_DATE - 52),
            (company.id, supplier_id, 'Internet - vencido', 299.00, 0, CURRENT_DATE - 10, 'pendente', chart_despesa_id, CURRENT_DATE - 40);
        
        -- 5 Pending payables (next 30 days)
        INSERT INTO payables (company_id, supplier_id, description, total_amount, paid_amount, due_date, status, chart_account_id, issue_date)
        VALUES
            (company.id, supplier_id, 'Aluguel próximo mês', 5000.00, 0, CURRENT_DATE + 5, 'pendente', chart_despesa_id, CURRENT_DATE - 25),
            (company.id, supplier_id, 'Folha de Pagamento', 15000.00, 0, CURRENT_DATE + 10, 'pendente', chart_despesa_id, CURRENT_DATE - 20),
            (company.id, supplier_id, 'Fornecedor XYZ', 3500.00, 0, CURRENT_DATE + 15, 'pendente', chart_custo_id, CURRENT_DATE - 15),
            (company.id, supplier_id, 'Manutenção equipamentos', 1200.00, 0, CURRENT_DATE + 20, 'pendente', chart_despesa_id, CURRENT_DATE - 10),
            (company.id, supplier_id, 'Serviços contábeis', 800.00, 0, CURRENT_DATE + 25, 'pendente', chart_despesa_id, CURRENT_DATE - 5);
        
        -- 4 Partially paid payables
        INSERT INTO payables (company_id, supplier_id, description, total_amount, paid_amount, due_date, status, chart_account_id, issue_date)
        VALUES
            (company.id, supplier_id, 'Licenças software - parcial', 2400.00, 800.00, CURRENT_DATE + 7, 'parcial', chart_custo_id, CURRENT_DATE - 30),
            (company.id, supplier_id, 'Marketing digital - parcial', 1500.00, 500.00, CURRENT_DATE + 12, 'parcial', chart_despesa_id, CURRENT_DATE - 25),
            (company.id, supplier_id, 'Hospedagem cloud - parcial', 900.00, 300.00, CURRENT_DATE + 8, 'parcial', chart_custo_id, CURRENT_DATE - 20),
            (company.id, supplier_id, 'Consultoria - parcial', 3000.00, 1500.00, CURRENT_DATE + 3, 'parcial', chart_despesa_id, CURRENT_DATE - 15);
        
        -- 3 Paid payables (last 30 days)
        INSERT INTO payables (company_id, supplier_id, description, total_amount, paid_amount, due_date, status, chart_account_id, issue_date)
        VALUES
            (company.id, supplier_id, 'Material escritório - pago', 350.00, 350.00, CURRENT_DATE - 5, 'pago', chart_despesa_id, CURRENT_DATE - 35),
            (company.id, supplier_id, 'Telefonia - pago', 450.00, 450.00, CURRENT_DATE - 8, 'pago', chart_despesa_id, CURRENT_DATE - 38),
            (company.id, supplier_id, 'Seguro empresarial - pago', 1200.00, 1200.00, CURRENT_DATE - 12, 'pago', chart_despesa_id, CURRENT_DATE - 42);
        
        -- =============================================
        -- INSERT 20 TRANSACTIONS (10 entrada, 10 saida)
        -- Distributed over last 60 days
        -- =============================================
        
        -- 10 Entrada transactions
        INSERT INTO transactions (company_id, bank_account_id, type, amount, description, transaction_date, chart_account_id, customer_id)
        VALUES
            (company.id, bank_account_id, 'entrada', 8500.00, 'Venda produto A', CURRENT_DATE - 55, chart_receita_id, customer_id),
            (company.id, bank_account_id, 'entrada', 12000.00, 'Serviço consultoria', CURRENT_DATE - 48, chart_receita_id, customer_id),
            (company.id, bank_account_id, 'entrada', 5500.00, 'Venda produto B', CURRENT_DATE - 42, chart_receita_id, customer_id),
            (company.id, bank_account_id, 'entrada', 9800.00, 'Contrato mensal', CURRENT_DATE - 35, chart_receita_id, customer_id),
            (company.id, bank_account_id, 'entrada', 3200.00, 'Venda produto C', CURRENT_DATE - 28, chart_receita_id, customer_id),
            (company.id, bank_account_id, 'entrada', 15000.00, 'Projeto especial', CURRENT_DATE - 21, chart_receita_id, customer_id),
            (company.id, bank_account_id, 'entrada', 7500.00, 'Venda produto D', CURRENT_DATE - 14, chart_receita_id, customer_id),
            (company.id, bank_account_id, 'entrada', 4200.00, 'Suporte técnico', CURRENT_DATE - 10, chart_receita_id, customer_id),
            (company.id, bank_account_id, 'entrada', 6800.00, 'Venda produto E', CURRENT_DATE - 5, chart_receita_id, customer_id),
            (company.id, bank_account_id, 'entrada', 11000.00, 'Serviço recorrente', CURRENT_DATE - 2, chart_receita_id, customer_id);
        
        -- 10 Saida transactions
        INSERT INTO transactions (company_id, bank_account_id, type, amount, description, transaction_date, chart_account_id, supplier_id)
        VALUES
            (company.id, bank_account_id, 'saida', 5000.00, 'Pagamento aluguel', CURRENT_DATE - 52, chart_despesa_id, supplier_id),
            (company.id, bank_account_id, 'saida', 850.00, 'Conta energia', CURRENT_DATE - 45, chart_despesa_id, supplier_id),
            (company.id, bank_account_id, 'saida', 2500.00, 'Compra materiais', CURRENT_DATE - 40, chart_custo_id, supplier_id),
            (company.id, bank_account_id, 'saida', 1200.00, 'Manutenção', CURRENT_DATE - 33, chart_despesa_id, supplier_id),
            (company.id, bank_account_id, 'saida', 3800.00, 'Pagamento fornecedor', CURRENT_DATE - 26, chart_custo_id, supplier_id),
            (company.id, bank_account_id, 'saida', 650.00, 'Despesas diversas', CURRENT_DATE - 19, chart_despesa_id, supplier_id),
            (company.id, bank_account_id, 'saida', 4500.00, 'Investimento equipamento', CURRENT_DATE - 13, chart_custo_id, supplier_id),
            (company.id, bank_account_id, 'saida', 890.00, 'Conta telefone', CURRENT_DATE - 8, chart_despesa_id, supplier_id),
            (company.id, bank_account_id, 'saida', 1800.00, 'Marketing', CURRENT_DATE - 4, chart_despesa_id, supplier_id),
            (company.id, bank_account_id, 'saida', 2200.00, 'Serviços terceiros', CURRENT_DATE - 1, chart_despesa_id, supplier_id);
    END LOOP;
END $$;

-- ============================================
-- Migration: 20260110042408_3a24037a-846c-4c0e-8516-6d9d68d8b21c.sql
-- ============================================
-- Table for pending user invitations
CREATE TABLE public.user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'viewer',
  invited_by UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, email)
);

-- Table for audit logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
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

-- Table for user preferences
CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  theme TEXT DEFAULT 'system',
  date_format TEXT DEFAULT 'DD/MM/YYYY',
  currency_format TEXT DEFAULT 'pt-BR',
  dashboard_layout JSONB DEFAULT '{}',
  email_notifications BOOLEAN DEFAULT true,
  overdue_alerts BOOLEAN DEFAULT true,
  weekly_summary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_invitations
CREATE POLICY "Admins can view invitations of their companies"
ON public.user_invitations FOR SELECT
USING (
  user_belongs_to_company(auth.uid(), company_id) 
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can insert invitations for their companies"
ON public.user_invitations FOR INSERT
WITH CHECK (
  user_belongs_to_company(auth.uid(), company_id) 
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update invitations of their companies"
ON public.user_invitations FOR UPDATE
USING (
  user_belongs_to_company(auth.uid(), company_id) 
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete invitations of their companies"
ON public.user_invitations FOR DELETE
USING (
  user_belongs_to_company(auth.uid(), company_id) 
  AND has_role(auth.uid(), 'admin')
);

-- RLS Policies for audit_logs
CREATE POLICY "Admins can view audit logs of their companies"
ON public.audit_logs FOR SELECT
USING (
  user_belongs_to_company(auth.uid(), company_id) 
  AND has_role(auth.uid(), 'admin')
);

-- RLS Policies for user_preferences
CREATE POLICY "Users can view their own preferences"
ON public.user_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
ON public.user_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
ON public.user_preferences FOR UPDATE
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_user_invitations_company ON public.user_invitations(company_id);
CREATE INDEX idx_user_invitations_email ON public.user_invitations(email);
CREATE INDEX idx_user_invitations_token ON public.user_invitations(token);
CREATE INDEX idx_audit_logs_company ON public.audit_logs(company_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_user_preferences_user ON public.user_preferences(user_id);

-- Trigger for updated_at on user_preferences
CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Migration: 20260110050418_97a43210-d7ab-44cb-9948-c3e12bb0e34e.sql
-- ============================================
-- Add push notification columns to user_preferences
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS notification_advance_days integer DEFAULT 3,
ADD COLUMN IF NOT EXISTS push_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS push_subscription jsonb DEFAULT null;

-- Create notification_logs table for tracking sent notifications
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  notification_type text NOT NULL,
  related_id uuid,
  title text NOT NULL,
  body text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for notification_logs
CREATE POLICY "Users can view own notifications" 
ON public.notification_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications" 
ON public.notification_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" 
ON public.notification_logs 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_company 
ON public.notification_logs(user_id, company_id);

CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at 
ON public.notification_logs(sent_at DESC);

-- ============================================
-- Migration: 20260110055329_87f85390-d367-4bb0-820f-c9a682089fc0.sql
-- ============================================

-- Tabela de personalidade financeira
CREATE TABLE public.financial_personality (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  archetype text NOT NULL DEFAULT 'guardian',
  archetype_score jsonb DEFAULT '{}',
  quiz_answers jsonb DEFAULT '[]',
  strengths text[] DEFAULT '{}',
  growth_areas text[] DEFAULT '{}',
  last_analysis_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id)
);

-- Tabela de marcos da jornada
CREATE TABLE public.journey_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  milestone_type text NOT NULL,
  title text NOT NULL,
  description text,
  narrative text,
  icon text,
  xp_earned integer DEFAULT 0,
  unlocked_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'
);

-- Tabela de missões diárias
CREATE TABLE public.daily_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  mission_type text NOT NULL,
  title text NOT NULL,
  description text,
  target_value numeric DEFAULT 1,
  current_value numeric DEFAULT 0,
  reward_xp integer DEFAULT 10,
  status text DEFAULT 'active',
  expires_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de conquistas do usuário
CREATE TABLE public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  achievement_id text NOT NULL,
  unlocked_at timestamptz DEFAULT now(),
  UNIQUE(user_id, company_id, achievement_id)
);

-- Adicionar campos de gamificação ao profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS guardian_level integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_xp integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_title text DEFAULT 'Aprendiz Financeiro';

-- Enable RLS
ALTER TABLE public.financial_personality ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journey_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para financial_personality
CREATE POLICY "Users can view own personality" ON public.financial_personality
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own personality" ON public.financial_personality
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own personality" ON public.financial_personality
  FOR UPDATE USING (auth.uid() = user_id);

-- Políticas RLS para journey_milestones
CREATE POLICY "Users can view own milestones" ON public.journey_milestones
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own milestones" ON public.journey_milestones
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para daily_missions
CREATE POLICY "Users can view own missions" ON public.daily_missions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own missions" ON public.daily_missions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own missions" ON public.daily_missions
  FOR UPDATE USING (auth.uid() = user_id);

-- Políticas RLS para user_achievements
CREATE POLICY "Users can view own achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements" ON public.user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_financial_personality_updated_at
  BEFORE UPDATE ON public.financial_personality
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_financial_personality_user_company ON public.financial_personality(user_id, company_id);
CREATE INDEX idx_journey_milestones_user_company ON public.journey_milestones(user_id, company_id);
CREATE INDEX idx_daily_missions_user_status ON public.daily_missions(user_id, status);
CREATE INDEX idx_user_achievements_user_company ON public.user_achievements(user_id, company_id);


-- ============================================
-- Migration: 20260110075132_f54fe1d7-f3ff-4371-99bc-b0d1b251706e.sql
-- ============================================
-- Add streak fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_streak integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS longest_streak integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_activity_date date;

-- Create daily activity log for tracking streaks
CREATE TABLE IF NOT EXISTS daily_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid REFERENCES companies NOT NULL,
  activity_date date NOT NULL,
  activities_count integer DEFAULT 0,
  xp_earned integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, company_id, activity_date)
);

ALTER TABLE daily_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activity logs"
  ON daily_activity_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity logs"
  ON daily_activity_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activity logs"
  ON daily_activity_log FOR UPDATE
  USING (auth.uid() = user_id);

-- Create weekly challenges table
CREATE TABLE IF NOT EXISTS weekly_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  challenge_type text NOT NULL DEFAULT 'individual',
  target_metric text NOT NULL,
  target_value numeric NOT NULL,
  reward_xp integer DEFAULT 100,
  reward_badge text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE weekly_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active challenges"
  ON weekly_challenges FOR SELECT
  USING (is_active = true);

-- Create challenge participants table
CREATE TABLE IF NOT EXISTS challenge_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid REFERENCES weekly_challenges NOT NULL,
  user_id uuid NOT NULL,
  company_id uuid REFERENCES companies NOT NULL,
  current_value numeric DEFAULT 0,
  completed_at timestamptz,
  rank integer,
  created_at timestamptz DEFAULT now(),
  UNIQUE(challenge_id, user_id, company_id)
);

ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own challenge participations"
  ON challenge_participants FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can join challenges"
  ON challenge_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON challenge_participants FOR UPDATE
  USING (auth.uid() = user_id);

-- Create leaderboard table
CREATE TABLE IF NOT EXISTS leaderboard (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid REFERENCES companies NOT NULL,
  period_type text NOT NULL,
  period_key text NOT NULL,
  total_xp integer DEFAULT 0,
  achievements_count integer DEFAULT 0,
  missions_completed integer DEFAULT 0,
  challenges_won integer DEFAULT 0,
  rank integer,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, company_id, period_type, period_key)
);

ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view leaderboard for their companies"
  ON leaderboard FOR SELECT
  USING (user_belongs_to_company(company_id, auth.uid()));

CREATE POLICY "Users can insert their own leaderboard entries"
  ON leaderboard FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leaderboard entries"
  ON leaderboard FOR UPDATE
  USING (auth.uid() = user_id);

-- Enable realtime for challenge participants and leaderboard
ALTER PUBLICATION supabase_realtime ADD TABLE challenge_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE leaderboard;

-- ============================================
-- Migration: 20260110081217_121bd7b4-8546-4c2b-a41d-4e505058e82a.sql
-- ============================================
-- Insert sample weekly challenges
INSERT INTO weekly_challenges (title, description, challenge_type, target_metric, target_value, reward_xp, reward_badge, starts_at, ends_at, is_active)
VALUES 
  (
    'Registrador Iniciante',
    'Registre 10 transações esta semana para ganhar XP extra',
    'individual',
    'transactions_registered',
    10,
    50,
    '📝',
    NOW(),
    NOW() + INTERVAL '7 days',
    true
  ),
  (
    'Corrida dos Guardiões',
    'Quem registra mais transações esta semana? Compita com outros guardiões!',
    'competitive',
    'transactions_registered',
    50,
    150,
    '🏁',
    NOW(),
    NOW() + INTERVAL '7 days',
    true
  ),
  (
    'Meta Coletiva',
    'Juntos, vamos registrar 500 transações como comunidade!',
    'collaborative',
    'transactions_registered',
    500,
    100,
    '🤝',
    NOW(),
    NOW() + INTERVAL '7 days',
    true
  ),
  (
    'Pontualidade em Dia',
    'Pague 5 títulos antes do vencimento esta semana',
    'individual',
    'early_payments',
    5,
    75,
    '⏰',
    NOW(),
    NOW() + INTERVAL '7 days',
    true
  );

-- ============================================
-- Migration: 20260110091540_808c3146-8892-4640-a5d6-6b9827adcb8e.sql
-- ============================================
-- Create table for DRE explanatory notes
CREATE TABLE public.dre_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  chart_account_id uuid REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL,
  dre_line_id text NOT NULL,
  period_year integer NOT NULL,
  period_month integer NOT NULL,
  note text NOT NULL,
  is_important boolean DEFAULT false,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, dre_line_id, period_year, period_month)
);

-- Enable RLS
ALTER TABLE public.dre_notes ENABLE ROW LEVEL SECURITY;

-- Policy for viewing notes (company members only)
CREATE POLICY "Users can view notes from their companies"
ON public.dre_notes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_companies uc
    WHERE uc.company_id = dre_notes.company_id
    AND uc.user_id = auth.uid()
  )
);

-- Policy for creating notes
CREATE POLICY "Users can create notes for their companies"
ON public.dre_notes
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_companies uc
    WHERE uc.company_id = dre_notes.company_id
    AND uc.user_id = auth.uid()
  )
  AND created_by = auth.uid()
);

-- Policy for updating notes
CREATE POLICY "Users can update notes from their companies"
ON public.dre_notes
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_companies uc
    WHERE uc.company_id = dre_notes.company_id
    AND uc.user_id = auth.uid()
  )
);

-- Policy for deleting notes
CREATE POLICY "Users can delete notes from their companies"
ON public.dre_notes
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_companies uc
    WHERE uc.company_id = dre_notes.company_id
    AND uc.user_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_dre_notes_updated_at
BEFORE UPDATE ON public.dre_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Migration: 20260110114345_477f0c75-d416-42c4-9f11-5d7145c8f46e.sql
-- ============================================
-- Tabela para metas/orçamento do DRE
CREATE TABLE public.dre_budget (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL,
  category_code TEXT NOT NULL,
  category_name TEXT NOT NULL,
  budgeted_value DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, period_year, period_month, category_code)
);

-- Enable RLS
ALTER TABLE public.dre_budget ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view budget for their companies
CREATE POLICY "Users can view budget for their companies"
  ON public.dre_budget FOR SELECT
  USING (public.user_belongs_to_company(auth.uid(), company_id));

-- Policy: Users can insert budget for their companies
CREATE POLICY "Users can insert budget for their companies"
  ON public.dre_budget FOR INSERT
  WITH CHECK (public.user_belongs_to_company(auth.uid(), company_id));

-- Policy: Users can update budget for their companies
CREATE POLICY "Users can update budget for their companies"
  ON public.dre_budget FOR UPDATE
  USING (public.user_belongs_to_company(auth.uid(), company_id));

-- Policy: Users can delete budget for their companies
CREATE POLICY "Users can delete budget for their companies"
  ON public.dre_budget FOR DELETE
  USING (public.user_belongs_to_company(auth.uid(), company_id));

-- Trigger for updated_at
CREATE TRIGGER update_dre_budget_updated_at
  BEFORE UPDATE ON public.dre_budget
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Migration: 20260111095545_1c98e2a8-a7fc-4135-8b7c-800782c336c3.sql
-- ============================================
-- Create DRE report schedules table for automatic email exports
CREATE TABLE public.dre_report_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  recipient_emails TEXT[] NOT NULL,
  schedule_type TEXT NOT NULL DEFAULT 'monthly',
  day_of_month INTEGER DEFAULT 5 CHECK (day_of_month >= 1 AND day_of_month <= 28),
  is_active BOOLEAN DEFAULT true,
  last_sent_at TIMESTAMPTZ,
  next_send_at TIMESTAMPTZ,
  include_pdf BOOLEAN DEFAULT true,
  include_excel BOOLEAN DEFAULT false,
  report_period TEXT DEFAULT 'previous_month',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dre_report_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own company schedules"
ON public.dre_report_schedules FOR SELECT
USING (public.user_belongs_to_company(auth.uid(), company_id));

CREATE POLICY "Users can insert own company schedules"
ON public.dre_report_schedules FOR INSERT
WITH CHECK (public.user_belongs_to_company(auth.uid(), company_id));

CREATE POLICY "Users can update own company schedules"
ON public.dre_report_schedules FOR UPDATE
USING (public.user_belongs_to_company(auth.uid(), company_id));

CREATE POLICY "Users can delete own company schedules"
ON public.dre_report_schedules FOR DELETE
USING (public.user_belongs_to_company(auth.uid(), company_id));

-- Create update trigger
CREATE TRIGGER update_dre_report_schedules_updated_at
BEFORE UPDATE ON public.dre_report_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster queries
CREATE INDEX idx_dre_report_schedules_company ON public.dre_report_schedules(company_id);
CREATE INDEX idx_dre_report_schedules_next_send ON public.dre_report_schedules(next_send_at) WHERE is_active = true;

-- ============================================
-- Migration: 20260111103549_88368342-07b6-490e-b430-8853088d2236.sql
-- ============================================
-- Create table for DRE email logs/metrics
CREATE TABLE public.dre_email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES public.dre_report_schedules(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ DEFAULT now(),
  recipient_emails TEXT[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  resend_id TEXT,
  error_message TEXT,
  opened_at TIMESTAMPTZ,
  report_period TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dre_email_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view email logs for their companies" 
ON public.dre_email_logs 
FOR SELECT 
USING (user_belongs_to_company(auth.uid(), company_id));

CREATE POLICY "Service role can insert email logs"
ON public.dre_email_logs
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Service role can update email logs"
ON public.dre_email_logs
FOR UPDATE
USING (true);

-- Index for faster queries
CREATE INDEX idx_dre_email_logs_schedule_id ON public.dre_email_logs(schedule_id);
CREATE INDEX idx_dre_email_logs_company_id ON public.dre_email_logs(company_id);
CREATE INDEX idx_dre_email_logs_sent_at ON public.dre_email_logs(sent_at DESC);

-- ============================================
-- Migration: 20260111103602_32fcac0b-4456-4080-85d6-1bb17e90c0a6.sql
-- ============================================
-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Service role can insert email logs" ON public.dre_email_logs;
DROP POLICY IF EXISTS "Service role can update email logs" ON public.dre_email_logs;

-- Create proper INSERT policy - only for users who belong to the company
CREATE POLICY "Users can insert email logs for their companies"
ON public.dre_email_logs
FOR INSERT
WITH CHECK (user_belongs_to_company(auth.uid(), company_id));

-- Create proper UPDATE policy - only for users who belong to the company  
CREATE POLICY "Users can update email logs for their companies"
ON public.dre_email_logs
FOR UPDATE
USING (user_belongs_to_company(auth.uid(), company_id));

-- ============================================
-- Migration: 20260121204227_9c7459ce-9e10-4462-addf-1859766e9293.sql
-- ============================================
-- Add mobile_phone column to companies table
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS mobile_phone TEXT;

-- ============================================
-- Migration: 20260121230545_ce7742d3-799d-4cf3-9f89-1cabf72fc87c.sql
-- ============================================
-- Create enum for payment methods (if not exists, we'll use text for flexibility)
-- Add payment_method column to transactions table
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'dinheiro';

-- Add comment for documentation
COMMENT ON COLUMN public.transactions.payment_method IS 'Payment method: dinheiro, pix, cartao_debito, cartao_credito, boleto, transferencia';

-- ============================================
-- Migration: 20260122012621_1cf0474c-369b-416e-9f28-c9e424bafb7f.sql
-- ============================================
-- Add category column to suppliers table
ALTER TABLE public.suppliers 
ADD COLUMN IF NOT EXISTS category text DEFAULT NULL;

COMMENT ON COLUMN public.suppliers.category IS 'Categoria do fornecedor: Serviços, Materiais, Tecnologia, etc.';

-- ============================================
-- Migration: 20260122013257_3cca0a0d-9c6a-4814-81bd-60816ba831f7.sql
-- ============================================
-- Create audit log function with security definer to bypass RLS
CREATE OR REPLACE FUNCTION public.log_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get current user ID safely
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

-- Create triggers for main transactional tables
CREATE TRIGGER audit_transactions
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();

CREATE TRIGGER audit_receivables
  AFTER INSERT OR UPDATE OR DELETE ON public.receivables
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();

CREATE TRIGGER audit_payables
  AFTER INSERT OR UPDATE OR DELETE ON public.payables
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();

CREATE TRIGGER audit_customers
  AFTER INSERT OR UPDATE OR DELETE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();

CREATE TRIGGER audit_suppliers
  AFTER INSERT OR UPDATE OR DELETE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();

CREATE TRIGGER audit_bank_accounts
  AFTER INSERT OR UPDATE OR DELETE ON public.bank_accounts
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();

CREATE TRIGGER audit_chart_of_accounts
  AFTER INSERT OR UPDATE OR DELETE ON public.chart_of_accounts
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();

-- ============================================
-- Migration: 20260122013740_bb5648f9-2b46-417c-80b2-6ec450a2961d.sql
-- ============================================
-- Add tax_regime column to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS tax_regime text DEFAULT 'simples_nacional';

COMMENT ON COLUMN public.companies.tax_regime IS 'Regime tributario: simples_nacional, lucro_presumido, lucro_real, mei';

-- ============================================
-- Migration: 20260122152635_a5dea6e2-4af8-4111-a845-04f3a1bd11de.sql
-- ============================================
-- Fix handle_new_user to assign 'viewer' by default, only first user gets 'admin'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_role app_role;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  
  -- Check if this is the first user (no admins exist yet)
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    v_role := 'admin';
  ELSE
    v_role := 'viewer';
  END IF;
  
  -- Assign role (avoid duplicates)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$function$;

-- ============================================
-- Migration: 20260122235603_7e5c2697-f9c5-46f5-9efd-e4635c336670.sql
-- ============================================
-- Add reconciliation columns to transactions table
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS reconciled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS reconciled_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS reconciled_by uuid,
ADD COLUMN IF NOT EXISTS bank_statement_ref text;

-- Create index for reconciliation queries
CREATE INDEX IF NOT EXISTS idx_transactions_reconciled 
ON public.transactions(company_id, bank_account_id, reconciled);

-- Create bank_statements table for imported OFX transactions
CREATE TABLE public.bank_statements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  bank_account_id uuid NOT NULL REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
  
  -- OFX transaction data
  fitid text NOT NULL,
  transaction_date date NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL,
  type text NOT NULL CHECK (type IN ('credit', 'debit')),
  memo text,
  check_number text,
  
  -- Reconciliation status
  reconciled boolean DEFAULT false,
  reconciled_transaction_id uuid REFERENCES public.transactions(id),
  reconciled_at timestamp with time zone,
  reconciled_by uuid,
  
  -- Import metadata
  imported_at timestamp with time zone DEFAULT now(),
  imported_by uuid NOT NULL,
  source_file text,
  
  created_at timestamp with time zone DEFAULT now(),
  
  -- Prevent duplicate FITIDs for the same account
  UNIQUE(bank_account_id, fitid)
);

-- Enable RLS on bank_statements
ALTER TABLE public.bank_statements ENABLE ROW LEVEL SECURITY;

-- RLS policies for bank_statements
CREATE POLICY "Users can view bank_statements of their companies"
ON public.bank_statements FOR SELECT
USING (user_belongs_to_company(auth.uid(), company_id));

CREATE POLICY "Admins and editors can insert bank_statements"
ON public.bank_statements FOR INSERT
WITH CHECK (
  user_belongs_to_company(auth.uid(), company_id) AND 
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role))
);

CREATE POLICY "Admins and editors can update bank_statements"
ON public.bank_statements FOR UPDATE
USING (
  user_belongs_to_company(auth.uid(), company_id) AND 
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role))
);

CREATE POLICY "Admins can delete bank_statements"
ON public.bank_statements FOR DELETE
USING (
  user_belongs_to_company(auth.uid(), company_id) AND 
  has_role(auth.uid(), 'admin'::app_role)
);

-- ============================================
-- Migration: 20260123052415_a5fa717e-6476-4eb1-a617-26338a447b4a.sql
-- ============================================
-- Create bank_statement_imports table to track import history
CREATE TABLE public.bank_statement_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  bank_account_id uuid NOT NULL REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
  filename text NOT NULL,
  import_date timestamptz DEFAULT now(),
  period_start date,
  period_end date,
  total_transactions int NOT NULL DEFAULT 0,
  total_credits numeric(15,2) DEFAULT 0,
  total_debits numeric(15,2) DEFAULT 0,
  imported_by uuid NOT NULL,
  detected_bank_name text,
  created_at timestamptz DEFAULT now()
);

-- Add import_id reference to bank_statements table
ALTER TABLE public.bank_statements ADD COLUMN import_id uuid REFERENCES public.bank_statement_imports(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.bank_statement_imports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bank_statement_imports
CREATE POLICY "Users can view imports of their companies"
ON public.bank_statement_imports
FOR SELECT
USING (user_belongs_to_company(auth.uid(), company_id));

CREATE POLICY "Admins and editors can insert imports"
ON public.bank_statement_imports
FOR INSERT
WITH CHECK (user_belongs_to_company(auth.uid(), company_id) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role)));

CREATE POLICY "Admins can delete imports"
ON public.bank_statement_imports
FOR DELETE
USING (user_belongs_to_company(auth.uid(), company_id) AND has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- Migration: 20260123055858_a6046d6b-a566-41c1-b007-73de0955b813.sql
-- ============================================
-- Add columns for tracking original dates
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS original_transaction_date date,
ADD COLUMN IF NOT EXISTS original_created_at timestamptz;

-- Create function to save original dates on first edit
CREATE OR REPLACE FUNCTION save_original_dates()
RETURNS TRIGGER AS $$
BEGIN
  -- Save original transaction_date on first change
  IF OLD.original_transaction_date IS NULL 
     AND NEW.transaction_date IS DISTINCT FROM OLD.transaction_date THEN
    NEW.original_transaction_date = OLD.transaction_date;
  END IF;
  
  -- Save original created_at if changed (rare but tracked)
  IF OLD.original_created_at IS NULL 
     AND NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    NEW.original_created_at = OLD.created_at;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to save original dates
DROP TRIGGER IF EXISTS tr_save_original_dates ON transactions;
CREATE TRIGGER tr_save_original_dates
BEFORE UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION save_original_dates();

-- ============================================
-- Migration: 20260123055906_c83ab874-65d7-4030-bb32-b7a6b8a7b144.sql
-- ============================================
-- Fix security warning: Set search_path for the function
CREATE OR REPLACE FUNCTION save_original_dates()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Save original transaction_date on first change
  IF OLD.original_transaction_date IS NULL 
     AND NEW.transaction_date IS DISTINCT FROM OLD.transaction_date THEN
    NEW.original_transaction_date = OLD.transaction_date;
  END IF;
  
  -- Save original created_at if changed (rare but tracked)
  IF OLD.original_created_at IS NULL 
     AND NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    NEW.original_created_at = OLD.created_at;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Migration: 20260125225823_8ae04257-98c8-4b16-8709-a72bedb0840e.sql
-- ============================================
-- Create subscriptions table for Stripe integration
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  stripe_customer_id text,
  stripe_subscription_id text UNIQUE,
  stripe_price_id text,
  plan_name text NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'inactive',
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT subscriptions_user_id_unique UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users can view their own subscription"
ON public.subscriptions FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own subscription (for initial creation)
CREATE POLICY "Users can insert their own subscription"
ON public.subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Migration: 20260126205341_08f0eb2b-6c38-440c-a465-4ac2af47bcd6.sql
-- ============================================
-- FASE 1: Corrigir Onboarding - Permitir criação da primeira empresa

-- 1.1 Adicionar coluna created_by na tabela companies
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 1.2 Criar função para verificar se usuário pode criar primeira empresa
CREATE OR REPLACE FUNCTION public.can_create_first_company(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM public.user_companies
    WHERE user_id = _user_id
  )
$$;

-- 1.3 Atualizar política RLS para INSERT em companies
DROP POLICY IF EXISTS "Admins can insert companies" ON public.companies;

CREATE POLICY "Users can create first company or admins can create any"
  ON public.companies FOR INSERT
  WITH CHECK (
    public.can_create_first_company(auth.uid())
    OR
    public.has_role(auth.uid(), 'admin')
  );

-- 1.4 Atualizar políticas RLS para user_companies
DROP POLICY IF EXISTS "Admins can manage user company associations" ON public.user_companies;

-- Permitir usuário associar-se a empresa que ele criou OU admins gerenciarem
CREATE POLICY "Users can join their created company or admins can manage"
  ON public.user_companies FOR INSERT
  WITH CHECK (
    (
      auth.uid() = user_id 
      AND EXISTS (
        SELECT 1 FROM public.companies 
        WHERE id = company_id 
        AND created_by = auth.uid()
      )
    )
    OR
    public.has_role(auth.uid(), 'admin')
  );

-- Admins podem fazer UPDATE/DELETE em user_companies
CREATE POLICY "Admins can update user company associations"
  ON public.user_companies FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete user company associations"
  ON public.user_companies FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- Migration: 20260127144736_85340f58-8620-4542-be6f-ec4028a3d438.sql
-- ============================================
-- FASE 1: Remover políticas antigas para garantir estado limpo
DROP POLICY IF EXISTS "Users can create first company or admins can create any" ON public.companies;
DROP POLICY IF EXISTS "Admins can insert companies" ON public.companies;

-- FASE 2: Recriar a função com VOLATILE para evitar cache
CREATE OR REPLACE FUNCTION public.can_create_first_company(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM public.user_companies
    WHERE user_id = _user_id
  )
$$;

-- FASE 3: Criar política de INSERT permitindo criação da primeira empresa
CREATE POLICY "Allow first company creation or admin insert"
  ON public.companies FOR INSERT
  TO authenticated
  WITH CHECK (
    public.can_create_first_company(auth.uid())
    OR
    public.has_role(auth.uid(), 'admin'::app_role)
  );

-- FASE 4: Garantir GRANT correto para authenticated
GRANT INSERT ON public.companies TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- ============================================
-- Migration: 20260127145541_8d29701c-c916-49d3-b179-5f6b08fa8223.sql
-- ============================================
-- Recria a policy de INSERT de forma mais direta (sem função) para evitar inconsistências
DROP POLICY IF EXISTS "Allow first company creation or admin insert" ON public.companies;

CREATE POLICY "Allow first company creation or admin insert"
  ON public.companies
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (
      created_by = auth.uid()
      AND NOT EXISTS (
        SELECT 1
        FROM public.user_companies uc
        WHERE uc.user_id = auth.uid()
      )
    )
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );


-- ============================================
-- Migration: 20260128194120_baa39149-4632-4777-9c2b-9fa2ff7780be.sql
-- ============================================
-- Define DEFAULT para created_by como auth.uid()
ALTER TABLE public.companies
  ALTER COLUMN created_by SET DEFAULT auth.uid();

-- Trigger para forçar created_by = auth.uid() mesmo se vier NULL explícito
CREATE OR REPLACE FUNCTION public.set_company_created_by()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Sempre força created_by para o usuário autenticado
  NEW.created_by := auth.uid();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_company_created_by
  BEFORE INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.set_company_created_by();

-- ============================================
-- Migration: 20260129003138_08aa07d0-086a-4d34-8d8f-7bb1c7fa766d.sql
-- ============================================
-- Add SELECT policy to allow users to view companies they created
-- This fixes the RETURNING clause issue during onboarding where the user
-- creates a company but isn't yet in user_companies

CREATE POLICY "Users can view companies they created" 
ON public.companies 
FOR SELECT 
TO authenticated 
USING (created_by = auth.uid());

-- ============================================
-- Migration: 20260129051513_9e2eeeba-cde1-4396-a5c9-e493b39d1277.sql
-- ============================================
-- Add trial_started_at column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add comment explaining the column
COMMENT ON COLUMN public.profiles.trial_started_at IS 
  'Data de início do período de trial gratuito de 14 dias';

-- ============================================
-- Migration: 20260129070552_a9c3385f-fe9d-4e62-8f58-cccb436b2796.sql
-- ============================================
-- =============================================
-- FASE 1: SUPER ADMIN DASHBOARD - TABELAS
-- =============================================

-- Tabela de sessões de usuário para rastrear usuários online
CREATE TABLE public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT now(),
  device_info JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT
);

-- Índice para buscar sessões ativas (heartbeat nos últimos 5 minutos)
CREATE INDEX idx_user_sessions_active ON user_sessions(last_heartbeat DESC);
CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Policies para user_sessions
CREATE POLICY "Users can insert own sessions"
  ON public.user_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON public.user_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON public.user_sessions FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own sessions"
  ON public.user_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Tabela de histórico de MRR para gráficos de evolução
CREATE TABLE public.mrr_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recorded_date DATE NOT NULL,
  mrr DECIMAL(12,2) NOT NULL DEFAULT 0,
  arr DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_subscribers INTEGER NOT NULL DEFAULT 0,
  active_trials INTEGER NOT NULL DEFAULT 0,
  churned_count INTEGER NOT NULL DEFAULT 0,
  new_subscribers INTEGER NOT NULL DEFAULT 0,
  plan_breakdown JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(recorded_date)
);

-- Enable RLS (only admins can read via edge function)
ALTER TABLE public.mrr_history ENABLE ROW LEVEL SECURITY;

-- No direct access - only via edge function with service role
CREATE POLICY "No direct access to mrr_history"
  ON public.mrr_history FOR SELECT
  USING (false);

-- Tabela para contagem de transações por empresa (cache para performance)
CREATE TABLE public.tenant_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  transactions_count INTEGER NOT NULL DEFAULT 0,
  last_transaction_at TIMESTAMPTZ,
  last_user_activity_at TIMESTAMPTZ,
  active_users_count INTEGER NOT NULL DEFAULT 0,
  total_revenue DECIMAL(14,2) DEFAULT 0,
  total_expenses DECIMAL(14,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id)
);

-- Enable RLS
ALTER TABLE public.tenant_metrics ENABLE ROW LEVEL SECURITY;

-- Policy para tenant_metrics (usuários veem métricas das suas empresas)
CREATE POLICY "Users can view own company metrics"
  ON public.tenant_metrics FOR SELECT
  USING (user_belongs_to_company(auth.uid(), company_id));

-- Tabela para log de impersonate (auditoria de segurança)
CREATE TABLE public.impersonate_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  target_user_id UUID NOT NULL,
  target_company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  reason TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT
);

-- Enable RLS
ALTER TABLE public.impersonate_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view impersonate logs
CREATE POLICY "Admins can view impersonate logs"
  ON public.impersonate_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert impersonate logs"
  ON public.impersonate_logs FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Function para atualizar tenant_metrics quando transações mudam
CREATE OR REPLACE FUNCTION public.update_tenant_metrics()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para atualizar métricas do tenant
CREATE TRIGGER trigger_update_tenant_metrics
AFTER INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_tenant_metrics();

-- ============================================
-- Migration: 20260129072815_8c8915d4-8a77-4fca-b564-4afedb367294.sql
-- ============================================
-- Update handle_new_user to automatically start 14-day trial
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_role app_role;
BEGIN
  -- Create profile with trial started
  INSERT INTO public.profiles (user_id, full_name, trial_started_at)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', now());
  
  -- Check if this is the first user (no admins exist yet)
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    v_role := 'admin';
  ELSE
    v_role := 'viewer';
  END IF;
  
  -- Assign role (avoid duplicates)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$function$;

-- ============================================
-- Migration: 20260129074943_8314aa38-f405-4cef-9a2e-8cf1d80ab360.sql
-- ============================================
-- Make ocr_images bucket private and add proper RLS policies
UPDATE storage.buckets SET public = false WHERE id = 'ocr_images';

-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Anyone can view ocr images" ON storage.objects;

-- Create proper RLS policies for ocr_images bucket
-- Users can view images from their company's OCR scans
CREATE POLICY "Authenticated users can view their company's ocr images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'ocr_images'
  AND auth.role() = 'authenticated'
  AND (
    -- Check if the image belongs to a scan from the user's company
    EXISTS (
      SELECT 1 FROM public.ocr_scans os
      INNER JOIN public.user_companies uc ON uc.company_id = os.company_id
      WHERE uc.user_id = auth.uid()
      AND storage.objects.name LIKE os.company_id::text || '/%'
    )
    OR
    -- Or the user owns the scan directly
    EXISTS (
      SELECT 1 FROM public.ocr_scans os
      WHERE os.user_id = auth.uid()
      AND storage.objects.name LIKE os.company_id::text || '/%'
    )
  )
);

-- Users can upload images to their company's folder
CREATE POLICY "Authenticated users can upload ocr images to their company"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'ocr_images'
  AND auth.role() = 'authenticated'
  AND (
    EXISTS (
      SELECT 1 FROM public.user_companies uc
      WHERE uc.user_id = auth.uid()
      AND (storage.foldername(name))[1] = uc.company_id::text
    )
  )
);

-- Users can delete images from their company's folder (admin/editor only)
CREATE POLICY "Admins can delete ocr images from their company"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'ocr_images'
  AND auth.role() = 'authenticated'
  AND public.has_role(auth.uid(), 'admin')
  AND (
    EXISTS (
      SELECT 1 FROM public.user_companies uc
      WHERE uc.user_id = auth.uid()
      AND (storage.foldername(name))[1] = uc.company_id::text
    )
  )
);

-- ============================================
-- Migration: 20260129075542_f0d6c87e-0bae-4c97-88b1-4805ce761cff.sql
-- ============================================
-- Fix 1: Make company_logos bucket private
UPDATE storage.buckets SET public = false WHERE id = 'company_logos';

-- Fix 2: Improve bank balance triggers with validation
-- Update update_bank_balance_on_transaction with amount validation
CREATE OR REPLACE FUNCTION public.update_bank_balance_on_transaction()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Validate amount is positive
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
    -- Revert old transaction
    IF OLD.type = 'entrada' THEN
      UPDATE public.bank_accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.bank_account_id;
    ELSE
      UPDATE public.bank_accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.bank_account_id;
    END IF;
    -- Apply new transaction
    IF NEW.type = 'entrada' THEN
      UPDATE public.bank_accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.bank_account_id;
    ELSE
      UPDATE public.bank_accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.bank_account_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Update update_bank_balance_on_payment with amount validation
CREATE OR REPLACE FUNCTION public.update_bank_balance_on_payment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Validate amount is positive
  IF TG_OP = 'INSERT' THEN
    IF NEW.amount IS NULL OR NEW.amount <= 0 THEN
      RAISE EXCEPTION 'Payment amount must be positive';
    END IF;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.receivable_id IS NOT NULL THEN
      -- Receivable payment = money coming in
      UPDATE public.bank_accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.bank_account_id;
      -- Update receivable paid_amount and status
      UPDATE public.receivables 
      SET paid_amount = paid_amount + NEW.amount,
          status = CASE 
            WHEN paid_amount + NEW.amount >= total_amount THEN 'pago'::receivable_status
            WHEN paid_amount + NEW.amount > 0 THEN 'parcial'::receivable_status
            ELSE 'pendente'::receivable_status
          END
      WHERE id = NEW.receivable_id;
    ELSE
      -- Payable payment = money going out
      UPDATE public.bank_accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.bank_account_id;
      -- Update payable paid_amount and status
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
$function$;

-- Fix 3: Fix race condition in handle_new_user with row locking
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_role app_role;
  v_admin_exists boolean;
BEGIN
  -- Create profile with trial started
  INSERT INTO public.profiles (user_id, full_name, trial_started_at)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', now());
  
  -- Use FOR UPDATE to lock the rows and prevent race condition
  -- SKIP LOCKED ensures we don't wait if another transaction has the lock
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
  
  -- Assign role (avoid duplicates)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$function$;

-- ============================================
-- Migration: 20260129080922_c466506c-1661-48f6-8595-2c71685e6f3d.sql
-- ============================================
-- Fix company_logos storage bucket RLS policies
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can upload company logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view company logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update company logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete company logos" ON storage.objects;

-- Create proper RLS policies that validate company membership
-- File path format: {company_id}/{filename}

-- SELECT: Users can view logos from companies they belong to
CREATE POLICY "Users can view logos from their companies"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'company_logos' AND
  public.user_belongs_to_company(auth.uid(), (storage.foldername(name))[1]::uuid)
);

-- INSERT: Admins can upload logos to their companies
CREATE POLICY "Admins can upload logos to their companies"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'company_logos' AND
  public.user_belongs_to_company(auth.uid(), (storage.foldername(name))[1]::uuid) AND
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- UPDATE: Admins can update logos in their companies
CREATE POLICY "Admins can update logos in their companies"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'company_logos' AND
  public.user_belongs_to_company(auth.uid(), (storage.foldername(name))[1]::uuid) AND
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- DELETE: Admins can delete logos from their companies
CREATE POLICY "Admins can delete logos from their companies"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'company_logos' AND
  public.user_belongs_to_company(auth.uid(), (storage.foldername(name))[1]::uuid) AND
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- ============================================
-- Migration: 20260129135619_ee9a8deb-a44b-4f32-bd55-d552c64bab13.sql
-- ============================================
-- Criar tabela de centros de custo
CREATE TABLE public.cost_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#C5A059',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, code)
);

-- Adicionar coluna em transactions
ALTER TABLE public.transactions 
ADD COLUMN cost_center_id UUID REFERENCES public.cost_centers(id);

-- Adicionar coluna em payables
ALTER TABLE public.payables 
ADD COLUMN cost_center_id UUID REFERENCES public.cost_centers(id);

-- RLS para cost_centers
ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view cost_centers of their companies"
ON public.cost_centers FOR SELECT
USING (user_belongs_to_company(auth.uid(), company_id));

CREATE POLICY "Admins and editors can insert cost_centers"
ON public.cost_centers FOR INSERT
WITH CHECK (user_belongs_to_company(auth.uid(), company_id) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor')));

CREATE POLICY "Admins and editors can update cost_centers"
ON public.cost_centers FOR UPDATE
USING (user_belongs_to_company(auth.uid(), company_id) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor')));

CREATE POLICY "Admins can delete cost_centers"
ON public.cost_centers FOR DELETE
USING (user_belongs_to_company(auth.uid(), company_id) 
  AND has_role(auth.uid(), 'admin'));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_cost_centers_updated_at
BEFORE UPDATE ON public.cost_centers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Migration: 20260129140737_0702a2bc-e341-44e6-88dc-2192c1c8f3bb.sql
-- ============================================
-- Criar funcao helper para verificar se o usuario e dono da empresa
CREATE OR REPLACE FUNCTION public.is_company_owner(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.companies
    WHERE id = _company_id
      AND created_by = _user_id
  )
$$;

-- =============================================
-- COST_CENTERS - Atualizar politicas
-- =============================================
DROP POLICY IF EXISTS "Admins and editors can insert cost_centers" ON public.cost_centers;
DROP POLICY IF EXISTS "Admins and editors can update cost_centers" ON public.cost_centers;
DROP POLICY IF EXISTS "Admins can delete cost_centers" ON public.cost_centers;

CREATE POLICY "Owners, admins and editors can insert cost_centers"
ON public.cost_centers FOR INSERT
WITH CHECK (
  user_belongs_to_company(auth.uid(), company_id) 
  AND (
    has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'editor')
    OR is_company_owner(auth.uid(), company_id)
  )
);

CREATE POLICY "Owners, admins and editors can update cost_centers"
ON public.cost_centers FOR UPDATE
USING (
  user_belongs_to_company(auth.uid(), company_id) 
  AND (
    has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'editor')
    OR is_company_owner(auth.uid(), company_id)
  )
);

CREATE POLICY "Owners and admins can delete cost_centers"
ON public.cost_centers FOR DELETE
USING (
  user_belongs_to_company(auth.uid(), company_id) 
  AND (
    has_role(auth.uid(), 'admin')
    OR is_company_owner(auth.uid(), company_id)
  )
);

-- =============================================
-- CHART_OF_ACCOUNTS - Atualizar politicas
-- =============================================
DROP POLICY IF EXISTS "Admins and editors can insert chart_of_accounts" ON public.chart_of_accounts;
DROP POLICY IF EXISTS "Admins and editors can update chart_of_accounts" ON public.chart_of_accounts;
DROP POLICY IF EXISTS "Admins can delete chart_of_accounts" ON public.chart_of_accounts;

CREATE POLICY "Owners, admins and editors can insert chart_of_accounts"
ON public.chart_of_accounts FOR INSERT
WITH CHECK (
  user_belongs_to_company(auth.uid(), company_id) 
  AND (
    has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'editor')
    OR is_company_owner(auth.uid(), company_id)
  )
);

CREATE POLICY "Owners, admins and editors can update chart_of_accounts"
ON public.chart_of_accounts FOR UPDATE
USING (
  user_belongs_to_company(auth.uid(), company_id) 
  AND (
    has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'editor')
    OR is_company_owner(auth.uid(), company_id)
  )
);

CREATE POLICY "Owners and admins can delete chart_of_accounts"
ON public.chart_of_accounts FOR DELETE
USING (
  user_belongs_to_company(auth.uid(), company_id) 
  AND (
    has_role(auth.uid(), 'admin')
    OR is_company_owner(auth.uid(), company_id)
  )
);

-- =============================================
-- TRANSACTIONS - Atualizar politicas
-- =============================================
DROP POLICY IF EXISTS "Admins and editors can insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins and editors can update transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can delete transactions" ON public.transactions;

CREATE POLICY "Owners, admins and editors can insert transactions"
ON public.transactions FOR INSERT
WITH CHECK (
  user_belongs_to_company(auth.uid(), company_id) 
  AND (
    has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'editor')
    OR is_company_owner(auth.uid(), company_id)
  )
);

CREATE POLICY "Owners, admins and editors can update transactions"
ON public.transactions FOR UPDATE
USING (
  user_belongs_to_company(auth.uid(), company_id) 
  AND (
    has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'editor')
    OR is_company_owner(auth.uid(), company_id)
  )
);

CREATE POLICY "Owners and admins can delete transactions"
ON public.transactions FOR DELETE
USING (
  user_belongs_to_company(auth.uid(), company_id) 
  AND (
    has_role(auth.uid(), 'admin')
    OR is_company_owner(auth.uid(), company_id)
  )
);

-- =============================================
-- PAYABLES - Atualizar politicas
-- =============================================
DROP POLICY IF EXISTS "Admins and editors can insert payables" ON public.payables;
DROP POLICY IF EXISTS "Admins and editors can update payables" ON public.payables;
DROP POLICY IF EXISTS "Admins can delete payables" ON public.payables;

CREATE POLICY "Owners, admins and editors can insert payables"
ON public.payables FOR INSERT
WITH CHECK (
  user_belongs_to_company(auth.uid(), company_id) 
  AND (
    has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'editor')
    OR is_company_owner(auth.uid(), company_id)
  )
);

CREATE POLICY "Owners, admins and editors can update payables"
ON public.payables FOR UPDATE
USING (
  user_belongs_to_company(auth.uid(), company_id) 
  AND (
    has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'editor')
    OR is_company_owner(auth.uid(), company_id)
  )
);

CREATE POLICY "Owners and admins can delete payables"
ON public.payables FOR DELETE
USING (
  user_belongs_to_company(auth.uid(), company_id) 
  AND (
    has_role(auth.uid(), 'admin')
    OR is_company_owner(auth.uid(), company_id)
  )
);

-- =============================================
-- RECEIVABLES - Atualizar politicas
-- =============================================
DROP POLICY IF EXISTS "Admins and editors can insert receivables" ON public.receivables;
DROP POLICY IF EXISTS "Admins and editors can update receivables" ON public.receivables;
DROP POLICY IF EXISTS "Admins can delete receivables" ON public.receivables;

CREATE POLICY "Owners, admins and editors can insert receivables"
ON public.receivables FOR INSERT
WITH CHECK (
  user_belongs_to_company(auth.uid(), company_id) 
  AND (
    has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'editor')
    OR is_company_owner(auth.uid(), company_id)
  )
);

CREATE POLICY "Owners, admins and editors can update receivables"
ON public.receivables FOR UPDATE
USING (
  user_belongs_to_company(auth.uid(), company_id) 
  AND (
    has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'editor')
    OR is_company_owner(auth.uid(), company_id)
  )
);

CREATE POLICY "Owners and admins can delete receivables"
ON public.receivables FOR DELETE
USING (
  user_belongs_to_company(auth.uid(), company_id) 
  AND (
    has_role(auth.uid(), 'admin')
    OR is_company_owner(auth.uid(), company_id)
  )
);

-- =============================================
-- CUSTOMERS - Atualizar politicas
-- =============================================
DROP POLICY IF EXISTS "Admins and editors can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Admins and editors can update customers" ON public.customers;
DROP POLICY IF EXISTS "Admins can delete customers" ON public.customers;

CREATE POLICY "Owners, admins and editors can insert customers"
ON public.customers FOR INSERT
WITH CHECK (
  user_belongs_to_company(auth.uid(), company_id) 
  AND (
    has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'editor')
    OR is_company_owner(auth.uid(), company_id)
  )
);

CREATE POLICY "Owners, admins and editors can update customers"
ON public.customers FOR UPDATE
USING (
  user_belongs_to_company(auth.uid(), company_id) 
  AND (
    has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'editor')
    OR is_company_owner(auth.uid(), company_id)
  )
);

CREATE POLICY "Owners and admins can delete customers"
ON public.customers FOR DELETE
USING (
  user_belongs_to_company(auth.uid(), company_id) 
  AND (
    has_role(auth.uid(), 'admin')
    OR is_company_owner(auth.uid(), company_id)
  )
);

-- =============================================
-- SUPPLIERS - Atualizar politicas
-- =============================================
DROP POLICY IF EXISTS "Admins and editors can insert suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Admins and editors can update suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Admins can delete suppliers" ON public.suppliers;

CREATE POLICY "Owners, admins and editors can insert suppliers"
ON public.suppliers FOR INSERT
WITH CHECK (
  user_belongs_to_company(auth.uid(), company_id) 
  AND (
    has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'editor')
    OR is_company_owner(auth.uid(), company_id)
  )
);

CREATE POLICY "Owners, admins and editors can update suppliers"
ON public.suppliers FOR UPDATE
USING (
  user_belongs_to_company(auth.uid(), company_id) 
  AND (
    has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'editor')
    OR is_company_owner(auth.uid(), company_id)
  )
);

CREATE POLICY "Owners and admins can delete suppliers"
ON public.suppliers FOR DELETE
USING (
  user_belongs_to_company(auth.uid(), company_id) 
  AND (
    has_role(auth.uid(), 'admin')
    OR is_company_owner(auth.uid(), company_id)
  )
);

-- =============================================
-- BANK_ACCOUNTS - Atualizar politicas
-- =============================================
DROP POLICY IF EXISTS "Admins and editors can insert bank_accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Admins and editors can update bank_accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Admins can delete bank_accounts" ON public.bank_accounts;

CREATE POLICY "Owners, admins and editors can insert bank_accounts"
ON public.bank_accounts FOR INSERT
WITH CHECK (
  user_belongs_to_company(auth.uid(), company_id) 
  AND (
    has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'editor')
    OR is_company_owner(auth.uid(), company_id)
  )
);

CREATE POLICY "Owners, admins and editors can update bank_accounts"
ON public.bank_accounts FOR UPDATE
USING (
  user_belongs_to_company(auth.uid(), company_id) 
  AND (
    has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'editor')
    OR is_company_owner(auth.uid(), company_id)
  )
);

CREATE POLICY "Owners and admins can delete bank_accounts"
ON public.bank_accounts FOR DELETE
USING (
  user_belongs_to_company(auth.uid(), company_id) 
  AND (
    has_role(auth.uid(), 'admin')
    OR is_company_owner(auth.uid(), company_id)
  )
);

-- ============================================
-- Migration: 20260203164548_efc97d85-90cd-49c0-9f33-e00711c3d6d2.sql
-- ============================================
-- Create RPC function to fetch user context in a single query
-- Returns profile, roles, and companies with their associations

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
  -- Get profile
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

  -- Get roles as array
  SELECT COALESCE(array_agg(role), ARRAY[]::app_role[])
  INTO v_roles
  FROM user_roles
  WHERE user_id = p_user_id;

  -- Get companies with full details
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

  -- Get default company id
  SELECT company_id INTO v_default_company_id
  FROM user_companies
  WHERE user_id = p_user_id AND is_default = true
  LIMIT 1;

  -- Build final result
  v_result := jsonb_build_object(
    'profile', COALESCE(v_profile, '{}'::jsonb),
    'roles', to_jsonb(v_roles),
    'companies', v_companies,
    'default_company_id', v_default_company_id
  );

  RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_context(UUID) TO authenticated;

-- ============================================
-- Migration: 20260203223619_43a1f431-e524-4f81-8dde-6ef25a810c86.sql
-- ============================================
-- Restore per-company role on user_companies (frontend and get_user_context expect it)
ALTER TABLE public.user_companies
ADD COLUMN IF NOT EXISTS role public.app_role NOT NULL DEFAULT 'viewer'::public.app_role;

-- Optional: index for admin queries/filtering
CREATE INDEX IF NOT EXISTS idx_user_companies_user_id_role
ON public.user_companies (user_id, role);


-- ============================================
-- Migration: 20260204190551_402e4074-672a-444a-80f8-e4eb7e80d9c6.sql
-- ============================================
-- Create categories table for personal organization
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('receita', 'despesa', 'ambos')),
  color VARCHAR(7) DEFAULT '#6366f1',
  icon VARCHAR(50) DEFAULT 'tag',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_categories_company ON public.categories(company_id);
CREATE INDEX idx_categories_type ON public.categories(company_id, type);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies using security definer functions (avoid recursion)
CREATE POLICY "Users can view categories of their company"
  ON public.categories FOR SELECT
  USING (user_belongs_to_company(auth.uid(), company_id));

CREATE POLICY "Owners, admins and editors can insert categories"
  ON public.categories FOR INSERT
  WITH CHECK (
    user_belongs_to_company(auth.uid(), company_id) AND 
    (has_role(auth.uid(), 'admin'::app_role) OR 
     has_role(auth.uid(), 'editor'::app_role) OR 
     is_company_owner(auth.uid(), company_id))
  );

CREATE POLICY "Owners, admins and editors can update categories"
  ON public.categories FOR UPDATE
  USING (
    user_belongs_to_company(auth.uid(), company_id) AND 
    (has_role(auth.uid(), 'admin'::app_role) OR 
     has_role(auth.uid(), 'editor'::app_role) OR 
     is_company_owner(auth.uid(), company_id))
  );

CREATE POLICY "Owners and admins can delete categories"
  ON public.categories FOR DELETE
  USING (
    user_belongs_to_company(auth.uid(), company_id) AND 
    (has_role(auth.uid(), 'admin'::app_role) OR 
     is_company_owner(auth.uid(), company_id))
  );

-- Trigger for updated_at
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Migration: 20260205060848_dcc33343-4068-4d06-a6d6-df32e89dae45.sql
-- ============================================
-- Add segment column to companies table
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS segment TEXT DEFAULT 'micro_empresa';

COMMENT ON COLUMN companies.segment IS 
  'Segmento: infoprodutor, profissional_liberal, micro_empresa, outro';

-- Create onboarding_progress table
CREATE TABLE IF NOT EXISTS onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Passos individuais
  step_empresa BOOLEAN DEFAULT FALSE,
  step_contas_bancarias BOOLEAN DEFAULT FALSE,
  step_categorias BOOLEAN DEFAULT FALSE,
  step_primeiro_lancamento BOOLEAN DEFAULT FALSE,
  
  -- Metadados
  segment TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  skipped_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(company_id, user_id)
);

-- Enable RLS
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own onboarding progress"
ON onboarding_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding progress"
ON onboarding_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding progress"
ON onboarding_progress FOR UPDATE
USING (auth.uid() = user_id);

-- Index para performance
CREATE INDEX IF NOT EXISTS idx_onboarding_company ON onboarding_progress(company_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_user ON onboarding_progress(user_id);

-- ============================================
-- Migration: 20260206065958_d7585e1b-a943-4459-bcc1-3224470407af.sql
-- ============================================
-- =============================================
-- Adicionar campos Hotmart na tabela profiles
-- =============================================

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS hotmart_transaction TEXT,
ADD COLUMN IF NOT EXISTS hotmart_subscriber_code TEXT,
ADD COLUMN IF NOT EXISTS hotmart_status TEXT DEFAULT 'active';

-- Índices para busca rápida
CREATE INDEX IF NOT EXISTS idx_profiles_hotmart_subscriber 
  ON public.profiles(hotmart_subscriber_code) 
  WHERE hotmart_subscriber_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_hotmart_status 
  ON public.profiles(hotmart_status) 
  WHERE hotmart_status IS NOT NULL;

-- =============================================
-- Criar tabela de logs de webhook Hotmart
-- =============================================

CREATE TABLE IF NOT EXISTS public.hotmart_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event TEXT NOT NULL,
  payload JSONB NOT NULL,
  buyer_email TEXT,
  status TEXT DEFAULT 'processed',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para auditoria
CREATE INDEX IF NOT EXISTS idx_hotmart_logs_event ON public.hotmart_webhook_logs(event);
CREATE INDEX IF NOT EXISTS idx_hotmart_logs_email ON public.hotmart_webhook_logs(buyer_email);
CREATE INDEX IF NOT EXISTS idx_hotmart_logs_created ON public.hotmart_webhook_logs(created_at DESC);

-- RLS para logs (apenas admins podem ver)
ALTER TABLE public.hotmart_webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view webhook logs" 
  ON public.hotmart_webhook_logs FOR SELECT 
  USING (public.has_role(auth.uid(), 'admin'));

-- Função para limpar logs antigos (após 90 dias)
CREATE OR REPLACE FUNCTION public.cleanup_old_hotmart_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.hotmart_webhook_logs 
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;

COMMENT ON TABLE public.hotmart_webhook_logs IS 'Logs de webhooks recebidos da Hotmart para auditoria';

-- ============================================
-- Migration: 20260211000000_chart_account_templates.sql
-- ============================================
-- ============================================================
-- Migration: Chart of Accounts — Full Balance Sheet + Templates
-- ============================================================

-- 1. Expand enum with balance sheet account types
-- NOTE: ALTER TYPE ADD VALUE cannot run inside a transaction block
ALTER TYPE public.account_entry_type ADD VALUE IF NOT EXISTS 'ativo';
ALTER TYPE public.account_entry_type ADD VALUE IF NOT EXISTS 'passivo';
ALTER TYPE public.account_entry_type ADD VALUE IF NOT EXISTS 'patrimonio';

-- 2. Add new columns to chart_of_accounts
ALTER TABLE public.chart_of_accounts
  ADD COLUMN IF NOT EXISTS nature TEXT DEFAULT 'devedora',
  ADD COLUMN IF NOT EXISTS is_analytical BOOLEAN DEFAULT true;

-- Add CHECK constraint for nature (separate statement for IF NOT EXISTS safety)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chart_of_accounts_nature_check'
  ) THEN
    ALTER TABLE public.chart_of_accounts
      ADD CONSTRAINT chart_of_accounts_nature_check
      CHECK (nature IN ('devedora', 'credora'));
  END IF;
END $$;

-- 3. Create chart_account_templates table
CREATE TABLE IF NOT EXISTS public.chart_account_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  segment TEXT NOT NULL DEFAULT 'geral',
  version TEXT DEFAULT '1.0',
  is_default BOOLEAN DEFAULT false,
  is_system BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.chart_account_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view system templates"
  ON public.chart_account_templates FOR SELECT
  USING (is_system = true);

CREATE TRIGGER update_chart_account_templates_updated_at
  BEFORE UPDATE ON public.chart_account_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Create chart_account_template_items table
CREATE TABLE IF NOT EXISTS public.chart_account_template_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.chart_account_templates(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type public.account_entry_type NOT NULL,
  nature TEXT NOT NULL DEFAULT 'devedora' CHECK (nature IN ('devedora', 'credora')),
  level INTEGER NOT NULL DEFAULT 1,
  parent_code TEXT,
  is_analytical BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  dre_category TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(template_id, code)
);

ALTER TABLE public.chart_account_template_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view system template items"
  ON public.chart_account_template_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.chart_account_templates t
    WHERE t.id = template_id AND t.is_system = true
  ));

-- 5. Create chart_account_template_dre_mapping table
CREATE TABLE IF NOT EXISTS public.chart_account_template_dre_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.chart_account_templates(id) ON DELETE CASCADE,
  dre_line_id TEXT NOT NULL,
  dre_line_name TEXT NOT NULL,
  account_codes TEXT[] NOT NULL DEFAULT '{}',
  operation TEXT NOT NULL DEFAULT 'sum' CHECK (operation IN ('sum', 'subtract', 'calculated')),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.chart_account_template_dre_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view system template DRE mapping"
  ON public.chart_account_template_dre_mapping FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.chart_account_templates t
    WHERE t.id = template_id AND t.is_system = true
  ));

-- 6. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_template_items_template_id
  ON public.chart_account_template_items(template_id);

CREATE INDEX IF NOT EXISTS idx_template_items_code
  ON public.chart_account_template_items(template_id, code);

CREATE INDEX IF NOT EXISTS idx_template_dre_mapping_template_id
  ON public.chart_account_template_dre_mapping(template_id);

CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_nature
  ON public.chart_of_accounts(nature);

CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_is_analytical
  ON public.chart_of_accounts(is_analytical);

