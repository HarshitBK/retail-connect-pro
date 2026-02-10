
-- Allow employers to insert wallet transactions (for reservation deductions and refunds)
DO $$ BEGIN
  CREATE POLICY "Users can insert own wallet transactions"
    ON public.wallet_transactions FOR INSERT
    WITH CHECK (wallet_id IN (SELECT id FROM wallets WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
