-- Fix: When employer reserves/hires, RLS blocks direct update to employee_profiles.
-- Use SECURITY DEFINER triggers so server updates employment_status for all employers.

-- 1. On INSERT into candidate_reservations → set employee to reserved
CREATE OR REPLACE FUNCTION public.on_candidate_reservation_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE employee_profiles
  SET
    employment_status = 'reserved',
    reserved_by = NEW.employer_id,
    reservation_expires_at = NEW.expires_at
  WHERE id = NEW.employee_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_on_candidate_reservation_created ON public.candidate_reservations;
CREATE TRIGGER trigger_on_candidate_reservation_created
  AFTER INSERT ON public.candidate_reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.on_candidate_reservation_created();

-- 2. On UPDATE candidate_reservations to not_hired or expired → set employee back to available
CREATE OR REPLACE FUNCTION public.on_candidate_reservation_updated()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IN ('not_hired', 'expired') AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    UPDATE employee_profiles
    SET employment_status = 'available', reserved_by = NULL, reservation_expires_at = NULL
    WHERE id = NEW.employee_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_on_candidate_reservation_updated ON public.candidate_reservations;
CREATE TRIGGER trigger_on_candidate_reservation_updated
  AFTER UPDATE ON public.candidate_reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.on_candidate_reservation_updated();

-- 3. On INSERT into hired_candidates → set employee to employed and clear reservation
CREATE OR REPLACE FUNCTION public.on_hired_candidate_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE employee_profiles
  SET employment_status = 'employed', reserved_by = NULL, reservation_expires_at = NULL
  WHERE id = NEW.employee_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_on_hired_candidate_created ON public.hired_candidates;
CREATE TRIGGER trigger_on_hired_candidate_created
  AFTER INSERT ON public.hired_candidates
  FOR EACH ROW
  EXECUTE FUNCTION public.on_hired_candidate_created();

-- 4. On UPDATE hired_candidates (released_at set) → set employee back to available
CREATE OR REPLACE FUNCTION public.on_hired_candidate_released()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.released_at IS NOT NULL AND OLD.released_at IS NULL THEN
    UPDATE employee_profiles
    SET employment_status = 'available', reserved_by = NULL, reservation_expires_at = NULL
    WHERE id = NEW.employee_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_on_hired_candidate_released ON public.hired_candidates;
CREATE TRIGGER trigger_on_hired_candidate_released
  AFTER UPDATE ON public.hired_candidates
  FOR EACH ROW
  EXECUTE FUNCTION public.on_hired_candidate_released();
