import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Building2, Users, Search, FileText, Wallet, Edit, Plus,
  UserCheck, UserX, Clock, Star, MapPin, Phone, Mail,
  Calendar, ArrowRight, Eye, Loader2, Share2, Briefcase,
  GraduationCap, Shield, AlertTriangle, LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import SocialShareButtons from "@/components/shared/SocialShareButtons";
import { RETAIL_CATEGORIES } from "@/lib/constants";
import { MessageSquare } from "lucide-react";
import { ChatWidget } from "@/components/chat/ChatWidget";

const EmployerDashboard = () => {
  const navigate = useNavigate();
  const { user, profile, employerProfile, wallet, loading: authLoading, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [reservedCandidates, setReservedCandidates] = useState<any[]>([]);
  const [hiredCandidates, setHiredCandidates] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [showRateDialog, setShowRateDialog] = useState(false);
  const [ratingTarget, setRatingTarget] = useState<any>(null);
  const [ratingValue, setRatingValue] = useState("3");
  const [ratingComment, setRatingComment] = useState("");

  const [showBlacklistDialog, setShowBlacklistDialog] = useState(false);
  const [blacklistTarget, setBlacklistTarget] = useState<any>(null);
  const [blacklistReason, setBlacklistReason] = useState("");

  const [activeChat, setActiveChat] = useState<{ roomId: string; recipientName: string; warningMessage: string; } | null>(null);

  useEffect(() => {
    if (user && employerProfile) {
      fetchDashboardData();
    }
  }, [user, employerProfile]);

  const fetchDashboardData = async () => {
    if (!employerProfile) return;
    try {
      // First check and expire old reservations
      await checkExpiredReservations();

      const [resRes, hiredRes, testsRes] = await Promise.all([
        supabase.from("candidate_reservations")
          .select("*, employee_profiles(*)")
          .eq("employer_id", employerProfile.id)
          .eq("status", "pending")
          .order("created_at", { ascending: false }),
        supabase.from("hired_candidates")
          .select("*, employee_profiles(*)")
          .eq("employer_id", employerProfile.id)
          .order("hired_date", { ascending: false }),
        supabase.from("skill_tests")
          .select("*")
          .eq("employer_id", employerProfile.id)
          .order("created_at", { ascending: false }),
      ]);

      // For reserved candidates, fetch their profile contact info
      const reserved = resRes.data || [];
      const enrichedReserved = await enrichWithContactInfo(reserved);

      const hired = hiredRes.data || [];
      const enrichedHired = await enrichWithContactInfo(hired);

      setReservedCandidates(enrichedReserved);
      setHiredCandidates(enrichedHired);
      setTests(testsRes.data || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const checkExpiredReservations = async () => {
    if (!employerProfile) return;
    // Check for expired reservations and update them
    const { data: expired } = await supabase
      .from("candidate_reservations")
      .select("id, employee_id")
      .eq("employer_id", employerProfile.id)
      .eq("status", "pending")
      .lt("expires_at", new Date().toISOString());

    if (expired && expired.length > 0) {
      for (const res of expired) {
        await supabase.from("candidate_reservations")
          .update({ status: "expired" })
          .eq("id", res.id);
        // Employee status reset to available is done by DB trigger on reservation status update
      }
    }
  };

  const enrichWithContactInfo = async (items: any[]) => {
    if (items.length === 0) return items;
    const userIds = items
      .map(i => i.employee_profiles?.user_id)
      .filter(Boolean);

    if (userIds.length === 0) return items;

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, phone")
      .in("id", userIds);

    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    return items.map(item => ({
      ...item,
      _contactInfo: profileMap.get(item.employee_profiles?.user_id) || null,
    }));
  };

  const handleHireDecision = async (reservation: any, hired: boolean) => {
    if (!user || !employerProfile) return;
    try {
      const empProfile = reservation.employee_profiles;

      await supabase.from("candidate_reservations").update({
        status: hired ? "hired" : "not_hired",
        hired_at: hired ? new Date().toISOString() : null,
        refund_amount: hired ? 0 : 200,
        refunded_at: hired ? null : new Date().toISOString(),
      }).eq("id", reservation.id);

      if (hired) {
        await supabase.from("hired_candidates").insert({
          employer_id: employerProfile.id,
          employee_id: reservation.employee_id,
          reservation_id: reservation.id,
          hired_date: new Date().toISOString().split("T")[0],
          status: "active",
        });
        // Employee status set to employed by DB trigger on hired_candidates insert

        // Notify employee
        if (empProfile?.user_id) {
          await supabase.from("notifications").insert({
            user_id: empProfile.user_id,
            title: "🎉 You've been hired!",
            message: `${employerProfile.organizationName} has hired you. Congratulations!`,
            type: "hired",
            reference_id: reservation.id,
            reference_type: "reservation",
          });
        }

        toast({ title: "Candidate Hired! 🎉", description: `${empProfile?.full_name} has been marked as hired.` });
      } else {
        const newBalance = (wallet?.balance || 0) + 200;
        await supabase.from("wallets").update({ balance: newBalance }).eq("user_id", user.id);

        const { data: walletData } = await supabase.from("wallets").select("id").eq("user_id", user.id).single();
        if (walletData) {
          await supabase.from("wallet_transactions").insert({
            wallet_id: walletData.id,
            amount: 200,
            transaction_type: "refund" as const,
            description: "Refund for not hiring candidate",
            reference_id: reservation.id,
            reference_type: "reservation_refund",
          });
        }

        // Employee status set back to available by DB trigger on candidate_reservations update to not_hired

        // Notify employee
        if (empProfile?.user_id) {
          await supabase.from("notifications").insert({
            user_id: empProfile.user_id,
            title: "Reservation Update",
            message: `${employerProfile.organizationName} has decided not to proceed. You are now available for other opportunities.`,
            type: "not_hired",
            reference_id: reservation.id,
            reference_type: "reservation",
          });
        }

        toast({ title: "Candidate Released", description: "₹200 refund added to your wallet. Candidate is now available again." });
      }

      await refreshProfile();
      fetchDashboardData();
    } catch (error: any) {
      console.error("Error:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleRelease = async (hired: any) => {
    try {
      // Update hired record (DB trigger will set employee back to available)
      await supabase.from("hired_candidates")
        .update({ status: "released", released_at: new Date().toISOString() })
        .eq("id", hired.id);

      // Notify employee
      if (hired.employee_profiles?.user_id) {
        await supabase.from("notifications").insert({
          user_id: hired.employee_profiles.user_id,
          title: "You've been released",
          message: `${employerProfile?.organizationName} has released you. You are now available for new opportunities.`,
          type: "released",
          reference_type: "hired",
        });
      }

      toast({ title: "Employee Released", description: "The employee is now available for other opportunities." });
      fetchDashboardData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleRate = async () => {
    if (!ratingTarget) return;
    try {
      await supabase.from("hired_candidates").update({
        rating: parseInt(ratingValue),
        rating_comment: ratingComment,
      }).eq("id", ratingTarget.id);

      if (ratingTarget.employee_profiles?.user_id) {
        await supabase.from("notifications").insert({
          user_id: ratingTarget.employee_profiles.user_id,
          title: `⭐ You received a ${ratingValue}-star rating!`,
          message: `${employerProfile?.organizationName} rated you ${ratingValue}/5.${ratingComment ? ` Comment: "${ratingComment}"` : ""}`,
          type: "rating",
          reference_type: "hired",
        });
      }

      toast({ title: "Rating Saved!", description: "Thank you for your feedback." });
      setShowRateDialog(false);
      setRatingComment("");
      fetchDashboardData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleBlacklist = async () => {
    if (!blacklistTarget) return;
    try {
      await supabase.from("hired_candidates").update({
        is_blacklisted: true,
        blacklist_reason: blacklistReason,
      }).eq("id", blacklistTarget.id);

      await supabase.from("employee_profiles").update({
        is_blacklisted: true,
      }).eq("id", blacklistTarget.employee_id);

      if (blacklistTarget.employee_profiles?.user_id) {
        await supabase.from("notifications").insert({
          user_id: blacklistTarget.employee_profiles.user_id,
          title: "⚠️ Account Flagged",
          message: "Your account has been flagged by an employer. Please contact support for details.",
          type: "blacklist",
          reference_type: "hired",
        });
      }

      toast({ title: "Candidate Blacklisted", description: "This candidate will no longer appear in searches." });
      setShowBlacklistDialog(false);
      setBlacklistReason("");
      fetchDashboardData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const getCategoryLabel = (val: string) => RETAIL_CATEGORIES.find(c => c.value === val)?.label || val;

  if (authLoading || loadingData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-24 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
      </div>
    );
  }

  const stats = {
    reserved: reservedCandidates.length,
    hired: hiredCandidates.filter(h => h.status === "active").length,
    released: hiredCandidates.filter(h => h.status === "released").length,
    testsCreated: tests.length,
    activeTests: tests.filter(t => t.status === "published").length,
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">Welcome back! 👋</h1>
              <p className="text-muted-foreground">Manage your hiring and find the perfect candidates</p>
            </div>
            <Button variant="hero" size="lg" asChild>
              <Link to="/employer/find-candidates"><Search className="w-5 h-5 mr-2" />Find Candidates</Link>
            </Button>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                      <Building2 className="w-10 h-10 text-accent" />
                    </div>
                    <h2 className="font-display font-semibold text-xl text-foreground mb-1">{employerProfile?.organizationName || "Complete Profile"}</h2>
                    <Badge variant="outline" className="mb-4">{employerProfile?.subscriptionStatus || "Pending"}</Badge>
                    <div className="space-y-2 text-sm text-left mb-4">
                      <div className="flex items-center gap-2 text-muted-foreground"><Phone className="w-4 h-4" />{profile?.phone || "Add phone"}</div>
                      <div className="flex items-center gap-2 text-muted-foreground"><Mail className="w-4 h-4" />{profile?.email || "Add email"}</div>
                    </div>
                    <Button variant="outline" className="w-full" asChild>
                      <Link to="/employer/profile/edit"><Edit className="w-4 h-4 mr-2" />Edit Profile</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-accent/5 border-accent/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2"><Wallet className="w-4 h-4 text-accent" />Wallet Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-accent mb-4">₹{(wallet?.balance || 0).toLocaleString()}</div>
                  <Button variant="accent" className="w-full"><Plus className="w-4 h-4 mr-2" />Add Money</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Quick Actions</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to="/employer/tests/create"><FileText className="w-4 h-4 mr-2" />Create Skill Test</Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to="/employer/tests"><Eye className="w-4 h-4 mr-2" />View Tests & Results</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2"><Share2 className="w-4 h-4" />Share & Attract</CardTitle>
                </CardHeader>
                <CardContent>
                  <SocialShareButtons userType="employer" referralCode={profile?.referralCode} />
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-warning/5 border-warning/20">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center"><Clock className="w-5 h-5 text-warning" /></div>
                      <div><div className="text-2xl font-bold">{stats.reserved}</div><p className="text-xs text-muted-foreground">Reserved</p></div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-success/5 border-success/20">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center"><UserCheck className="w-5 h-5 text-success" /></div>
                      <div><div className="text-2xl font-bold">{stats.hired}</div><p className="text-xs text-muted-foreground">Hired</p></div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><FileText className="w-5 h-5 text-primary" /></div>
                      <div><div className="text-2xl font-bold">{stats.testsCreated}</div><p className="text-xs text-muted-foreground">Tests</p></div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center"><Users className="w-5 h-5 text-accent" /></div>
                      <div><div className="text-2xl font-bold">{stats.released}</div><p className="text-xs text-muted-foreground">Released</p></div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="reserved" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="reserved"><Clock className="w-4 h-4 mr-2" />Reserved ({stats.reserved})</TabsTrigger>
                  <TabsTrigger value="hired"><UserCheck className="w-4 h-4 mr-2" />Hired ({stats.hired})</TabsTrigger>
                </TabsList>

                {/* Reserved Tab */}
                <TabsContent value="reserved" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Reserved Candidates</CardTitle>
                      <CardDescription>Full candidate details. Update hiring status within 5 days.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {reservedCandidates.length > 0 ? (
                        <div className="space-y-6">
                          {reservedCandidates.map((reservation) => {
                            const emp = reservation.employee_profiles;
                            const contact = reservation._contactInfo;
                            const daysLeft = reservation.expires_at
                              ? Math.max(0, Math.ceil((new Date(reservation.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                              : 5;

                            return (
                              <div key={reservation.id} className="p-4 border border-border rounded-lg space-y-4">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                  <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-semibold text-lg text-foreground">{emp?.full_name || "Candidate"}</span>
                                      <Badge variant="outline" className="text-warning border-warning">
                                        <Clock className="w-3 h-3 mr-1" />{daysLeft} days left
                                      </Badge>
                                      {emp?.aadhar_number && <Badge variant="secondary"><Shield className="w-3 h-3 mr-1" />Aadhar Verified</Badge>}
                                      {emp?.pan_number && <Badge variant="secondary"><Shield className="w-3 h-3 mr-1" />PAN Verified</Badge>}
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-2 text-sm">
                                      <div className="flex items-center gap-2 text-muted-foreground">
                                        <Phone className="w-4 h-4" />{contact?.phone || "N/A"}
                                      </div>
                                      <div className="flex items-center gap-2 text-muted-foreground">
                                        <Mail className="w-4 h-4" />{contact?.email || "N/A"}
                                      </div>
                                      <div className="flex items-center gap-2 text-muted-foreground">
                                        <MapPin className="w-4 h-4" />
                                        {emp?.city}, {emp?.state}
                                      </div>
                                      <div className="flex items-center gap-2 text-muted-foreground">
                                        <Briefcase className="w-4 h-4" />{emp?.years_of_experience || 0} years exp
                                      </div>
                                      <div className="flex items-center gap-2 text-muted-foreground">
                                        <GraduationCap className="w-4 h-4" />
                                        {emp?.education_level || "N/A"}{emp?.education_grade ? ` (${emp.education_grade})` : ""} - {emp?.education_details || ""}
                                      </div>
                                      <div className="flex items-center gap-2 text-muted-foreground">
                                        <Building2 className="w-4 h-4" />{emp?.current_organization || "No current org"}
                                      </div>
                                    </div>

                                    {/* Skills */}
                                    {emp?.skills && (emp.skills as string[]).length > 0 && (
                                      <div className="flex flex-wrap gap-1">
                                        {(emp.skills as string[]).map((skill: string, i: number) => (
                                          <Badge key={i} variant="secondary" className="text-xs">{skill}</Badge>
                                        ))}
                                      </div>
                                    )}

                                    {/* Retail Categories */}
                                    {emp?.retail_categories && (emp.retail_categories as string[]).length > 0 && (
                                      <div className="flex flex-wrap gap-1">
                                        {(emp.retail_categories as string[]).map((cat: string, i: number) => (
                                          <Badge key={i} variant="default" className="text-xs">{getCategoryLabel(cat)}</Badge>
                                        ))}
                                      </div>
                                    )}

                                    {/* Resume link */}
                                    {emp?.resume_url && (
                                      <a href={emp.resume_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                                        <FileText className="w-4 h-4" />View Resume/CV
                                      </a>
                                    )}
                                  </div>

                                  <div className="flex flex-col gap-2 min-w-[140px]">
                                    <Button variant="default" size="sm" onClick={() => handleHireDecision(reservation, true)}>
                                      <UserCheck className="w-4 h-4 mr-1" />Hired
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => handleHireDecision(reservation, false)}>
                                      <UserX className="w-4 h-4 mr-1" />Not Hired
                                    </Button>
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => setActiveChat({
                                        roomId: reservation.id,
                                        recipientName: emp?.full_name || "Candidate",
                                        warningMessage: "Chat is active for 5 days or until hiring decision."
                                      })}
                                    >
                                      <MessageSquare className="w-4 h-4 mr-1" />Chat
                                    </Button>
                                    <p className="text-xs text-muted-foreground text-center">₹200 refund if not hired</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground mb-4">No reserved candidates</p>
                          <Button variant="gradient" asChild>
                            <Link to="/employer/find-candidates">Find Candidates<ArrowRight className="w-4 h-4 ml-2" /></Link>
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Hired Tab */}
                <TabsContent value="hired" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Hired Candidates</CardTitle>
                      <CardDescription>Manage your team, rate employees, and track performance</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {hiredCandidates.length > 0 ? (
                        <div className="space-y-6">
                          {hiredCandidates.map((hired) => {
                            const emp = hired.employee_profiles;
                            const contact = hired._contactInfo;
                            const isActive = hired.status === "active";
                            return (
                              <div key={hired.id} className="p-4 border border-border rounded-lg space-y-3">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                  <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-semibold text-lg text-foreground">{emp?.full_name || "Employee"}</span>
                                      {isActive ? (
                                        <Badge className="bg-success text-success-foreground"><UserCheck className="w-3 h-3 mr-1" />Active</Badge>
                                      ) : (
                                        <Badge variant="outline"><LogOut className="w-3 h-3 mr-1" />Released</Badge>
                                      )}
                                      {hired.rating && (
                                        <div className="flex items-center gap-1">
                                          {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`w-3 h-3 ${i < hired.rating ? "text-warning fill-warning" : "text-muted-foreground"}`} />
                                          ))}
                                        </div>
                                      )}
                                      {hired.is_blacklisted && <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Blacklisted</Badge>}
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-2 text-sm">
                                      <div className="flex items-center gap-2 text-muted-foreground">
                                        <Phone className="w-4 h-4" />{contact?.phone || "N/A"}
                                      </div>
                                      <div className="flex items-center gap-2 text-muted-foreground">
                                        <Mail className="w-4 h-4" />{contact?.email || "N/A"}
                                      </div>
                                      <div className="flex items-center gap-2 text-muted-foreground">
                                        <MapPin className="w-4 h-4" />{emp?.city}, {emp?.state}
                                      </div>
                                      <div className="flex items-center gap-2 text-muted-foreground">
                                        <Briefcase className="w-4 h-4" />{emp?.years_of_experience || 0} years exp
                                      </div>
                                      <div className="flex items-center gap-2 text-muted-foreground">
                                        <Calendar className="w-4 h-4" />Hired on {new Date(hired.hired_date || hired.created_at).toLocaleDateString()}
                                      </div>
                                      <div className="flex items-center gap-2 text-muted-foreground">
                                        <GraduationCap className="w-4 h-4" />{emp?.education_level || "N/A"}{emp?.education_grade ? ` (${emp.education_grade})` : ""}
                                      </div>
                                    </div>

                                    {emp?.skills && (emp.skills as string[]).length > 0 && (
                                      <div className="flex flex-wrap gap-1">
                                        {(emp.skills as string[]).map((skill: string, i: number) => (
                                          <Badge key={i} variant="secondary" className="text-xs">{skill}</Badge>
                                        ))}
                                      </div>
                                    )}

                                    {emp?.retail_categories && (emp.retail_categories as string[]).length > 0 && (
                                      <div className="flex flex-wrap gap-1">
                                        {(emp.retail_categories as string[]).map((cat: string, i: number) => (
                                          <Badge key={i} variant="default" className="text-xs">{getCategoryLabel(cat)}</Badge>
                                        ))}
                                      </div>
                                    )}

                                    {emp?.resume_url && (
                                      <a href={emp.resume_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                                        <FileText className="w-4 h-4" />View Resume/CV
                                      </a>
                                    )}

                                    {hired.rating_comment && (
                                      <p className="text-sm text-muted-foreground italic">"{hired.rating_comment}"</p>
                                    )}
                                  </div>

                                  <div className="flex flex-col gap-2 min-w-[120px]">
                                    {!hired.rating && (
                                      <Button variant="outline" size="sm" onClick={() => { setRatingTarget(hired); setShowRateDialog(true); }}>
                                        <Star className="w-4 h-4 mr-1" />Rate
                                      </Button>
                                    )}
                                    {isActive && (
                                      <div className="flex flex-col gap-0.5">
                                        <Button variant="outline" size="sm" onClick={() => handleRelease(hired)}>
                                          <LogOut className="w-4 h-4 mr-1" />Release
                                        </Button>
                                        <span className="text-xs text-muted-foreground">Release from job (candidate becomes available in Find Candidates again)</span>
                                      </div>
                                    )}
                                    {!hired.is_blacklisted && (
                                      <Button variant="destructive" size="sm" onClick={() => { setBlacklistTarget(hired); setShowBlacklistDialog(true); }}>
                                        <AlertTriangle className="w-4 h-4 mr-1" />Blacklist
                                      </Button>
                                    )}
                                    {isActive && (
                                      <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setActiveChat({
                                          roomId: hired.reservation_id,
                                          recipientName: emp?.full_name || "Employee",
                                          warningMessage: "Chat will disappear if employee is released."
                                        })}
                                      >
                                        <MessageSquare className="w-4 h-4 mr-1" />Chat
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No hired candidates yet</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>

      {/* Rate Dialog */}
      <Dialog open={showRateDialog} onOpenChange={setShowRateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate Candidate</DialogTitle>
            <DialogDescription>How would you rate {ratingTarget?.employee_profiles?.full_name}?</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rating</Label>
              <Select value={ratingValue} onValueChange={setRatingValue}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">⭐ 1 - Poor</SelectItem>
                  <SelectItem value="2">⭐⭐ 2 - Below Average</SelectItem>
                  <SelectItem value="3">⭐⭐⭐ 3 - Average</SelectItem>
                  <SelectItem value="4">⭐⭐⭐⭐ 4 - Good</SelectItem>
                  <SelectItem value="5">⭐⭐⭐⭐⭐ 5 - Excellent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Comment (optional)</Label>
              <Textarea placeholder="Share your experience..." value={ratingComment} onChange={e => setRatingComment(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRateDialog(false)}>Cancel</Button>
            <Button onClick={handleRate}>Submit Rating</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Blacklist Dialog */}
      <Dialog open={showBlacklistDialog} onOpenChange={setShowBlacklistDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Blacklist Candidate</DialogTitle>
            <DialogDescription>This will prevent {blacklistTarget?.employee_profiles?.full_name} from appearing in future searches.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reason *</Label>
              <Textarea placeholder="Why are you blacklisting this candidate?" value={blacklistReason} onChange={e => setBlacklistReason(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBlacklistDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleBlacklist} disabled={!blacklistReason.trim()}>Confirm Blacklist</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Chat Widget */}
      {activeChat && (
        <ChatWidget
          isOpen={!!activeChat}
          onClose={() => setActiveChat(null)}
          roomId={activeChat.roomId}
          recipientName={activeChat.recipientName}
          senderId={user?.id || ""}
          senderName={employerProfile?.organizationName || "Employer"}
          warningMessage={activeChat.warningMessage}
        />
      )}
    </div>
  );
};

export default EmployerDashboard;
