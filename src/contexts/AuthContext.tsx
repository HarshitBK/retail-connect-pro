import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  userType: "employee" | "employer";
  email: string;
  phone?: string;
  phoneVerified: boolean;
  emailVerified: boolean;
}

interface EmployeeProfile {
  id: string;
  userId: string;
  fullName: string;
  photoUrl?: string;
  employmentStatus: "available" | "employed" | "reserved";
  profileCompletionPercent: number;
}

interface EmployerProfile {
  id: string;
  userId: string;
  organizationName: string;
  logoUrl?: string;
  subscriptionStatus: string;
}

interface WalletInfo {
  id: string;
  balance: number;
}

interface RewardInfo {
  id: string;
  points: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  employeeProfile: EmployeeProfile | null;
  employerProfile: EmployerProfile | null;
  wallet: WalletInfo | null;
  rewards: RewardInfo | null;
  loading: boolean;
  signUp: (email: string, password: string, userType: "employee" | "employer") => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [employeeProfile, setEmployeeProfile] = useState<EmployeeProfile | null>(null);
  const [employerProfile, setEmployerProfile] = useState<EmployerProfile | null>(null);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [rewards, setRewards] = useState<RewardInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) throw profileError;

      if (profileData) {
        setProfile({
          id: profileData.id,
          userType: profileData.user_type as "employee" | "employer",
          email: profileData.email,
          phone: profileData.phone || undefined,
          phoneVerified: profileData.phone_verified || false,
          emailVerified: profileData.email_verified || false,
        });

        // Fetch type-specific profile
        if (profileData.user_type === "employee") {
          const { data: empData } = await supabase
            .from("employee_profiles")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle();

          if (empData) {
            setEmployeeProfile({
              id: empData.id,
              userId: empData.user_id,
              fullName: empData.full_name,
              photoUrl: empData.photo_url || undefined,
              employmentStatus: empData.employment_status as "available" | "employed" | "reserved",
              profileCompletionPercent: empData.profile_completion_percent || 0,
            });
          }
        } else if (profileData.user_type === "employer") {
          const { data: emplrData } = await supabase
            .from("employer_profiles")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle();

          if (emplrData) {
            setEmployerProfile({
              id: emplrData.id,
              userId: emplrData.user_id,
              organizationName: emplrData.organization_name,
              logoUrl: emplrData.logo_url || undefined,
              subscriptionStatus: emplrData.subscription_status || "pending",
            });
          }
        }
      }

      // Fetch wallet
      const { data: walletData } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (walletData) {
        setWallet({
          id: walletData.id,
          balance: Number(walletData.balance) || 0,
        });
      }

      // Fetch rewards
      const { data: rewardsData } = await supabase
        .from("reward_points")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (rewardsData) {
        setRewards({
          id: rewardsData.id,
          points: rewardsData.points || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Defer data fetching to avoid deadlock
          setTimeout(() => fetchUserData(session.user.id), 0);
        } else {
          setProfile(null);
          setEmployeeProfile(null);
          setEmployerProfile(null);
          setWallet(null);
          setRewards(null);
        }

        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, userType: "employee" | "employer") => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            user_type: userType,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: data.user.id,
            user_type: userType,
            email: email,
          });

        if (profileError) throw profileError;

        // Create user role
        await supabase.from("user_roles").insert({
          user_id: data.user.id,
          role: userType,
        });

        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
      }

      return { error: null };
    } catch (error) {
      console.error("Signup error:", error);
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error("Signin error:", error);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setEmployeeProfile(null);
    setEmployerProfile(null);
    setWallet(null);
    setRewards(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserData(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        employeeProfile,
        employerProfile,
        wallet,
        rewards,
        loading,
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
