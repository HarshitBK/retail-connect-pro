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
  Loader2, Timer, Flag, Video, Mic, Maximize, LayoutDashboard, LogOut,
  User, ClipboardCheck, Eye
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";
import { aiTestApi } from "@/lib/aiTestApi";

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

type StoredQuestion = {
  id?: string;
  question?: string;
  options?: string[];
  correctAnswer?: number;
  marks?: number;
};

const TakeTest = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { user, employeeProfile } = useAuth();
  const { toast } = useToast();

  const [test, setTest] = useState<Database["public"]["Tables"]["skill_tests"]["Row"] | null>(null);
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

  // Anti-cheating states
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [violations, setViolations] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [checkingMedia, setCheckingMedia] = useState(false);
  const [mediaGranted, setMediaGranted] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [visitedQuestions, setVisitedQuestions] = useState<Set<number>>(new Set([0]));

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

  // Tab Switching Detection
  useEffect(() => {
    if (!testStarted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setViolations(prev => prev + 1);
        toast({
          title: "Cheating Warning!",
          description: "Switching tabs/windows during the test is strictly prohibited. This incident will be reported.",
          variant: "destructive"
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [testStarted, toast]);

  // Fullscreen Detection
  useEffect(() => {
    if (!testStarted) return;

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [testStarted]);

  // Cleanup Media Stream
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const fetchTest = async () => {
    if (!testId) return;
    try {
      const { data, error } = await supabase
        .from("skill_tests")
        .select("*")
        .eq("id", testId)
        .eq("status", "published")
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        setTest(null);
        setQuestions([]);
        setLoading(false);
        return;
      }
      if (data.starts_at && new Date(data.starts_at) > new Date()) {
        toast({ title: "Test Not Started", description: "This test is scheduled to start later." });
        setTest(null);
        setLoading(false);
        return;
      }
      if (data.ends_at && new Date(data.ends_at) < new Date()) {
        toast({ title: "Test Expired", description: "This test has already expired.", variant: "destructive" });
        setTest(null);
        setLoading(false);
        return;
      }
      setTest(data);
      setTimeLeft((data.duration_minutes || 60) * 60);
    } catch (error) {
      console.error("Error:", error);
      toast({ title: "Error", description: "Failed to load test. It may no longer be available.", variant: "destructive" });
      setTest(null);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const shuffleArray = <T,>(arr: T[]) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const pickRandom = <T,>(arr: T[], count: number) => {
    if (count >= arr.length) return shuffleArray(arr);
    return shuffleArray(arr).slice(0, count);
  };

  const buildDeliveredQuestions = (testRow: Database["public"]["Tables"]["skill_tests"]["Row"]): StoredQuestion[] => {
    const bank = (Array.isArray(testRow.question_bank) ? testRow.question_bank : []) as unknown[];
    const approved = (Array.isArray(testRow.approved_question_ids) ? testRow.approved_question_ids : []) as unknown[];

    const approvedSet = new Set(approved.map((x) => String(x)).filter(Boolean));
    const pool =
      bank.length > 0
        ? (bank as StoredQuestion[]).filter((q) => q?.id && approvedSet.has(String(q.id)))
        : ((Array.isArray(testRow.questions) ? testRow.questions : []) as StoredQuestion[]);

    const nToShowRaw = typeof testRow.questions_to_show === "number" ? testRow.questions_to_show : null;
    const nToShow = nToShowRaw && nToShowRaw > 0 ? nToShowRaw : pool.length;

    const chosen = pickRandom(pool, Math.min(nToShow, pool.length));
    const shouldShuffleOptions = testRow.shuffle_options !== false;

    return chosen.map((q) => {
      const options = Array.isArray(q?.options) ? q.options.map((o) => String(o)) : [];
      const correctAnswer = typeof q?.correctAnswer === "number" ? q.correctAnswer : 0;
      if (!shouldShuffleOptions || options.length !== 4) return { ...q, options, correctAnswer };

      const indices = shuffleArray([0, 1, 2, 3]);
      const newOptions = indices.map((i) => options[i]);
      const newCorrect = indices.findIndex((i) => i === correctAnswer);
      return { ...q, options: newOptions, correctAnswer: newCorrect >= 0 ? newCorrect : 0 };
    });
  };

  const requestFullscreen = async () => {
    try {
      const element = document.documentElement;
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  };

  const initMedia = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(mediaStream);
      setMediaError(null);
      return true;
    } catch (err) {
      console.error("Media error:", err);
      setMediaError("Camera and Microphone access is mandatory to take this test.");
      return false;
    }
  };

  const handleEnableMedia = async () => {
    setCheckingMedia(true);
    const ok = await initMedia();
    setMediaGranted(ok);
    setCheckingMedia(false);
  };

  const startTest = async () => {
    if (!employeeProfile || !testId || !mediaGranted) return;

    try {
      const { data: testRow, error: testErr } = await supabase
        .from("skill_tests")
        .select("*")
        .eq("id", testId)
        .eq("status", "published")
        .maybeSingle();
      if (testErr) throw testErr;
      if (!testRow) throw new Error("Test not available.");

      if (testRow.starts_at && new Date(testRow.starts_at) > new Date()) {
        throw new Error("This test has not started yet.");
      }
      if (testRow.ends_at && new Date(testRow.ends_at) < new Date()) {
        throw new Error("This test has expired.");
      }

      const { data: attemptData, error } = await supabase
        .from("skill_test_attempts")
        .insert({
          test_id: testId,
          employee_id: employeeProfile.id,
          status: "in_progress",
          fee_paid: (testRow as Database["public"]["Tables"]["skill_tests"]["Row"])?.test_fee || 0,
        })
        .select()
        .single();

      if (error) throw error;
      const attemptIdVal = attemptData.id;
      setAttemptId(attemptIdVal);

      let delivered: StoredQuestion[];
      try {
        const result = await aiTestApi.startAttempt(testId, attemptIdVal);
        delivered = Array.isArray(result.deliveredQuestions) ? result.deliveredQuestions : [];
      } catch {
        delivered = buildDeliveredQuestions(testRow as Database["public"]["Tables"]["skill_tests"]["Row"]);
      }
      if (delivered.length === 0) throw new Error("This test has no questions configured.");

      const parsedQuestions = delivered.map((q: StoredQuestion, i: number) => ({
        id: i,
        question: String(q.question ?? `Question ${i + 1}`),
        options: Array.isArray(q.options) ? q.options : [],
        correctAnswer: typeof q.correctAnswer === "number" ? q.correctAnswer : 0,
      }));
      setQuestions(parsedQuestions);
      setTestStarted(true);
      setVisitedQuestions(new Set([0]));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to start test.";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      const nextIdx = currentQuestion + 1;
      setCurrentQuestion(nextIdx);
      setVisitedQuestions(prev => new Set([...prev, nextIdx]));
    }
  };

  const handlePrev = () => {
    if (currentQuestion > 0) {
      const prevIdx = currentQuestion - 1;
      setCurrentQuestion(prevIdx);
      setVisitedQuestions(prev => new Set([...prev, prevIdx]));
    }
  };

  const jumpToQuestion = (idx: number) => {
    setCurrentQuestion(idx);
    setVisitedQuestions(prev => new Set([...prev, idx]));
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
        if (answers[i] === q.correctAnswer) {
          correct++;
        }
      });

      const score = Math.round((correct / questions.length) * 100);
      const passed = score >= (test?.passing_score || 40);

      const { error } = await supabase.from("skill_test_attempts").update({
        status: "completed",
        score,
        answers: answers,
        completed_at: new Date().toISOString(),
        metadata: { violations }
      }).eq("id", attemptId);

      if (error) throw error;

      if (document.fullscreenElement) {
        try { await document.exitFullscreen(); } catch (e) { console.error(e); }
      }

      setTestStarted(false);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }

      toast({
        title: "Test submitted",
        description: `Score: ${score}%. Your answers have been submitted successfully.`,
      });
      navigate("/employee/dashboard");
    } catch (error: any) {
      console.error("Submission Error:", error);
      const message = error?.message || error?.details || "Failed to submit test.";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
      setShowConfirmSubmit(false);
    }
  }, [attemptId, answers, questions, test, submitting, stream, violations, navigate, toast]);

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

  const displayQuestionCount =
    typeof test?.questions_to_show === "number" && test.questions_to_show > 0
      ? test.questions_to_show
      : Array.isArray(test?.approved_question_ids) && test.approved_question_ids.length > 0
        ? test.approved_question_ids.length
        : Array.isArray(test?.questions)
          ? test.questions.length
          : 0;

  if (!test || displayQuestionCount === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-12">
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Test Not Available</h2>
            <p className="text-muted-foreground mb-4">
              {!test ? "This test was not found or is no longer available. It may be closed or removed." : "This test doesn't have any questions yet."}
            </p>
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
                    <p className="text-2xl font-bold">{displayQuestionCount}</p>
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

                <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <div className="flex items-start gap-2">
                    <Video className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">Anti-Cheating Policy</p>
                      <ul className="text-muted-foreground mt-1 space-y-1">
                        <li>• Fullscreen mode is mandatory</li>
                        <li>• Camera and Microphone will be monitored</li>
                        <li>• Tab switching will be logged as a violation</li>
                        <li>• Multiple violations may lead to disqualification</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {mediaError && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {mediaError}
                  </div>
                )}

                <Button variant="default" className="w-full" size="lg" onClick={startTest}>
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
  const notSeenCount = questions.length - visitedQuestions.size;
  const notAttemptedCount = questions.length - answeredCount;

  return (
    <div className="min-h-screen bg-muted/10 flex flex-col font-sans selection:bg-primary/20">
      {/* Test-Active Header: Simplified to prevent accidental navigation */}
      {!testStarted ? <Header /> : (
        <header className="fixed top-0 left-0 right-0 z-[60] h-10 bg-white border-b border-primary/10 shadow-sm flex items-center px-6 justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-primary" />
              <span className="font-bold text-lg tracking-tight text-foreground">{test.title}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-primary/5 px-4 py-1.5 rounded-lg border border-primary/10">
              <Clock className="w-4 h-4 text-primary" />
              <span className={`font-mono text-xl font-bold ${timeLeft < 300 ? "text-destructive blink" : "text-primary"}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
            <div className="w-px h-6 bg-muted" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowConfirmSubmit(true)}
              className="text-xs font-bold text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              QUIT
            </Button>
          </div>
        </header>
      )}

      <main className={`${testStarted ? "pt-14" : "pt-24"} flex-1 flex flex-col overflow-hidden`}>
        {/* Anti-cheating Fullscreen Overlay */}
        {testStarted && !isFullscreen && (
          <div className="fixed inset-0 z-[100] bg-slate-900 bg-opacity-95 flex flex-col items-center justify-center text-center p-6 pointer-events-auto">
            <div className="p-4 bg-red-500/10 rounded-full mb-6 border border-red-500/20">
              <Maximize className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-semibold text-white mb-3">FULLSCREEN MODE REQUIRED</h2>
            <p className="text-slate-400 max-w-sm mb-8 text-sm leading-relaxed">
              To maintain integrity, this assessment must be completed in fullscreen. Your progress is paused. Please restore fullscreen to continue.
            </p>
            <Button size="lg" onClick={requestFullscreen} className="h-12 px-8 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-xl cursor-pointer pointer-events-auto relative z-[110]">
              RESTORE FULLSCREEN NOW
            </Button>
          </div>
        )}

        {testStarted && isFullscreen ? (
          <div className="flex-1 flex overflow-hidden">
            {/* Left Area: Main Question Content */}
            <div className="flex-1 flex flex-col bg-white relative">
              <div className="flex-1 overflow-y-auto p-4 lg:p-6">
                <div className="w-full max-w-4xl mx-auto">
                  <div className="mb-4 pb-2 border-b flex justify-between items-center bg-blue-50/50 px-4 py-2 rounded">
                    <span className="text-sm font-semibold text-blue-700">
                      Question {currentQuestion + 1}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">
                      Marks: 1
                    </span>
                  </div>
                  <h2 className="text-[15px] font-medium text-slate-800 mb-6 px-2 leading-relaxed">
                    {currentQ.question}
                  </h2>
                  <RadioGroup
                    value={answers[currentQuestion]?.toString()}
                    onValueChange={v => handleAnswer(currentQuestion, parseInt(v))}
                    className="grid grid-cols-1 gap-2 pl-2"
                  >
                    {currentQ.options.map((option, idx) => {
                      const isSelected = answers[currentQuestion] === idx;
                      return (
                        <div
                          key={idx}
                          onClick={() => handleAnswer(currentQuestion, idx)}
                          className={`flex items-start p-3 w-fit pr-8 rounded border transition-colors cursor-pointer ${isSelected ? "bg-blue-50 border-blue-200" : "border-transparent hover:bg-slate-50"}`}
                        >
                          <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs shrink-0 mt-0.5 transition-colors ${isSelected ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-500 border-slate-300"}`}>
                            {String.fromCharCode(65 + idx)}
                          </div>
                          <Label className="pl-3 text-[14px] text-slate-700 cursor-pointer leading-snug pt-1" onClick={(e) => e.preventDefault()}>
                            {option}
                          </Label>
                          <RadioGroupItem value={idx.toString()} id={`q${currentQuestion}-opt${idx}`} className="sr-only" />
                        </div>
                      );
                    })}
                  </RadioGroup>
                </div>
              </div>

              {/* Bottom Nav Actions */}
              <div className="bg-slate-50 border-t py-3 px-6 flex flex-wrap items-center justify-between gap-4 shrink-0">
                <Button variant="outline" onClick={() => handleAnswer(currentQuestion, -1)} className="text-sm font-medium h-9 px-6 bg-white border-slate-300 text-slate-700 hover:bg-slate-100 rounded-sm">
                  Clear Response
                </Button>
                <div className="flex items-center gap-3">
                  <Button variant="secondary" onClick={handlePrev} disabled={currentQuestion === 0} className="w-28 text-sm font-semibold h-9 rounded-sm bg-slate-200 text-slate-800 hover:bg-slate-300">
                    Previous
                  </Button>
                  <Button onClick={handleNext} disabled={currentQuestion === questions.length - 1} className="w-28 text-sm font-semibold h-9 shadow-sm rounded-sm bg-blue-600 hover:bg-blue-700 text-white">
                    Save & Next
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Sidebar: Proctoring & Palette */}
            <div className="w-80 border-l bg-muted/5 flex flex-col z-10 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)]">
              {/* Camera Video Fixed at Top */}
              <div className="p-4 border-b bg-black relative shrink-0">
                <div className="flex items-center justify-between absolute top-6 left-6 right-6 z-10 pointer-events-none">
                  <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur px-2 py-1 rounded shadow-sm text-[10px] text-white font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> REC
                  </div>
                  {violations > 0 && (
                    <div className="flex items-center gap-1 bg-destructive/90 px-2 py-1 rounded shadow-sm text-[10px] text-white font-bold">
                      {violations} Warnings
                    </div>
                  )}
                </div>
                <video
                  autoPlay
                  muted
                  ref={video => { if (video && stream) video.srcObject = stream; }}
                  className="w-full aspect-video object-cover rounded-md mirror scale-x-[-1] border border-white/20 shadow-md"
                />
              </div>

              {/* Box Title */}
              <div className="bg-blue-600 text-white text-[13px] font-bold px-4 py-2 flex items-center justify-between">
                <span>Section: {test.title}</span>
                <span className="opacity-80 font-normal">Q. {currentQuestion + 1}/{questions.length}</span>
              </div>

              {/* Navigation Grid */}
              <div className="flex-1 p-4 overflow-y-auto bg-slate-50 border-b border-l border-r mx-4 mt-4 rounded-t shadow-inner">
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {questions.map((_, i) => {
                    let statusClass = "bg-white text-slate-600 border-slate-300"; // Not seen
                    if (answers[i] !== undefined && answers[i] !== -1) {
                      statusClass = "bg-green-500 text-white border-green-600"; // Answered
                    } else if (visitedQuestions.has(i)) {
                      statusClass = "bg-red-500 text-white border-red-600"; // Not answered (visited)
                    }

                    if (i === currentQuestion) {
                      statusClass = "bg-blue-600 text-white border-blue-700";
                    }

                    return (
                      <button
                        key={i}
                        onClick={() => jumpToQuestion(i)}
                        className={`w-[36px] h-[36px] mx-auto rounded-md text-[13px] font-medium border transition-colors flex items-center justify-center shadow-sm hover:opacity-80 ${statusClass}`}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Legend & Submit */}
              <div className="p-4 bg-white border-l border-r border-b mx-4 rounded-b mb-4">
                <p className="text-xs font-bold text-slate-700 mb-3">Legend :</p>
                <div className="grid grid-cols-2 gap-y-2 text-[11px] font-medium text-slate-600">
                  <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-green-500 border border-green-600 shadow-sm" /> Answered</div>
                  <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-red-500 border border-red-600 shadow-sm" /> Not Answered</div>
                  <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-white border border-slate-300 shadow-sm" /> Not Visited</div>
                  <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-blue-600 border border-blue-700 shadow-sm" /> Current</div>
                </div>
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <Button onClick={() => setShowConfirmSubmit(true)} className="w-full h-10 bg-[#4caec4] hover:bg-[#3d8c9e] text-white text-sm font-semibold shadow-sm rounded-sm">
                    Submit Exam
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="container mx-auto px-4 max-w-2xl mt-8 mb-4">
            <Card className="shadow-2xl border-none overflow-hidden rounded-lg bg-white">
              <div className="h-3 bg-primary w-full" />
              <CardHeader className="text-center pt-10 pb-6 space-y-4">
                <div className="w-20 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2 border-4 border-white shadow-xl">
                  <Timer className="w-8 h-8 text-primary" />
                </div>
                <h1 className="font-display font-semibold text-xl text-foreground tracking-tight px-6">{test.title}</h1>
                <p className="text-muted-foreground text-base px-8 leading-relaxed font-medium">{test.description}</p>
              </CardHeader>
              <CardContent className="space-y-8 px-8 pb-10">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-primary/5 rounded-lg flex flex-col items-center border border-primary/10 shadow-sm">
                    <Flag className="w-6 h-6 text-primary mb-2" />
                    <span className="text-[10px] font-semibold text-primary/60 uppercase tracking-widest">Questions</span>
                    <span className="text-xl font-semibold text-primary">{displayQuestionCount}</span>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg flex flex-col items-center border border-transparent">
                    <Clock className="w-6 h-6 text-primary mb-2" />
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Duration</span>
                    <span className="text-xl font-semibold">{test.duration_minutes}m</span>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="font-semibold text-xs uppercase tracking-[0.2em] text-muted-foreground text-center">Mandatory Compliance Checklist</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      { icon: <Video />, title: "Live Proctoring", desc: "Camera & mic will record throughout the session." },
                      { icon: <LayoutDashboard />, title: "Locked Environment", desc: "Tab switching & browser resizing are prohibited." },
                      { icon: <CheckCircle2 />, title: "Benchmarking", desc: "Score 50% or above to earn the certification." }
                    ].map((step, idx) => (
                      <div key={idx} className="flex gap-5 p-5 bg-muted/20 rounded-lg border border-transparent transition-all hover:bg-white hover:border-primary/10 hover:shadow-xl group">
                        <div className="w-8 h-8 rounded-md bg-white shadow-md flex items-center justify-center text-primary transition-transform group-hover:rotate-6">
                          {step.icon}
                        </div>
                        <div className="flex flex-col justify-center">
                          <h4 className="font-semibold text-sm uppercase tracking-tight">{step.title}</h4>
                          <p className="text-xs text-muted-foreground font-bold">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {mediaError && (
                  <div className="p-5 bg-destructive/10 border-2 border-destructive/20 rounded-lg text-destructive text-sm font-semibold flex items-center gap-4 animate-shake">
                    <AlertCircle className="w-7 h-7 shrink-0" />
                    <p>{mediaError}</p>
                  </div>
                )}

                {!mediaGranted ? (
                  <Button variant="outline" className="w-full h-10 text-[13px] font-semibold rounded-md hover:bg-primary/5 transition-all text-muted-foreground uppercase tracking-widest" onClick={handleEnableMedia} disabled={checkingMedia}>
                    {checkingMedia ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Video className="w-5 h-5 mr-3" />}
                    1. Enable Camera & Mic to Proceed
                  </Button>
                ) : (
                  <Button variant="default" className="w-full h-10 text-lg font-semibold rounded-md shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all" onClick={startTest}>
                    2. START ASSESSMENT NOW
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Submit Progress Dialog */}
        <Dialog open={showConfirmSubmit} onOpenChange={setShowConfirmSubmit}>
          <DialogContent className="max-w-xl rounded-lg border-none p-0 overflow-hidden shadow-2xl bg-white">
            <div className="bg-primary p-6 text-primary-foreground relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
              <DialogHeader className="relative z-10">
                <DialogTitle className="text-2xl font-semibold tracking-tight">Final Submission</DialogTitle>
                <DialogDescription className="text-primary-foreground/80 font-bold text-lg pt-4 leading-relaxed">
                  Excellent work! Review your completion metrics before final commitment.
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="p-6 space-y-12">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-6 bg-muted/30 rounded-lg border-2 border-transparent">
                  <p className="text-xl font-semibold mb-1">{questions.length}</p>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase opacity-60">Total Items</p>
                </div>
                <div className="text-center p-6 bg-success/10 text-success rounded-lg border-2 border-success/10 shadow-inner">
                  <p className="text-xl font-semibold mb-1">{answeredCount}</p>
                  <p className="text-[10px] font-semibold uppercase opacity-60">Attempted</p>
                </div>
                <div className="text-center p-6 bg-destructive/5 text-destructive rounded-lg border-2 border-destructive/5">
                  <p className="text-xl font-semibold mb-1">{notAttemptedCount}</p>
                  <p className="text-[10px] font-semibold uppercase opacity-60">Unanswered</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-primary/5 rounded-lg border border-primary/10 flex flex-col items-center">
                  <Eye className="w-6 h-6 text-primary mb-2 opacity-40" />
                  <p className="text-xl font-semibold text-primary mb-1">{notSeenCount}</p>
                  <p className="text-[10px] font-semibold text-primary/60 uppercase">Not Even Seen</p>
                </div>
                <div className="p-6 bg-warning/5 rounded-lg border border-warning/10 flex flex-col items-center">
                  <Flag className="w-6 h-6 text-warning mb-2 opacity-40" />
                  <p className="text-xl font-semibold text-warning mb-1">{violations}</p>
                  <p className="text-[10px] font-semibold text-warning/60 uppercase">Violations</p>
                </div>
              </div>

              {notAttemptedCount > 0 && (
                <div className="p-6 bg-orange-500/5 rounded-lg border-2 border-orange-500/10 flex gap-4">
                  <div className="w-8 h-8 rounded-md bg-orange-500 flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/20">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex flex-col justify-center">
                    <p className="font-semibold text-orange-950 text-sm italic">UNFINISHED TASKS DETECTED</p>
                    <p className="text-xs text-orange-900/60 font-bold">You have {notAttemptedCount} unanswered questions. Scores are calculated only on committed answers.</p>
                  </div>
                </div>
              )}

              <DialogFooter className="flex-col sm:flex-col gap-4">
                <Button className="w-full h-10 text-2xl font-semibold rounded-lg shadow-2xl hover:scale-[1.02] transition-all" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                      SUBMITTING...
                    </>
                  ) : "SUBMIT TEST"}
                </Button>
                <Button variant="ghost" className="w-full h-10 font-semibold text-muted-foreground hover:text-foreground rounded-md" onClick={() => setShowConfirmSubmit(false)}>
                  RE-REVIEW ATTEMPT
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default TakeTest;
