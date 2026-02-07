import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Building2, Eye, EyeOff } from "lucide-react";

const Login = () => {
  const { type } = useParams<{ type?: string }>();
  const [activeTab, setActiveTab] = useState(type === "employer" ? "employer" : "employee");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login:", { type: activeTab, ...formData });
    // Handle login
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-12 flex items-center justify-center min-h-screen">
        <div className="container mx-auto px-4 max-w-md">
          <Card className="shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="font-display text-2xl">Welcome Back</CardTitle>
              <CardDescription>
                Login to access your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                      <Label htmlFor="username">Username or Email</Label>
                      <Input
                        id="username"
                        placeholder="Enter your username or email"
                        value={formData.username}
                        onChange={e => setFormData(prev => ({ ...prev, username: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={formData.password}
                          onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-end">
                      <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                        Forgot password?
                      </Link>
                    </div>

                    <Button type="submit" variant="hero" className="w-full">
                      Login as Employee
                    </Button>

                    <p className="text-center text-sm text-muted-foreground">
                      Don't have an account?{" "}
                      <Link to="/employee/register" className="text-primary hover:underline font-medium">
                        Register here
                      </Link>
                    </p>
                  </form>
                </TabsContent>

                <TabsContent value="employer">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username-emp">Username or Email</Label>
                      <Input
                        id="username-emp"
                        placeholder="Enter your username or email"
                        value={formData.username}
                        onChange={e => setFormData(prev => ({ ...prev, username: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password-emp">Password</Label>
                      <div className="relative">
                        <Input
                          id="password-emp"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={formData.password}
                          onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-end">
                      <Link to="/forgot-password" className="text-sm text-accent hover:underline">
                        Forgot password?
                      </Link>
                    </div>

                    <Button type="submit" variant="accent" className="w-full">
                      Login as Employer
                    </Button>

                    <p className="text-center text-sm text-muted-foreground">
                      Don't have an account?{" "}
                      <Link to="/employer/register" className="text-accent hover:underline font-medium">
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
