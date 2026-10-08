-- Enable pg_cron extension (if supported by the project tier)
-- Note: pg_cron is available on Supabase Pro. If free tier, this will fail or be ignored.
-- For free tier, user must rely on external cron services (GitHub Actions, etc.) or manual trigger.
-- Assuming user has capability or we just provide the setup.

create extension if not exists pg_net;
create extension if not exists pg_cron;

-- Schedule the job to run every day at 00:01 UTC
-- Replace 'PROJECT_REF' and 'ANON_KEY' with actual values or use secrets in a real environment.
-- Since we can't hardcode keys here easily without exposing them, 
-- we will create a function that calls the edge function using `net.http_post`.

-- In Supabase, the best practice is to invoke the function via pg_net.

-- Job: Invoke materialize-recurrences
SELECT cron.schedule(
  'materialize-recurrences-daily', -- name of the cron job
  '1 0 * * *', -- every day at 00:01
  $$
  select
    net.http_post(
      url:='https://wqbbdortsqqglujgechi.supabase.co/functions/v1/materialize-recurrences',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || 'SUPABASE_SERVICE_ROLE_KEY_PLACEHOLDER' || '"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);

-- Job: Invoke generate-financial-snapshots (Monthly)
SELECT cron.schedule(
  'generate-financial-snapshots-monthly', -- name of the cron job
  '0 2 1 * *', -- every 1st of the month at 02:00 AM
  $$
  select
    net.http_post(
      url:='https://wqbbdortsqqglujgechi.supabase.co/functions/v1/generate-financial-snapshots',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || 'SUPABASE_SERVICE_ROLE_KEY_PLACEHOLDER' || '"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);
