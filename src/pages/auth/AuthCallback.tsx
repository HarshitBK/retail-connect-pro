import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Auth callback error:", error);
        navigate("/login?error=callback_failed");
        return;
      }

      if (session) {
        // Check user type and redirect accordingly
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_type")
          .eq("id", session.user.id)
          .maybeSingle();

        if (profile?.user_type === "employee") {
          navigate("/employee/dashboard");
        } else if (profile?.user_type === "employer") {
          navigate("/employer/dashboard");
        } else {
          navigate("/");
        }
      } else {
        navigate("/login");
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Verifying your account...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
