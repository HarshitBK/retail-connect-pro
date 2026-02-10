import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Clock, AlertCircle, CheckCircle2, ArrowRight, ArrowLeft,
  Loader2, Timer, Flag
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

const TakeTest = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { user, employeeProfile } = useAuth();
  const { toast } = useToast();

  const [test, setTest] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [testStarted, setTestStarted] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number; passed: boolean } | null>(null);

  useEffect(() => {
    fetchTest();
  }, [testId]);

  // Timer
  useEffect(() => {
    if (!testStarted || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [testStarted, timeLeft]);

  const fetchTest = async () => {
    if (!testId) return;
    try {
      const { data, error } = await supabase
        .from("skill_tests")
        .select("*")
        .eq("id", testId)
        .single();

      if (error) throw error;
      setTest(data);
      const parsedQuestions = (data.questions as any[] || []).map((q: any, i: number) => ({
        id: i,
        question: q.question || `Question ${i + 1}`,
        options: q.options || [],
        correctAnswer: q.correctAnswer ?? 0,
      }));
      setQuestions(parsedQuestions);
      setTimeLeft((data.duration_minutes || 60) * 60);
    } catch (error) {
      console.error("Error:", error);
      toast({ title: "Error", description: "Failed to load test", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const startTest = async () => {
    if (!employeeProfile || !testId) return;
    try {
      const { data, error } = await supabase.from("skill_test_attempts").insert({
        test_id: testId,
        employee_id: employeeProfile.id,
        status: "in_progress",
        fee_paid: test?.test_fee || 0,
      }).select().single();

      if (error) throw error;
      setAttemptId(data.id);
      setTestStarted(true);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleAnswer = (questionIdx: number, answerIdx: number) => {
    setAnswers(prev => ({ ...prev, [questionIdx]: answerIdx }));
  };

  const handleSubmit = useCallback(async () => {
    if (submitting || !attemptId) return;
    setSubmitting(true);

    try {
      let correct = 0;
      questions.forEach((q, i) => {
        if (answers[i] === q.correctAnswer) correct++;
      });

      const score = Math.round((correct / questions.length) * 100);
      const passed = score >= (test?.passing_score || 40);

      await supabase.from("skill_test_attempts").update({
        status: "completed",
        score,
        answers: answers,
        completed_at: new Date().toISOString(),
      }).eq("id", attemptId);

      setResult({ score, total: questions.length, passed });
      setShowResultDialog(true);
      setTestStarted(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }, [attemptId, answers, questions, test, submitting]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-24 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      </div>
    );
  }

  if (!test || questions.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-12">
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Test Not Available</h2>
            <p className="text-muted-foreground mb-4">This test doesn't have any questions yet.</p>
            <Button onClick={() => navigate("/tests")}>Browse Other Tests</Button>
          </div>
        </main>
      </div>
    );
  }

  // Pre-test screen
  if (!testStarted && !result) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-12">
          <div className="container mx-auto px-4 max-w-2xl">
            <Card className="shadow-lg">
              <CardHeader className="text-center">
                <CardTitle className="font-display text-2xl">{test.title}</CardTitle>
                <CardDescription>{test.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">Questions</p>
                    <p className="text-2xl font-bold">{questions.length}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="text-2xl font-bold">{test.duration_minutes} min</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">Passing Score</p>
                    <p className="text-2xl font-bold">{test.passing_score}%</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">Fee</p>
                    <p className="text-2xl font-bold">₹{test.test_fee || 0}</p>
                  </div>
                </div>

                <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">Important Instructions</p>
                      <ul className="text-muted-foreground mt-1 space-y-1">
                        <li>• Once started, the timer cannot be paused</li>
                        <li>• Answer all questions before the time runs out</li>
                        <li>• Your score will be calculated automatically</li>
                        <li>• You need {test.passing_score}% to pass</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Button variant="hero" className="w-full" size="lg" onClick={startTest}>
                  Start Test Now
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const answeredCount = Object.keys(answers).length;
  const progressPercent = (answeredCount / questions.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Timer Bar */}
          <div className="sticky top-16 z-10 bg-background py-3 border-b border-border mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant="outline">{test.title}</Badge>
                <span className="text-sm text-muted-foreground">
                  Q {currentQuestion + 1}/{questions.length}
                </span>
              </div>
              <div className={`flex items-center gap-2 font-mono text-lg font-bold ${timeLeft < 300 ? "text-destructive" : "text-foreground"}`}>
                <Timer className="w-5 h-5" />
                {formatTime(timeLeft)}
              </div>
            </div>
            <Progress value={progressPercent} className="h-1 mt-2" />
          </div>

          {/* Question Card */}
          <Card className="shadow-lg mb-6">
            <CardHeader>
              <CardTitle className="text-lg">
                Question {currentQuestion + 1}
              </CardTitle>
              <CardDescription className="text-base text-foreground font-medium mt-2">
                {currentQ.question}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={answers[currentQuestion]?.toString()}
                onValueChange={v => handleAnswer(currentQuestion, parseInt(v))}
                className="space-y-3"
              >
                {currentQ.options.map((option, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-all ${
                      answers[currentQuestion] === idx
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => handleAnswer(currentQuestion, idx)}
                  >
                    <RadioGroupItem value={idx.toString()} id={`q${currentQuestion}-opt${idx}`} />
                    <Label htmlFor={`q${currentQuestion}-opt${idx}`} className="cursor-pointer flex-1">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
              disabled={currentQuestion === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />Previous
            </Button>

            <div className="flex gap-2">
              {/* Question dots */}
              {questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentQuestion(i)}
                  className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${
                    i === currentQuestion
                      ? "bg-primary text-primary-foreground"
                      : answers[i] !== undefined
                      ? "bg-success/20 text-success border border-success/30"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            {currentQuestion === questions.length - 1 ? (
              <Button variant="hero" onClick={handleSubmit} disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Flag className="w-4 h-4 mr-2" />}
                Submit Test
              </Button>
            ) : (
              <Button onClick={() => setCurrentQuestion(prev => Math.min(questions.length - 1, prev + 1))}>
                Next<ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </main>

      {/* Result Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">
              {result?.passed ? "🎉 Congratulations!" : "😔 Better Luck Next Time"}
            </DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4 py-4">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto ${
              result?.passed ? "bg-success/10" : "bg-destructive/10"
            }`}>
              <span className={`text-3xl font-bold ${result?.passed ? "text-success" : "text-destructive"}`}>
                {result?.score}%
              </span>
            </div>
            <p className="text-muted-foreground">
              You answered {Object.keys(answers).length} out of {questions.length} questions.
              {result?.passed ? " You passed!" : ` You needed ${test?.passing_score}% to pass.`}
            </p>
            {result?.passed && (
              <Badge className="bg-success text-success-foreground"><CheckCircle2 className="w-4 h-4 mr-1" />Test Passed</Badge>
            )}
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => navigate("/tests")} className="w-full sm:w-auto">Browse More Tests</Button>
            <Button onClick={() => navigate("/employee/dashboard")} className="w-full sm:w-auto">Go to Dashboard</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TakeTest;
