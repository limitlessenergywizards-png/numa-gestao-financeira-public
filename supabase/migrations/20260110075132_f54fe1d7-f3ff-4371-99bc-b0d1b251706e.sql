-- Add streak fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_streak integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS longest_streak integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_activity_date date;

-- Create daily activity log for tracking streaks
CREATE TABLE IF NOT EXISTS daily_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid REFERENCES companies NOT NULL,
  activity_date date NOT NULL,
  activities_count integer DEFAULT 0,
  xp_earned integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, company_id, activity_date)
);

ALTER TABLE daily_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activity logs"
  ON daily_activity_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity logs"
  ON daily_activity_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activity logs"
  ON daily_activity_log FOR UPDATE
  USING (auth.uid() = user_id);

-- Create weekly challenges table
CREATE TABLE IF NOT EXISTS weekly_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  challenge_type text NOT NULL DEFAULT 'individual',
  target_metric text NOT NULL,
  target_value numeric NOT NULL,
  reward_xp integer DEFAULT 100,
  reward_badge text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE weekly_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active challenges"
  ON weekly_challenges FOR SELECT
  USING (is_active = true);

-- Create challenge participants table
CREATE TABLE IF NOT EXISTS challenge_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid REFERENCES weekly_challenges NOT NULL,
  user_id uuid NOT NULL,
  company_id uuid REFERENCES companies NOT NULL,
  current_value numeric DEFAULT 0,
  completed_at timestamptz,
  rank integer,
  created_at timestamptz DEFAULT now(),
  UNIQUE(challenge_id, user_id, company_id)
);

ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own challenge participations"
  ON challenge_participants FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can join challenges"
  ON challenge_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON challenge_participants FOR UPDATE
  USING (auth.uid() = user_id);

-- Create leaderboard table
CREATE TABLE IF NOT EXISTS leaderboard (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid REFERENCES companies NOT NULL,
  period_type text NOT NULL,
  period_key text NOT NULL,
  total_xp integer DEFAULT 0,
  achievements_count integer DEFAULT 0,
  missions_completed integer DEFAULT 0,
  challenges_won integer DEFAULT 0,
  rank integer,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, company_id, period_type, period_key)
);

ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view leaderboard for their companies"
  ON leaderboard FOR SELECT
  USING (user_belongs_to_company(company_id, auth.uid()));

CREATE POLICY "Users can insert their own leaderboard entries"
  ON leaderboard FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leaderboard entries"
  ON leaderboard FOR UPDATE
  USING (auth.uid() = user_id);

-- Enable realtime for challenge participants and leaderboard
ALTER PUBLICATION supabase_realtime ADD TABLE challenge_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE leaderboard;