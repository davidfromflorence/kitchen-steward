-- Gamification: persist XP, streaks, and completed actions per user
CREATE TABLE IF NOT EXISTS user_gamification (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp int NOT NULL DEFAULT 0,
  streak int NOT NULL DEFAULT 0,
  last_login_date date,
  completed_actions text[] NOT NULL DEFAULT '{}',
  saved_items text[] NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own gamification"
  ON user_gamification FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own gamification"
  ON user_gamification FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gamification"
  ON user_gamification FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Food profile preferences
ALTER TABLE users ADD COLUMN IF NOT EXISTS food_profile jsonb DEFAULT NULL;
