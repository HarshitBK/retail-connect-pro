-- Add metadata column to skill_test_attempts for cheating detection
ALTER TABLE public.skill_test_attempts ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
