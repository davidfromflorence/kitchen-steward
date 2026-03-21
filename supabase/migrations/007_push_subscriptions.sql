-- Push notification subscriptions
ALTER TABLE users ADD COLUMN IF NOT EXISTS push_subscription text DEFAULT NULL;
