import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  Users,
  Trophy,
  Clock,
  Loader2,
  CheckCircle,
  XCircle,
  MapPin,
  Briefcase,
  GraduationCap,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { RETAIL_CATEGORIES } from "@/lib/constants";

interface TestResult {
  id: string;
  employeeId: string;
  score: number;
  status: "completed" | "in_progress" | "abandoned";
  completedAt: string | null;
  passed: boolean;
  candidate: {
    skills: string[];
    retailCategories: string[];
    experience: number;
    educationLevel: string;
    city: string;
    state: string;
    employmentStatus: string;
    gender: string;
    profileCompletion: number;
  };
  isBlocked: boolean;
  blockedReason: "reserved" | "hired" | null;
}

interface TestInfo {
  id: string;
  title: string;
  position: string;
  passingScore: number;
  totalQuestions: number;
}

const TestResults = () => {
  const { testId } = useParams();
  const { user, employerProfile, wallet, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [testInfo, setTestInfo] = useState<TestInfo | null>(null);
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [reserveDialogOpen, setReserveDialogOpen] = useState(false);

  useEffect(() => {
    if (testId) {
      fetchTestResults();
    }
  }, [testId]);

  const fetchTestResults = async () => {
    try {
      const nowIso = new Date().toISOString();
      const thirtyDaysAgoIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      // Fetch test info
      const { data: testData, error: testError } = await supabase
        .from("skill_tests")
        .select("id, title, position, passing_score, questions")
        .eq("id", testId)
        .single();

      if (testError) throw testError;

      setTestInfo({
        id: testData.id,
        title: testData.title,
        position: testData.position || "",
        passingScore: testData.passing_score,
        totalQuestions: Array.isArray(testData.questions) ? testData.questions.length : 0,
      });

      // Fetch attempts with anonymous employee profile info (no name/phone/email)
      const { data: attemptsData, error: attemptsError } = await supabase
        .from("skill_test_attempts")
        .select(`
          id,
          employee_id,
          score,
          status,
          completed_at,
          employee_profiles!inner(
            id,
            skills,
            retail_categories,
            years_of_experience,
            education_level,
            city,
            state,
            employment_status,
            gender,
            profile_completion_percent
          )
        `)
        .eq("test_id", testId)
        .order("score", { ascending: false });

      if (attemptsError) throw attemptsError;

      const employeeIds = (attemptsData || []).map((a: any) => a.employee_id).filter(Boolean);

      const [{ data: pendingReservations }, { data: recentHires }] = await Promise.all([
        employeeIds.length > 0
          ? supabase
              .from("candidate_reservations")
              .select("employee_id, expires_at, status")
              .in("employee_id", employeeIds)
              .eq("status", "pending")
              .gt("expires_at", nowIso)
          : Promise.resolve({ data: [] as any[] } as any),
        employeeIds.length > 0
          ? supabase
              .from("hired_candidates")
              .select("employee_id, hired_date, status")
              .in("employee_id", employeeIds)
              .eq("status", "active")
              .gt("hired_date", thirtyDaysAgoIso)
          : Promise.resolve({ data: [] as any[] } as any),
      ]);

      const blockedByReservation = new Set<string>((pendingReservations || []).map((r: any) => r.employee_id));
      const blockedByHire = new Set<string>((recentHires || []).map((h: any) => h.employee_id));

      const resultsData: TestResult[] = (attemptsData || []).map((attempt: any) => {
        const emp = attempt.employee_profiles || {};
        const isBlocked = blockedByReservation.has(attempt.employee_id) || blockedByHire.has(attempt.employee_id);
        const blockedReason: TestResult["blockedReason"] = blockedByHire.has(attempt.employee_id)
          ? "hired"
          : blockedByReservation.has(attempt.employee_id)
          ? "reserved"
          : null;

        return {
          id: attempt.id,
          employeeId: attempt.employee_id,
          score: attempt.score || 0,
          status: attempt.status as "completed" | "in_progress" | "abandoned",
          completedAt: attempt.completed_at,
          passed: (attempt.score || 0) >= testData.passing_score,
          candidate: {
            skills: (emp.skills as string[]) || [],
            retailCategories: (emp.retail_categories as string[]) || [],
            experience: emp.years_of_experience || 0,
            educationLevel: emp.education_level || "",
            city: emp.city || "",
            state: emp.state || "",
            employmentStatus: emp.employment_status || "available",
            gender: emp.gender || "",
            profileCompletion: emp.profile_completion_percent || 0,
          },
          isBlocked,
          blockedReason,
        };
      });

      const selectableAttemptIds = new Set(
        resultsData
          .filter((r) => r.status === "completed" && !r.isBlocked)
          .map((r) => r.id)
      );
      setSelectedCandidates((prev) => prev.filter((id) => selectableAttemptIds.has(id)));

      setResults(resultsData);
    } catch (error) {
      console.error("Error fetching test results:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCandidateSelection = (id: string) => {
    setSelectedCandidates(prev => 
      prev.includes(id) 
        ? prev.filter(c => c !== id)
        : [...prev, id]
    );
  };

  const handleReserveCandidates = () => {
    if (selectedCandidates.length === 0) {
      toast({
        title: "No candidates selected",
        description: "Please select at least one candidate to reserve.",
        variant: "destructive",
      });
      return;
    }
    setReserveDialogOpen(true);
  };

  const confirmReservation = async () => {
    if (!user || !employerProfile?.id) {
      toast({
        title: "Error",
        description: "Employer profile not found.",
        variant: "destructive",
      });
      return;
    }

    const totalCost = selectedCandidates.length * 500;

    if ((wallet?.balance || 0) < totalCost) {
      toast({
        title: "Insufficient Balance",
        description: `You need ₹${totalCost} to reserve ${selectedCandidates.length} candidate(s). Please add money to your wallet.`,
        variant: "destructive",
      });
      setReserveDialogOpen(false);
      return;
    }

    try {
      const expiresAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();

      // Map selected attempt IDs to employee IDs
      const selectedEmployeeIds = results
        .filter((r) => selectedCandidates.includes(r.id))
        .map((r) => r.employeeId);

      const reservations = selectedEmployeeIds.map((empId) => ({
        employer_id: employerProfile.id,
        employee_id: empId,
        reservation_fee: 500,
        status: "pending" as const,
        expires_at: expiresAt,
      }));

      const { error: resError } = await supabase.from("candidate_reservations").insert(reservations);
      if (resError) throw resError;

      // Notify each employee about reservation
      for (const empId of selectedEmployeeIds) {
        const { data: empData } = await supabase
          .from("employee_profiles")
          .select("user_id")
          .eq("id", empId)
          .single();
        if (empData?.user_id) {
          await supabase.from("notifications").insert({
            user_id: empData.user_id,
            title: "🔔 You've been reserved!",
            message: `${employerProfile.organizationName} has reserved your profile based on your test performance.`,
            type: "reserved",
            reference_type: "reservation",
          });
        }
      }

      // Deduct wallet balance
      const newBalance = (wallet?.balance || 0) - totalCost;
      await supabase.from("wallets").update({ balance: newBalance }).eq("user_id", user.id);

      const { data: walletData } = await supabase
        .from("wallets")
        .select("id")
        .eq("user_id", user.id)
        .single();
      if (walletData) {
        await supabase.from("wallet_transactions").insert(
          selectedEmployeeIds.map((empId) => ({
            wallet_id: walletData.id,
            amount: 500,
            transaction_type: "debit" as const,
            description: "Reservation fee for candidate (from test results)",
            reference_id: empId,
            reference_type: "reservation",
          }))
        );
      }

      await refreshProfile();

      toast({
        title: "Candidates Reserved!",
        description: `${selectedCandidates.length} candidate(s) have been reserved for 5 days.`,
      });

      setReserveDialogOpen(false);
      setSelectedCandidates([]);
      fetchTestResults();
    } catch (error: any) {
      console.error("Reservation error:", error);
      toast({
        title: "Reservation Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const completedResults = results.filter(r => r.status === "completed");
  const selectableCompletedResults = completedResults.filter(r => !r.isBlocked);
  const passedCount = completedResults.filter(r => r.passed).length;
  const averageScore = completedResults.length > 0
    ? Math.round(completedResults.reduce((sum, r) => sum + r.score, 0) / completedResults.length)
    : 0;

  const getCategoryLabel = (val: string) => RETAIL_CATEGORIES.find(c => c.value === val)?.label || val;
  const getExperienceLabel = (years: number) => {
    if (years === 0) return "Fresher";
    if (years <= 1) return "0-1 years";
    if (years <= 2) return "1-2 years";
    if (years <= 5) return "2-5 years";
    return "5+ years";
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <Button 
            variant="ghost" 
            asChild 
            className="mb-6"
          >
            <Link to="/employer/tests">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tests
            </Link>
          </Button>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="font-display text-3xl font-bold">{testInfo?.title}</h1>
                <p className="text-muted-foreground">
                  {testInfo?.position} • {testInfo?.totalQuestions} questions • Pass: {testInfo?.passingScore}%
                </p>
              </div>

              {/* Stats */}
              <div className="grid md:grid-cols-4 gap-4 mb-8">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{results.length}</p>
                        <p className="text-sm text-muted-foreground">Total Attempts</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-green-500/10 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{completedResults.length}</p>
                        <p className="text-sm text-muted-foreground">Completed</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-accent/10 rounded-lg">
                        <Trophy className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{passedCount}</p>
                        <p className="text-sm text-muted-foreground">Passed</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-yellow-500/10 rounded-lg">
                        <Clock className="w-5 h-5 text-yellow-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{averageScore}%</p>
                        <p className="text-sm text-muted-foreground">Avg. Score</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Actions */}
              {selectedCandidates.length > 0 && (
                <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 mb-4 flex items-center justify-between">
                  <p className="text-sm">
                    <strong>{selectedCandidates.length}</strong> candidate(s) selected
                  </p>
                  <Button onClick={handleReserveCandidates}>
                    Reserve Selected (₹{selectedCandidates.length * 500})
                  </Button>
                </div>
              )}

              {/* Results List */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Test Results</CardTitle>
                      <CardDescription>Candidates sorted by score (highest first)</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={
                          selectableCompletedResults.length > 0 &&
                          selectedCandidates.length === selectableCompletedResults.length
                        }
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedCandidates(selectableCompletedResults.map(r => r.id));
                          } else {
                            setSelectedCandidates([]);
                          }
                        }}
                      />
                      <span className="text-xs text-muted-foreground">Select all (eligible)</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {results.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No results yet</h3>
                      <p className="text-muted-foreground">
                        Candidates will appear here once they complete the test.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {results.map((result, index) => {
                        const c = result.candidate;
                        const isEligible = result.status === "completed" && !result.isBlocked;
                        const isSelected = selectedCandidates.includes(result.id);

                        const statusBadge =
                          c.employmentStatus === "available"
                            ? <Badge className="bg-success text-success-foreground">Available</Badge>
                            : c.employmentStatus === "reserved"
                            ? <Badge className="bg-warning text-warning-foreground">Reserved</Badge>
                            : <Badge className="bg-primary text-primary-foreground">Employed</Badge>;

                        return (
                          <Card
                            key={result.id}
                            className={`transition-all ${result.isBlocked ? "opacity-60" : "hover:border-primary/50"} ${
                              isSelected ? "border-primary shadow-md" : ""
                            }`}
                          >
                            <CardContent className="pt-6">
                              <div className="flex items-start gap-4">
                                <Checkbox
                                  checked={isSelected}
                                  disabled={!isEligible}
                                  onCheckedChange={() => toggleCandidateSelection(result.id)}
                                  className="mt-1"
                                />

                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-semibold text-foreground">
                                          Candidate #{String(index + 1).padStart(4, "0")}
                                        </span>
                                        {statusBadge}
                                        {c.gender && (
                                          <Badge variant="outline" className="text-xs capitalize">{c.gender}</Badge>
                                        )}
                                        {c.profileCompletion >= 80 && <Badge variant="secondary">Verified Profile</Badge>}
                                        {result.isBlocked && (
                                          <Badge variant="outline" className="text-xs">
                                            {result.blockedReason === "reserved" ? "Already reserved" : "Recently hired"}
                                          </Badge>
                                        )}
                                        {result.status === "completed" ? (
                                          result.passed ? (
                                            <Badge className="bg-success text-success-foreground">
                                              <CheckCircle className="w-3 h-3 mr-1" />Pass
                                            </Badge>
                                          ) : (
                                            <Badge variant="destructive">
                                              <XCircle className="w-3 h-3 mr-1" />Fail
                                            </Badge>
                                          )
                                        ) : result.status === "in_progress" ? (
                                          <Badge variant="secondary">In Progress</Badge>
                                        ) : (
                                          <Badge variant="outline">Abandoned</Badge>
                                        )}
                                      </div>

                                      {c.retailCategories.length > 0 && (
                                        <div>
                                          <span className="text-xs font-medium text-muted-foreground">Retail Specialization: </span>
                                          <div className="flex flex-wrap gap-1 mt-0.5">
                                            {c.retailCategories.map((cat, i) => (
                                              <Badge key={i} variant="default" className="text-xs">{getCategoryLabel(cat)}</Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {c.skills.length > 0 && (
                                        <div>
                                          <span className="text-xs font-medium text-muted-foreground">Skills: </span>
                                          <div className="flex flex-wrap gap-1 mt-0.5">
                                            {c.skills.map((skill, i) => (
                                              <Badge key={i} variant="secondary" className="text-xs">{skill}</Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                          <Briefcase className="w-4 h-4" />
                                          {getExperienceLabel(c.experience)}
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <GraduationCap className="w-4 h-4" />
                                          {c.educationLevel || "N/A"}
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <MapPin className="w-4 h-4" />
                                          {c.city}, {c.state}
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Clock className="w-4 h-4" />
                                          {result.completedAt ? format(new Date(result.completedAt), "MMM d, yyyy h:mm a") : "-"}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="text-right">
                                      <p className="text-sm text-muted-foreground">Score</p>
                                      <p className={`text-2xl font-bold ${result.passed ? "text-success" : "text-foreground"}`}>
                                        {result.score}%
                                      </p>
                                      {!isEligible && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                          {result.status !== "completed"
                                            ? "Selectable after completion"
                                            : "Not selectable (reserved/hired)"}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>

      {/* Reserve Dialog */}
      <Dialog open={reserveDialogOpen} onOpenChange={setReserveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reserve Candidates</DialogTitle>
            <DialogDescription>
              You are about to reserve {selectedCandidates.length} candidate(s).
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span>Candidates selected</span>
                <span className="font-medium">{selectedCandidates.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Fee per candidate</span>
                <span className="font-medium">₹500</span>
              </div>
              <div className="border-t pt-2 flex justify-between text-lg">
                <span className="font-bold">Total</span>
                <span className="font-bold">₹{selectedCandidates.length * 500}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Reserved candidates will be exclusive to you for 5 days. You'll be able to view their 
              full contact details and can hire them during this period. A refund of ₹200 per 
              candidate applies if you don't hire them.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReserveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmReservation}>
              Confirm & Pay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TestResults;
