import { Link } from "react-router-dom";
import { Radio, Clock, Users, MessageSquare } from "lucide-react";
import { format } from "date-fns";

interface HearingCardProps {
  id: string;
  title: string;
  committee: string;
  scheduled_at: string;
  status: string;
  viewers: number | null;
}

export default function HearingCard({ id, title, committee, scheduled_at, status, viewers }: HearingCardProps) {
  const dateStr = format(new Date(scheduled_at), "MMM d, yyyy · h:mm a");

  return (
    <Link
      to={`/hearing/${id}`}
      className="group block rounded-xl border border-border bg-card p-5 shadow-card transition-all hover:shadow-elevated hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            {status === "live" ? (
              <span className="flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
                </span>
                LIVE
              </span>
            ) : status === "upcoming" ? (
              <span className="rounded-full bg-info/10 px-2.5 py-1 text-xs font-semibold text-info">UPCOMING</span>
            ) : (
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">ARCHIVED</span>
            )}
            <span className="text-xs text-muted-foreground">{committee}</span>
          </div>

          <h3 className="mb-1 font-display text-lg font-bold text-foreground group-hover:text-accent transition-colors">
            {title}
          </h3>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {dateStr}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {(viewers || 0).toLocaleString()}
            </span>
          </div>
        </div>

        {status === "live" && (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
            <Radio className="h-5 w-5" />
          </div>
        )}
      </div>
    </Link>
  );
}
