-- Create a trigger function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_type_val text;
BEGIN
  -- Get user_type from metadata
  user_type_val := NEW.raw_user_meta_data->>'user_type';
  
  -- Default to 'employee' if not specified
  IF user_type_val IS NULL THEN
    user_type_val := 'employee';
  END IF;
  
  -- Create profile
  INSERT INTO public.profiles (id, email, user_type)
  VALUES (NEW.id, NEW.email, user_type_val::user_type);
  
  -- Create user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_type_val::user_type);
  
  -- Create wallet (already handled by handle_new_user but keeping for safety)
  INSERT INTO public.wallets (user_id, balance)
  VALUES (NEW.id, 0)
  ON CONFLICT DO NOTHING;
  
  -- Create reward points (already handled by handle_new_user but keeping for safety)
  INSERT INTO public.reward_points (user_id, points)
  VALUES (NEW.id, 10)
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();

-- Update RLS policy for profiles to allow the trigger to work
-- The trigger runs with SECURITY DEFINER so it bypasses RLS

-- Also update handle_new_user to not conflict
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Create wallet if not exists
    INSERT INTO public.wallets (user_id, balance) 
    VALUES (NEW.id, 0)
    ON CONFLICT DO NOTHING;
    
    -- Create reward points if not exists
    INSERT INTO public.reward_points (user_id, points) 
    VALUES (NEW.id, 10)
    ON CONFLICT DO NOTHING;
    
    RETURN NEW;
END;
$$;