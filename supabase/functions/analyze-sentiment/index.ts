import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text, type } = await req.json();
    const API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt = "";
    const body: any = {
      model: "google/gemini-1.5-flash",
      messages: [],
    };

    if (type === "sentiment") {
      systemPrompt = `You are a sentiment analysis tool for civic engagement. 
      Analyze the text and classify it into: positive, neutral, or negative.
      
      Guidelines:
      - POSITIVE: Support, enthusiasm, constructive praise, or proactive suggestions that improve the discourse.
      - NEUTRAL: Factual questions, objective observations, requests for information, or balanced feedback that isn't purely critical.
      - NEGATIVE: Pure opposition, inflammatory language, frustration without resolution, or toxicity.
      
      Note: Constructive criticism that aims to improve a bill or process should be classified as NEUTRAL or POSITIVE engagement, not NEGATIVE.`;

      body.messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analyze this public comment: "${text}"` },
      ];
      body.tools = [{
        type: "function",
        function: {
          name: "classify_sentiment",
          description: "Classify the sentiment of a public comment",
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
          },
        },
      }];
      body.tool_choice = { type: "function", function: { name: "extract_questions" } };
    } else if (type === "caption_summary") {
      systemPrompt = "You are a real-time caption summarizer for live legislative hearings. Provide brief, clear closed-caption style summaries.";
      body.messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Create a brief 2-3 sentence summary of this hearing transcript:\n\n${text}` },
      ];
    } else if (type === "topics") {
      systemPrompt = "You are an AI that extracts key discussion topics from civic engagement comments.";
      body.messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Extract the top 8-12 key topics/themes from these public comments. For each topic, estimate its prominence (weight 1-10) and overall sentiment.\n\nComments:\n${text}` },
      ];
      body.tools = [{
        type: "function",
        function: {
          name: "extract_topics",
          description: "Extract key topics from public comments",
          parameters: {
            type: "object",
            properties: {
              topics: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    label: { type: "string", description: "Short topic label (1-3 words)" },
                    weight: { type: "number", description: "Prominence score 1-10" },
                    sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
                  },
                  required: ["label", "weight", "sentiment"],
                  additionalProperties: false,
                },
              },
            },
            required: ["topics"],
            additionalProperties: false,
          },
        },
      }];
      body.tool_choice = { type: "function", function: { name: "extract_topics" } };
    } else if (type === "insights") {
      systemPrompt = "You are a legislative analyst AI. Generate structured policy insights from hearing data and public comments.";
      body.messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analyze this legislative hearing data and public feedback. Generate a comprehensive policy briefing.\n\n${text}` },
      ];
      body.tools = [{
        type: "function",
        function: {
          name: "generate_insights",
          description: "Generate structured legislative insights",
          parameters: {
            type: "object",
            properties: {
              executive_summary: { type: "string", description: "2-3 paragraph executive summary" },
              key_arguments_for: { type: "array", items: { type: "string" }, description: "3-5 arguments supporting the legislation" },
              key_arguments_against: { type: "array", items: { type: "string" }, description: "3-5 arguments against the legislation" },
              risk_indicators: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    topic: { type: "string" },
                    risk: { type: "string", enum: ["high", "medium", "low"] },
                    detail: { type: "string" },
                  },
                  required: ["topic", "risk", "detail"],
                  additionalProperties: false,
                },
              },
              recommendations: { type: "array", items: { type: "string" }, description: "3-5 actionable recommendations" },
            },
            required: ["executive_summary", "key_arguments_for", "key_arguments_against", "risk_indicators", "recommendations"],
            additionalProperties: false,
          },
        },
      }];
      body.tool_choice = { type: "function", function: { name: "generate_insights" } };
    }

    const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

    const response = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    let result: any;

    if (type === "sentiment" || type === "questions" || type === "topics" || type === "insights") {
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall) {
        result = JSON.parse(toolCall.function.arguments);
      } else {
        // Fallback: try to extract sentiment from content text if tool wasn't used
        const content = data.choices?.[0]?.message?.content?.toLowerCase() || "";
        if (type === "sentiment") {
          let detected = "neutral";
          if (content.includes("positive")) detected = "positive";
          else if (content.includes("negative")) detected = "negative";
          result = { sentiment: detected, confidence: 0.5 };
        } else {
          result = { raw: content };
        }
      }
    } else {
      result = { text: data.choices?.[0]?.message?.content };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Sentiment Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Internal Server Error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
