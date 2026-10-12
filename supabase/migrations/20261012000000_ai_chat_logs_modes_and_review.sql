-- Two AI modes (affirm / question) each keep their own thread, and "Review keys"
-- needs to know which rows have already been reviewed.
-- Additive and backward compatible: existing rows become 'affirm' and unreviewed.

ALTER TABLE ai_chat_logs
  ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'affirm',
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

ALTER TABLE ai_chat_logs
  ADD CONSTRAINT ai_chat_logs_mode_check CHECK (mode IN ('affirm', 'question'));

CREATE INDEX IF NOT EXISTS idx_ai_chat_logs_user_mode_order
  ON ai_chat_logs (user_id, mode, "order");

-- Rows still waiting for a key review
CREATE INDEX IF NOT EXISTS idx_ai_chat_logs_unreviewed
  ON ai_chat_logs (user_id, mode) WHERE reviewed_at IS NULL;

-- Before applying, check that RLS on ai_chat_logs and user_keys lets a user UPDATE
-- their own rows (the app sets reviewed_at and edits user_keys under the user's session):
--   select tablename, policyname, cmd, qual from pg_policies
--   where tablename in ('ai_chat_logs', 'user_keys');
