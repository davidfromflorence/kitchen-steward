-- Habits table: recurring consumption patterns
CREATE TABLE IF NOT EXISTS habits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id uuid NOT NULL,
  user_id uuid NOT NULL,
  description text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]',
  frequency text NOT NULL DEFAULT 'daily',
  times_per_period int NOT NULL DEFAULT 1,
  active boolean NOT NULL DEFAULT true,
  last_processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_habits_household ON habits(household_id, active);
