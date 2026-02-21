// Supabase Edge Function: Generate MCQs from PDF/PPTX using an AI API.
// Expects JSON body: { testName, description, role, fileName, mimeType, fileBase64, count? }

import JSZip from "npm:jszip@3.10.1";

type Mcq = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
};

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...corsHeaders,
      ...(init?.headers ?? {}),
    },
  });
}

function base64ToUint8Array(base64: string): Uint8Array {
  const cleaned = base64.replace(/^data:.*;base64,/, "");
  const bin = atob(cleaned);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function normalizeWhitespace(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

function decodeXmlEntities(input: string) {
  return input
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&#39;", "'");
}

async function extractTextFromPptx(bytes: Uint8Array): Promise<string> {
  const zip = await JSZip.loadAsync(bytes);
  const slideXmlFiles = Object.keys(zip.files)
    .filter((p) => /^ppt\/slides\/slide\d+\.xml$/i.test(p))
    .sort((a, b) => {
      const an = parseInt(a.match(/slide(\d+)\.xml/i)?.[1] ?? "0", 10);
      const bn = parseInt(b.match(/slide(\d+)\.xml/i)?.[1] ?? "0", 10);
      return an - bn;
    });

  const texts: string[] = [];
  for (const path of slideXmlFiles) {
    const xml = await zip.files[path].async("string");
    const matches = [...xml.matchAll(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g)];
    for (const m of matches) {
      const t = decodeXmlEntities(m[1] ?? "");
      const cleaned = normalizeWhitespace(t);
      if (cleaned) texts.push(cleaned);
    }
    texts.push("\n");
  }
  return normalizeWhitespace(texts.join(" "));
}

async function extractTextFromPdf(bytes: Uint8Array): Promise<string> {
  // pdfjs-dist works in many JS runtimes; use the legacy build for broad compatibility.
  const pdfjs = await import("npm:pdfjs-dist@4.10.38/legacy/build/pdf.mjs");
  // @ts-expect-error runtime var
  pdfjs.GlobalWorkerOptions.workerSrc = undefined;
  const loadingTask = pdfjs.getDocument({ data: bytes });
  const pdf = await loadingTask.promise;
  const parts: string[] = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    // @ts-expect-error pdfjs item typing
    const strings = (content.items ?? []).map((it) => (it.str ?? "")).filter(Boolean);
    parts.push(strings.join(" "));
  }
  return normalizeWhitespace(parts.join("\n"));
}

function makePrompt(opts: {
  testName: string;
  description?: string;
  role: string;
  sourceText: string;
  count: number;
}) {
  const clipped = opts.sourceText.slice(0, 50_000);
  return `
You are an expert assessment designer.

Create exactly ${opts.count} multiple-choice questions (MCQs) for the role "${opts.role}".
Test name: "${opts.testName}"
Test description: "${opts.description ?? ""}"

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

function coerceQuestions(raw: unknown, fallbackCount: number): Mcq[] {
  const arr = (raw as { questions?: unknown })?.questions;
  if (!Array.isArray(arr)) return [];
  const cleaned: Mcq[] = [];
  for (const q of arr) {
    const qq = q as { id?: unknown; question?: unknown; options?: unknown; correctAnswer?: unknown };
    const question = typeof qq?.question === "string" ? qq.question.trim() : "";
    const options = Array.isArray(qq?.options) ? (qq.options as unknown[]).map((o) => String(o ?? "").trim()) : [];
    const correctAnswer = Number.isInteger(qq?.correctAnswer) ? (qq.correctAnswer as number) : 0;
    const id = typeof qq?.id === "string" && qq.id ? qq.id : crypto.randomUUID();
    if (!question) continue;
    if (options.length !== 4 || options.some((o) => !o)) continue;
    if (correctAnswer < 0 || correctAnswer > 3) continue;
    cleaned.push({ id, question, options, correctAnswer });
  }
  // If AI returns more than needed, trim. If fewer, return what we have.
  return cleaned.slice(0, fallbackCount);
}

async function callOpenAi(prompt: string) {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY in function environment.");
  }
  const model = Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini";

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Return strict JSON only." },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI error (${res.status}): ${text}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("OpenAI returned empty content.");
  }
  return JSON.parse(content);
}

async function assertEmployer(authorization: string | null) {
  if (!authorization) throw new Error("Missing Authorization header.");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnon) throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY.");

  const { createClient } = await import("npm:@supabase/supabase-js@2.95.3");
  const supabase = createClient(supabaseUrl, supabaseAnon, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  const userId = userData?.user?.id;
  if (!userId) throw new Error("Unauthorized.");

  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("user_type")
    .eq("id", userId)
    .maybeSingle();
  if (profErr) throw profErr;
  if (profile?.user_type !== "employer") throw new Error("Only employers can generate tests.");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const authorization = req.headers.get("authorization");
    await assertEmployer(authorization);

    const body = await req.json();
    const testName = String(body?.testName ?? "").trim();
    const description = typeof body?.description === "string" ? body.description : "";
    const role = String(body?.role ?? "").trim();
    const fileName = String(body?.fileName ?? "").trim();
    const mimeType = String(body?.mimeType ?? "").trim();
    const fileBase64 = String(body?.fileBase64 ?? "");
    const count = Number.isFinite(body?.count) ? Math.max(1, Math.min(100, body.count)) : 50;

    if (!testName || !role) {
      return jsonResponse({ error: "testName and role are required." }, { status: 400 });
    }
    if (!fileName || !fileBase64) {
      return jsonResponse({ error: "fileName and fileBase64 are required." }, { status: 400 });
    }

    const bytes = base64ToUint8Array(fileBase64);
    const ext = fileName.toLowerCase().split(".").pop() || "";

    let sourceText = "";
    if (ext === "pptx" || mimeType.includes("presentation")) {
      sourceText = await extractTextFromPptx(bytes);
    } else if (ext === "pdf" || mimeType.includes("pdf")) {
      sourceText = await extractTextFromPdf(bytes);
    } else {
      return jsonResponse({ error: "Unsupported file type. Please upload a PDF or PPTX." }, { status: 400 });
    }

    if (!sourceText || sourceText.length < 50) {
      return jsonResponse(
        { error: "Could not extract enough text from the file. Try another file or add more content." },
        { status: 400 },
      );
    }

    const prompt = makePrompt({ testName, description, role, sourceText, count });
    const aiJson: unknown = await callOpenAi(prompt);
    const questions = coerceQuestions(aiJson, count);

    if (questions.length === 0) {
      return jsonResponse(
        { error: "AI did not return usable questions. Try again with a different document or more content." },
        { status: 502 },
      );
    }

    return jsonResponse({ questions, extractedTextChars: sourceText.length });
  } catch (e: unknown) {
    console.error(e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonResponse({ error: message }, { status: 500 });
  }
});

