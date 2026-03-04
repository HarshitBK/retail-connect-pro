
-- Enable Realtime for chat_messages
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;

-- Ensure the publication exists for realtime
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- Add chat_messages to the publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Ensure RLS is enabled
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreation them
DROP POLICY IF EXISTS "Users can view messages in their rooms" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert messages in their rooms" ON public.chat_messages;

-- SELECT policy: Users can see messages if they are part of the reservation or hired record
CREATE POLICY "Users can view messages in their rooms"
ON public.chat_messages FOR SELECT
TO authenticated
USING (
  -- 1. Direct match (for simple rooms or internal testing)
  room_id LIKE '%' || auth.uid()::text || '%'
  OR 
  -- 2. Match via candidate_reservations (for pending or past reservations)
  EXISTS (
    SELECT 1 FROM public.candidate_reservations cr
    JOIN public.employer_profiles ep ON cr.employer_id = ep.id
    JOIN public.employee_profiles emp ON cr.employee_id = emp.id
    WHERE cr.id::text = room_id
    AND (ep.user_id = auth.uid() OR emp.user_id = auth.uid())
  )
  OR
  -- 3. Match via hired_candidates (for active employment)
  EXISTS (
    SELECT 1 FROM public.hired_candidates hc
    JOIN public.employer_profiles ep ON hc.employer_id = ep.id
    JOIN public.employee_profiles emp ON hc.employee_id = emp.id
    WHERE hc.reservation_id::text = room_id
    AND (ep.user_id = auth.uid() OR emp.user_id = auth.uid())
  )
);

-- INSERT policy: Same logic as SELECT
CREATE POLICY "Users can insert messages in their rooms"
ON public.chat_messages FOR INSERT
TO authenticated
WITH CHECK (
  -- 1. Direct match
  room_id LIKE '%' || auth.uid()::text || '%'
  OR 
  -- 2. Match via candidate_reservations
  EXISTS (
    SELECT 1 FROM public.candidate_reservations cr
    JOIN public.employer_profiles ep ON cr.employer_id = ep.id
    JOIN public.employee_profiles emp ON cr.employee_id = emp.id
    WHERE cr.id::text = room_id
    AND (ep.user_id = auth.uid() OR emp.user_id = auth.uid())
  )
  OR
  -- 3. Match via hired_candidates
  EXISTS (
    SELECT 1 FROM public.hired_candidates hc
    JOIN public.employer_profiles ep ON hc.employer_id = ep.id
    JOIN public.employee_profiles emp ON hc.employee_id = emp.id
    WHERE hc.reservation_id::text = room_id
    AND (ep.user_id = auth.uid() OR emp.user_id = auth.uid())
  )
);
