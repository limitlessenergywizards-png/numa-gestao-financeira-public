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