import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-platform",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text, type } = await req.json();
    const API_KEY = Deno.env.get("CIVIC_VOICE_API_KEY") || Deno.env.get("LOVABLE_API_KEY");
    if (!API_KEY) throw new Error("AI API Key is not configured");

    let systemPrompt = "";
    const body: any = {
      model: "google/gemini-3-flash-preview",
      messages: [],
    };

    if (type === "sentiment") {
      systemPrompt = "You are a sentiment analysis tool for civic engagement. Analyze the given text and classify it. Return both the sentiment label (positive/neutral/negative) and a confidence score between 0 and 1 indicating how sure you are of the classification.";
      body.messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analyze the sentiment of this comment about a legislative hearing: "${text}"` },
      ];
      body.tools = [{
        type: "function",
        function: {
          name: "classify_sentiment",
          description: "Classify the sentiment of a public comment and include a confidence value",
          parameters: {
            type: "object",
            properties: {
              sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
              confidence: { type: "number" },
            },
            required: ["sentiment", "confidence"],
            additionalProperties: false,
          },
        },
      }];
      body.tool_choice = { type: "function", function: { name: "classify_sentiment" } };
    } else if (type === "summarize") {
      systemPrompt = "You are a legislative hearing summarizer. Create concise, actionable summaries for policymakers.";
      body.messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Summarize the following hearing transcript into an executive briefing with key points, risks, and recommendations:\n\n${text}` },
      ];
    } else if (type === "questions") {
      systemPrompt = "You are an AI that extracts key questions and generates survey questions from legislative hearing content.";
      body.messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Based on this hearing content, extract the key questions raised and generate 5 survey questions for public feedback:\n\n${text}` },
      ];
      body.tools = [{
        type: "function",
        function: {
          name: "extract_questions",
          description: "Extract questions from hearing and generate survey",
          parameters: {
            type: "object",
            properties: {
              extracted_questions: {
                type: "array",
                items: { type: "object", properties: { question: { type: "string" }, speaker: { type: "string" }, answered: { type: "boolean" } }, required: ["question", "speaker", "answered"], additionalProperties: false },
              },
              survey_questions: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: ["extracted_questions", "survey_questions"],
            additionalProperties: false,
          },
        },
      }];
      body.tool_choice = { type: "function", function: { name: "extract_questions" } };
    } else if (type === "caption_summary") {
      systemPrompt = "You are a real-time caption summarizer for live legislative hearings. Provide brief, clear closed-caption style summaries.";
      body.messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Create a brief 2-3 sentence closed-caption summary of what's being discussed:\n\n${text}` },
      ];
    }

    // Using a generic gateway if configured, otherwise fallback to default
    const GATEWAY_URL = Deno.env.get("AI_GATEWAY_URL") || "https://ai.gateway.lovable.dev/v1/chat/completions";

    const response = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    let result: any;

    if (type === "sentiment" || type === "questions") {
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall) {
        result = JSON.parse(toolCall.function.arguments);
      } else {
        result = { raw: data.choices?.[0]?.message?.content };
      }
    } else {
      result = { text: data.choices?.[0]?.message?.content };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
