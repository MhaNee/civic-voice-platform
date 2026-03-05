import { useState, useEffect } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface Topic {
  label: string;
  weight: number;
  sentiment: string;
}

const sentimentColor: Record<string, string> = {
  positive: "bg-success/15 text-success border-success/30",
  neutral: "bg-info/15 text-info border-info/30",
  negative: "bg-destructive/15 text-destructive border-destructive/30",
};

const sizeClasses = [
  "text-xs px-2 py-1",
  "text-sm px-2.5 py-1",
  "text-base px-3 py-1.5 font-semibold",
  "text-lg px-3.5 py-2 font-bold",
];

export default function TopicCloud() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasComments, setHasComments] = useState(true);

  const analyzeTopics = async () => {
    setLoading(true);
    try {
      // Fetch recent comments
      const { data: comments } = await supabase
        .from("comments")
        .select("text, sentiment")
        .order("created_at", { ascending: false })
        .limit(100);

      if (!comments || comments.length === 0) {
        setHasComments(false);
        setLoading(false);
        return;
      }

      setHasComments(true);
      const combinedText = (comments as any[]).map((c) => c.text).join("\n");

      const { data, error } = await supabase.functions.invoke("analyze-sentiment", {
        body: { text: combinedText, type: "topics" },
      });

      if (error) throw error;
      if (data?.topics) {
        setTopics(data.topics);
      }
    } catch (e) {
      console.error("Topic analysis error:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    analyzeTopics();
  }, []);

  if (!hasComments) {
    return (
      <div className="flex min-h-[150px] items-center justify-center p-8 text-center bg-muted/20 rounded-lg">
        <p className="text-sm text-muted-foreground">No comments yet. Topics will appear as citizens participate.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Button size="sm" variant="ghost" onClick={analyzeTopics} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
          {loading ? "Analyzing..." : "Refresh"}
        </Button>
      </div>
      {topics.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {topics.map((t, i) => {
            const sizeIdx = Math.min(Math.floor((t.weight / 10) * sizeClasses.length), sizeClasses.length - 1);
            return (
              <span
                key={i}
                className={`rounded-full border ${sentimentColor[t.sentiment] || sentimentColor.neutral} ${sizeClasses[sizeIdx]} transition-transform hover:scale-105`}
              >
                {t.label}
              </span>
            );
          })}
        </div>
      ) : loading ? (
        <div className="flex min-h-[120px] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex min-h-[120px] items-center justify-center p-8 text-center bg-muted/20 rounded-lg">
          <p className="text-sm text-muted-foreground">Click Refresh to analyze topics from citizen comments.</p>
        </div>
      )}
    </div>
  );
}
