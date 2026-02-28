import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function makePrompt({ testName, description, role, sourceText, count }) {
  const clipped = sourceText.slice(0, 50_000);
  return `
You are an expert assessment designer.

Create exactly ${count} multiple-choice questions (MCQs) for the role "${role}".
Test name: "${testName}"
Test description: "${description || ""}"

Requirements:
- Derive questions from the source material when possible, but also use general domain knowledge to fill gaps.
- Each question must have exactly 4 options.
- Exactly one option must be correct.
- Keep options concise and unambiguous.
- Avoid trick questions and avoid "All of the above"/"None of the above".
- Output MUST be valid JSON ONLY (no markdown), matching this schema:
{
  "questions": [
    { "id": "<uuid>", "question": "<string>", "options": ["A","B","C","D"], "correctAnswer": 0 }
  ]
}

Source material (may be truncated):
${clipped}
`.trim();
}

function coerceQuestions(raw, fallbackCount) {
  const arr = raw?.questions;
  if (!Array.isArray(arr)) return [];
  const cleaned = [];
  for (const q of arr) {
    const question = typeof q?.question === "string" ? q.question.trim() : "";
    const options = Array.isArray(q?.options) ? q.options.map((o) => String(o ?? "").trim()) : [];
    const correctAnswer = Number.isInteger(q?.correctAnswer) ? q.correctAnswer : 0;
    const id = typeof q?.id === "string" && q.id ? q.id : crypto.randomUUID();
    if (!question) continue;
    if (options.length !== 4 || options.some((o) => !o)) continue;
    if (correctAnswer < 0 || correctAnswer > 3) continue;
    cleaned.push({ id, question, options, correctAnswer });
  }
  return cleaned.slice(0, fallbackCount);
}

export async function generateMcqs({ testName, description, role, sourceText, count = 50 }) {
  const prompt = makePrompt({ testName, description, role, sourceText, count });
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const response = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: "You are an expert assessment designer. Return strict JSON only." },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
  });

  const text = response.choices[0].message.content;
  if (typeof text !== "string" || !text.trim()) throw new Error("OpenAI returned empty content.");
  const parsed = JSON.parse(text);
  return coerceQuestions(parsed, count);
}
