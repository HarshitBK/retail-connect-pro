-- Create enums
CREATE TYPE public.user_type AS ENUM ('employee', 'employer');
CREATE TYPE public.employment_status AS ENUM ('available', 'employed', 'reserved');
CREATE TYPE public.transaction_type AS ENUM ('credit', 'debit', 'refund');
CREATE TYPE public.reservation_status AS ENUM ('pending', 'hired', 'not_hired', 'expired');
CREATE TYPE public.test_status AS ENUM ('draft', 'published', 'closed');
CREATE TYPE public.attempt_status AS ENUM ('in_progress', 'completed', 'abandoned');
CREATE TYPE public.course_status AS ENUM ('enrolled', 'in_progress', 'completed');

-- Profiles table (links to auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    user_type user_type NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    phone_verified BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User roles table for security
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role user_type NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, role)
);

-- Employee profiles
CREATE TABLE public.employee_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    photo_url TEXT,
    date_of_birth DATE,
    gender TEXT,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    preferred_work_cities JSONB DEFAULT '[]'::jsonb,
    education_level TEXT,
    education_details TEXT,
    years_of_experience INTEGER DEFAULT 0,
    current_organization TEXT,
    previous_organizations JSONB DEFAULT '[]'::jsonb,
    skills JSONB DEFAULT '[]'::jsonb,
    employment_status employment_status DEFAULT 'available',
    aadhar_number TEXT,
    pan_number TEXT,
    bank_name TEXT,
    bank_account_number TEXT,
    bank_ifsc TEXT,
    resume_url TEXT,
    payslips_urls JSONB DEFAULT '[]'::jsonb,
    certificates_urls JSONB DEFAULT '[]'::jsonb,
    is_blacklisted BOOLEAN DEFAULT FALSE,
    reserved_by UUID,
    reservation_expires_at TIMESTAMPTZ,
    profile_completion_percent INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employer profiles
CREATE TABLE public.employer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    organization_name TEXT NOT NULL,
    organization_type TEXT,
    logo_url TEXT,
    gst_number TEXT,
    pan_number TEXT,
    cin_number TEXT,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    website TEXT,
    contact_person_name TEXT,
    contact_person_designation TEXT,
    contact_person_phone TEXT,
    contact_person_email TEXT,
    subscription_status TEXT DEFAULT 'pending',
    subscription_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wallets
CREATE TABLE public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    balance DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wallet transactions
CREATE TABLE public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE NOT NULL,
    transaction_type transaction_type NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    description TEXT,
    reference_type TEXT,
    reference_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rewards/Points
CREATE TABLE public.reward_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    points INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reward transactions
CREATE TABLE public.reward_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reward_id UUID REFERENCES public.reward_points(id) ON DELETE CASCADE NOT NULL,
    points_change INTEGER NOT NULL,
    description TEXT,
    reference_type TEXT,
    reference_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gifts catalog
CREATE TABLE public.gifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    points_required INTEGER NOT NULL,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gift redemptions
CREATE TABLE public.gift_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    gift_id UUID REFERENCES public.gifts(id) ON DELETE CASCADE NOT NULL,
    points_used INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    shipping_address TEXT,
    redeemed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Candidate reservations
CREATE TABLE public.candidate_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employer_id UUID REFERENCES public.employer_profiles(id) ON DELETE CASCADE NOT NULL,
    employee_id UUID REFERENCES public.employee_profiles(id) ON DELETE CASCADE NOT NULL,
    reservation_fee DECIMAL(12,2) DEFAULT 500,
    status reservation_status DEFAULT 'pending',
    reserved_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    hired_at TIMESTAMPTZ,
    offer_letter_url TEXT,
    refund_amount DECIMAL(12,2) DEFAULT 0,
    refunded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hired candidates (employment records)
CREATE TABLE public.hired_candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employer_id UUID REFERENCES public.employer_profiles(id) ON DELETE CASCADE NOT NULL,
    employee_id UUID REFERENCES public.employee_profiles(id) ON DELETE CASCADE NOT NULL,
    reservation_id UUID REFERENCES public.candidate_reservations(id),
    position TEXT,
    hired_date DATE,
    offer_letter_url TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    rating_comment TEXT,
    is_blacklisted BOOLEAN DEFAULT FALSE,
    blacklist_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Skill tests
