import Layout from "@/components/Layout";
import {
  FileText,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Download,
} from "lucide-react";

const executiveSummary = `The Clean Air Amendment Act hearing revealed strong public support for cleaner air goals (52% positive sentiment) but significant concerns about implementation timeline and economic impact on small businesses. Key stakeholders agree on the need for emissions reduction but diverge on the pace of transition. AI analysis suggests extending the timeline from 5 to 8 years and strengthening the small business tax credit program would increase public approval by an estimated 15%.`;

const keyArguments = {
  forBill: [
    "$4.2B annual savings in healthcare costs",
    "23% reduction in particulate matter within 5 years",
    "Tax incentives for small business compliance",
    "Phased implementation reduces economic shock",
  ],
  againstBill: [
    "5-year timeline is unrealistic for manufacturers",
    "Compliance costs may force small plant closures",
    "Rural communities disproportionately affected",
    "Insufficient transition funding in current draft",
  ],
};

const riskIndicators = [
  { topic: "Job displacement", risk: "high", detail: "65% negative sentiment on employment impact" },
  { topic: "Timeline feasibility", risk: "high", detail: "72% believe 5-year timeline is too aggressive" },
  { topic: "Small business burden", risk: "medium", detail: "Mixed sentiment - tax credits help but may not be enough" },
  { topic: "Public health framing", risk: "low", detail: "85% positive sentiment on health benefits" },
];

const riskColors = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-warning/10 text-warning",
  low: "bg-success/10 text-success",
};

export default function InsightsPage() {
  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Legislative Insights</h1>
            <p className="mt-1 text-muted-foreground">
              AI-generated briefing for policymakers on the Clean Air Amendment Act.
            </p>
          </div>
          <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105">
            <Download className="h-4 w-4" />
            Export Briefing
          </button>
        </div>

        {/* Executive Summary */}
        <div className="mb-8 rounded-xl border border-border bg-card p-6 shadow-card">
          <div className="mb-3 flex items-center gap-2">
            <FileText className="h-5 w-5 text-accent" />
            <h2 className="font-display text-xl font-bold text-foreground">Executive Summary</h2>
          </div>
          <p className="leading-relaxed text-foreground/85">{executiveSummary}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Arguments For */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              <h3 className="font-display text-lg font-bold text-foreground">Arguments For</h3>
            </div>
            <div className="space-y-2">
              {keyArguments.forBill.map((arg, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg bg-success/5 p-3">
                  <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <p className="text-sm text-foreground">{arg}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Arguments Against */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="mb-4 flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              <h3 className="font-display text-lg font-bold text-foreground">Arguments Against</h3>
            </div>
            <div className="space-y-2">
              {keyArguments.againstBill.map((arg, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg bg-destructive/5 p-3">
                  <TrendingDown className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <p className="text-sm text-foreground">{arg}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Indicators */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-card lg:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <h3 className="font-display text-lg font-bold text-foreground">Risk Indicators</h3>
            </div>
            <div className="space-y-3">
              {riskIndicators.map((r, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase ${riskColors[r.risk as keyof typeof riskColors]}`}>
                      {r.risk}
                    </span>
                    <span className="font-medium text-foreground">{r.topic}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{r.detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
