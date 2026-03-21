-- Activity log: tracks every user action for leaderboard, analytics, and feed
CREATE TABLE IF NOT EXISTS activity_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id uuid NOT NULL,
  user_id uuid NOT NULL,
  action text NOT NULL, -- 'item_added', 'item_used', 'item_wasted', 'item_deleted', 'meal_logged', 'recipe_cooked'
  item_name text,
  item_quantity numeric,
  item_unit text,
  xp_earned int DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_household ON activity_log(household_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_log(user_id, created_at DESC);

-- RLS: users can read their household's activity
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read household activity"
  ON activity_log FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own activity"
  ON activity_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);
