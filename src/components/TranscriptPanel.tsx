import { ThumbsUp, Clock, User, Loader2, Sparkles } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTranscripts } from "@/hooks/useData";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface TranscriptEntry {
  id: string;
  speaker: string;
  role: string | null;
  timestamp: string;
  text: string;
  sentiment: string | null;
}

const sentimentColors: Record<string, string> = {
  positive: "border-l-success",
  neutral: "border-l-info",
  negative: "border-l-destructive",
};

interface TranscriptPanelProps {
  hearingId?: string;
  streamUrl?: string;
}

export default function TranscriptPanel({ hearingId, streamUrl }: TranscriptPanelProps) {
  const { data: initialTranscripts = [] } = useTranscripts(hearingId);
  const [entries, setEntries] = useState<TranscriptEntry[]>([]);
  const [generating, setGenerating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (initialTranscripts.length > 0) {
      setEntries(initialTranscripts as any);
    }
  }, [initialTranscripts]);

  useEffect(() => {
    if (!hearingId) return;

    const channel = supabase
      .channel("transcript-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "transcript_entries",
          filter: `hearing_id=eq.${hearingId}`,
        },
        (payload) => {
          setEntries((prev) => [...prev, payload.new as TranscriptEntry]);
        }
      )
      .subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [hearingId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  const handleGenerateTranscript = async () => {
    if (!hearingId || !streamUrl) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("extract-transcript", {
        body: { hearingId, streamUrl },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Transcript Generated",
        description: `${data.count} entries extracted${data.aiProcessed ? " with AI speaker detection" : ""}.`,
      });

      // Refetch
      const { data: fresh } = await supabase
        .from("transcript_entries")
        .select("*")
        .eq("hearing_id", hearingId as any)
        .order("created_at", { ascending: true });
      if (fresh) setEntries(fresh as any);
    } catch (e: any) {
      console.error("Generate transcript error:", e);
      toast({
        title: "Error",
        description: e.message || "Failed to generate transcript",
        variant: "destructive",
      });
    }
    setGenerating(false);
  };

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <h3 className="font-display text-lg font-bold text-foreground">Live Transcript</h3>
        <div className="flex items-center gap-2">
          {streamUrl && entries.length === 0 && (
            <Button size="sm" variant="outline" onClick={handleGenerateTranscript} disabled={generating}>
              {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
              {generating ? "Extracting..." : "AI Transcript"}
            </Button>
          )}
          {entries.length > 0 && (
            <span className="flex items-center gap-2 rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
              </span>
              {entries.length} entries
            </span>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4 scroll-smooth">
        {entries.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center py-20 px-4">
            <div className="mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              {generating ? (
                <Loader2 className="h-6 w-6 text-accent animate-spin" />
              ) : (
                <Clock className="h-6 w-6 text-muted-foreground animate-pulse" />
              )}
            </div>
            {generating ? (
              <>
                <p className="text-sm font-medium text-foreground">Extracting transcript from YouTube captions...</p>
                <p className="mt-1 text-xs text-muted-foreground opacity-60">AI is processing captions and identifying speakers. This may take a moment.</p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-muted-foreground">No transcript entries yet.</p>
                <p className="mt-1 text-xs text-muted-foreground opacity-60">
                  {streamUrl
                    ? 'Click "AI Transcript" above to extract captions from the YouTube video.'
                    : "The AI transcription engine will start processing once the audio feed becomes active."}
                </p>
              </>
            )}
          </div>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className={`rounded-lg border-l-4 bg-muted/30 p-4 transition-all hover:bg-muted/50 ${sentimentColors[entry.sentiment || "neutral"] || sentimentColors.neutral}`}
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-primary">
                    <User className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-foreground">{entry.speaker}</span>
                    {entry.role && <span className="ml-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{entry.role}</span>}
                  </div>
                </div>
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="h-2.5 w-2.5" />
                  {entry.timestamp}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-foreground/90">{entry.text}</p>
            </div>
          ))
        )}
      </div>

      {entries.length > 0 && streamUrl && (
        <div className="border-t border-border px-4 py-2 flex justify-end">
          <Button size="sm" variant="ghost" onClick={handleGenerateTranscript} disabled={generating}>
            {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
            Regenerate
          </Button>
        </div>
      )}
    </div>
  );
}
