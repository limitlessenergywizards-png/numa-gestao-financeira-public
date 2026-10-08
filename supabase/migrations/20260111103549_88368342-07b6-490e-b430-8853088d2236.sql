-- Create table for DRE email logs/metrics
CREATE TABLE public.dre_email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES public.dre_report_schedules(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ DEFAULT now(),
  recipient_emails TEXT[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  resend_id TEXT,
  error_message TEXT,
  opened_at TIMESTAMPTZ,
  report_period TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dre_email_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view email logs for their companies" 
ON public.dre_email_logs 
FOR SELECT 
USING (user_belongs_to_company(auth.uid(), company_id));

CREATE POLICY "Service role can insert email logs"
ON public.dre_email_logs
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Service role can update email logs"
ON public.dre_email_logs
FOR UPDATE
USING (true);

-- Index for faster queries
CREATE INDEX idx_dre_email_logs_schedule_id ON public.dre_email_logs(schedule_id);
CREATE INDEX idx_dre_email_logs_company_id ON public.dre_email_logs(company_id);
CREATE INDEX idx_dre_email_logs_sent_at ON public.dre_email_logs(sent_at DESC);