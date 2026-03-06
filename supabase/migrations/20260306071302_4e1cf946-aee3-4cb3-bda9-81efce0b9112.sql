CREATE TABLE public.call_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id text NOT NULL,
  caller_id uuid NOT NULL,
  caller_name text NOT NULL,
  callee_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'ringing',
  created_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);

ALTER TABLE public.call_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own calls" ON public.call_signals
  FOR SELECT TO authenticated
  USING (caller_id = auth.uid() OR callee_id = auth.uid());

CREATE POLICY "Users can create calls" ON public.call_signals
  FOR INSERT TO authenticated
  WITH CHECK (caller_id = auth.uid());

CREATE POLICY "Users can update own calls" ON public.call_signals
  FOR UPDATE TO authenticated
  USING (caller_id = auth.uid() OR callee_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE public.call_signals;