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