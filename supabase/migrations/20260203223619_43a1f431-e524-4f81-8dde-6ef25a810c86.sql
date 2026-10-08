-- Restore per-company role on user_companies (frontend and get_user_context expect it)
ALTER TABLE public.user_companies
ADD COLUMN IF NOT EXISTS role public.app_role NOT NULL DEFAULT 'viewer'::public.app_role;

-- Optional: index for admin queries/filtering
CREATE INDEX IF NOT EXISTS idx_user_companies_user_id_role
ON public.user_companies (user_id, role);
