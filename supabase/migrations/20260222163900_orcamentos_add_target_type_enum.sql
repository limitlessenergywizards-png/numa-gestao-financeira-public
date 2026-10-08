-- Create an enum type if it does not exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'budget_target_type') THEN
        CREATE TYPE budget_target_type AS ENUM ('category', 'chart_account');
    END IF;
END
$$;

-- Convert existing target_type column to use the enum
ALTER TABLE public.orcamentos 
ALTER COLUMN target_type TYPE budget_target_type 
USING target_type::budget_target_type;

-- Also set the default
ALTER TABLE public.orcamentos 
ALTER COLUMN target_type SET DEFAULT 'chart_account'::budget_target_type;