CREATE TABLE public.skill_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employer_id UUID REFERENCES public.employer_profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    position TEXT,
    location TEXT,
    test_fee DECIMAL(12,2) DEFAULT 50,
    employer_fee_per_completion DECIMAL(12,2) DEFAULT 30,
    duration_minutes INTEGER DEFAULT 60,
    passing_score INTEGER DEFAULT 40,
    status test_status DEFAULT 'draft',
    questions JSONB DEFAULT '[]'::jsonb,
    max_attempts INTEGER DEFAULT 1,
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Skill test attempts
CREATE TABLE public.skill_test_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID REFERENCES public.skill_tests(id) ON DELETE CASCADE NOT NULL,
    employee_id UUID REFERENCES public.employee_profiles(id) ON DELETE CASCADE NOT NULL,
    status attempt_status DEFAULT 'in_progress',
    answers JSONB DEFAULT '[]'::jsonb,
    score INTEGER,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    fee_paid DECIMAL(12,2) DEFAULT 50,
    employer_charged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Certification courses
CREATE TABLE public.certification_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    fee DECIMAL(12,2) DEFAULT 50,
    duration_hours INTEGER,
    content JSONB DEFAULT '[]'::jsonb,
    passing_score INTEGER DEFAULT 70,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Course enrollments
CREATE TABLE public.course_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.certification_courses(id) ON DELETE CASCADE NOT NULL,
    employee_id UUID REFERENCES public.employee_profiles(id) ON DELETE CASCADE NOT NULL,
    status course_status DEFAULT 'enrolled',
    progress INTEGER DEFAULT 0,
    score INTEGER,
    fee_paid DECIMAL(12,2) DEFAULT 50,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    certificate_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- OTP verification table
CREATE TABLE public.otp_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    phone TEXT,
    otp_code TEXT NOT NULL,
    otp_type TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indian states and cities (reference data)
CREATE TABLE public.indian_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE
);

