
-- Create notifications table
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  is_read boolean NOT NULL DEFAULT false,
  reference_id uuid,
  reference_type text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Add education_grade column to employee_profiles
ALTER TABLE public.employee_profiles ADD COLUMN IF NOT EXISTS education_grade text;

-- Add released_at column to hired_candidates for tracking release
ALTER TABLE public.hired_candidates ADD COLUMN IF NOT EXISTS released_at timestamp with time zone;
ALTER TABLE public.hired_candidates ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- Create function to auto-expire reservations after 5 days
CREATE OR REPLACE FUNCTION public.check_expired_reservations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update expired reservations
  UPDATE candidate_reservations
  SET status = 'expired'
  WHERE status = 'pending' AND expires_at < now();

  -- Reset employee status for expired reservations
  UPDATE employee_profiles ep
  SET employment_status = 'available', reserved_by = NULL, reservation_expires_at = NULL
  FROM candidate_reservations cr
  WHERE cr.employee_id = ep.id
    AND cr.status = 'expired'
    AND ep.employment_status = 'reserved';

  -- Release hired employees after 1 month
  UPDATE employee_profiles ep
  SET employment_status = 'available'
  FROM hired_candidates hc
  WHERE hc.employee_id = ep.id
    AND hc.status = 'active'
    AND hc.released_at IS NULL
    AND ep.employment_status = 'employed'
    AND hc.hired_date < (now() - interval '30 days')::date;
END;
$$;
