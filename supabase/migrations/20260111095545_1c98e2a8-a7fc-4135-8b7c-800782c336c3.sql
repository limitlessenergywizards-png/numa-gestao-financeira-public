-- Create DRE report schedules table for automatic email exports
CREATE TABLE public.dre_report_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  recipient_emails TEXT[] NOT NULL,
  schedule_type TEXT NOT NULL DEFAULT 'monthly',
  day_of_month INTEGER DEFAULT 5 CHECK (day_of_month >= 1 AND day_of_month <= 28),
  is_active BOOLEAN DEFAULT true,
  last_sent_at TIMESTAMPTZ,
  next_send_at TIMESTAMPTZ,
  include_pdf BOOLEAN DEFAULT true,
  include_excel BOOLEAN DEFAULT false,
  report_period TEXT DEFAULT 'previous_month',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dre_report_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own company schedules"
ON public.dre_report_schedules FOR SELECT
USING (public.user_belongs_to_company(auth.uid(), company_id));

CREATE POLICY "Users can insert own company schedules"
ON public.dre_report_schedules FOR INSERT
WITH CHECK (public.user_belongs_to_company(auth.uid(), company_id));

CREATE POLICY "Users can update own company schedules"
ON public.dre_report_schedules FOR UPDATE
USING (public.user_belongs_to_company(auth.uid(), company_id));

CREATE POLICY "Users can delete own company schedules"
ON public.dre_report_schedules FOR DELETE
USING (public.user_belongs_to_company(auth.uid(), company_id));

-- Create update trigger
CREATE TRIGGER update_dre_report_schedules_updated_at
BEFORE UPDATE ON public.dre_report_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster queries
CREATE INDEX idx_dre_report_schedules_company ON public.dre_report_schedules(company_id);
CREATE INDEX idx_dre_report_schedules_next_send ON public.dre_report_schedules(next_send_at) WHERE is_active = true;