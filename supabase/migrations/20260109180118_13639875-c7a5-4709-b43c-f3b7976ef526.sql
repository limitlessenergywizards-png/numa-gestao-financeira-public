
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
