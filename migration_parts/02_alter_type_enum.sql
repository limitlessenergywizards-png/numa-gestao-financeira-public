-- ============================================
-- PARTE 2: ALTER TYPE ADD VALUE
-- IMPORTANTE: Rodar SEPARADAMENTE no SQL Editor
-- Estas instrucoes NAO podem rodar dentro de transacao
-- ============================================

ALTER TYPE public.account_entry_type ADD VALUE IF NOT EXISTS 'ativo';
ALTER TYPE public.account_entry_type ADD VALUE IF NOT EXISTS 'passivo';
ALTER TYPE public.account_entry_type ADD VALUE IF NOT EXISTS 'patrimonio';
