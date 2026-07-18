import type { WatchStatus } from "@/types/media";
import { cn } from "@/lib/utils";
import { WATCH_STATUS_LABELS } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

/** Per-status accent colors, kept subtle so posters stay the focus. */
const STATUS_STYLES: Record<WatchStatus, string> = {
  watching: "bg-emerald-500/15 text-emerald-500 border-emerald-500/25",
  completed: "bg-sky-500/15 text-sky-500 border-sky-500/25",
  plan_to_watch: "bg-violet-500/15 text-violet-500 border-violet-500/25",
  on_hold: "bg-amber-500/15 text-amber-500 border-amber-500/25",
  dropped: "bg-rose-500/15 text-rose-500 border-rose-500/25",
  rewatching: "bg-fuchsia-500/15 text-fuchsia-500 border-fuchsia-500/25",
};

export function StatusBadge({ status, className }: { status: WatchStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn(STATUS_STYLES[status], className)}>
      {WATCH_STATUS_LABELS[status]}
    </Badge>
  );
}
