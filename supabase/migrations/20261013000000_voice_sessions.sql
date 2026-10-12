-- One row per voice conversation. Written only by keystone-ai-service (service role) so the
-- daily voice-time cap can't be bypassed from the client.
-- A row that never gets ended_at (app killed mid-call) is counted at max_seconds by the service.

CREATE TABLE IF NOT EXISTS voice_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  mode TEXT NOT NULL,
  max_seconds INTEGER NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voice_sessions_user_started
  ON voice_sessions (user_id, started_at);

-- RLS on with no policies: anon/authenticated users get no access; the service role bypasses RLS.
ALTER TABLE voice_sessions ENABLE ROW LEVEL SECURITY;
