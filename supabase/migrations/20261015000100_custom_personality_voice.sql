-- Which OpenAI Realtime voice a custom persona speaks with in voice chat.
-- NULL means "use the default voice". Allowed values are validated by keystone-ai-service.
-- (custom_personalities was created outside version control; this only adds the column.)

ALTER TABLE custom_personalities
  ADD COLUMN IF NOT EXISTS voice TEXT;
