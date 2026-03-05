import { useState, useEffect } from "react";
import { Captions, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface CaptionSummaryProps {
  hearingId: string;
}

export default function CaptionSummary({ hearingId }: CaptionSummaryProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [transcriptText, setTranscriptText] = useState("");

  // Fetch transcript entries for the hearing
  useEffect(() => {
    if (!hearingId) return;
    const fetchTranscript = async () => {
      const { data } = await supabase
        .from("transcript_entries")
        .select("speaker, text, timestamp")
        .eq("hearing_id", hearingId as any)
        .order("created_at", { ascending: true });
      if (data && data.length > 0) {
        const combined = (data as any[])
          .map((e) => `[${e.timestamp}] ${e.speaker}: ${e.text}`)
          .join("\n");
        setTranscriptText(combined);
      }
    };
    fetchTranscript();
  }, [hearingId]);

  const generateSummary = async () => {
    if (!transcriptText.trim()) {
      setSummary("No transcript entries available yet to summarize.");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-sentiment", {
        body: { text: transcriptText, type: "caption_summary" },
      });
      if (error) throw error;
      setSummary(data.text);
    } catch (e) {
      console.error("Summary error:", e);
      setSummary("Failed to generate summary. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Captions className="h-5 w-5 text-accent" />
          <h3 className="font-display text-base font-bold text-foreground">AI Caption Summary</h3>
        </div>
        <Button size="sm" variant="outline" onClick={generateSummary} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "Generating..." : "Summarize"}
        </Button>
      </div>
      {summary ? (
        <p className="text-sm leading-relaxed text-foreground/85">{summary}</p>
      ) : (
        <p className="text-sm text-muted-foreground">
          {transcriptText
            ? 'Click "Summarize" to get an AI-generated summary of the current hearing transcript.'
            : "Waiting for transcript entries to become available..."}
        </p>
      )}
    </div>
  );
}
