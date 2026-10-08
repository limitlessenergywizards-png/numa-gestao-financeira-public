-- Add push notification columns to user_preferences
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS notification_advance_days integer DEFAULT 3,
ADD COLUMN IF NOT EXISTS push_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS push_subscription jsonb DEFAULT null;

-- Create notification_logs table for tracking sent notifications
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  notification_type text NOT NULL,
  related_id uuid,
  title text NOT NULL,
  body text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for notification_logs
CREATE POLICY "Users can view own notifications" 
ON public.notification_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications" 
ON public.notification_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" 
ON public.notification_logs 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_company 
ON public.notification_logs(user_id, company_id);

CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at 
ON public.notification_logs(sent_at DESC);