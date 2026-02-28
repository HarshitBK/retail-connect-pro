/**
 * Local AI test API (Node + MongoDB). Set VITE_AI_API_URL in .env.
 */
const BASE = import.meta.env.VITE_AI_API_URL || "http://127.0.0.1:3001";

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
    const res = await fetch(`${BASE}/api/generate-mcqs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : "Failed to generate questions.");
    return data as { questions: { id: string; question: string; options: string[]; correctAnswer: number }[] };
  },

  async saveSnapshot(testId: string, payload: {
    employerId: string;
    questionBank: unknown[];
    approvedQuestionIds: string[];
    questionsToShow: number;
  }) {
    const res = await fetch(`${BASE}/api/tests/${testId}/snapshot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : "Failed to save snapshot.");
  },

  async getSnapshot(testId: string): Promise<{
    questionBank: unknown[];
    approvedQuestionIds: string[];
    questionsToShow: number | null;
  } | null> {
    const res = await fetch(`${BASE}/api/tests/${testId}/snapshot`);
    if (res.status === 404) return null;
    const data = await res.json();
    if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : "Failed to load snapshot.");
    return data;
  },

  async startAttempt(testId: string, attemptId: string): Promise<{
    deliveredQuestions: { question?: string; options?: string[]; correctAnswer?: number }[];
  }> {
    const res = await fetch(`${BASE}/api/attempts/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ testId, attemptId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : "Failed to start attempt.");
    return data;
  },
};
