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