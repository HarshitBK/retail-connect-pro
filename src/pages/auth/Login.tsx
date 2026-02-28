import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Building2, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const navigate = useNavigate();
  const { signIn, signOut } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"employee" | "employer">("employee");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    identifier: "", // Can be email or username
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.identifier.trim()) {
      newErrors.identifier = "Email or username is required";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      // Determine if input is email or username
      const isEmail = formData.identifier.includes("@");
      let email = formData.identifier;

      // If it's a username, look up the email from profiles table
      if (!isEmail) {
        const { data: profileData, error: lookupError } = await supabase
          .from("profiles")
          .select("email, user_type")
          .eq("username", formData.identifier)
          .maybeSingle();

        if (lookupError || !profileData) {
          toast({
            title: "Login Failed",
            description: "Username not found. Please check and try again.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        if (profileData.user_type !== activeTab) {
          toast({
            title: "Login Failed",
            description: "Invalid email/username or password",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        email = profileData.email;
      }

      const { error } = await signIn(email, formData.password);

      if (error) {
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Verify user type matches the active tab after successful login
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("email", email)
        .maybeSingle();

      if (profileError || !profile) {
        await signOut();
        toast({
          title: "Login Failed",
          description: "Could not retrieve user profile.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (profile.user_type !== activeTab) {
        await signOut();
        toast({
          title: "Login Failed",
          description: "Invalid email/username or password",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });

      const redirectPath = profile.user_type === "employer"
        ? "/employer/dashboard"
        : "/employee/dashboard";
      navigate(redirectPath);
    } catch (err: any) {
      toast({
        title: "Login Failed",
        description: err.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-12 flex items-center justify-center min-h-screen">
        <div className="container mx-auto px-4 max-w-md">
          <Card className="shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="font-display text-2xl">Welcome Back</CardTitle>
              <CardDescription>Login to access your account</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as "employee" | "employer")}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="employee" className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Employee
                  </TabsTrigger>
                  <TabsTrigger value="employer" className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Employer
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="employee">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="identifier">Email or Username</Label>
                      <Input
                        id="identifier"
                        type="text"
                        placeholder="Enter your email or username"
                        value={formData.identifier}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, identifier: e.target.value }))
                        }
                        className={errors.identifier ? "border-destructive" : ""}
                      />
                      {errors.identifier && (
                        <p className="text-sm text-destructive">{errors.identifier}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={formData.password}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, password: e.target.value }))
                          }
                          className={errors.password ? "border-destructive" : ""}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-sm text-destructive">{errors.password}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-end">
                      <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                        Forgot password?
                      </Link>
                    </div>

                    <Button type="submit" variant="hero" className="w-full" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Logging in...
                        </>
                      ) : (
                        "Login as Employee"
                      )}
                    </Button>

                    <p className="text-center text-sm text-muted-foreground">
                      Don't have an account?{" "}
                      <Link
                        to="/employee/register"
                        className="text-primary hover:underline font-medium"
                      >
                        Register here
                      </Link>
                    </p>
                  </form>
                </TabsContent>

                <TabsContent value="employer">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="identifier-emp">Email or Username</Label>
                      <Input
                        id="identifier-emp"
                        type="text"
                        placeholder="Enter your email or username"
                        value={formData.identifier}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, identifier: e.target.value }))
                        }
                        className={errors.identifier ? "border-destructive" : ""}
                      />
                      {errors.identifier && (
                        <p className="text-sm text-destructive">{errors.identifier}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password-emp">Password</Label>
                      <div className="relative">
                        <Input
                          id="password-emp"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={formData.password}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, password: e.target.value }))
                          }
                          className={errors.password ? "border-destructive" : ""}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-sm text-destructive">{errors.password}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-end">
                      <Link to="/forgot-password" className="text-sm text-accent hover:underline">
                        Forgot password?
                      </Link>
                    </div>

                    <Button type="submit" variant="accent" className="w-full" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Logging in...
                        </>
                      ) : (
                        "Login as Employer"
                      )}
                    </Button>

                    <p className="text-center text-sm text-muted-foreground">
                      Don't have an account?{" "}
                      <Link
                        to="/employer/register"
                        className="text-accent hover:underline font-medium"
                      >
                        Register here
                      </Link>
                    </p>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Login;
