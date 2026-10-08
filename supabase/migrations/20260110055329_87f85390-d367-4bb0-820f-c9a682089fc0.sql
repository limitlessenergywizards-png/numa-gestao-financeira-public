
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
