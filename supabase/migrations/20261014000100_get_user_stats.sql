-- One round trip for everything the Stats/Home/Keys/Profile tabs show about activity.
-- It replaces three full downloads of ai_chat_logs plus several count queries, and it buckets
-- days in the caller's timezone (the app used to slice the UTC timestamp, which put late-evening
-- chats on the wrong day for anyone not on UTC).
--
-- Streak rule is unchanged: walk back from today, count days with a chat, and stop after two
-- missed days in a row (so a single gap, including "not yet today", is tolerated).
-- cleared_at is deliberately NOT filtered: clearing a conversation must not touch stats.
--
-- SECURITY INVOKER: runs as the caller, so RLS applies and auth.uid() is the signed-in user.

CREATE OR REPLACE FUNCTION get_user_stats(p_tz TEXT DEFAULT 'UTC')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_today DATE;
  v_week_start DATE;
  v_cur DATE;
  v_streak INT := 0;
  v_missed INT := 0;
  v_longest INT;
  v_days DATE[];
  v_active_days JSONB;
  v_daily_counts JSONB;
  v_affirm BIGINT;
  v_question BIGINT;
  v_total BIGINT;
  v_week BIGINT;
BEGIN
  IF v_uid IS NULL THEN
    RETURN NULL;
  END IF;

  v_today := (now() AT TIME ZONE p_tz)::DATE;
  -- Weeks start on Sunday, matching the app's existing "this week" count
  v_week_start := v_today - EXTRACT(DOW FROM v_today)::INT;

  WITH per_day AS (
    SELECT (created_at AT TIME ZONE p_tz)::DATE AS day, COUNT(*) AS n
    FROM ai_chat_logs
    WHERE user_id = v_uid
    GROUP BY 1
  )
  SELECT
    COALESCE(array_agg(day), ARRAY[]::DATE[]),
    COALESCE(jsonb_agg(to_char(day, 'YYYY-MM-DD') ORDER BY day), '[]'::JSONB),
    COALESCE(jsonb_object_agg(to_char(day, 'YYYY-MM-DD'), n), '{}'::JSONB),
    COALESCE(SUM(n), 0),
    COALESCE(SUM(n) FILTER (WHERE day >= v_week_start), 0)
  INTO v_days, v_active_days, v_daily_counts, v_total, v_week
  FROM per_day;

  v_cur := v_today;
  LOOP
    IF v_cur = ANY(v_days) THEN
      v_streak := v_streak + 1;
      v_missed := 0;
    ELSE
      v_missed := v_missed + 1;
      EXIT WHEN v_missed >= 2;
    END IF;
    v_cur := v_cur - 1;
  END LOOP;

  SELECT COUNT(*) FILTER (WHERE mode = 'affirm'), COUNT(*) FILTER (WHERE mode = 'question')
  INTO v_affirm, v_question
  FROM ai_chat_logs
  WHERE user_id = v_uid;

  -- longest_streak only ever goes up
  UPDATE users
  SET day_streak = v_streak,
      longest_streak = GREATEST(COALESCE(longest_streak, 0), v_streak)
  WHERE id = v_uid
  RETURNING longest_streak INTO v_longest;

  RETURN jsonb_build_object(
    'day_streak', v_streak,
    'longest_streak', COALESCE(v_longest, v_streak),
    'active_days', v_active_days,
    'daily_counts', v_daily_counts,
    'total', v_total,
    'week', v_week,
    'affirm', v_affirm,
    'question', v_question
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION get_user_stats(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION get_user_stats(TEXT) TO authenticated;
