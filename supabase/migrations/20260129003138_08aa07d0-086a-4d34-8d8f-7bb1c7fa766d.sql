-- Add SELECT policy to allow users to view companies they created
-- This fixes the RETURNING clause issue during onboarding where the user
-- creates a company but isn't yet in user_companies

CREATE POLICY "Users can view companies they created" 
ON public.companies 
FOR SELECT 
TO authenticated 
USING (created_by = auth.uid());