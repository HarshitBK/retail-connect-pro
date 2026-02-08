-- Add username field to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Add referral system columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by TEXT;

-- Create index on referral_code for lookups
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);

-- Add retail categories to employee profiles
ALTER TABLE public.employee_profiles ADD COLUMN IF NOT EXISTS retail_categories JSONB DEFAULT '[]'::jsonb;

-- Add document URLs for employee profiles  
ALTER TABLE public.employee_profiles ADD COLUMN IF NOT EXISTS aadhar_document_url TEXT;
ALTER TABLE public.employee_profiles ADD COLUMN IF NOT EXISTS pan_document_url TEXT;

-- Add store count to employer profiles
ALTER TABLE public.employer_profiles ADD COLUMN IF NOT EXISTS number_of_stores INTEGER DEFAULT 1;

-- Add retail categories for employer filtering
ALTER TABLE public.employer_profiles ADD COLUMN IF NOT EXISTS retail_categories JSONB DEFAULT '[]'::jsonb;

-- Create referral_rewards table to track referral bonus
CREATE TABLE IF NOT EXISTS public.referral_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_user_id UUID NOT NULL,
  referred_user_id UUID NOT NULL,
  points_awarded INTEGER NOT NULL DEFAULT 15,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(referred_user_id)
);

-- Enable RLS on referral_rewards
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own referral rewards
CREATE POLICY "Users can view own referral rewards"
  ON public.referral_rewards
  FOR SELECT
  USING (auth.uid() = referrer_user_id);

-- Create function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER AS $$
DECLARE
  code TEXT;
  exists_count INTEGER;
BEGIN
  LOOP
    -- Generate a 6-character alphanumeric code
    code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));
    
    -- Check if it already exists
    SELECT COUNT(*) INTO exists_count FROM public.profiles WHERE referral_code = code;
    
    -- Exit loop if unique
    IF exists_count = 0 THEN
      NEW.referral_code := code;
      EXIT;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-generate referral code on profile insert
DROP TRIGGER IF EXISTS trigger_generate_referral_code ON public.profiles;
CREATE TRIGGER trigger_generate_referral_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  WHEN (NEW.referral_code IS NULL)
  EXECUTE FUNCTION public.generate_referral_code();