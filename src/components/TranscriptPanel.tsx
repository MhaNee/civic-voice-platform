import { ThumbsUp, Clock, User } from "lucide-react";

interface TranscriptEntry {
  id: string;
  speaker: string;
  role: string;
  timestamp: string;
  text: string;
  sentiment?: "positive" | "neutral" | "negative";
}

const mockTranscript: TranscriptEntry[] = [
  {
    id: "1",
    speaker: "Sen. Maria Torres",
    role: "Committee Chair",
    timestamp: "00:02:15",
    text: "Good morning. We're convening today to discuss the proposed Clean Air Amendment Act. This hearing will examine the environmental and economic impacts of the proposed legislation.",
    sentiment: "neutral",
  },
  {
    id: "2",
    speaker: "Dr. James Chen",
    role: "Environmental Scientist",
    timestamp: "00:05:42",
    text: "Thank you, Senator. Our research shows a 23% reduction in particulate matter is achievable within 5 years with the proposed standards. The health benefits alone would save an estimated $4.2 billion annually.",
    sentiment: "positive",
  },
  {
    id: "3",
    speaker: "Rep. David Okafor",
    role: "Committee Member",
    timestamp: "00:12:08",
    text: "Dr. Chen, what about the economic impact on small manufacturers? My constituents are concerned about compliance costs that could force plant closures.",
    sentiment: "negative",
  },
  {
    id: "4",
    speaker: "Dr. James Chen",
    role: "Environmental Scientist",
    timestamp: "00:14:33",
    text: "That's a valid concern. We recommend a phased implementation with tax incentives for small businesses. The transition fund in Section 4 of the bill addresses this directly.",
    sentiment: "neutral",
  },
  {
    id: "5",
    speaker: "Ms. Angela Wright",
    role: "Industry Representative",
    timestamp: "00:18:55",
    text: "While we support cleaner air goals, the timeline is unrealistic. Our members need at minimum 8 years, not 5, to retrofit existing facilities without mass layoffs.",
    sentiment: "negative",
  },
];

const sentimentColors = {
  positive: "border-l-success",
  neutral: "border-l-info",
  negative: "border-l-destructive",
};

export default function TranscriptPanel() {
  return (
    <div className="flex h-full flex-col bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <h3 className="font-display text-lg font-bold text-foreground">Live Transcript</h3>
        <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
          AI Transcribing
        </span>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto p-4">
        {mockTranscript.map((entry) => (
          <div
            key={entry.id}
            className={`rounded-lg border-l-4 bg-muted/50 p-4 transition-colors hover:bg-muted ${
              sentimentColors[entry.sentiment || "neutral"]
            }`}
          >
            <div className="mb-1.5 flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <User className="h-3.5 w-3.5" />
              </div>
              <div>
                <span className="text-sm font-semibold text-foreground">{entry.speaker}</span>
                <span className="ml-2 text-xs text-muted-foreground">{entry.role}</span>
              </div>
              <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {entry.timestamp}
              </span>
            </div>
            <p className="pl-10 text-sm leading-relaxed text-foreground/90">{entry.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
