-- 1. Ensure created_by column exists
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- 2. Backfill created_by for existing companies (taking the first linked user)
UPDATE public.companies c
SET created_by = (
  SELECT user_id 
  FROM public.user_companies uc 
  WHERE uc.company_id = c.id 
  ORDER BY uc.created_at ASC 
  LIMIT 1
)
WHERE c.created_by IS NULL;

-- 3. Drop restricted delete policy (ignore error if not exists)
DROP POLICY IF EXISTS "Admins can delete companies" ON public.companies;
DROP POLICY IF EXISTS "Users can delete their own companies" ON public.companies;

-- 4. Create new delete policy based on ownership (created_by)
CREATE POLICY "Users can delete their own companies"
ON public.companies
FOR DELETE
TO authenticated
USING (
  auth.uid() = created_by
);

-- 5. Fallback policy: Allow deletion if user is in global admin role (keep existing logic but as separate policy)
CREATE POLICY "Global Admins can delete any company"
ON public.companies
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
);
