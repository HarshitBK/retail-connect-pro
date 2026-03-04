
// Supabase Edge Function: Generate MCQs from PDF/PPTX using an AI API.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import JSZip from "npm:jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Mcq = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
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

async function extractTextFromPptx(bytes: Uint8Array): Promise<string> {
  try {
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
        texts.push(m[1] ?? "");
      }
      texts.push("\n");
    }
    return texts.join(" ").replace(/\s+/g, " ").trim();
  } catch (err) {
    console.error("PPTX Error:", err);
    throw new Error("Failed to extract text from PPTX file.");
  }
}

async function extractTextFromPdf(bytes: Uint8Array): Promise<string> {
  try {
    // Note: pdfjs-dist can be heavy. Ensure Deno can handle it or use a simpler lib if needed.
    const pdfjs = await import("npm:pdfjs-dist@4.10.38/legacy/build/pdf.mjs");
    // @ts-ignore: standard pdfjs worker setup
    pdfjs.GlobalWorkerOptions.workerSrc = undefined;

    const loadingTask = pdfjs.getDocument({ data: bytes });
    const pdf = await loadingTask.promise;
    let fullText = "";
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();
      // @ts-ignore: pdfjs items
      const strings = content.items.map((it: any) => it.str);
      fullText += strings.join(" ") + "\n";
    }
    return fullText.replace(/\s+/g, " ").trim();
  } catch (err) {
    console.error("PDF Error:", err);
    throw new Error("Failed to extract text from PDF file. Make sure it's not password protected.");
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { testName, description, role, fileName, mimeType, fileBase64, count = 10 } = await req.json();

    if (!fileBase64) {
      return jsonResponse({ error: "No file content provided." }, { status: 400 });
    }

    const bytes = base64ToUint8Array(fileBase64);
    const ext = fileName.toLowerCase().split('.').pop();

    let sourceText = "";
    if (ext === "pptx" || mimeType.includes("presentation")) {
      sourceText = await extractTextFromPptx(bytes);
    } else if (ext === "pdf" || mimeType.includes("pdf")) {
      sourceText = await extractTextFromPdf(bytes);
    } else {
      return jsonResponse({ error: "Unsupported file type. Use PDF or PPTX." }, { status: 400 });
    }

    if (!sourceText || sourceText.length < 50) {
      return jsonResponse({ error: "Extracted text is too short to generate a meaningful test." }, { status: 400 });
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return jsonResponse({ error: "OpenAI API Key not configured in Edge Functions." }, { status: 500 });
    }

    const prompt = `
      You are an expert assessment designer. 
      Create exactly ${count} multiple-choice questions for a candidate apply for the role of "${role}".
      The test is named "${testName}" with description: "${description}".
      
      Requirements:
      - Use the following source material content.
      - Each question must have exactly 4 options.
      - Only one correct answer (index 0-3).
      - Format: Return ONLY a JSON object with a "questions" array.
      - Each question object: { "id": "uuid", "question": "...", "options": ["...", "...", "...", "..."], "correctAnswer": index }

      Source material:
      ${sourceText.substring(0, 15000)}
    `;

    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo-1106", // or gpt-4-1106-preview
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("OpenAI Error:", errText);
      return jsonResponse({ error: "OpenAI API returned an error." }, { status: 502 });
    }

    const aiData = await aiResponse.json();
    const result = JSON.parse(aiData.choices[0].message.content);

    return jsonResponse({ questions: result.questions });
  } catch (error: any) {
    console.error("Function Error:", error);
    return jsonResponse({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
});
