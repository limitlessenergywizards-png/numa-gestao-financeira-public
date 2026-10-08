-- Add cost classification to categories
ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS cost_type TEXT CHECK (cost_type IN ('fixo', 'variavel', 'misto', 'nao_aplicavel')) DEFAULT 'nao_aplicavel',
ADD COLUMN IF NOT EXISTS variable_percentage NUMERIC(5, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_categories_cost_type ON public.categories(cost_type);

-- Financial Health Snapshots Table
CREATE TABLE IF NOT EXISTS public.financial_health_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  reference_month DATE NOT NULL,
  
  -- Components
  total_revenue NUMERIC(15, 2) NOT NULL DEFAULT 0,
  fixed_costs NUMERIC(15, 2) NOT NULL DEFAULT 0,
  variable_costs NUMERIC(15, 2) NOT NULL DEFAULT 0,
  variable_cost_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0,
  
  -- Derived Metrics
  contribution_margin NUMERIC(15, 2) NOT NULL DEFAULT 0,
  contribution_margin_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0,
  break_even_point NUMERIC(15, 2) NOT NULL DEFAULT 0,
  break_even_units INTEGER,
  
  -- Margins & Profit
  gross_margin NUMERIC(15, 2) NOT NULL DEFAULT 0,
  gross_margin_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0,
  net_profit NUMERIC(15, 2) NOT NULL DEFAULT 0,
  net_margin_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0,
  
  -- Indicators
  revenue_above_breakeven NUMERIC(15, 2),
  breakeven_coverage_percentage NUMERIC(5, 2),
  safety_margin NUMERIC(15, 2),
  safety_margin_percentage NUMERIC(5, 2),
  
  -- Projections
  projected_next_month_revenue NUMERIC(15, 2),
  projected_breakeven_date DATE,
  
  -- Health Score
  health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),
  health_status TEXT CHECK (health_status IN ('critico', 'atencao', 'estavel', 'saudavel', 'excelente')),
  
  -- Breakdown
  fixed_costs_breakdown JSONB,
  variable_costs_breakdown JSONB,
  
  -- Comparison
  revenue_growth_percentage NUMERIC(5, 2),
  cost_growth_percentage NUMERIC(5, 2),
  profit_growth_percentage NUMERIC(5, 2),
  
  -- Metadata
  calculated_at TIMESTAMPTZ DEFAULT now(),
  calculation_source TEXT DEFAULT 'automatic',
  
  UNIQUE(company_id, reference_month)
);

-- Indices for snapshots
CREATE INDEX IF NOT EXISTS idx_health_snapshots_company ON public.financial_health_snapshots(company_id);
CREATE INDEX IF NOT EXISTS idx_health_snapshots_month ON public.financial_health_snapshots(reference_month);
CREATE INDEX IF NOT EXISTS idx_health_snapshots_health_status ON public.financial_health_snapshots(health_status);

-- Enable RLS for snapshots
ALTER TABLE public.financial_health_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for financial_health_snapshots
CREATE POLICY "Users can view financial snapshots of their company"
    ON public.financial_health_snapshots
    FOR SELECT
    USING (
        company_id IN (
            SELECT company_id 
            FROM public.user_companies 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert financial snapshots for their company"
    ON public.financial_health_snapshots
    FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id 
            FROM public.user_companies 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update financial snapshots for their company"
    ON public.financial_health_snapshots
    FOR UPDATE
    USING (
        company_id IN (
            SELECT company_id 
            FROM public.user_companies 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete financial snapshots for their company"
    ON public.financial_health_snapshots
    FOR DELETE
    USING (
        company_id IN (
            SELECT company_id 
            FROM public.user_companies 
            WHERE user_id = auth.uid()
        )
    );

-- Break-Even Simulations Table
CREATE TABLE IF NOT EXISTS public.breakeven_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  
  base_snapshot_id UUID REFERENCES public.financial_health_snapshots(id),
  
  adjustments JSONB NOT NULL,
  
  -- Simulation Results
  simulated_revenue NUMERIC(15, 2) NOT NULL,
  simulated_fixed_costs NUMERIC(15, 2) NOT NULL,
  simulated_variable_costs NUMERIC(15, 2) NOT NULL,
  simulated_break_even_point NUMERIC(15, 2) NOT NULL,
  simulated_contribution_margin_percentage NUMERIC(5, 2) NOT NULL,
  simulated_net_profit NUMERIC(15, 2) NOT NULL,
  
  -- Comparison
  revenue_delta NUMERIC(15, 2),
  breakeven_delta NUMERIC(15, 2),
  profit_delta NUMERIC(15, 2),
  
  -- Viability
  is_viable BOOLEAN,
  months_to_breakeven INTEGER,
  roi_percentage NUMERIC(5, 2),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indices for simulations
CREATE INDEX IF NOT EXISTS idx_simulations_company ON public.breakeven_simulations(company_id);
CREATE INDEX IF NOT EXISTS idx_simulations_base_snapshot ON public.breakeven_simulations(base_snapshot_id);

-- Enable RLS for simulations
ALTER TABLE public.breakeven_simulations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for simulations
CREATE POLICY "Users can view simulations of their company"
    ON public.breakeven_simulations
    FOR SELECT
    USING (
        company_id IN (
            SELECT company_id 
            FROM public.user_companies 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert simulations for their company"
    ON public.breakeven_simulations
    FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id 
            FROM public.user_companies 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update simulations for their company"
    ON public.breakeven_simulations
    FOR UPDATE
    USING (
        company_id IN (
            SELECT company_id 
            FROM public.user_companies 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete simulations for their company"
    ON public.breakeven_simulations
    FOR DELETE
    USING (
        company_id IN (
            SELECT company_id 
            FROM public.user_companies 
            WHERE user_id = auth.uid()
        )
    );
