import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
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
  Download,
  Users,
  Trophy,
  Clock,
  Loader2,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface TestResult {
  id: string;
  employeeId: string;
  employeeName: string;
  score: number;
  status: "completed" | "in_progress" | "abandoned";
  completedAt: string | null;
  passed: boolean;
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
  const { wallet } = useAuth();
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

      // Fetch attempts with employee info
      const { data: attemptsData, error: attemptsError } = await supabase
        .from("skill_test_attempts")
        .select(`
          id,
          employee_id,
          score,
          status,
          completed_at,
          employee_profiles!inner(full_name)
        `)
        .eq("test_id", testId)
        .order("score", { ascending: false });

      if (attemptsError) throw attemptsError;

      const resultsData: TestResult[] = (attemptsData || []).map((attempt: any) => ({
        id: attempt.id,
        employeeId: attempt.employee_id,
        employeeName: attempt.employee_profiles?.full_name || "Unknown",
        score: attempt.score || 0,
        status: attempt.status as "completed" | "in_progress" | "abandoned",
        completedAt: attempt.completed_at,
        passed: (attempt.score || 0) >= testData.passing_score,
      }));

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

    toast({
      title: "Candidates Reserved!",
      description: `${selectedCandidates.length} candidate(s) have been reserved for 5 days.`,
    });

    setReserveDialogOpen(false);
    setSelectedCandidates([]);
  };

  const completedResults = results.filter(r => r.status === "completed");
  const passedCount = completedResults.filter(r => r.passed).length;
  const averageScore = completedResults.length > 0
    ? Math.round(completedResults.reduce((sum, r) => sum + r.score, 0) / completedResults.length)
    : 0;

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

              {/* Results Table */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Test Results</CardTitle>
                      <CardDescription>Candidates sorted by score (highest first)</CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
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
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox 
                              checked={selectedCandidates.length === completedResults.length && completedResults.length > 0}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedCandidates(completedResults.map(r => r.id));
                                } else {
                                  setSelectedCandidates([]);
                                }
                              }}
                            />
                          </TableHead>
                          <TableHead>Rank</TableHead>
                          <TableHead>Candidate</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Result</TableHead>
                          <TableHead>Completed</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.map((result, index) => (
                          <TableRow key={result.id}>
                            <TableCell>
                              <Checkbox 
                                checked={selectedCandidates.includes(result.id)}
                                onCheckedChange={() => toggleCandidateSelection(result.id)}
                                disabled={result.status !== "completed"}
                              />
                            </TableCell>
                            <TableCell>
                              {result.status === "completed" ? (
                                <span className="font-bold">#{index + 1}</span>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell className="font-medium">{result.employeeName}</TableCell>
                            <TableCell>
                              <span className={result.passed ? "text-green-600 font-bold" : ""}>
                                {result.score}%
                              </span>
                            </TableCell>
                            <TableCell>
                              {result.status === "completed" ? (
                                <Badge className="bg-green-500">Completed</Badge>
                              ) : result.status === "in_progress" ? (
                                <Badge variant="secondary">In Progress</Badge>
                              ) : (
                                <Badge variant="outline">Abandoned</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {result.status === "completed" && (
                                result.passed ? (
                                  <div className="flex items-center gap-1 text-green-600">
                                    <CheckCircle className="w-4 h-4" />
                                    Pass
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 text-red-500">
                                    <XCircle className="w-4 h-4" />
                                    Fail
                                  </div>
                                )
                              )}
                            </TableCell>
                            <TableCell>
                              {result.completedAt 
                                ? format(new Date(result.completedAt), "MMM d, yyyy h:mm a")
                                : "-"
                              }
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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
