-- PROPOSED, NOT APPLIED. This file is deliberately outside supabase/migrations/ so nothing picks it up.
-- Read it, then apply the two parts in the order below.
--
-- THE PROBLEM
-- Any signed-in user can mark themselves Pro with the public anon key:
--   * "Users can update themselves" lets a user UPDATE their own users row, and the table grants UPDATE
--     on every column, including is_pro / pro_expires_at / subscription_source / free_month_granted_at.
--   * "Authenticated users can insert their user row" has the same hole at INSERT (a user can delete
--     their own row, then re-insert it with is_pro = true).
--   * "Authenticated can update referral code usage" (USING true) lets any user rewrite any referral code.
--   * "Authenticated can read referral codes" (USING true) lets any signed-in user LIST every active code,
--     including lifetime ones, and redeem them (once per account, so a new account repeats it).
-- Pro unlocks voice mode, which costs real OpenAI money.
--
-- THE FIX
-- Subscription state is written only by the Superwall webhook (handle-subscription, service role) and by
-- the two SECURITY DEFINER functions below, which hold the same rules the client enforces today
-- (services/user/referralService.ts and freeMonthOfferService.ts). The client loses the ability to write
-- the protected columns.
--
-- ORDER (do not reorder)
--   1. Apply PART A. It is additive and changes no behaviour.
--   2. Confirm the Superwall webhook is live: SUPERWALL_WEBHOOK_SECRET set in Supabase and a real or test
--      event shows a 200 in the handle-subscription logs. Part B removes the client's own purchase sync,
--      so without the webhook a paying customer would never be marked Pro.
--   3. Ship an app build that (a) calls grant_free_month_offer() and redeem_referral_code() instead of
--      reading or writing users/referral_codes (so validateReferralCode must go through the function and
--      show its status instead of the specific "expired / used up" messages, which would otherwise let a
--      caller probe which codes exist), (b) stops sending is_pro in the users insert, (c) no longer writes
--      is_pro / pro_expires_at / subscription_source from subscriptionService, and (d) treats an expired
--      pro_expires_at as "not Pro" when reading instead of writing is_pro = false.
--   4. Once that build is what almost everyone runs, apply PART B. Older builds will then fail to
--      redeem a code or claim the free month (their client-side writes are refused); purchases keep
--      working through the webhook.
--
-- ROLLBACK for Part B: GRANT UPDATE, INSERT ON public.users TO authenticated; and re-create the dropped
-- policy. Part A can stay.


-- ============================ PART A: additive ============================

-- One free month per account, only if they are not already a real subscriber.
-- Returns a status the app maps to its existing messages.
CREATE OR REPLACE FUNCTION public.grant_free_month_offer()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_row public.users%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN 'not_signed_in';
  END IF;

  -- Locked so two taps can't both pass the checks
  SELECT * INTO v_row FROM public.users WHERE id = v_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN 'not_signed_in';
  END IF;

  IF v_row.subscription_source = 'superwall' AND v_row.is_pro THEN
    RETURN 'already_subscribed';
  END IF;

  IF v_row.free_month_granted_at IS NOT NULL THEN
    RETURN 'already_granted';
  END IF;

  UPDATE public.users
  SET is_pro = TRUE,
      referral_subscription_type = 'monthly',
      pro_expires_at = NOW() + INTERVAL '1 month',
      free_month_granted_at = NOW()
  WHERE id = v_user_id;

  RETURN 'granted';
END;
$$;

-- Failed redemption attempts, kept so guessing codes can be throttled. RLS on with no policies: only the
-- functions below (and the service role) can touch it.
CREATE TABLE IF NOT EXISTS public.referral_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_attempts_user_time
  ON public.referral_attempts (user_id, attempted_at);

ALTER TABLE public.referral_attempts ENABLE ROW LEVEL SECURITY;

