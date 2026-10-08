-- ============================================
-- Migration: Expand payment_method enum with cartao_debito and cartao_credito
-- Date: 2026-03-30
-- Purpose: Frontend differentiates debit vs credit cards but the enum
--          only had 'cartao'. Adding 'cartao_debito' and 'cartao_credito'
--          to match what the UI sends. Keeping 'cartao' for backward compat.
-- ============================================

ALTER TYPE public.payment_method ADD VALUE IF NOT EXISTS 'cartao_debito';
ALTER TYPE public.payment_method ADD VALUE IF NOT EXISTS 'cartao_credito';
