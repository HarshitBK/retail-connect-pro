import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Building2, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { emailSchema, passwordSchema } from "@/lib/validations";

const Signup = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"employee" | "employer">("employee");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    const emailResult = emailSchema.safeParse(formData.email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0]?.message || "Invalid email";
    }
    
    const passwordResult = passwordSchema.safeParse(formData.password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0]?.message || "Invalid password";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    const { error } = await signUp(formData.email, formData.password, activeTab);

    if (error) {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-12 flex items-center justify-center min-h-screen">
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="pt-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Check Your Email!</h2>
              <p className="text-muted-foreground mb-6">
                We've sent a verification link to <strong>{formData.email}</strong>. 
                Please click the link to verify your account.
              </p>
              <Button asChild variant="outline">
                <Link to="/login">Back to Login</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-12 flex items-center justify-center min-h-screen">
        <div className="container mx-auto px-4 max-w-md">
          <Card className="shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="font-display text-2xl">Create Account</CardTitle>
              <CardDescription>
                Join thousands of retail professionals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "employee" | "employer")} className="w-full">
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
                    <div className="p-3 bg-primary/10 rounded-lg text-sm text-primary mb-4">
                      <strong>Free Registration!</strong> Create your profile and get discovered by top employers.
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className={errors.email ? "border-destructive" : ""}
                      />
                      {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a strong password"
                          value={formData.password}
                          onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
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
                      {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                      <p className="text-xs text-muted-foreground">
                        Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          value={formData.confirmPassword}
                          onChange={e => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className={errors.confirmPassword ? "border-destructive" : ""}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                    </div>

                    <Button type="submit" variant="hero" className="w-full" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        "Create Employee Account"
                      )}
                    </Button>

                    <p className="text-center text-sm text-muted-foreground">
                      Already have an account?{" "}
                      <Link to="/login" className="text-primary hover:underline font-medium">
                        Login here
                      </Link>
                    </p>
                  </form>
                </TabsContent>

                <TabsContent value="employer">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="p-3 bg-accent/10 rounded-lg text-sm text-accent mb-4">
                      <strong>₹5,000/year</strong> for unlimited access to verified candidates.
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email-emp">Email</Label>
                      <Input
                        id="email-emp"
                        type="email"
                        placeholder="Enter your business email"
                        value={formData.email}
                        onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className={errors.email ? "border-destructive" : ""}
                      />
                      {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password-emp">Password</Label>
                      <div className="relative">
                        <Input
                          id="password-emp"
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a strong password"
                          value={formData.password}
                          onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
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
                      {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword-emp">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword-emp"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          value={formData.confirmPassword}
                          onChange={e => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className={errors.confirmPassword ? "border-destructive" : ""}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                    </div>

                    <Button type="submit" variant="accent" className="w-full" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        "Create Employer Account"
                      )}
                    </Button>

                    <p className="text-center text-sm text-muted-foreground">
                      Already have an account?{" "}
                      <Link to="/login" className="text-accent hover:underline font-medium">
                        Login here
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

export default Signup;
