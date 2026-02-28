import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User, Briefcase, Award, Bell, Wallet, Edit, Star,
  BookOpen, Trophy, Gift, Clock, CheckCircle2, MapPin,
  Phone, Mail, Loader2, Share2, ExternalLink, MessageSquare, Building2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import SocialShareButtons from "@/components/shared/SocialShareButtons";
import { RETAIL_CATEGORIES } from "@/lib/constants";
import { ChatWidget } from "@/components/chat/ChatWidget";

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const { user, profile, employeeProfile, wallet, rewards, loading: authLoading } = useAuth();
  const [certifications, setCertifications] = useState<any[]>([]);
  const [gifts, setGifts] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [testCount, setTestCount] = useState(0);
  const [certCount, setCertCount] = useState(0);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState<"notifications" | "certifications" | "rewards" | "jobs">("notifications");
  const [jobs, setJobs] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<{ roomId: string; recipientName: string; warningMessage: string; } | null>(null);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const [coursesRes, giftsRes, notifsRes, employeeId] = await Promise.all([
        supabase.from("certification_courses").select("*").eq("is_active", true).limit(5),
        supabase.from("gifts").select("*").eq("is_active", true).order("points_required", { ascending: true }),
        supabase.from("notifications").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(20),
        getEmployeeId(),
      ]);

      setCertifications(coursesRes.data || []);
      setGifts(giftsRes.data || []);
      setNotifications(notifsRes.data || []);

      // Fetch test attempts and cert enrollments count
      if (employeeId) {
        const [testsRes, certsRes, resRes, hiredRes] = await Promise.all([
          supabase.from("skill_test_attempts").select("id", { count: "exact" }).eq("employee_id", employeeId),
          supabase.from("course_enrollments").select("id", { count: "exact" }).eq("employee_id", employeeId).eq("status", "completed"),
          supabase.from("candidate_reservations").select("*, employer_profiles(*)").eq("employee_id", employeeId).in("status", ["pending"]),
          supabase.from("hired_candidates").select("*, employer_profiles(*)").eq("employee_id", employeeId).in("status", ["active"])
        ]);
        setTestCount(testsRes.count || 0);
        setCertCount(certsRes.count || 0);

        const allJobs = [
          ...(resRes.data || []).map(r => ({ ...r, type: 'reserved' })),
          ...(hiredRes.data || []).map(h => ({ ...h, type: 'hired' }))
        ];
        setJobs(allJobs);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const getEmployeeId = async (): Promise<string | null> => {
    if (!user) return null;
    const { data } = await supabase
      .from("employee_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    return data?.id || null;
  };

  const markNotificationRead = async (notifId: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", notifId);
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
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

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "hired": return <CheckCircle2 className="w-4 h-4 text-success" />;
      case "not_hired": return <Briefcase className="w-4 h-4 text-muted-foreground" />;
      case "reserved": return <Clock className="w-4 h-4 text-warning" />;
      case "rating": return <Star className="w-4 h-4 text-warning" />;
      case "welcome": return <Gift className="w-4 h-4 text-primary" />;
      case "points": return <Trophy className="w-4 h-4 text-accent" />;
      case "released": return <Briefcase className="w-4 h-4 text-muted-foreground" />;
      default: return <Bell className="w-4 h-4 text-primary" />;
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
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

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
              Welcome back, {employeeProfile?.fullName?.split(" ")[0] || "User"}! 👋
            </h1>
            <p className="text-muted-foreground">Manage your profile and track your job opportunities</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    {employeeProfile?.photoUrl ? (
                      <img src={employeeProfile.photoUrl} alt="Profile" className="w-24 h-24 rounded-full mx-auto mb-4 object-cover" />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <User className="w-12 h-12 text-primary" />
                      </div>
                    )}
                    <h2 className="font-display font-semibold text-xl text-foreground mb-1">{employeeProfile?.fullName || "Complete Your Profile"}</h2>
                    <div className="mb-4">{getStatusBadge()}</div>
                    <div className="space-y-2 text-sm text-left mb-4">
                      <div className="flex items-center gap-2 text-muted-foreground"><Phone className="w-4 h-4" />{profile?.phone || "Add phone number"}</div>
                      <div className="flex items-center gap-2 text-muted-foreground"><Mail className="w-4 h-4" />{profile?.email || "Add email"}</div>
                    </div>
                    <Button variant="outline" className="w-full" asChild>
                      <Link to="/employee/profile/edit"><Edit className="w-4 h-4 mr-2" />Edit Profile</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Profile Completion</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold text-foreground">{employeeProfile?.profileCompletionPercent || 20}%</span>
                    <span className="text-sm text-muted-foreground">{(employeeProfile?.profileCompletionPercent || 0) < 50 ? "Let's improve!" : "Almost there!"}</span>
                  </div>
                  <Progress value={employeeProfile?.profileCompletionPercent || 20} className="h-2 mb-2" />
                  <p className="text-xs text-muted-foreground">Complete your profile to get more visibility</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Rewards</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-accent/10 rounded-lg">
                    <div className="flex items-center gap-2"><Trophy className="w-5 h-5 text-accent" /><span className="font-medium">Points</span></div>
                    <span className="text-xl font-bold text-accent">{rewards?.points || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                    <div className="flex items-center gap-2"><Wallet className="w-5 h-5 text-primary" /><span className="font-medium">Wallet</span></div>
                    <span className="text-xl font-bold text-primary">₹{wallet?.balance || 0}</span>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    size="sm"
                    onClick={() => setActiveTab("rewards")}
                  >
                    <Gift className="w-4 h-4 mr-2" />
                    View Rewards
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2"><Share2 className="w-4 h-4" />Share & Earn</CardTitle>
                </CardHeader>
                <CardContent>
                  <SocialShareButtons userType="employee" referralCode={profile?.referralCode} />
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card><CardContent className="pt-4 pb-4 text-center"><div className="text-2xl font-bold text-foreground">{testCount}</div><p className="text-xs text-muted-foreground">Tests Taken</p></CardContent></Card>
                <Card><CardContent className="pt-4 pb-4 text-center"><div className="text-2xl font-bold text-foreground">{certCount}</div><p className="text-xs text-muted-foreground">Certifications</p></CardContent></Card>
                <Card><CardContent className="pt-4 pb-4 text-center"><div className="text-2xl font-bold text-foreground">{rewards?.points || 0}</div><p className="text-xs text-muted-foreground">Points</p></CardContent></Card>
                <Card><CardContent className="pt-4 pb-4 text-center"><div className="text-2xl font-bold text-foreground">{unreadCount}</div><p className="text-xs text-muted-foreground">Unread</p></CardContent></Card>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Button variant="hero" size="lg" asChild>
                  <Link to="/tests"><BookOpen className="w-5 h-5 mr-2" />Browse Skill Tests</Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/certifications"><Award className="w-5 h-5 mr-2" />Get Certified</Link>
                </Button>
              </div>

              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="notifications">
                    <Bell className="w-4 h-4 mr-2" />Notifications {unreadCount > 0 && `(${unreadCount})`}
                  </TabsTrigger>
                  <TabsTrigger value="jobs"><Briefcase className="w-4 h-4 mr-2" />My Jobs</TabsTrigger>
                  <TabsTrigger value="certifications"><Award className="w-4 h-4 mr-2" />Certifications</TabsTrigger>
                  <TabsTrigger value="rewards"><Gift className="w-4 h-4 mr-2" />Rewards</TabsTrigger>
                </TabsList>

                <TabsContent value="notifications" className="mt-4">
                  <Card>
                    <CardContent className="pt-6">
                      {notifications.length > 0 ? (
                        <div className="space-y-3">
                          {notifications.map(notif => (
                            <div
                              key={notif.id}
                              className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${notif.is_read ? "bg-muted/30" : "bg-primary/5 border border-primary/10"}`}
                              onClick={() => !notif.is_read && markNotificationRead(notif.id)}
                            >
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                {getNotifIcon(notif.type)}
                              </div>
                              <div className="flex-1">
                                <p className={`text-sm ${notif.is_read ? "text-muted-foreground" : "text-foreground font-medium"}`}>{notif.title}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                                <p className="text-xs text-muted-foreground mt-1"><Clock className="w-3 h-3 inline mr-1" />{formatTimeAgo(notif.created_at)}</p>
                              </div>
                              {!notif.is_read && <div className="w-2 h-2 rounded-full bg-primary mt-2" />}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">No notifications yet</p>
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
                        {certifications.length > 0 ? certifications.map(cert => (
                          <div key={cert.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                            <div className="flex items-center gap-3">
                              <BookOpen className="w-5 h-5 text-muted-foreground" />
                              <div>
                                <p className="font-medium text-foreground">{cert.title}</p>
                                <p className="text-xs text-muted-foreground">{cert.duration_hours} hours • Earn {cert.passing_score} points</p>
                              </div>
                            </div>
                            <Button size="sm" asChild><Link to={`/certifications/${cert.id}`}>Start Course</Link></Button>
                          </div>
                        )) : (
                          <p className="text-center text-muted-foreground py-4">No courses available yet</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="rewards" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Redeem Your Points</CardTitle>
                      <CardDescription>You have <strong>{rewards?.points || 0} points</strong> available</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {gifts.length > 0 ? gifts.map(gift => (
                          <div key={gift.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                            <div className="flex items-center gap-3">
                              <Gift className="w-5 h-5 text-accent" />
                              <div>
                                <p className="font-medium text-foreground">{gift.name}</p>
                                <p className="text-xs text-muted-foreground">{gift.points_required} points required</p>
                              </div>
                            </div>
                            <Button size="sm" variant={(rewards?.points || 0) >= gift.points_required ? "default" : "outline"} disabled={(rewards?.points || 0) < gift.points_required}>
                              {(rewards?.points || 0) >= gift.points_required ? "Redeem" : "Locked"}
                            </Button>
                          </div>
                        )) : (
                          <p className="text-center text-muted-foreground py-4">No rewards available yet</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="jobs" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">My Opportunities</CardTitle>
                      <CardDescription>View and manage your reserved and active job opportunities</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {jobs.length > 0 ? jobs.map(job => (
                          <div key={job.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-border rounded-lg gap-4">
                            <div className="flex items-start gap-3">
                              <Building2 className="w-5 h-5 text-muted-foreground mt-0.5" />
                              <div>
                                <p className="font-medium text-foreground">{job.employer_profiles?.organization_name || "Employer"}</p>
                                <div className="flex gap-2 items-center mt-1">
                                  {job.type === 'reserved' ? (
                                    <Badge className="bg-warning text-warning-foreground">Reserved</Badge>
                                  ) : (
                                    <Badge className="bg-success text-success-foreground">Hired</Badge>
                                  )}
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(job.created_at || job.hired_date).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="secondary"
                              onClick={() => setActiveChat({
                                roomId: job.reservation_id || job.id,
                                recipientName: job.employer_profiles?.organization_name || "Employer",
                                warningMessage: job.type === 'reserved' ? "Chat is active for 5 days or until hiring decision." : "Chat will disappear if you are released."
                              })}
                            >
                              <MessageSquare className="w-4 h-4 mr-2" />Chat
                            </Button>
                          </div>
                        )) : (
                          <p className="text-center text-muted-foreground py-8">No active opportunities yet</p>
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

      {/* Chat Widget */}
      {activeChat && (
        <ChatWidget
          isOpen={!!activeChat}
          onClose={() => setActiveChat(null)}
          roomId={activeChat.roomId}
          recipientName={activeChat.recipientName}
          senderId={user?.id || ""}
          senderName={employeeProfile?.fullName || "Employee"}
          warningMessage={activeChat.warningMessage}
        />
      )}
    </div>
  );
};

export default EmployeeDashboard;
