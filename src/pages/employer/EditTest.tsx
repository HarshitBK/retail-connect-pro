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
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
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
    location: "",
    durationMinutes: 60,
    passingScore: 40,
  });

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
        count: 50,
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
        location: testRow.location || "",
        durationMinutes: testRow.duration_minutes || 60,
        passingScore: testRow.passing_score || 40,
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
    if (!testData.title || !testData.position) {
      toast({ title: "Missing required fields", description: "Fill in title and position.", variant: "destructive" });
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
          location: testData.location,
          duration_minutes: testData.durationMinutes,
          passing_score: testData.passingScore,
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
    <div className="min-h-screen bg-muted/30">
      <Header />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Button variant="ghost" asChild className="mb-6">
            <Link to="/employer/tests">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Link>
          </Button>

          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold">Edit Skill Test</h1>
            <p className="text-muted-foreground">Update test details and questions</p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Test Details</CardTitle>
              <CardDescription>Basic information about your test</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Test Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Cashier Skills Assessment"
                    value={testData.title}
                    onChange={(e) => setTestData((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Position *</Label>
                  <Input
                    id="position"
                    placeholder="e.g., Retail Cashier"
                    value={testData.position}
                    onChange={(e) => setTestData((prev) => ({ ...prev, position: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this test evaluates..."
                  value={testData.description}
                  onChange={(e) => setTestData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Bangalore"
                    value={testData.location}
                    onChange={(e) => setTestData((prev) => ({ ...prev, location: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={testData.durationMinutes}
                    onChange={(e) => setTestData((prev) => ({ ...prev, durationMinutes: parseInt(e.target.value) || 60 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passing">Passing Score (%)</Label>
                  <Input
                    id="passing"
                    type="number"
                    value={testData.passingScore}
                    onChange={(e) => setTestData((prev) => ({ ...prev, passingScore: parseInt(e.target.value) || 40 }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Questions</CardTitle>
                  <CardDescription>Edit multiple choice questions</CardDescription>
                </div>
                <Button onClick={addQuestion} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" /> Add Question
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border rounded-lg p-4 bg-accent/10 space-y-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-medium">AI Question Generator (PDF/PPTX)</p>
                    <p className="text-sm text-muted-foreground">
                      Upload a document and generate ~50 MCQs, then select and edit.
                    </p>
                  </div>
                  <Button onClick={generateWithAi} disabled={generating} variant="secondary">
                    {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Generate 50 MCQs
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ai-file">Upload PDF/PPTX</Label>
                    <Input
                      id="ai-file"
                      type="file"
                      accept=".pdf,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                      onChange={(e) => setGeneratorFile(e.target.files?.[0] ?? null)}
                    />
                    <p className="text-xs text-muted-foreground">
                      {generatorFile ? `Selected: ${generatorFile.name}` : "No file selected"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="questionsToShow">Questions to show (random from selected)</Label>
                    <Input
                      id="questionsToShow"
                      type="number"
                      value={questionsToShow}
                      onChange={(e) => setQuestionsToShow(parseInt(e.target.value) || 20)}
                      min={1}
                    />
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  Selected:{" "}
                  <span className="font-medium text-foreground">
                    {questions.filter((q) => q.selected).length}
                  </span>{" "}
                  / {questions.length}
                </div>
              </div>

              {questions.map((question, qIndex) => (
                <div key={question.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <GripVertical className="w-4 h-4" />
                      <span className="font-medium">Q{qIndex + 1}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={question.selected}
                          onChange={(e) => updateQuestion(question.id, "selected", e.target.checked)}
                          className="w-4 h-4"
                        />
                        Include
                      </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(question.id)}
                      disabled={questions.length === 1}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Question</Label>
                    <Textarea
                      placeholder="Enter your question..."
                      value={question.question}
                      onChange={(e) => updateQuestion(question.id, "question", e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    {question.options.map((option, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${question.id}`}
                          checked={question.correctAnswer === oIndex}
                          onChange={() => updateQuestion(question.id, "correctAnswer", oIndex)}
                          className="w-4 h-4 text-primary"
                        />
                        <Input
                          placeholder={`Option ${oIndex + 1}`}
                          value={option}
                          onChange={(e) => updateOption(question.id, oIndex, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="space-y-1">
                      <Label className="text-sm">Marks</Label>
                      <Input
                        type="number"
                        value={question.marks}
                        onChange={(e) => updateQuestion(question.id, "marks", parseInt(e.target.value) || 1)}
                        className="w-20"
                        min={1}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <Button variant="outline" asChild>
              <Link to="/employer/tests">Cancel</Link>
            </Button>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => handleSubmit("draft")} disabled={loading}>
                <Save className="w-4 h-4 mr-2" /> Save as Draft
              </Button>
              <Button onClick={() => handleSubmit("published")} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Eye className="w-4 h-4 mr-2" />}
                Update & Publish
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EditTest;
