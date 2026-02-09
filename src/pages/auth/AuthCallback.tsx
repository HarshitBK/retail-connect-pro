import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState("Verifying your account...");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth callback error:", error);
          navigate("/login?error=callback_failed");
          return;
        }

        if (session) {
          const userId = session.user.id;
          setStatus("Creating your profile...");

          // Check user type and redirect accordingly
          const { data: profile } = await supabase
            .from("profiles")
            .select("user_type")
            .eq("id", userId)
            .maybeSingle();

          const userType = profile?.user_type;

          // Check for pending profile data in localStorage
          if (userType === "employee") {
            const pendingData = localStorage.getItem(`pending_employee_profile_${userId}`);
            if (pendingData) {
              try {
                const data = JSON.parse(pendingData);
                
                // Create employee profile
                const { error: empError } = await supabase
                  .from("employee_profiles")
                  .insert({
                    user_id: userId,
                    full_name: data.fullName,
                    gender: data.gender,
                    date_of_birth: data.dateOfBirth || null,
                    address_line1: data.addressLine1,
                    address_line2: data.addressLine2,
                    state: data.state,
                    city: data.city,
                    pincode: data.pincode,
                    education_level: data.educationLevel,
                    education_details: data.educationDetails,
                    years_of_experience: data.yearsOfExperience || 0,
                    current_organization: data.currentOrganization,
                    skills: data.skills || [],
                    retail_categories: data.retailCategories || [],
                    preferred_work_cities: data.preferredWorkCities || [],
                    aadhar_number: data.aadharNumber,
                    pan_number: data.panNumber,
                    bank_name: data.bankName,
                    bank_account_number: data.bankAccountNumber,
                    bank_ifsc: data.bankIfsc,
                    employment_status: "available",
                    profile_completion_percent: calculateEmployeeCompletion(data),
                  });

                if (empError) {
                  console.error("Error creating employee profile:", empError);
                } else {
                  // Clear pending data
                  localStorage.removeItem(`pending_employee_profile_${userId}`);
                  
                  // Handle referral reward if there's a referral code
                  if (data.referralCode) {
                    await handleReferralReward(userId, data.referralCode);
                  }
                }
              } catch (e) {
                console.error("Error parsing pending employee data:", e);
              }
            }
            
            toast({
              title: "Welcome to RetailHire! 🎉",
              description: "Your account has been verified. You earned 10 bonus points!",
            });
            navigate("/employee/dashboard");
            
          } else if (userType === "employer") {
            const pendingData = localStorage.getItem(`pending_employer_profile_${userId}`);
            if (pendingData) {
              try {
                const data = JSON.parse(pendingData);
                
                // Create employer profile
                const { error: emplrError } = await supabase
                  .from("employer_profiles")
                  .insert({
                    user_id: userId,
                    organization_name: data.organizationName,
                    organization_type: data.organizationType,
                    gst_number: data.gstNumber,
                    pan_number: data.panNumber,
                    cin_number: data.cinNumber,
                    number_of_stores: data.numberOfStores || 1,
                    website: data.website,
                    address_line1: data.addressLine1,
                    address_line2: data.addressLine2,
                    state: data.state,
                    city: data.city,
                    pincode: data.pincode,
                    retail_categories: data.retailCategories || [],
                    contact_person_name: data.contactPersonName,
                    contact_person_designation: data.contactPersonDesignation,
                    contact_person_email: data.contactPersonEmail,
                    contact_person_phone: data.contactPersonPhone,
                    subscription_status: "pending",
                  });

                if (emplrError) {
                  console.error("Error creating employer profile:", emplrError);
                } else {
                  // Clear pending data
                  localStorage.removeItem(`pending_employer_profile_${userId}`);
                  
                  // Handle referral reward if there's a referral code
                  if (data.referralCode) {
                    await handleReferralReward(userId, data.referralCode);
                  }
                }
              } catch (e) {
                console.error("Error parsing pending employer data:", e);
              }
            }
            
            toast({
              title: "Welcome to RetailHire! 🎉",
              description: "Your company account has been verified.",
            });
            navigate("/employer/dashboard");
            
          } else {
            navigate("/");
          }
        } else {
          navigate("/login");
        }
      } catch (err) {
        console.error("Callback error:", err);
        navigate("/login?error=callback_failed");
      }
    };

    handleCallback();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">{status}</p>
      </div>
    </div>
  );
};

// Calculate profile completion percentage
function calculateEmployeeCompletion(data: any): number {
  let score = 0;
  const fields = [
    data.fullName,
    data.phone,
    data.dateOfBirth,
    data.gender,
    data.addressLine1,
    data.state,
    data.city,
    data.educationLevel,
    data.skills?.length > 0,
    data.retailCategories?.length > 0,
    data.preferredWorkCities?.length > 0,
  ];
  
  fields.forEach(f => {
    if (f) score += 9;
  });
  
  return Math.min(score, 100);
}

// Handle referral reward
async function handleReferralReward(newUserId: string, referralCode: string) {
  try {
    // Find the referrer by their referral code
    const { data: referrer } = await supabase
      .from("profiles")
      .select("id")
      .eq("referral_code", referralCode)
      .maybeSingle();

    if (referrer) {
      // Create referral reward record
      await supabase.from("referral_rewards").insert({
        referrer_user_id: referrer.id,
        referred_user_id: newUserId,
        points_awarded: 15,
      });

      // Add points to referrer's reward_points
      const { data: rewards } = await supabase
        .from("reward_points")
        .select("id, points")
        .eq("user_id", referrer.id)
        .maybeSingle();

      if (rewards) {
        await supabase
          .from("reward_points")
          .update({ points: (rewards.points || 0) + 15 })
          .eq("id", rewards.id);
      }
    }
  } catch (err) {
    console.error("Error handling referral:", err);
  }
}

export default AuthCallback;
