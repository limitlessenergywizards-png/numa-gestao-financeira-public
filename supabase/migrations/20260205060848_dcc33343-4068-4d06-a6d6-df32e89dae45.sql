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