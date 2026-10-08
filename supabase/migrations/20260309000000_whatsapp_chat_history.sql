-- =============================================
-- Criar tabela de histórico de mensagens do WhatsApp
-- =============================================

CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant', 'tool')),
  content TEXT,
  tool_call_id TEXT,
  tool_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para busca rápida por lead e data
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_lead_id ON public.whatsapp_messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created_at ON public.whatsapp_messages(created_at ASC);

-- RLS
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Política simples: serviço pode tudo, usuários (se logados) podem ver seus leads
CREATE POLICY "Service role can do everything"
  ON public.whatsapp_messages FOR ALL
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.whatsapp_messages IS 'Histórico de conversas do Agente NUMA via WhatsApp para memória de contexto';
