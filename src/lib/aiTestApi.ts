
import { supabase } from "@/integrations/supabase/client";

/**
 * AI Test API - Now using Supabase Edge Functions for a seamless experience.
 */
export const aiTestApi = {
  async generateMcqs(payload: {
    testName: string;
    description?: string;
    role: string;
    fileName: string;
    mimeType: string;
    fileBase64: string;
    count?: number;
  }) {
    console.log("Invoking Edge Function: generate-skill-test-mcqs", {
      testName: payload.testName,
      role: payload.role,
      file: payload.fileName
    });

    try {
      const { data, error } = await supabase.functions.invoke("generate-skill-test-mcqs", {
        body: payload,
      });

      if (error) {
        console.error("Edge Function Invocation Error:", error);
        throw new Error(error.message || "Failed to generate questions. Edge function error.");
      }

      if (data?.error) {
        console.error("AI Generation Error:", data.error);
        throw new Error(data.error);
      }

      if (!data?.questions || !Array.isArray(data.questions)) {
        throw new Error("AI did not return any questions. Please check the document content.");
      }

      return data as { questions: { id: string; question: string; options: string[]; correctAnswer: number }[] };
    } catch (err: any) {
      console.error("AI API Error:", err);
      if (err.message?.includes("Failed to fetch")) {
        throw new Error("Connection failed. Ensure the Edge Function is deployed and accessible.");
      }
      throw err;
    }
  },

  async saveSnapshot(testId: string, payload: {
    employerId: string;
    questionBank: any[];
    approvedQuestionIds: string[];
    questionsToShow: number;
  }) {
    const BASE = import.meta.env.VITE_AI_API_URL || "http://127.0.0.1:3001";
    try {
      await fetch(`${BASE}/api/tests/${testId}/snapshot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.warn("Local snapshot server not reachable. This is optional.", e);
    }
  },

  async getSnapshot(testId: string): Promise<{
    questionBank: any[];
    approvedQuestionIds: string[];
    questionsToShow: number | null;
  } | null> {
    const BASE = import.meta.env.VITE_AI_API_URL || "http://127.0.0.1:3001";
    try {
      const res = await fetch(`${BASE}/api/tests/${testId}/snapshot`);
      if (res.status === 404) return null;
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  }
};
