-- When the user agreed to have their messages, saved keys and (in voice mode) voice sent to the AI
-- provider. NULL means they haven't agreed yet, so the app asks before the next AI request.
-- Additive and nullable, so it is safe to apply before or after the app build that reads it: the app
-- also keeps a per-user flag on the device and treats a missing column as "not agreed on the account".

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS ai_consent_at TIMESTAMPTZ;
