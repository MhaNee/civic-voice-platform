import Layout from "@/components/Layout";
import TopicCloud from "@/components/TopicCloud";
import StatsCard from "@/components/StatsCard";
import { TrendingUp, AlertTriangle, CheckCircle, Users, MessageSquare, Lightbulb } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const topConcerns = [
  { concern: "Job losses during transition", mentions: 342, sentiment: "negative" as const },
  { concern: "Health benefits of cleaner air", mentions: 287, sentiment: "positive" as const },
  { concern: "Implementation timeline too short", mentions: 231, sentiment: "negative" as const },
  { concern: "Small business tax credits", mentions: 198, sentiment: "positive" as const },
  { concern: "Rural community impact", mentions: 165, sentiment: "neutral" as const },
];

const engagementByRegion = [
  { region: "Northeast", comments: 420 },
  { region: "Southeast", comments: 310 },
  { region: "Midwest", comments: 380 },
  { region: "Southwest", comments: 250 },
  { region: "West", comments: 440 },
];

const sentimentBadge = {
  positive: "bg-success/10 text-success",
  neutral: "bg-info/10 text-info",
  negative: "bg-destructive/10 text-destructive",
};

const aiQuestions = [
  "Should the compliance deadline be extended from 5 to 8 years?",
  "Do you support additional tax incentives for small manufacturers?",
  "How should the transition fund in Section 4 be allocated?",
  "What level of emissions reduction is realistic for your region?",
  "Should rural areas receive different compliance timelines?",
];

export default function PeoplesView() {
  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">People's View</h1>
          <p className="mt-1 text-muted-foreground">
            Civic insight dashboard - what the public thinks about the Clean Air Amendment Act.
          </p>
        </div>

        {/* Stats row */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <StatsCard icon={<Users className="h-5 w-5" />} label="Total Participants" value="4,832" change="+12% from last hearing" positive />
          <StatsCard icon={<MessageSquare className="h-5 w-5" />} label="Comments Analyzed" value="1,800" />
          <StatsCard icon={<TrendingUp className="h-5 w-5" />} label="Avg Engagement" value="4.2 min" change="+18% engagement time" positive />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Topic Cloud */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <h3 className="mb-2 font-display text-lg font-bold text-foreground">Key Themes</h3>
            <p className="mb-2 text-sm text-muted-foreground">Most discussed topics by the public</p>
            <TopicCloud />
          </div>

          {/* Top Concerns */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <h3 className="mb-4 font-display text-lg font-bold text-foreground">Top Concerns</h3>
            <div className="space-y-3">
              {topConcerns.map((c, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium text-foreground">{c.concern}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{c.mentions} mentions</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${sentimentBadge[c.sentiment]}`}>
                      {c.sentiment}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Engagement by Region */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <h3 className="mb-4 font-display text-lg font-bold text-foreground">Engagement by Region</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={engagementByRegion}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
                <XAxis dataKey="region" tick={{ fontSize: 12, fill: "hsl(215, 16%, 47%)" }} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(215, 16%, 47%)" }} />
                <Tooltip />
                <Bar dataKey="comments" fill="hsl(38, 92%, 50%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* AI-Generated Questions */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="mb-4 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-accent" />
              <h3 className="font-display text-lg font-bold text-foreground">AI-Generated Survey</h3>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Questions generated by AI based on hearing transcript, public comments, and sentiment trends.
            </p>
            <div className="space-y-3">
              {aiQuestions.map((q, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg border border-border bg-background p-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                    {i + 1}
                  </span>
                  <p className="text-sm text-foreground">{q}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
