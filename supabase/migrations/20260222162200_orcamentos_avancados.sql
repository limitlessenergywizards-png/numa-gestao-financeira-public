-- Create the orcamentos table to store budgets by custom periods
CREATE TABLE IF NOT EXISTS public.orcamentos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    category_code VARCHAR(50) NOT NULL,
    category_name VARCHAR(255) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    period_type VARCHAR(50) NOT NULL CHECK (period_type IN ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'semiannual', 'annual')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for efficient querying by company and date ranges
CREATE INDEX IF NOT EXISTS idx_orcamentos_company_id ON public.orcamentos(company_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_category_code ON public.orcamentos(category_code);
CREATE INDEX IF NOT EXISTS idx_orcamentos_dates ON public.orcamentos(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_orcamentos_period_type ON public.orcamentos(period_type);

-- RLS Policies
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orcamentos_view_policy"
    ON public.orcamentos FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_companies cu
            WHERE cu.company_id = orcamentos.company_id
              AND cu.user_id = auth.uid()
        )
    );

CREATE POLICY "orcamentos_insert_policy"
    ON public.orcamentos FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_companies cu
            WHERE cu.company_id = orcamentos.company_id
              AND cu.user_id = auth.uid()
        )
    );

CREATE POLICY "orcamentos_update_policy"
    ON public.orcamentos FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_companies cu
            WHERE cu.company_id = orcamentos.company_id
              AND cu.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_companies cu
            WHERE cu.company_id = orcamentos.company_id
              AND cu.user_id = auth.uid()
        )
    );

CREATE POLICY "orcamentos_delete_policy"
    ON public.orcamentos FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM user_companies cu
            WHERE cu.company_id = orcamentos.company_id
              AND cu.user_id = auth.uid()
        )
    );

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS update_orcamentos_updated_at ON public.orcamentos;
CREATE TRIGGER update_orcamentos_updated_at
    BEFORE UPDATE ON public.orcamentos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
