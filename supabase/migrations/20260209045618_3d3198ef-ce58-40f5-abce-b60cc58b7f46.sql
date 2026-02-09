-- Allow looking up profiles by username for login purposes
CREATE POLICY "Anyone can lookup profiles by username for login"
ON public.profiles
FOR SELECT
USING (true);

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;