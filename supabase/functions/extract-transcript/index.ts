import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'")
    .replace(/<[^>]+>/g, "").trim();
}

async function fetchYouTubeCaptions(videoId: string): Promise<string> {
  // Try InnerTube API first
  const innertubeResp = await fetch("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      videoId,
      context: {
        client: { clientName: "WEB", clientVersion: "2.20250101.00.00", hl: "en" },
      },
    }),
  });

  if (!innertubeResp.ok) {
    throw new Error(`InnerTube API returned ${innertubeResp.status}`);
  }

  const playerData = await innertubeResp.json();
  const tracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

  if (!tracks || tracks.length === 0) {
    throw new Error("No captions available for this video. Use the 'Paste' option to manually provide transcript text.");
  }

  // Prefer English, then any track
  const track = tracks.find((t: any) => t.languageCode === "en") || tracks[0];
  if (!track?.baseUrl) throw new Error("No caption track URL found");

  // Fetch the caption XML
  const captionResp = await fetch(track.baseUrl + "&fmt=srv3");
  if (!captionResp.ok) throw new Error("Failed to fetch caption track");
  const xml = await captionResp.text();

  // Parse captions
  const captionRegex = /<text[^>]*?start="([\d.]+)"[^>]*?>([\s\S]*?)<\/text>/g;
  const captions: Array<{ start: number; text: string }> = [];
  let m;
  while ((m = captionRegex.exec(xml)) !== null) {
    const text = decodeEntities(m[2]);
    if (text) captions.push({ start: parseFloat(m[1]), text });
  }

  if (captions.length === 0) throw new Error("No caption text found in track");

  // Group into ~30s segments
  const segments: Array<{ start: number; text: string }> = [];
  let currentSegment = { start: captions[0].start, texts: [captions[0].text] };
  for (let i = 1; i < captions.length; i++) {
    if (captions[i].start - currentSegment.start > 30) {
      segments.push({ start: currentSegment.start, text: currentSegment.texts.join(" ") });
      currentSegment = { start: captions[i].start, texts: [captions[i].text] };
    } else {
      currentSegment.texts.push(captions[i].text);
    }
  }
  segments.push({ start: currentSegment.start, text: currentSegment.texts.join(" ") });

  console.log(`Extracted ${captions.length} captions into ${segments.length} segments`);
  return segments.map(s => `[${formatTimestamp(s.start)}] ${s.text}`).join("\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const { hearingId, videoId, rawText } = body;
    if (!hearingId) throw new Error("hearingId is required");

    let rawTranscript = "";

    if (rawText && typeof rawText === "string" && rawText.trim().length > 0) {
      rawTranscript = rawText.trim();
      console.log(`Processing pasted raw text (${rawTranscript.length} chars)`);
    } else if (videoId && typeof videoId === "string") {
      rawTranscript = await fetchYouTubeCaptions(videoId);
    } else {
      throw new Error("Either 'videoId' or 'rawText' is required");
    }

    // AI processing
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a transcript processor for legislative hearings. Given raw transcript text or YouTube captions, produce structured transcript entries.
For each segment, identify the speaker if possible (from context clues like "Chairman", "Senator", "Witness", names, colons, etc). If you can't identify the speaker, use "Speaker".
Assign logical timestamps (e.g. "0:00", "0:30", "1:00") based on the flow of conversation if none are present.
Also classify each segment's sentiment as: positive, neutral, or negative.`,
          },
          { role: "user", content: `Process this transcript text into structured entries:\n\n${rawTranscript}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "save_transcript",
            description: "Save processed transcript entries",
            parameters: {
              type: "object",
              properties: {
                entries: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      timestamp: { type: "string" },
                      speaker: { type: "string" },
                      role: { type: "string" },
                      text: { type: "string" },
                      sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
                    },
                    required: ["timestamp", "speaker", "text", "sentiment"],
                  },
                },
              },
              required: ["entries"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "save_transcript" } },
      }),
    });

    // Setup DB
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    let entries: any[] = [];
    let aiProcessed = false;

    if (aiResp.ok) {
      try {
        const aiData = await aiResp.json();
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
        if (toolCall) {
          const parsed = JSON.parse(toolCall.function.arguments);
          entries = parsed.entries || [];
          aiProcessed = true;
        }
      } catch { /* fallback below */ }
    } else {
      const errText = await aiResp.text();
      console.error("AI error:", aiResp.status, errText);
    }

    // Fallback: split rawTranscript into simple segments
    if (entries.length === 0) {
      const lines = rawTranscript.split("\n").filter(l => l.trim());
      entries = lines.map((line, i) => ({
        timestamp: `${Math.floor(i * 0.5)}:${String((i * 30) % 60).padStart(2, "0")}`,
        speaker: "Speaker",
        role: null,
        text: line.replace(/^\[[\d:]+\]\s*/, ""),
        sentiment: "neutral",
      }));
    }

    // Clear old and insert new
    await supabase.from("transcript_entries").delete().eq("hearing_id", hearingId);

    const dbEntries = entries.map((e: any) => ({
      hearing_id: hearingId,
      speaker: e.speaker || "Speaker",
      role: e.role || null,
      timestamp: e.timestamp || "0:00",
      text: e.text,
      sentiment: e.sentiment || "neutral",
    }));

    const { error: insertErr } = await supabase.from("transcript_entries").insert(dbEntries);
    if (insertErr) throw insertErr;

    return new Response(JSON.stringify({ success: true, count: dbEntries.length, aiProcessed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-transcript error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
