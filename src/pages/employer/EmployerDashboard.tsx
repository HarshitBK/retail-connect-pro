import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  Users,
  Search,
  FileText,
  Wallet,
  Edit,
  Plus,
  UserCheck,
  UserX,
  Clock,
  Star,
  MapPin,
  Phone,
  Mail,
  Calendar,
  ArrowRight,
  Eye,
  Loader2,
  Share2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import SocialShareButtons from "@/components/shared/SocialShareButtons";

const EmployerDashboard = () => {
  const navigate = useNavigate();
  const { user, profile, employerProfile, wallet, loading: authLoading } = useAuth();
  const [reservedCandidates, setReservedCandidates] = useState<any[]>([]);
  const [hiredCandidates, setHiredCandidates] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (user && employerProfile) {
      fetchDashboardData();
    }
  }, [user, employerProfile]);

  const fetchDashboardData = async () => {
    if (!employerProfile) return;

    try {
      // Fetch reserved candidates
      const { data: reservationsData } = await supabase
        .from("candidate_reservations")
        .select("*, employee_profiles(*)")
        .eq("employer_id", employerProfile.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      setReservedCandidates(reservationsData || []);

      // Fetch hired candidates
      const { data: hiredData } = await supabase
        .from("hired_candidates")
        .select("*, employee_profiles(*)")
        .eq("employer_id", employerProfile.id)
        .order("hired_date", { ascending: false });

      setHiredCandidates(hiredData || []);

      // Fetch skill tests
      const { data: testsData } = await supabase
        .from("skill_tests")
        .select("*")
        .eq("employer_id", employerProfile.id)
        .order("created_at", { ascending: false });

      setTests(testsData || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleHireDecision = async (reservationId: string, hired: boolean) => {
    try {
      const { error } = await supabase
        .from("candidate_reservations")
        .update({
          status: hired ? "hired" : "not_hired",
          hired_at: hired ? new Date().toISOString() : null,
        })
        .eq("id", reservationId);

      if (!error) {
        fetchDashboardData();
      }
    } catch (error) {
      console.error("Error updating reservation:", error);
    }
  };

  if (authLoading || loadingData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-24 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </div>
    );
  }

  const stats = {
    reserved: reservedCandidates.length,
    hired: hiredCandidates.length,
    testsCreated: tests.length,
    activeTests: tests.filter((t) => t.status === "published").length,
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Welcome Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
                Welcome back! 👋
              </h1>
              <p className="text-muted-foreground">Manage your hiring and find the perfect candidates</p>
            </div>
            <Button variant="hero" size="lg" asChild>
              <Link to="/employer/find-candidates">
                <Search className="w-5 h-5 mr-2" />
                Find Candidates
              </Link>
            </Button>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Company Profile */}
            <div className="lg:col-span-1 space-y-6">
              {/* Company Card */}
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    {employerProfile?.logoUrl ? (
                      <img
                        src={employerProfile.logoUrl}
                        alt="Company Logo"
                        className="w-20 h-20 rounded-xl mx-auto mb-4 object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                        <Building2 className="w-10 h-10 text-accent" />
                      </div>
                    )}
                    <h2 className="font-display font-semibold text-xl text-foreground mb-1">
                      {employerProfile?.organizationName || "Complete Your Profile"}
                    </h2>
                    <Badge variant="outline" className="mb-4">
                      {employerProfile?.subscriptionStatus || "Pending"}
                    </Badge>

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
                      <Link to="/employer/profile/edit">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Wallet Card */}
              <Card className="bg-accent/5 border-accent/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-accent" />
                    Wallet Balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-accent mb-4">
                    ₹{(wallet?.balance || 0).toLocaleString()}
                  </div>
                  <Button variant="accent" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Money
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to="/employer/create-test">
                      <FileText className="w-4 h-4 mr-2" />
                      Create Skill Test
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to="/employer/tests">
                      <Eye className="w-4 h-4 mr-2" />
                      View Test Results
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Social Share */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Share2 className="w-4 h-4" />
                    Share & Attract Candidates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SocialShareButtons userType="employer" referralCode={profile?.referralCode} />
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-warning/5 border-warning/20">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-warning" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-foreground">{stats.reserved}</div>
                        <p className="text-xs text-muted-foreground">Reserved</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-success/5 border-success/20">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                        <UserCheck className="w-5 h-5 text-success" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-foreground">{stats.hired}</div>
                        <p className="text-xs text-muted-foreground">Hired</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-foreground">{stats.testsCreated}</div>
                        <p className="text-xs text-muted-foreground">Tests</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-foreground">0</div>
                        <p className="text-xs text-muted-foreground">Candidates</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="reserved" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="reserved">
                    <Clock className="w-4 h-4 mr-2" />
                    Reserved ({stats.reserved})
                  </TabsTrigger>
                  <TabsTrigger value="hired">
                    <UserCheck className="w-4 h-4 mr-2" />
                    Hired ({stats.hired})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="reserved" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Reserved Candidates</CardTitle>
                      <CardDescription>Update hiring status within the reservation period</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {reservedCandidates.length > 0 ? (
                        <div className="space-y-4">
                          {reservedCandidates.map((reservation) => (
                            <div
                              key={reservation.id}
                              className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-border rounded-lg gap-4"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-medium text-foreground">
                                    {reservation.employee_profiles?.full_name || `Candidate`}
                                  </span>
                                  <Badge variant="outline" className="text-warning border-warning">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {reservation.expires_at
                                      ? `Expires ${new Date(reservation.expires_at).toLocaleDateString()}`
                                      : "5 days"}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Reserved on {new Date(reservation.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="success"
                                  size="sm"
                                  onClick={() => handleHireDecision(reservation.id, true)}
                                >
                                  <UserCheck className="w-4 h-4 mr-1" />
                                  Hired
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleHireDecision(reservation.id, false)}
                                >
                                  <UserX className="w-4 h-4 mr-1" />
                                  Not Hired
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground mb-4">No reserved candidates</p>
                          <Button variant="gradient" asChild>
                            <Link to="/employer/find-candidates">
                              Find Candidates
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Link>
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="hired" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Hired Candidates</CardTitle>
                      <CardDescription>Manage your team and provide ratings</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {hiredCandidates.length > 0 ? (
                        <div className="space-y-4">
                          {hiredCandidates.map((hired) => (
                            <div
                              key={hired.id}
                              className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-border rounded-lg gap-4"
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                                  <UserCheck className="w-6 h-6 text-success" />
                                </div>
                                <div>
                                  <p className="font-medium text-foreground">
                                    {hired.employee_profiles?.full_name || "Employee"}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {hired.position || "Position"} • Hired on{" "}
                                    {new Date(hired.hired_date).toLocaleDateString()}
                                  </p>
                                  {hired.rating && (
                                    <div className="flex items-center gap-1 mt-1">
                                      {[...Array(5)].map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`w-3 h-3 ${
                                            i < Math.floor(hired.rating)
                                              ? "text-warning fill-warning"
                                              : "text-muted-foreground"
                                          }`}
                                        />
                                      ))}
                                      <span className="text-xs text-muted-foreground ml-1">
                                        ({hired.rating})
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm">
                                  Rate
                                </Button>
                                <Button variant="destructive" size="sm">
                                  Blacklist
                                </Button>
                              </div>
                            </div>
                          ))}
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
    </div>
  );
};

export default EmployerDashboard;
