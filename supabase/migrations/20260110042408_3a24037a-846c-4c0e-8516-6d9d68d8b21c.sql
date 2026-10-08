-- Table for pending user invitations
CREATE TABLE public.user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'viewer',
  invited_by UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, email)
);

-- Table for audit logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table for user preferences
CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  theme TEXT DEFAULT 'system',
  date_format TEXT DEFAULT 'DD/MM/YYYY',
  currency_format TEXT DEFAULT 'pt-BR',
  dashboard_layout JSONB DEFAULT '{}',
  email_notifications BOOLEAN DEFAULT true,
  overdue_alerts BOOLEAN DEFAULT true,
  weekly_summary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_invitations
CREATE POLICY "Admins can view invitations of their companies"
ON public.user_invitations FOR SELECT
USING (
  user_belongs_to_company(auth.uid(), company_id) 
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can insert invitations for their companies"
ON public.user_invitations FOR INSERT
WITH CHECK (
  user_belongs_to_company(auth.uid(), company_id) 
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update invitations of their companies"
ON public.user_invitations FOR UPDATE
USING (
  user_belongs_to_company(auth.uid(), company_id) 
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete invitations of their companies"
ON public.user_invitations FOR DELETE
USING (
  user_belongs_to_company(auth.uid(), company_id) 
  AND has_role(auth.uid(), 'admin')
);

-- RLS Policies for audit_logs
CREATE POLICY "Admins can view audit logs of their companies"
ON public.audit_logs FOR SELECT
USING (
  user_belongs_to_company(auth.uid(), company_id) 
  AND has_role(auth.uid(), 'admin')
);

-- RLS Policies for user_preferences
CREATE POLICY "Users can view their own preferences"
ON public.user_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
ON public.user_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
ON public.user_preferences FOR UPDATE
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_user_invitations_company ON public.user_invitations(company_id);
CREATE INDEX idx_user_invitations_email ON public.user_invitations(email);
CREATE INDEX idx_user_invitations_token ON public.user_invitations(token);
CREATE INDEX idx_audit_logs_company ON public.audit_logs(company_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_user_preferences_user ON public.user_preferences(user_id);

-- Trigger for updated_at on user_preferences
CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();