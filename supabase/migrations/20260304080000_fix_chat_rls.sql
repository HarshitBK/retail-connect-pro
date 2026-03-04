
-- Drop old policies
DROP POLICY IF EXISTS "Users can view messages in their rooms" ON public.chat_messages;

-- Create more comprehensive SELECT policy for Chat Messages
-- This allows both employers and employees to see messages in rooms 
-- identified by a reservation ID, as long as they are participants.
CREATE POLICY "Users can view messages in their rooms"
ON public.chat_messages FOR SELECT
TO authenticated
USING (
  -- 1. Direct match (backwards compatibility or simple rooms)
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
