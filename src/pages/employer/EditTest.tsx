import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Eye,
  Loader2,
  GripVertical,
  ClipboardCheck,
  Timer,
  Clock,
  Star,
  Calendar
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { aiTestApi } from "@/lib/aiTestApi";

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  marks: number;
  selected: boolean;
}

type GeneratedMcq = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
};

type StoredQuestion = {
  id?: string;
  question?: string;
  options?: string[];
  correctAnswer?: number;
  marks?: number;
};

const EditTest = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { employerProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingTest, setLoadingTest] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatorFile, setGeneratorFile] = useState<File | null>(null);
  const [questionsToShow, setQuestionsToShow] = useState<number>(20);
  const [existingSourceFilePath, setExistingSourceFilePath] = useState<string | null>(null);

  const [testData, setTestData] = useState({
    title: "",
    description: "",
    position: "",
    location: ["India"] as string[],
    durationMinutes: 30,
    passingScore: 50,
    startsAt: "",
    endsAt: "",
  });

  const [aiQuestionCount, setAiQuestionCount] = useState(50);

  const [questions, setQuestions] = useState<Question[]>([
    { id: crypto.randomUUID(), question: "", options: ["", "", "", ""], correctAnswer: 0, marks: 1, selected: true },
  ]);

  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }
    return btoa(binary);
  };

  const generateWithAi = async () => {
    if (!generatorFile) {
      toast({ title: "Upload required", description: "Please choose a PDF or PPTX.", variant: "destructive" });
      return;
    }
    if (!testData.title || !testData.position) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in the test title and position (role) first.",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const buf = await generatorFile.arrayBuffer();
      const data = await aiTestApi.generateMcqs({
        testName: testData.title,
        description: testData.description,
        role: testData.position,
        fileName: generatorFile.name,
        mimeType: generatorFile.type,
        fileBase64: arrayBufferToBase64(buf),
        count: aiQuestionCount,
      });
      const generated: GeneratedMcq[] = Array.isArray(data?.questions) ? data.questions : [];
      if (generated.length === 0) throw new Error("AI returned no questions.");

      setQuestions(
        generated.map((q) => ({
          id: typeof q.id === "string" && q.id ? q.id : crypto.randomUUID(),
          question: typeof q.question === "string" ? q.question : String(q.question ?? ""),
          options: Array.isArray(q.options) ? q.options.map((o) => String(o ?? "")) : ["", "", "", ""],
          correctAnswer: typeof q.correctAnswer === "number" ? q.correctAnswer : 0,
          marks: 1,
          selected: true,
        }))
      );

      toast({
        title: "Generated!",
        description: `AI created ${generated.length} questions. Review, edit, and select the ones you want.`,
      });
    } catch (e: unknown) {
      console.error(e);
      const message = e instanceof Error ? e.message : "Please try again.";
      toast({ title: "Generation failed", description: message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (testId && employerProfile?.id) fetchTest();
    else setLoadingTest(false);
  }, [testId, employerProfile?.id]);

  const fetchTest = async () => {
    if (!testId) return;
    try {
      const { data, error } = await supabase
        .from("skill_tests")
        .select("*")
        .eq("id", testId)
        .eq("employer_id", employerProfile?.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast({ title: "Test not found", description: "You can only edit your own tests.", variant: "destructive" });
        navigate("/employer/tests");
        return;
      }
      const testRow = data as Database["public"]["Tables"]["skill_tests"]["Row"];

      setTestData({
        title: testRow.title || "",
        description: testRow.description || "",
        position: testRow.position || "",
        location: testRow.location ? testRow.location.split(", ") : ["India"],
        durationMinutes: testRow.duration_minutes || 30,
        passingScore: testRow.passing_score || 50,
        startsAt: testRow.starts_at ? new Date(testRow.starts_at).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
        endsAt: testRow.ends_at ? new Date(testRow.ends_at).toISOString().slice(0, 16) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      });
      const snapshot = await aiTestApi.getSnapshot(testId).catch(() => null);
      if (snapshot && Array.isArray(snapshot.questionBank) && snapshot.questionBank.length > 0) {
        setQuestionsToShow(
          typeof snapshot.questionsToShow === "number" ? snapshot.questionsToShow : 20
        );
        const approvedSet = new Set(
          (snapshot.approvedQuestionIds || []).map((x) => String(x)).filter(Boolean)
        );
        const raw = snapshot.questionBank as StoredQuestion[];
        setQuestions(
          raw.map((q) => ({
            id: typeof q?.id === "string" && q.id ? q.id : crypto.randomUUID(),
            question: typeof q?.question === "string" ? q.question : "",
            options: Array.isArray(q?.options) ? q.options.map((o) => String(o ?? "")) : ["", "", "", ""],
            correctAnswer: typeof q?.correctAnswer === "number" ? q.correctAnswer : 0,
            marks: typeof q?.marks === "number" ? q.marks : 1,
            selected: approvedSet.size ? approvedSet.has(String(q?.id)) : true,
          })),
        );
      } else {
        setQuestionsToShow(20);
        const raw = (Array.isArray(testRow.questions) ? testRow.questions : []) as unknown[];
        if (raw.length > 0) {
          setQuestions(
            (raw as StoredQuestion[]).map((q) => ({
              id: typeof q?.id === "string" && q.id ? q.id : crypto.randomUUID(),
              question: typeof q?.question === "string" ? q.question : "",
              options: Array.isArray(q?.options) ? q.options.map((o) => String(o ?? "")) : ["", "", "", ""],
              correctAnswer: typeof q?.correctAnswer === "number" ? q.correctAnswer : 0,
              marks: typeof q?.marks === "number" ? q.marks : 1,
              selected: true,
            })),
          );
        }
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to load test", variant: "destructive" });
      navigate("/employer/tests");
    } finally {
      setLoadingTest(false);
    }
  };

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      { id: crypto.randomUUID(), question: "", options: ["", "", "", ""], correctAnswer: 0, marks: 1, selected: true },
    ]);
  };

  const removeQuestion = (id: string) => {
    if (questions.length > 1) setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const updateQuestion = (id: string, field: keyof Question, value: unknown) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, [field]: value } : q)));
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        const newOptions = [...q.options];
        newOptions[optionIndex] = value;
        return { ...q, options: newOptions };
      })
    );
  };

  const handleSubmit = async (status: "draft" | "published") => {
    if (!testData.title || !testData.position || !testData.location.length || !testData.durationMinutes || !testData.passingScore) {
      toast({ title: "Missing required fields", description: "Fill in all compulsory fields.", variant: "destructive" });
      return;
    }
    if (testData.passingScore < 0 || testData.passingScore > 100) {
      toast({ title: "Invalid Passing Score", description: "Passing score must be between 0 and 100.", variant: "destructive" });
      return;
    }

    const now = new Date();
    const startVal = testData.startsAt ? new Date(testData.startsAt) : now;
    const endVal = testData.endsAt ? new Date(testData.endsAt) : new Date(startVal.getTime() + 30 * 24 * 60 * 60 * 1000);

    if (endVal <= startVal) {
      toast({ title: "Invalid Expiry Date", description: "Expiry date must be after the publish date.", variant: "destructive" });
      return;
    }

    const validQuestions = questions.filter((q) => q.question && q.options.every((o) => o));
    if (validQuestions.length === 0) {
      toast({ title: "No valid questions", description: "Add at least one complete question.", variant: "destructive" });
      return;
    }
    const selectedValid = validQuestions.filter((q) => q.selected);
    if (selectedValid.length === 0) {
      toast({
        title: "No Questions Selected",
        description: "Please select at least one question to include in the test.",
        variant: "destructive",
      });
      return;
    }

    if (questionsToShow > selectedValid.length) {
      toast({
        title: "Invalid Strategy",
        description: `You can't show ${questionsToShow} random questions if you've only selected ${selectedValid.length}.`,
        variant: "destructive",
      });
      return;
    }
    if (!testId || !employerProfile?.id) return;

    setLoading(true);
    try {
      const questionBankPayload = validQuestions.map(({ selected: _selected, ...q }) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        marks: q.marks ?? 1,
      }));

      const approvedIds = selectedValid.map((q) => q.id);
      const approvedQuestionsPayload = selectedValid
        .map(({ id: _id, selected: _selected, ...q }) => ({
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          marks: q.marks ?? 1,
        }));

      const { error } = await supabase
        .from("skill_tests")
        .update({
          title: testData.title,
          description: testData.description,
          position: testData.position,
          location: testData.location.join(", "),
          duration_minutes: testData.durationMinutes,
          passing_score: testData.passingScore,
          starts_at: startVal.toISOString(),
          ends_at: endVal.toISOString(),
          status,
          questions: approvedQuestionsPayload,
        })
        .eq("id", testId)
        .eq("employer_id", employerProfile.id);

      if (error) throw error;

      await aiTestApi.saveSnapshot(testId, {
        employerId: employerProfile.id,
        questionBank: questionBankPayload,
        approvedQuestionIds: approvedIds,
        questionsToShow: Math.min(Math.max(1, questionsToShow || 1), approvedIds.length),
      });

      toast({
        title: status === "published" ? "Test updated and published" : "Test saved",
        description: status === "published" ? "Candidates can take this test." : "Saved as draft.",
      });
      navigate("/employer/tests");
    } catch (e: unknown) {
      console.error(e);
      const message = e instanceof Error ? e.message : "Failed to update test";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (loadingTest) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Header />
        <div className="pt-24 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-24">
      <Header />
      <main className="pt-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <Button variant="ghost" asChild className="mb-6 hover:bg-white">
            <Link to="/employer/tests">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to List
            </Link>
          </Button>

          <div className="mb-8 flex flex-col">
            <h1 className="font-display text-4xl font-black text-primary tracking-tight">Edit Assessment</h1>
            <p className="text-muted-foreground text-lg">Update test content and proctoring settings</p>
          </div>

          <Card className="mb-8 border-none shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-primary/5 pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <ClipboardCheck className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold">1. Configuration Details</CardTitle>
                  <CardDescription>Modify basic test metadata and timing</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="font-bold text-sm">Test Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Cashier Skills Assessment"
                    value={testData.title}
                    onChange={(e) => setTestData((prev) => ({ ...prev, title: e.target.value }))}
                    className="h-11 rounded-xl border-2 focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position" className="font-bold text-sm">Target Role *</Label>
                  <Input
                    id="position"
                    placeholder="e.g., Retail Cashier"
                    value={testData.position}
                    onChange={(e) => setTestData((prev) => ({ ...prev, position: e.target.value }))}
                    className="h-11 rounded-xl border-2 focus-visible:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="font-bold text-sm">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this test evaluates..."
                  value={testData.description}
                  onChange={(e) => setTestData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="rounded-xl border-2 resize-none focus-visible:ring-primary"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="startsAt" className="font-bold text-sm">Publish Date & Time *</Label>
                  <Input
                    id="startsAt"
                    type="datetime-local"
                    value={testData.startsAt}
                    onChange={e => setTestData(prev => ({ ...prev, startsAt: e.target.value }))}
                    className="h-11 rounded-xl border-2 focus-visible:ring-primary bg-white"
                  />
                  <p className="text-[10px] text-muted-foreground italic px-1">When will users see this? (Immediate if past/now)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endsAt" className="font-bold text-sm">Expiry Date & Time</Label>
                  <Input
                    id="endsAt"
                    type="datetime-local"
                    value={testData.endsAt}
                    onChange={e => setTestData(prev => ({ ...prev, endsAt: e.target.value }))}
                    className="h-11 rounded-xl border-2 focus-visible:ring-primary bg-white"
                  />
                  <p className="text-[10px] text-muted-foreground italic px-1">When should the test close?</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="location" className="font-bold text-sm">Job Location(s) *</Label>
                  <div className="flex flex-col gap-2">
                    <Select
                      onValueChange={(value) => {
                        if (testData.location.includes(value)) {
                          setTestData(prev => ({ ...prev, location: prev.location.filter(l => l !== value) }));
                        } else {
                          setTestData(prev => ({ ...prev, location: [...prev.location, value] }));
                        }
                      }}
                    >
                      <SelectTrigger className="h-11 rounded-xl border-2 bg-white">
                        <SelectValue placeholder="Add Locations" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="India">India (Pan-India)</SelectItem>
                        <SelectItem value="North India">North India</SelectItem>
                        <SelectItem value="South India">South India</SelectItem>
                        <SelectItem value="East India">East India</SelectItem>
                        <SelectItem value="West India">West India</SelectItem>
                        <SelectItem value="Central India">Central India</SelectItem>
                        <SelectItem value="Mumbai">Mumbai</SelectItem>
                        <SelectItem value="Delhi NCR">Delhi NCR</SelectItem>
                        <SelectItem value="Bangalore">Bangalore</SelectItem>
                        <SelectItem value="Chennai">Chennai</SelectItem>
                        <SelectItem value="Hyderabad">Hyderabad</SelectItem>
                        <SelectItem value="Kolkata">Kolkata</SelectItem>
                        <SelectItem value="Ahmedabad">Ahmedabad</SelectItem>
                        <SelectItem value="Pune">Pune</SelectItem>
                        <SelectItem value="Jaipur">Jaipur</SelectItem>
                        <SelectItem value="Surat">Surat</SelectItem>
                        <SelectItem value="Lucknow">Lucknow</SelectItem>
                        <SelectItem value="Kanpur">Kanpur</SelectItem>
                        <SelectItem value="Nagpur">Nagpur</SelectItem>
                        <SelectItem value="Indore">Indore</SelectItem>
                        <SelectItem value="Thane">Thane</SelectItem>
                        <SelectItem value="Bhopal">Bhopal</SelectItem>
                        <SelectItem value="Visakhapatnam">Visakhapatnam</SelectItem>
                        <SelectItem value="Pimpri-Chinchwad">Pimpri-Chinchwad</SelectItem>
                        <SelectItem value="Patna">Patna</SelectItem>
                        <SelectItem value="Vadodara">Vadodara</SelectItem>
                        <SelectItem value="Ghaziabad">Ghaziabad</SelectItem>
                        <SelectItem value="Ludhiana">Ludhiana</SelectItem>
                        <SelectItem value="Coimbatore">Coimbatore</SelectItem>
                        <SelectItem value="Agra">Agra</SelectItem>
                        <SelectItem value="Madurai">Madurai</SelectItem>
                        <SelectItem value="Nashik">Nashik</SelectItem>
                        <SelectItem value="Vijayawada">Vijayawada</SelectItem>
                        <SelectItem value="Faridabad">Faridabad</SelectItem>
                        <SelectItem value="Meerut">Meerut</SelectItem>
                        <SelectItem value="Rajkot">Rajkot</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex flex-wrap gap-1.5 min-h-[24px]">
                      {testData.location.map(loc => (
                        <Badge key={loc} variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-none px-2 py-0.5 rounded-lg text-[10px] font-black">
                          {loc}
                          <button
                            className="ml-1.5 hover:text-destructive"
                            onClick={() => setTestData(prev => ({ ...prev, location: prev.location.filter(l => l !== loc) }))}
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration" className="font-bold text-sm">Duration (min) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={testData.durationMinutes}
                    onChange={(e) => setTestData((prev) => ({ ...prev, durationMinutes: parseInt(e.target.value) || 30 }))}
                    className="h-11 rounded-xl border-2 focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passing" className="font-bold text-sm">Passing Score (%) *</Label>
                  <Input
                    id="passing"
                    type="number"
                    value={testData.passingScore}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setTestData((prev) => ({ ...prev, passingScore: isNaN(val) ? 50 : Math.min(100, Math.max(0, val)) }));
                    }}
                    className="h-11 rounded-xl border-2 focus-visible:ring-primary"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8 border-2 border-primary/20 shadow-xl overflow-hidden rounded-2xl bg-gradient-to-br from-white to-primary/5">
            <CardHeader className="bg-primary text-primary-foreground py-6">
              <div className="flex items-center gap-4 px-2">
                <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl shadow-inner">
                  <Loader2 className={`w-8 h-8 ${generating ? 'animate-spin' : ''}`} />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black tracking-tight tracking-tight">AI Knowledge Refresh</CardTitle>
                  <CardDescription className="text-primary-foreground/90 font-bold text-md">
                    Generate entirely new questions from updated documents
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                <div className="md:col-span-12 space-y-8">
                  <div className="grid md:grid-cols-3 gap-8 items-end">
                    <div className="space-y-3">
                      <Label htmlFor="ai-file" className="font-black text-[10px] uppercase tracking-[0.2em] text-primary px-1 opacity-60">1. NEW SOURCE FILE</Label>
                      <div className="relative">
                        <Input
                          id="ai-file"
                          type="file"
                          accept=".pdf,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                          onChange={(e) => setGeneratorFile(e.target.files?.[0] ?? null)}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className={`w-full h-12 border-2 border-dashed rounded-xl flex flex-row items-center justify-start gap-4 px-4 transition-all ${generatorFile ? 'border-primary bg-primary/5 text-primary' : 'hover:border-primary/50 hover:bg-white'}`}
                          onClick={() => document.getElementById('ai-file')?.click()}
                        >
                          <div className={`p-1.5 rounded-lg transition-colors ${generatorFile ? 'bg-primary text-white' : 'bg-muted'}`}>
                            <Plus className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-black truncate max-w-[140px]">
                            {generatorFile ? generatorFile.name : "Select Replacement PDF"}
                          </span>
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="ai-question-count" className="font-black text-[10px] uppercase tracking-[0.2em] text-primary px-1 opacity-60">2. DRAFT QUANTITY (MAX 75)</Label>
                      <div className="relative">
                        <Input
                          id="ai-question-count"
                          type="number"
                          value={aiQuestionCount}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setAiQuestionCount(isNaN(val) ? 50 : Math.min(75, Math.max(1, val)));
                          }}
                          min={1}
                          max={75}
                          className="h-12 rounded-xl border-2 text-lg font-black text-center pr-10 focus-visible:ring-primary bg-white/50"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 font-black text-muted-foreground/30 text-[10px]">POOL</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="questionsToShow" className="font-black text-[10px] uppercase tracking-[0.2em] text-primary px-1 opacity-60">3. SHOWN TO CANDIDATE</Label>
                      <div className="relative">
                        <Input
                          id="questionsToShow"
                          type="number"
                          value={questionsToShow}
                          onChange={(e) => setQuestionsToShow(parseInt(e.target.value) || 20)}
                          min={1}
                          className="h-12 rounded-xl border-2 text-lg font-black text-center pr-10 focus-visible:ring-primary bg-white/50"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 font-black text-muted-foreground/30 text-[10px]">EXIT</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={generateWithAi}
                    disabled={generating}
                    className="w-full h-14 rounded-xl shadow-xl font-black text-lg tracking-wide transition-all hover:translate-y-[-2px] active:translate-y-[1px] group"
                    variant="hero"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-6 h-6 mr-4 animate-spin" />
                        Reprogramming Assessment Logic...
                      </>
                    ) : (
                      <>
                        <span className="mr-3 scale-125 group-hover:rotate-12 transition-transform">✨</span>
                        REGENERATE ENTIRE POOL
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between mb-6 px-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-foreground text-foreground">Content Repository</h2>
              <Badge variant="outline" className="rounded-full px-4 h-7 border-2 font-black bg-white">{questions.length} Items</Badge>
            </div>
            <Button onClick={addQuestion} variant="outline" size="sm" className="rounded-xl h-10 font-black border-2 bg-white hover:bg-primary/5 hover:text-primary transition-all">
              <Plus className="w-4 h-4 mr-2" /> ADD MANUAL Q
            </Button>
          </div>

          <div className="space-y-6">
            {questions.map((question, qIndex) => (
              <Card key={question.id} className={`transition-all duration-500 rounded-2xl border-2 overflow-hidden shadow-md group ${question.selected ? 'border-primary/30 bg-white ring-4 ring-primary/5' : 'opacity-40 grayscale pointer-events-none'}`}>
                <div className={`h-1.5 w-full ${question.selected ? 'bg-primary' : 'bg-muted'}`} />
                <CardContent className="p-8 space-y-8">
                  <div className="flex items-start justify-between gap-6 px-2">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl ${question.selected ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-muted text-muted-foreground'} flex items-center justify-center font-black text-xl transition-all`}>
                        {qIndex + 1}
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-black text-lg tracking-tight">Question Item</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`include-${question.id}`}
                            checked={question.selected}
                            onChange={(e) => updateQuestion(question.id, "selected", e.target.checked)}
                            className="w-4 h-4 rounded-md border-2 border-primary/30 text-primary pointer-events-auto cursor-pointer"
                          />
                          <Label htmlFor={`include-${question.id}`} className="text-[11px] font-black uppercase tracking-widest text-primary/70 cursor-pointer pointer-events-auto">Toggle Include</Label>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(question.id)}
                      disabled={questions.length === 1}
                      className="text-destructive hover:bg-destructive/10 h-10 px-3 rounded-xl pointer-events-auto"
                    >
                      <Trash2 className="w-5 h-5 font-bold" />
                    </Button>
                  </div>

                  <div className="space-y-6 px-2">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">The Question</Label>
                      <Textarea
                        placeholder="Type the core inquiry here..."
                        value={question.question}
                        onChange={(e) => updateQuestion(question.id, "question", e.target.value)}
                        rows={2}
                        className="rounded-xl border-2 text-lg font-bold p-5 focus-visible:ring-primary transition-all pointer-events-auto"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      {question.options.map((option, oIndex) => (
                        <div key={oIndex} className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all group/opt ${question.correctAnswer === oIndex ? 'border-success bg-success/5 ring-4 ring-success/10' : 'border-muted/50 bg-muted/20 hover:border-primary/40'} pointer-events-auto`}>
                          <div className="relative flex items-center justify-center h-10 w-10 shrink-0">
                            <input
                              type="radio"
                              name={`correct-${question.id}`}
                              checked={question.correctAnswer === oIndex}
                              onChange={() => updateQuestion(question.id, "correctAnswer", oIndex)}
                              className="appearance-none w-10 h-10 rounded-full border-2 border-border cursor-pointer checked:bg-success checked:border-success transition-all shadow-md active:scale-95"
                            />
                            <span className={`absolute pointer-events-none text-sm font-black transition-colors ${question.correctAnswer === oIndex ? 'text-white' : 'text-muted-foreground group-hover/opt:text-primary'}`}>
                              {String.fromCharCode(65 + oIndex)}
                            </span>
                          </div>
                          <Input
                            placeholder={`Option ${String.fromCharCode(65 + oIndex)} content...`}
                            value={option}
                            onChange={(e) => updateOption(question.id, oIndex, e.target.value)}
                            className="h-10 border-none bg-transparent shadow-none focus-visible:ring-0 px-1 font-bold text-md pointer-events-auto"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-dashed border-muted-foreground/30">
                      <div className="flex items-center gap-4 pointer-events-auto">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Marks</Label>
                        <Input
                          type="number"
                          value={question.marks}
                          onChange={(e) => updateQuestion(question.id, "marks", parseInt(e.target.value) || 1)}
                          className="w-20 h-11 rounded-xl border-2 text-center font-black text-lg focus-visible:ring-primary"
                          min={1}
                        />
                      </div>
                      <div className="flex items-center gap-2 animate-pulse">
                        <div className="w-2 h-2 rounded-full bg-success" />
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Correct answer validated</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t-2 border-primary/10 p-5 px-8 z-[60] shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.1)]">
            <div className="container mx-auto max-w-4xl flex items-center justify-between">
              <Button variant="ghost" asChild className="font-black text-muted-foreground hover:text-foreground">
                <Link to="/employer/tests">EXIT WITHOUT SAVING</Link>
              </Button>
              <div className="flex items-center gap-6">
                <Button variant="outline" onClick={() => handleSubmit("draft")} disabled={loading} className="h-14 px-10 rounded-2xl border-4 border-primary/20 font-black tracking-widest hover:bg-primary/5 hover:border-primary/40 transition-all text-sm">
                  <Save className="w-5 h-5 mr-3" /> STASH DRAFT
                </Button>
                <Button onClick={() => handleSubmit("published")} disabled={loading} variant="hero" className="h-14 px-12 rounded-2xl font-black text-lg tracking-widest shadow-[0_10px_20px_-5px_theme(colors.primary.DEFAULT / 40%)] hover:translate-y-[-2px] active:translate-y-[1px] transition-all">
                  {loading ? <Loader2 className="w-6 h-6 mr-3 animate-spin" /> : <Eye className="w-6 h-6 mr-3" />}
                  COMMIT UPDATES
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EditTest;
