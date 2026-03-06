
// Supabase Edge Function: Generate MCQs from PDF/PPTX using Lovable AI Gateway (Gemini).
// Sends the file as base64 to Gemini's multimodal API for text extraction + MCQ generation.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { testName, description, role, fileName, mimeType, fileBase64, count = 10 } = await req.json();

    if (!fileBase64) {
      return jsonResponse({ error: "No file content provided." }, { status: 400 });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return jsonResponse({ error: "AI API Key not configured." }, { status: 500 });
    }

    // Clean base64 - remove data URI prefix if present
    const cleanBase64 = fileBase64.replace(/^data:.*;base64,/, "");

    const prompt = `You are an expert assessment designer.

Analyze the attached document and create exactly ${count} multiple-choice questions for a candidate applying for the role of "${role}".
The test is named "${testName}" with description: "${description || 'N/A'}".

Requirements:
- Derive questions from the document content.
- Each question must have exactly 4 options.
- Exactly one option must be correct (index 0-3).
- Keep options concise and unambiguous.
- Avoid trick questions and "All of the above"/"None of the above".
- Each question must have a unique UUID as id.
- Return ONLY a valid JSON object with this exact structure:
{
  "questions": [
    { "id": "<uuid>", "question": "<string>", "options": ["A","B","C","D"], "correctAnswer": 0 }
  ]
}`;

    // Determine mime type for the file
    let fileMime = mimeType || "application/pdf";
    const ext = fileName?.toLowerCase().split('.').pop();
    if (ext === "pptx") {
      fileMime = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    } else if (ext === "pdf") {
      fileMime = "application/pdf";
    }

    // Use Gemini via Lovable AI Gateway with file as inline data
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:${fileMime};base64,${cleanBase64}`,
                },
              },
            ],
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI Gateway Error:", errText);
      return jsonResponse({ error: "AI service returned an error. Please try again." }, { status: 502 });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error("Empty AI response:", JSON.stringify(aiData));
      return jsonResponse({ error: "AI returned empty response. Try a different document." }, { status: 502 });
    }

    // Parse JSON from response - handle markdown code blocks
    let jsonStr = content.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const result = JSON.parse(jsonStr);

    if (!result?.questions || !Array.isArray(result.questions)) {
      console.error("Invalid AI response structure:", content);
      return jsonResponse({ error: "AI did not return valid questions. Please try again." }, { status: 502 });
    }

    // Validate and clean questions
    const cleanedQuestions = result.questions
      .filter((q: any) => q?.question && Array.isArray(q?.options) && q.options.length === 4)
      .map((q: any) => ({
        id: q.id || crypto.randomUUID(),
        question: q.question,
        options: q.options.map((o: any) => String(o)),
        correctAnswer: typeof q.correctAnswer === "number" ? q.correctAnswer : 0,
      }));

    if (cleanedQuestions.length === 0) {
      return jsonResponse({ error: "AI could not generate valid questions from this document." }, { status: 502 });
    }

    return jsonResponse({ questions: cleanedQuestions });
  } catch (error: any) {
    console.error("Function Error:", error);
    return jsonResponse({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
});
