-- Conversation history for WhatsApp chat memory
CREATE TABLE IF NOT EXISTS wa_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  household_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wa_messages_household_time
  ON wa_messages(household_id, created_at DESC);

-- Auto-cleanup: keep only last 50 messages per household
CREATE OR REPLACE FUNCTION cleanup_old_wa_messages()
RETURNS trigger AS $$
BEGIN
  DELETE FROM wa_messages
  WHERE household_id = NEW.household_id
    AND id NOT IN (
      SELECT id FROM wa_messages
      WHERE household_id = NEW.household_id
      ORDER BY created_at DESC
      LIMIT 50
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cleanup_wa_messages ON wa_messages;
CREATE TRIGGER trg_cleanup_wa_messages
  AFTER INSERT ON wa_messages
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_old_wa_messages();
