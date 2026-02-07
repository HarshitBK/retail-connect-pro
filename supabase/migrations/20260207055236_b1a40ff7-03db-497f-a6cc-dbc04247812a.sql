-- Fix security warnings: Set search_path for functions
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Create wallet
    INSERT INTO public.wallets (user_id, balance) VALUES (NEW.id, 0);
    -- Create reward points with 10 initial points
    INSERT INTO public.reward_points (user_id, points) VALUES (NEW.id, 10);
    RETURN NEW;
END;
$$;

-- Fix OTP verification policy - restrict INSERT to valid use cases
DROP POLICY IF EXISTS "Anyone can insert OTP" ON public.otp_verifications;
CREATE POLICY "Authenticated users can insert OTP" ON public.otp_verifications FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL OR user_id IS NULL);