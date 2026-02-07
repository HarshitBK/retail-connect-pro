import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save, 
  Eye, 
  Loader2,
  GripVertical
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  marks: number;
}

const CreateTest = () => {
  const navigate = useNavigate();
  const { user, employerProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [testData, setTestData] = useState({
    title: "",
    description: "",
    position: "",
    location: "",
    durationMinutes: 60,
    passingScore: 40,
  });

  const [questions, setQuestions] = useState<Question[]>([
    {
      id: crypto.randomUUID(),
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      marks: 1,
    },
  ]);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: crypto.randomUUID(),
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
        marks: 1,
      },
    ]);
  };

  const removeQuestion = (id: string) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const updateQuestion = (id: string, field: keyof Question, value: unknown) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        const newOptions = [...q.options];
        newOptions[optionIndex] = value;
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const handleSubmit = async (status: "draft" | "published") => {
    if (!testData.title || !testData.position) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in the title and position.",
        variant: "destructive",
      });
      return;
    }

    const validQuestions = questions.filter(q => q.question && q.options.every(o => o));
    if (validQuestions.length === 0) {
      toast({
        title: "No Valid Questions",
        description: "Please add at least one complete question.",
        variant: "destructive",
      });
      return;
    }

    if (!employerProfile?.id) {
      toast({
        title: "Error",
        description: "Employer profile not found. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("skill_tests").insert({
        employer_id: employerProfile.id,
        title: testData.title,
        description: testData.description,
        position: testData.position,
        location: testData.location,
        duration_minutes: testData.durationMinutes,
        passing_score: testData.passingScore,
        status: status,
        questions: validQuestions as unknown as null,
      });

      if (error) throw error;

      toast({
        title: status === "published" ? "Test Published!" : "Test Saved",
        description: status === "published" 
          ? "Your test is now visible to candidates." 
          : "Your test has been saved as draft.",
      });

      navigate("/employer/tests");
    } catch (error) {
      console.error("Error creating test:", error);
      toast({
        title: "Error",
        description: "Failed to create test. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)} 
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold">Create Skill Test</h1>
              <p className="text-muted-foreground">
                Create automated proctored tests to evaluate candidates
              </p>
            </div>
          </div>

          {/* Test Details */}
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
                    onChange={e => setTestData(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Position *</Label>
                  <Input
                    id="position"
                    placeholder="e.g., Retail Cashier"
                    value={testData.position}
                    onChange={e => setTestData(prev => ({ ...prev, position: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this test evaluates..."
                  value={testData.description}
                  onChange={e => setTestData(prev => ({ ...prev, description: e.target.value }))}
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
                    onChange={e => setTestData(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={testData.durationMinutes}
                    onChange={e => setTestData(prev => ({ ...prev, durationMinutes: parseInt(e.target.value) || 60 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passing">Passing Score (%)</Label>
                  <Input
                    id="passing"
                    type="number"
                    value={testData.passingScore}
                    onChange={e => setTestData(prev => ({ ...prev, passingScore: parseInt(e.target.value) || 40 }))}
                  />
                </div>
              </div>

              <div className="p-4 bg-accent/10 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Fee Structure:</strong> Employees pay ₹50 to take this test. 
                  You will be charged ₹30 for each employee who completes the test.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Questions */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Questions</CardTitle>
                  <CardDescription>Add multiple choice questions</CardDescription>
                </div>
                <Button onClick={addQuestion} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Question
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {questions.map((question, qIndex) => (
                <div key={question.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <GripVertical className="w-4 h-4" />
                      <span className="font-medium">Q{qIndex + 1}</span>
                    </div>
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

                  <div className="space-y-2">
                    <Label>Question</Label>
                    <Textarea
                      placeholder="Enter your question..."
                      value={question.question}
                      onChange={e => updateQuestion(question.id, "question", e.target.value)}
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
                          onChange={e => updateOption(question.id, oIndex, e.target.value)}
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
                        onChange={e => updateQuestion(question.id, "marks", parseInt(e.target.value) || 1)}
                        className="w-20"
                        min={1}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-6">
                      Select the correct answer by clicking the radio button
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={() => handleSubmit("draft")}
                disabled={loading}
              >
                <Save className="w-4 h-4 mr-2" />
                Save as Draft
              </Button>
              <Button 
                onClick={() => handleSubmit("published")}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Eye className="w-4 h-4 mr-2" />
                )}
                Publish Test
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateTest;
