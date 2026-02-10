
-- 1. Create trigger for referral code generation on profiles (use IF NOT EXISTS pattern)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_generate_referral_code') THEN
    CREATE TRIGGER trigger_generate_referral_code
      BEFORE INSERT ON public.profiles
      FOR EACH ROW
      WHEN (NEW.referral_code IS NULL)
      EXECUTE FUNCTION public.generate_referral_code();
  END IF;
END $$;

-- 2. Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage policies for document uploads
DO $$ BEGIN
  CREATE POLICY "Users can upload own documents"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view own documents"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own documents"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own documents"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
