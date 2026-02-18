-- Allow new users to record that they were referred (so referrer gets points and notification)
CREATE POLICY "Users can insert referral when they are the referred"
  ON public.referral_rewards
  FOR INSERT
  WITH CHECK (auth.uid() = referred_user_id);

-- When a referral is recorded, credit the referrer and notify them (SECURITY DEFINER so RLS doesn't block)
CREATE OR REPLACE FUNCTION public.on_referral_reward_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reward_row RECORD;
BEGIN
  -- Ensure referrer has a reward_points row and add points
  INSERT INTO reward_points (user_id, points)
  VALUES (NEW.referrer_user_id, NEW.points_awarded)
  ON CONFLICT (user_id) DO UPDATE
  SET points = reward_points.points + EXCLUDED.points;

  -- Notify the referrer
  INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type)
  VALUES (
    NEW.referrer_user_id,
    '🎁 Referral bonus!',
    'Someone just signed up using your referral code. You''ve earned ' || NEW.points_awarded || ' bonus points!',
    'referral',
    NEW.referred_user_id,
    'referral'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_on_referral_reward_created ON public.referral_rewards;
CREATE TRIGGER trigger_on_referral_reward_created
  AFTER INSERT ON public.referral_rewards
  FOR EACH ROW
  EXECUTE FUNCTION public.on_referral_reward_created();
