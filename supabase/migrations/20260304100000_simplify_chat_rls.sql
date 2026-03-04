
-- Simplify RLS for chat_messages to diagnose "failed to send message" error
-- This also ensures the sender_id matches the auth.uid()

DROP POLICY IF EXISTS "Users can view messages in their rooms" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert messages in their rooms" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.chat_messages;

-- 1. SELECT Policy: Re-implementing with robust checks for both employers and employees
CREATE POLICY "chat_messages_select_policy"
ON public.chat_messages FOR SELECT
TO authenticated
USING (
    -- Allow if user is the sender
    sender_id = auth.uid()
    OR
    -- Allow if user is participant via reservation
    EXISTS (
        SELECT 1 FROM public.candidate_reservations cr
        LEFT JOIN public.employer_profiles ep ON cr.employer_id = ep.id
        LEFT JOIN public.employee_profiles emp ON cr.employee_id = emp.id
        WHERE cr.id::text = room_id
        AND (ep.user_id = auth.uid() OR emp.user_id = auth.uid())
    )
    OR
    -- Allow if user is participant via hiring
    EXISTS (
        SELECT 1 FROM public.hired_candidates hc
        LEFT JOIN public.employer_profiles ep ON hc.employer_id = ep.id
        LEFT JOIN public.employee_profiles emp ON hc.employee_id = emp.id
        WHERE (hc.id::text = room_id OR hc.reservation_id::text = room_id)
        AND (ep.user_id = auth.uid() OR emp.user_id = auth.uid())
    )
    OR
    -- Fallback for direct room strings (if room_id contains the user_id)
    room_id LIKE '%' || auth.uid()::text || '%'
);

-- 2. INSERT Policy: Ensuring the user can only insert as themselves and only in valid rooms
CREATE POLICY "chat_messages_insert_policy"
ON public.chat_messages FOR INSERT
TO authenticated
WITH CHECK (
    -- MUST be sending as self
    sender_id = auth.uid()
    AND (
        -- Room participation check (Reservation)
        EXISTS (
            SELECT 1 FROM public.candidate_reservations cr
            LEFT JOIN public.employer_profiles ep ON cr.employer_id = ep.id
            LEFT JOIN public.employee_profiles emp ON cr.employee_id = emp.id
            WHERE cr.id::text = room_id
            AND (ep.user_id = auth.uid() OR emp.user_id = auth.uid())
        )
        OR
        -- Room participation check (Hiring)
        EXISTS (
            SELECT 1 FROM public.hired_candidates hc
            LEFT JOIN public.employer_profiles ep ON hc.employer_id = ep.id
            LEFT JOIN public.employee_profiles emp ON hc.employee_id = emp.id
            WHERE (hc.id::text = room_id OR hc.reservation_id::text = room_id)
            AND (ep.user_id = auth.uid() OR emp.user_id = auth.uid())
        )
        OR
        -- Fallback
        room_id LIKE '%' || auth.uid()::text || '%'
    )
);

-- Ensure Realtime is enabled
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;

-- Re-verify publication
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
EXCEPTION
    WHEN others THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
EXCEPTION
    WHEN others THEN NULL;
END $$;
