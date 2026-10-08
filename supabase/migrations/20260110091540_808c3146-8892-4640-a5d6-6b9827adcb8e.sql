-- Create table for DRE explanatory notes
CREATE TABLE public.dre_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  chart_account_id uuid REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL,
  dre_line_id text NOT NULL,
  period_year integer NOT NULL,
  period_month integer NOT NULL,
  note text NOT NULL,
  is_important boolean DEFAULT false,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, dre_line_id, period_year, period_month)
);

-- Enable RLS
ALTER TABLE public.dre_notes ENABLE ROW LEVEL SECURITY;

-- Policy for viewing notes (company members only)
CREATE POLICY "Users can view notes from their companies"
ON public.dre_notes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_companies uc
    WHERE uc.company_id = dre_notes.company_id
    AND uc.user_id = auth.uid()
  )
);

-- Policy for creating notes
CREATE POLICY "Users can create notes for their companies"
ON public.dre_notes
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_companies uc
    WHERE uc.company_id = dre_notes.company_id
    AND uc.user_id = auth.uid()
  )
  AND created_by = auth.uid()
);

-- Policy for updating notes
CREATE POLICY "Users can update notes from their companies"
ON public.dre_notes
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_companies uc
    WHERE uc.company_id = dre_notes.company_id
    AND uc.user_id = auth.uid()
  )
);

-- Policy for deleting notes
CREATE POLICY "Users can delete notes from their companies"
ON public.dre_notes
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_companies uc
    WHERE uc.company_id = dre_notes.company_id
    AND uc.user_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_dre_notes_updated_at
BEFORE UPDATE ON public.dre_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();