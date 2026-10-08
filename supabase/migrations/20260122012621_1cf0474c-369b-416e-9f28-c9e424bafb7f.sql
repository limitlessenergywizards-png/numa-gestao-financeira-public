-- Add category column to suppliers table
ALTER TABLE public.suppliers 
ADD COLUMN IF NOT EXISTS category text DEFAULT NULL;

COMMENT ON COLUMN public.suppliers.category IS 'Categoria do fornecedor: Serviços, Materiais, Tecnologia, etc.';