
-- Fix the overly permissive INSERT policy on notifications
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Allow authenticated users to insert notifications (app logic controls who gets notified)
CREATE POLICY "Authenticated users can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