CREATE TABLE public.indian_cities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state_id UUID REFERENCES public.indian_states(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hired_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certification_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indian_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indian_cities ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION public.get_user_type(user_uuid UUID)
RETURNS user_type
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_type FROM profiles WHERE id = user_uuid;
$$;

CREATE OR REPLACE FUNCTION public.is_employee(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = user_uuid AND user_type = 'employee');
$$;

CREATE OR REPLACE FUNCTION public.is_employer(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = user_uuid AND user_type = 'employer');
$$;

-- RLS Policies

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- User roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own role" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Employee profiles
CREATE POLICY "Employees can view own profile" ON public.employee_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Employers can view employee profiles" ON public.employee_profiles FOR SELECT USING (public.is_employer(auth.uid()));
CREATE POLICY "Employees can insert own profile" ON public.employee_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Employees can update own profile" ON public.employee_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Employer profiles
CREATE POLICY "Employers can view own profile" ON public.employer_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Employees can view employer profiles" ON public.employer_profiles FOR SELECT USING (public.is_employee(auth.uid()));
CREATE POLICY "Employers can insert own profile" ON public.employer_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Employers can update own profile" ON public.employer_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Wallets
CREATE POLICY "Users can view own wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wallet" ON public.wallets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own wallet" ON public.wallets FOR UPDATE USING (auth.uid() = user_id);

-- Wallet transactions
CREATE POLICY "Users can view own transactions" ON public.wallet_transactions FOR SELECT 
USING (wallet_id IN (SELECT id FROM wallets WHERE user_id = auth.uid()));

-- Reward points
CREATE POLICY "Users can view own rewards" ON public.reward_points FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own rewards" ON public.reward_points FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rewards" ON public.reward_points FOR UPDATE USING (auth.uid() = user_id);

-- Reward transactions
CREATE POLICY "Users can view own reward transactions" ON public.reward_transactions FOR SELECT 
USING (reward_id IN (SELECT id FROM reward_points WHERE user_id = auth.uid()));

-- Gifts (public read)
CREATE POLICY "Anyone can view active gifts" ON public.gifts FOR SELECT USING (is_active = TRUE);

-- Gift redemptions
CREATE POLICY "Users can view own redemptions" ON public.gift_redemptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own redemptions" ON public.gift_redemptions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Candidate reservations
CREATE POLICY "Employers can view own reservations" ON public.candidate_reservations FOR SELECT 
USING (employer_id IN (SELECT id FROM employer_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Employees can view reservations about them" ON public.candidate_reservations FOR SELECT 
USING (employee_id IN (SELECT id FROM employee_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Employers can create reservations" ON public.candidate_reservations FOR INSERT 
WITH CHECK (employer_id IN (SELECT id FROM employer_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Employers can update own reservations" ON public.candidate_reservations FOR UPDATE 
USING (employer_id IN (SELECT id FROM employer_profiles WHERE user_id = auth.uid()));

-- Hired candidates
CREATE POLICY "Employers can view own hired" ON public.hired_candidates FOR SELECT 
USING (employer_id IN (SELECT id FROM employer_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Employees can view own hiring records" ON public.hired_candidates FOR SELECT 
USING (employee_id IN (SELECT id FROM employee_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Employers can create hiring records" ON public.hired_candidates FOR INSERT 
WITH CHECK (employer_id IN (SELECT id FROM employer_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Employers can update own hiring records" ON public.hired_candidates FOR UPDATE 
USING (employer_id IN (SELECT id FROM employer_profiles WHERE user_id = auth.uid()));

-- Skill tests
CREATE POLICY "Anyone authenticated can view published tests" ON public.skill_tests FOR SELECT USING (status = 'published' OR employer_id IN (SELECT id FROM employer_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Employers can create tests" ON public.skill_tests FOR INSERT WITH CHECK (employer_id IN (SELECT id FROM employer_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Employers can update own tests" ON public.skill_tests FOR UPDATE USING (employer_id IN (SELECT id FROM employer_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Employers can delete own tests" ON public.skill_tests FOR DELETE USING (employer_id IN (SELECT id FROM employer_profiles WHERE user_id = auth.uid()));

-- Skill test attempts
CREATE POLICY "Employees can view own attempts" ON public.skill_test_attempts FOR SELECT USING (employee_id IN (SELECT id FROM employee_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Employers can view attempts on their tests" ON public.skill_test_attempts FOR SELECT 
USING (test_id IN (SELECT id FROM skill_tests WHERE employer_id IN (SELECT id FROM employer_profiles WHERE user_id = auth.uid())));
CREATE POLICY "Employees can create attempts" ON public.skill_test_attempts FOR INSERT WITH CHECK (employee_id IN (SELECT id FROM employee_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Employees can update own attempts" ON public.skill_test_attempts FOR UPDATE USING (employee_id IN (SELECT id FROM employee_profiles WHERE user_id = auth.uid()));

-- Certification courses (public read)
CREATE POLICY "Anyone can view active courses" ON public.certification_courses FOR SELECT USING (is_active = TRUE);

-- Course enrollments
CREATE POLICY "Employees can view own enrollments" ON public.course_enrollments FOR SELECT USING (employee_id IN (SELECT id FROM employee_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Employees can enroll" ON public.course_enrollments FOR INSERT WITH CHECK (employee_id IN (SELECT id FROM employee_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Employees can update own enrollments" ON public.course_enrollments FOR UPDATE USING (employee_id IN (SELECT id FROM employee_profiles WHERE user_id = auth.uid()));

-- OTP verifications
CREATE POLICY "Users can view own OTPs" ON public.otp_verifications FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Anyone can insert OTP" ON public.otp_verifications FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Users can update own OTPs" ON public.otp_verifications FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

-- Indian states and cities (public read)
CREATE POLICY "Anyone can view states" ON public.indian_states FOR SELECT USING (TRUE);
CREATE POLICY "Anyone can view cities" ON public.indian_cities FOR SELECT USING (TRUE);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_employee_profiles_updated_at BEFORE UPDATE ON public.employee_profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_employer_profiles_updated_at BEFORE UPDATE ON public.employer_profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_wallets_updated_at BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_reward_points_updated_at BEFORE UPDATE ON public.reward_points FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_candidate_reservations_updated_at BEFORE UPDATE ON public.candidate_reservations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_hired_candidates_updated_at BEFORE UPDATE ON public.hired_candidates FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_skill_tests_updated_at BEFORE UPDATE ON public.skill_tests FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_certification_courses_updated_at BEFORE UPDATE ON public.certification_courses FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to create wallet and rewards on user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create wallet
    INSERT INTO public.wallets (user_id, balance) VALUES (NEW.id, 0);
    -- Create reward points with 10 initial points
    INSERT INTO public.reward_points (user_id, points) VALUES (NEW.id, 10);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create wallet and rewards
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();