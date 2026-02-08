import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Briefcase,
  Award,
  Bell,
  Wallet,
  Edit,
  Star,
  BookOpen,
  Trophy,
  Gift,
  Clock,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  Loader2,
  Share2,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import SocialShareButtons from "@/components/shared/SocialShareButtons";
import { RETAIL_CATEGORIES } from "@/lib/constants";

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const { user, profile, employeeProfile, wallet, rewards, loading: authLoading } = useAuth();
  const [certifications, setCertifications] = useState<any[]>([]);
  const [gifts, setGifts] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch certification courses
      const { data: coursesData } = await supabase
        .from("certification_courses")
        .select("*")
        .eq("is_active", true)
        .limit(5);

      setCertifications(coursesData || []);

      // Fetch available gifts
      const { data: giftsData } = await supabase
        .from("gifts")
        .select("*")
        .eq("is_active", true)
        .order("points_required", { ascending: true });

      setGifts(giftsData || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const getStatusBadge = () => {
    const status = employeeProfile?.employmentStatus || "available";
    switch (status) {
      case "available":
        return <Badge className="bg-success text-success-foreground">Available</Badge>;
      case "reserved":
        return <Badge className="bg-warning text-warning-foreground">Reserved</Badge>;
      case "employed":
        return <Badge className="bg-primary text-primary-foreground">Employed</Badge>;
      default:
        return null;
    }
  };

  const getRetailCategoryLabels = (categories: string[]) => {
    return categories
      .map((cat) => RETAIL_CATEGORIES.find((c) => c.value === cat)?.label || cat)
      .join(", ");
  };

  if (authLoading || loadingData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-24 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const notifications = [
    { id: 1, message: "Your profile was viewed by a potential employer", time: "2 hours ago", type: "view" },
    { id: 2, message: "Complete your profile to get 3x more views", time: "1 day ago", type: "tip" },
    { id: 3, message: "New certification course available: Advanced POS", time: "2 days ago", type: "course" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
              Welcome back, {employeeProfile?.fullName?.split(" ")[0] || "User"}! 👋
            </h1>
            <p className="text-muted-foreground">Manage your profile and track your job opportunities</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Profile Card */}
            <div className="lg:col-span-1 space-y-6">
              {/* Profile Card */}
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    {employeeProfile?.photoUrl ? (
                      <img
                        src={employeeProfile.photoUrl}
                        alt="Profile"
                        className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <User className="w-12 h-12 text-primary" />
                      </div>
                    )}
                    <h2 className="font-display font-semibold text-xl text-foreground mb-1">
                      {employeeProfile?.fullName || "Complete Your Profile"}
                    </h2>
                    <div className="mb-4">{getStatusBadge()}</div>

                    <div className="space-y-2 text-sm text-left mb-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        {profile?.phone || "Add phone number"}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        {profile?.email || "Add email"}
                      </div>
                    </div>

                    <Button variant="outline" className="w-full" asChild>
                      <Link to="/employee/profile/edit">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Profile Completion */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Profile Completion</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold text-foreground">
                      {employeeProfile?.profileCompletionPercent || 20}%
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {(employeeProfile?.profileCompletionPercent || 0) < 50
                        ? "Let's improve!"
                        : "Almost there!"}
                    </span>
                  </div>
                  <Progress value={employeeProfile?.profileCompletionPercent || 20} className="h-2 mb-2" />
                  <p className="text-xs text-muted-foreground">Complete your profile to get more visibility</p>
                </CardContent>
              </Card>

              {/* Points & Wallet */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Rewards</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-accent/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-accent" />
                      <span className="font-medium">Points</span>
                    </div>
                    <span className="text-xl font-bold text-accent">{rewards?.points || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-primary" />
                      <span className="font-medium">Wallet</span>
                    </div>
                    <span className="text-xl font-bold text-primary">₹{wallet?.balance || 0}</span>
                  </div>
                  <Button variant="outline" className="w-full" size="sm" asChild>
                    <Link to="/rewards">
                      <Gift className="w-4 h-4 mr-2" />
                      View Rewards
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Social Share */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Share2 className="w-4 h-4" />
                    Share & Earn
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SocialShareButtons userType="employee" referralCode={profile?.referralCode} />
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4 pb-4 text-center">
                    <div className="text-2xl font-bold text-foreground">0</div>
                    <p className="text-xs text-muted-foreground">Profile Views</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4 text-center">
                    <div className="text-2xl font-bold text-foreground">0</div>
                    <p className="text-xs text-muted-foreground">Certifications</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4 text-center">
                    <div className="text-2xl font-bold text-foreground">0</div>
                    <p className="text-xs text-muted-foreground">Tests Taken</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4 text-center">
                    <div className="text-2xl font-bold text-foreground">{rewards?.points || 0}</div>
                    <p className="text-xs text-muted-foreground">Points Earned</p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="grid md:grid-cols-2 gap-4">
                <Button variant="hero" size="lg" asChild>
                  <Link to="/available-tests">
                    <BookOpen className="w-5 h-5 mr-2" />
                    Browse Skill Tests
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/certifications">
                    <Award className="w-5 h-5 mr-2" />
                    Get Certified
                  </Link>
                </Button>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="notifications" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="notifications">
                    <Bell className="w-4 h-4 mr-2" />
                    Notifications
                  </TabsTrigger>
                  <TabsTrigger value="certifications">
                    <Award className="w-4 h-4 mr-2" />
                    Certifications
                  </TabsTrigger>
                  <TabsTrigger value="rewards">
                    <Gift className="w-4 h-4 mr-2" />
                    Rewards
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="notifications" className="mt-4">
                  <Card>
                    <CardContent className="pt-6">
                      {notifications.length > 0 ? (
                        <div className="space-y-4">
                          {notifications.map((notif) => (
                            <div
                              key={notif.id}
                              className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                            >
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Bell className="w-4 h-4 text-primary" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm text-foreground">{notif.message}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  <Clock className="w-3 h-3 inline mr-1" />
                                  {notif.time}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">No new notifications</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="certifications" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Available Certifications</CardTitle>
                      <CardDescription>Complete certifications to boost your profile (₹50 per course)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {certifications.length > 0 ? (
                          certifications.map((cert) => (
                            <div
                              key={cert.id}
                              className="flex items-center justify-between p-4 border border-border rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <BookOpen className="w-5 h-5 text-muted-foreground" />
                                <div>
                                  <p className="font-medium text-foreground">{cert.title}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {cert.duration_hours} hours • Earn {cert.passing_score} points
                                  </p>
                                </div>
                              </div>
                              <Button size="sm" asChild>
                                <Link to={`/certifications/${cert.id}`}>Start Course</Link>
                              </Button>
                            </div>
                          ))
                        ) : (
                          <p className="text-center text-muted-foreground py-4">
                            No courses available yet
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="rewards" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Redeem Your Points</CardTitle>
                      <CardDescription>
                        You have <strong>{rewards?.points || 0} points</strong> available
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {gifts.length > 0 ? (
                          gifts.map((gift) => (
                            <div
                              key={gift.id}
                              className="flex items-center justify-between p-4 border border-border rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <Gift className="w-5 h-5 text-accent" />
                                <div>
                                  <p className="font-medium text-foreground">{gift.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {gift.points_required} points required
                                  </p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant={
                                  (rewards?.points || 0) >= gift.points_required ? "default" : "outline"
                                }
                                disabled={(rewards?.points || 0) < gift.points_required}
                              >
                                {(rewards?.points || 0) >= gift.points_required ? "Redeem" : "Locked"}
                              </Button>
                            </div>
                          ))
                        ) : (
                          <p className="text-center text-muted-foreground py-4">
                            No rewards available yet
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmployeeDashboard;
