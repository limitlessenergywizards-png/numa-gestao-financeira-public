-- Create enum for payment methods (if not exists, we'll use text for flexibility)
-- Add payment_method column to transactions table
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'dinheiro';

-- Add comment for documentation
COMMENT ON COLUMN public.transactions.payment_method IS 'Payment method: dinheiro, pix, cartao_debito, cartao_credito, boleto, transferencia';