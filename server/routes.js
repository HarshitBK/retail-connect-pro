import { getDb, getCollection } from "./db.js";
import { base64ToBuffer, getExtractor } from "./extract.js";
import { generateMcqs } from "./openai-mcq.js";

const SNAPSHOTS = "test_snapshots";
const DELIVERED = "attempt_delivered";

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom(arr, count) {
  if (count >= arr.length) return shuffleArray(arr);
  return shuffleArray(arr).slice(0, count);
}

export function registerRoutes(app) {
  // POST /api/generate-mcqs — body: { testName, description, role, fileName, mimeType, fileBase64, count? }
  app.post("/api/generate-mcqs", async (req, res) => {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: "OPENAI_API_KEY is not set on server." });
      }
      const { testName, description, role, fileName, mimeType, fileBase64, count: rawCount } = req.body || {};
      const count = Number.isFinite(rawCount) ? Math.max(1, Math.min(100, rawCount)) : 50;
      if (!testName || !role) {
        return res.status(400).json({ error: "testName and role are required." });
      }
      if (!fileName || !fileBase64) {
        return res.status(400).json({ error: "fileName and fileBase64 are required." });
      }
      const extract = getExtractor(fileName, mimeType);
      if (!extract) {
        return res.status(400).json({ error: "Unsupported file type. Use PDF or PPTX." });
      }
      const buffer = base64ToBuffer(fileBase64);
      const sourceText = await extract(buffer);
      if (!sourceText || sourceText.length < 50) {
        return res.status(400).json({
          error: "Could not extract enough text from the file. Try another file or add more content.",
        });
      }
      const questions = await generateMcqs({
        testName,
        description,
        role,
        sourceText,
        count,
      });
      if (questions.length === 0) {
        return res.status(502).json({
          error: "AI did not return usable questions. Try again with a different document.",
        });
      }
      res.json({ questions, extractedTextChars: sourceText.length });
    } catch (e) {
      console.error(e);
      const message = e instanceof Error ? e.message : "Unknown error";
      res.status(500).json({ error: message });
    }
  });

  // POST /api/tests/:testId/snapshot — body: { employerId, questionBank, approvedQuestionIds, questionsToShow }
  app.post("/api/tests/:testId/snapshot", async (req, res) => {
    try {
      await getDb();
      const col = getCollection(SNAPSHOTS);
      const testId = req.params.testId;
      const { employerId, questionBank, approvedQuestionIds, questionsToShow } = req.body || {};
      if (!testId) return res.status(400).json({ error: "testId required." });
      await col.updateOne(
        { testId },
        {
          $set: {
            testId,
            employerId: employerId || null,
            questionBank: Array.isArray(questionBank) ? questionBank : [],
            approvedQuestionIds: Array.isArray(approvedQuestionIds) ? approvedQuestionIds : [],
            questionsToShow: Number.isFinite(questionsToShow) ? questionsToShow : null,
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );
      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e instanceof Error ? e.message : "Unknown error" });
    }
  });

  // GET /api/tests/:testId/snapshot
  app.get("/api/tests/:testId/snapshot", async (req, res) => {
    try {
      await getDb();
      const col = getCollection(SNAPSHOTS);
      const doc = await col.findOne({ testId: req.params.testId });
      if (!doc) return res.status(404).json({ error: "Snapshot not found." });
      res.json({
        questionBank: doc.questionBank || [],
        approvedQuestionIds: doc.approvedQuestionIds || [],
        questionsToShow: doc.questionsToShow,
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e instanceof Error ? e.message : "Unknown error" });
    }
  });

  // POST /api/attempts/start — body: { testId, attemptId }; returns { deliveredQuestions }
  app.post("/api/attempts/start", async (req, res) => {
    try {
      await getDb();
      const snapCol = getCollection(SNAPSHOTS);
      const delCol = getCollection(DELIVERED);
      const { testId, attemptId } = req.body || {};
      if (!testId || !attemptId) {
        return res.status(400).json({ error: "testId and attemptId are required." });
      }
      const snapshot = await snapCol.findOne({ testId });
      if (!snapshot || !Array.isArray(snapshot.questionBank) || snapshot.questionBank.length === 0) {
        return res.status(404).json({ error: "No AI snapshot for this test. Use Supabase questions only." });
      }
      const approvedSet = new Set(
        (snapshot.approvedQuestionIds || []).map((x) => String(x)).filter(Boolean)
      );
      const pool = (snapshot.questionBank || []).filter((q) => q?.id && approvedSet.has(String(q.id)));
      const nToShow =
        Number.isFinite(snapshot.questionsToShow) && snapshot.questionsToShow > 0
          ? snapshot.questionsToShow
          : pool.length;
      const chosen = pickRandom(pool, Math.min(nToShow, pool.length));

      const delivered = chosen.map((q) => {
        const options = Array.isArray(q?.options) ? q.options.map((o) => String(o)) : [];
        const correctAnswer = typeof q?.correctAnswer === "number" ? q.correctAnswer : 0;
        if (options.length !== 4) return { ...q, options, correctAnswer };
        const indices = shuffleArray([0, 1, 2, 3]);
        const newOptions = indices.map((i) => options[i]);
        const newCorrect = indices.findIndex((i) => i === correctAnswer);
        return { ...q, options: newOptions, correctAnswer: newCorrect >= 0 ? newCorrect : 0 };
      });

      await delCol.updateOne(
        { attemptId },
        { $set: { attemptId, testId, deliveredQuestions: delivered, createdAt: new Date() } },
        { upsert: true }
      );
      res.json({ deliveredQuestions: delivered });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e instanceof Error ? e.message : "Unknown error" });
    }
  });
}