-- Redeems a referral code for the caller. Mirrors redeemReferralCode(): same checks, same grant, but the
-- usage count is bumped in the same statement that validates it, so a code can't be over-redeemed.
CREATE OR REPLACE FUNCTION public.redeem_referral_code(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_code TEXT := UPPER(TRIM(p_code));
  v_row public.users%ROWTYPE;
  v_ref public.referral_codes%ROWTYPE;
  v_expires_at TIMESTAMPTZ;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('status', 'not_signed_in');
  END IF;

  SELECT * INTO v_row FROM public.users WHERE id = v_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'not_signed_in');
  END IF;

  IF EXISTS (SELECT 1 FROM public.referral_redemptions WHERE user_id = v_user_id) THEN
    RETURN jsonb_build_object('status', 'already_redeemed');
  END IF;

  IF v_row.subscription_source = 'superwall' AND v_row.is_pro THEN
    RETURN jsonb_build_object('status', 'already_subscribed');
  END IF;

  IF v_row.free_month_granted_at IS NOT NULL THEN
    RETURN jsonb_build_object('status', 'already_granted');
  END IF;

  -- Codes are short and random, so without a limit they could be guessed at whatever rate the API allows
  IF (SELECT COUNT(*) FROM public.referral_attempts
      WHERE user_id = v_user_id AND attempted_at > NOW() - INTERVAL '1 hour') >= 5 THEN
    RETURN jsonb_build_object('status', 'rate_limited');
  END IF;

  -- usage_limit of NULL or 0 means unlimited, as the client treats it today
  UPDATE public.referral_codes
  SET used_count = used_count + 1
  WHERE code = v_code
    AND is_active
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (COALESCE(usage_limit, 0) = 0 OR used_count < usage_limit)
  RETURNING * INTO v_ref;

  IF NOT FOUND THEN
    INSERT INTO public.referral_attempts (user_id) VALUES (v_user_id);
    -- Not distinguishing inactive / expired / used up / unknown keeps the function from being a code oracle
    RETURN jsonb_build_object('status', 'invalid_code');
  END IF;

  IF v_ref.duration_months IS NOT NULL AND v_ref.subscription_type <> 'lifetime' THEN
    v_expires_at := NOW() + (v_ref.duration_months * 30) * INTERVAL '1 day';
  END IF;

  INSERT INTO public.referral_redemptions (user_id, referral_code, subscription_type, redeemed_at, expires_at)
  VALUES (v_user_id, v_code, v_ref.subscription_type, NOW(), v_expires_at);

  UPDATE public.users
  SET is_pro = TRUE,
      referral_subscription_type = v_ref.subscription_type,
      pro_expires_at = v_expires_at,
      free_month_granted_at = NOW()
  WHERE id = v_user_id;

  RETURN jsonb_build_object('status', 'redeemed', 'subscription_type', v_ref.subscription_type);
END;
$$;

-- Same lockdown pattern as 20260901150543_lock_down_security_definer_functions: signed-in users only
REVOKE ALL ON FUNCTION public.grant_free_month_offer() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.redeem_referral_code(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.grant_free_month_offer() TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_referral_code(TEXT) TO authenticated;


-- ======================= PART B: the lock (see ORDER) =======================

-- Column privileges can't be subtracted from a table-level grant, so take the table-level ones away and
-- grant back only what the app legitimately writes. Not granted: id, created_at, is_pro, pro_expires_at,
-- subscription_source, referral_subscription_type, free_month_granted_at. The service role (the
-- webhook and keystone-ai-service) is unaffected.
REVOKE INSERT, UPDATE ON public.users FROM authenticated, anon;

GRANT UPDATE (
  email, name, onboarding_complete, day_streak, longest_streak,
  core_values, future_self_vision, life_goals, motivations, avoidances, identity_traits,
  free_month_offer_shown_at
) ON public.users TO authenticated;

-- id is required so the profile row can be created for the signed-in user (RLS still pins it to auth.uid())
GRANT INSERT (
  id, email, name, onboarding_complete, day_streak, longest_streak,
  core_values, future_self_vision, life_goals, motivations, avoidances, identity_traits,
  free_month_offer_shown_at
) ON public.users TO authenticated;

-- Usage is now counted inside redeem_referral_code(); no client should read or write referral codes at all.
-- With RLS on and no policy left, only the service role (the landing page's waitlist route) and the
-- SECURITY DEFINER function above can reach the table.
DROP POLICY IF EXISTS "Authenticated can update referral code usage" ON public.referral_codes;
DROP POLICY IF EXISTS "Authenticated can read referral codes" ON public.referral_codes;
