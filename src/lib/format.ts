import type { MediaType, WatchStatus } from "@/types/media";

/** Formats a runtime in minutes as e.g. "2h 14m" or "48m". */
export function formatRuntime(minutes: number | null): string {
  if (!minutes || minutes <= 0) return "—";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/** Formats an ISO date string as a localized medium date. */
export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Rounds a 0–10 rating to one decimal, or "—" when absent. */
export function formatRating(rating: number | null): string {
  if (rating === null || rating === undefined) return "—";
  return rating.toFixed(1);
}

export const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
  movie: "Película",
  series: "Serie",
  anime: "Anime",
};

export const WATCH_STATUS_LABELS: Record<WatchStatus, string> = {
  watching: "Viendo",
  completed: "Completado",
  plan_to_watch: "Por ver",
  on_hold: "En pausa",
  dropped: "Abandonado",
  rewatching: "Reviendo",
};

export const WATCH_STATUSES: WatchStatus[] = [
  "watching",
  "completed",
  "plan_to_watch",
  "on_hold",
  "dropped",
  "rewatching",
];

export const MEDIA_TYPES: MediaType[] = ["movie", "series", "anime"];

/** Strips HTML tags (AniList descriptions arrive as light HTML). */
export function stripHtml(input: string): string {
  return input
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
