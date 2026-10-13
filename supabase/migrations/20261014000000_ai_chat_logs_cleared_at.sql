-- "Clear conversation" hides messages instead of deleting them, so streaks, the activity
-- calendar and stats (all derived from ai_chat_logs rows) are preserved.
-- Additive and backward compatible: existing rows stay visible (cleared_at IS NULL).

ALTER TABLE ai_chat_logs
  ADD COLUMN IF NOT EXISTS cleared_at TIMESTAMPTZ;

-- Conversation reads: visible rows for a user + mode, in order
CREATE INDEX IF NOT EXISTS idx_ai_chat_logs_visible
  ON ai_chat_logs (user_id, mode, "order") WHERE cleared_at IS NULL;

-- Activity / streak queries scan by day
CREATE INDEX IF NOT EXISTS idx_ai_chat_logs_user_created
  ON ai_chat_logs (user_id, created_at);

-- Before applying, check that RLS on ai_chat_logs lets a user UPDATE their own rows:
--   select tablename, policyname, cmd, qual from pg_policies where tablename = 'ai_chat_logs';
