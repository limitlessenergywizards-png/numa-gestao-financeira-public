-- Create recurring_transactions table
CREATE TABLE IF NOT EXISTS public.recurring_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Identification
  name TEXT NOT NULL,
  description TEXT,
  
  -- Financial Values
  amount NUMERIC(15, 2) NOT NULL,
  category_id UUID NOT NULL REFERENCES public.categories(id),
  type TEXT NOT NULL CHECK (type IN ('receita', 'despesa')),
  
  -- Recurrence Configuration
  frequency TEXT NOT NULL CHECK (frequency IN (
    'diaria',
    'semanal',
    'quinzenal',
    'mensal',
    'bimestral',
    'trimestral',
    'semestral',
    'anual',
    'personalizada'
  )),
  
  -- Custom Frequency
  custom_interval_value INTEGER,
  custom_interval_unit TEXT CHECK (custom_interval_unit IN ('dias', 'semanas', 'meses')),
  
  -- Dates
  start_date DATE NOT NULL,
  end_date DATE, -- NULL = indefinite
  
  -- Specific Day
  day_of_month INTEGER CHECK (day_of_month >= 1 AND day_of_month <= 31),
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday
  
  -- Termination Limit
  occurrence_limit INTEGER,
  occurrence_count INTEGER DEFAULT 0,
  
  -- Advanced Config
  amount_type TEXT DEFAULT 'fixed' CHECK (amount_type IN ('fixed', 'variable', 'indexed')),
  variable_basis TEXT,
  indexer TEXT,
  indexer_month INTEGER,
  
  -- Optional Foreign Keys (assuming these tables exist, if not, remove these lines or keep as TODO)
  -- party_id UUID REFERENCES public.parties(id),
  -- cost_center_id UUID REFERENCES public.cost_centers(id),
  
  -- Holidays
  skip_weekends BOOLEAN DEFAULT false,
  skip_holidays BOOLEAN DEFAULT false,
  holiday_adjustment TEXT CHECK (holiday_adjustment IN ('before', 'after', 'skip')),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
  
  -- Dual System Integration
  create_as_forecast BOOLEAN DEFAULT true,
  forecast_confidence INTEGER DEFAULT 95,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  paused_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  
  -- Change Log
  change_log JSONB DEFAULT '[]'::jsonb
);

-- Indices for recurring_transactions
CREATE INDEX IF NOT EXISTS idx_recurring_company ON public.recurring_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_recurring_status ON public.recurring_transactions(status);
CREATE INDEX IF NOT EXISTS idx_recurring_start_date ON public.recurring_transactions(start_date);
CREATE INDEX IF NOT EXISTS idx_recurring_frequency ON public.recurring_transactions(frequency);

-- Trigger for updated_at
CREATE OR REPLACE TRIGGER update_recurring_transactions_updated_at
  BEFORE UPDATE ON public.recurring_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- Create recurring_occurrences table
CREATE TABLE IF NOT EXISTS public.recurring_occurrences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recurring_id UUID NOT NULL REFERENCES public.recurring_transactions(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  
  -- Occurrence Metadata
  occurrence_number INTEGER NOT NULL,
  scheduled_date DATE NOT NULL,
  actual_date DATE,
  
  -- Variations
  original_amount NUMERIC(15, 2),
  actual_amount NUMERIC(15, 2),
  adjustment_reason TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',    -- Generated but not due yet
    'due',        -- Due date reached
    'paid',       -- Paid/Received
    'overdue',    -- Past due
    'skipped',    -- Manually skipped
    'cancelled'   -- Cancelled
  )),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  materialized_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ
);

-- Indices for recurring_occurrences
CREATE INDEX IF NOT EXISTS idx_occurrences_recurring ON public.recurring_occurrences(recurring_id);
CREATE INDEX IF NOT EXISTS idx_occurrences_transaction ON public.recurring_occurrences(transaction_id);
CREATE INDEX IF NOT EXISTS idx_occurrences_scheduled_date ON public.recurring_occurrences(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_occurrences_status ON public.recurring_occurrences(status);

-- Enable RLS
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_occurrences ENABLE ROW LEVEL SECURITY;

-- Policies for recurring_transactions
CREATE POLICY "Users can view recurring transactions of their company" 
ON public.recurring_transactions FOR SELECT 
USING (company_id = (SELECT current_company_id FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can insert recurring transactions for their company" 
ON public.recurring_transactions FOR INSERT 
WITH CHECK (company_id = (SELECT current_company_id FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can update recurring transactions of their company" 
ON public.recurring_transactions FOR UPDATE 
USING (company_id = (SELECT current_company_id FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can delete recurring transactions of their company" 
ON public.recurring_transactions FOR DELETE 
USING (company_id = (SELECT current_company_id FROM auth.users WHERE id = auth.uid()));

-- Policies for recurring_occurrences (using join via recurring_transactions)
CREATE POLICY "Users can view occurrences of their company" 
ON public.recurring_occurrences FOR SELECT 
USING (
  recurring_id IN (
    SELECT id FROM public.recurring_transactions 
    WHERE company_id = (SELECT current_company_id FROM auth.users WHERE id = auth.uid())
  )
);

CREATE POLICY "Users can insert occurrences for their company" 
ON public.recurring_occurrences FOR INSERT 
WITH CHECK (
  recurring_id IN (
    SELECT id FROM public.recurring_transactions 
    WHERE company_id = (SELECT current_company_id FROM auth.users WHERE id = auth.uid())
  )
);

CREATE POLICY "Users can update occurrences of their company" 
ON public.recurring_occurrences FOR UPDATE 
USING (
  recurring_id IN (
    SELECT id FROM public.recurring_transactions 
    WHERE company_id = (SELECT current_company_id FROM auth.users WHERE id = auth.uid())
  )
);
