-- The daily voice limit is now counted in user messages instead of wall-clock seconds.
-- keystone-ai-service bumps message_count after each finished user turn.

ALTER TABLE voice_sessions
  ADD COLUMN IF NOT EXISTS message_count INTEGER NOT NULL DEFAULT 0;

-- Incremented in SQL so two turns landing together can't overwrite each other's count.
-- Matching user_id as well means a caller can only count against their own open session.
CREATE OR REPLACE FUNCTION increment_voice_message(p_user_id UUID, p_session_id UUID)
RETURNS INTEGER
LANGUAGE sql
AS $$
  UPDATE voice_sessions
  SET message_count = message_count + 1
  WHERE id = p_session_id
    AND user_id = p_user_id
    AND ended_at IS NULL
  RETURNING message_count;
$$;

-- Only the service role (keystone-ai-service) may call it
REVOKE ALL ON FUNCTION increment_voice_message(UUID, UUID) FROM PUBLIC, anon, authenticated;
