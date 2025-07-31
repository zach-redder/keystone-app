-- 🔒 BACKEND-ONLY REFERRAL CODES TABLE SETUP
-- Run this SQL in your Supabase SQL Editor to create the referral_codes table

-- Create the referral_codes table
CREATE TABLE IF NOT EXISTS referral_codes (
  code TEXT PRIMARY KEY,
  subscription_type TEXT NOT NULL CHECK (subscription_type IN ('monthly', 'yearly', 'lifetime')),
  description TEXT NOT NULL,
  duration_months INTEGER, -- NULL for lifetime subscriptions
  is_active BOOLEAN NOT NULL DEFAULT true,
  usage_limit INTEGER, -- NULL for unlimited usage
  used_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE, -- NULL for codes that don't expire
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add RLS (Row Level Security) policies if needed
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read active codes (for validation)
CREATE POLICY "Allow authenticated users to read active referral codes"
ON referral_codes FOR SELECT
TO authenticated
USING (is_active = true);

-- Policy: Only service role can modify codes (for admin operations)
CREATE POLICY "Only service role can modify referral codes"
ON referral_codes FOR ALL
TO service_role
USING (true);

-- Insert example referral codes (adjust as needed for your app)
INSERT INTO referral_codes (code, subscription_type, description, duration_months, is_active, usage_limit, used_count) VALUES
('KEYSTONE30', 'monthly', '30-day free trial access', 1, true, 100, 0),
('LAUNCH2024', 'yearly', 'Free yearly subscription for early adopters', 12, true, 50, 0),
('LIFETIME100', 'lifetime', 'Lifetime access for special users', NULL, true, 10, 0),
('BETA2024', 'yearly', 'Beta tester yearly access', 12, true, 200, 0),
('FRIEND30', 'monthly', 'Friend referral - 30 days free', 1, true, 1000, 0),
('VIP2024', 'lifetime', 'VIP lifetime access', NULL, true, 5, 0),
('STUDENT50', 'yearly', 'Student discount - 1 year free', 12, true, 500, 0),
('CREATOR2024', 'lifetime', 'Content creator lifetime access', NULL, true, 25, 0)
ON CONFLICT (code) DO NOTHING;

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_referral_codes_active ON referral_codes (is_active, code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_expires ON referral_codes (expires_at) WHERE expires_at IS NOT NULL;

-- Example queries for managing codes:

-- View all active codes with usage stats
-- SELECT code, subscription_type, description, used_count, usage_limit, 
--        CASE WHEN usage_limit IS NULL THEN 'Unlimited' 
--             ELSE (usage_limit - used_count)::text || ' remaining' 
--        END as remaining_uses,
--        expires_at, created_at 
-- FROM referral_codes 
-- WHERE is_active = true 
-- ORDER BY created_at DESC;

-- Deactivate a code
-- UPDATE referral_codes SET is_active = false WHERE code = 'EXAMPLE_CODE';

-- Set expiration for a code
-- UPDATE referral_codes SET expires_at = '2024-12-31 23:59:59+00' WHERE code = 'EXAMPLE_CODE';

-- Reset usage count for a code
-- UPDATE referral_codes SET used_count = 0 WHERE code = 'EXAMPLE_CODE';