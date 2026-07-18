"use client";

import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { CalendarClock } from "lucide-react";

import type { LibraryEntry, NextEpisode } from "@/types/media";
import { formatDate } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { fetchMediaDetails } from "@/features/search/hooks/use-media-details";
import { PosterImage } from "@/components/shared/poster-image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const MS_PER_DAY = 86_400_000;
const RECENT_WINDOW_DAYS = 3;

interface UpcomingItem {
  entry: LibraryEntry;
  nextEpisode: NextEpisode;
  daysUntil: number;
}

function daysUntil(iso: string): number {
  const air = new Date(iso);
  const now = new Date();
  const airUTC = Date.UTC(air.getFullYear(), air.getMonth(), air.getDate());
  const nowUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((airUTC - nowUTC) / MS_PER_DAY);
}

function relativeLabel(days: number): string {
  if (days < 0) return "Ya disponible";
  if (days === 0) return "Hoy";
  if (days === 1) return "Mañana";
  return `En ${days} días`;
}

export function UpcomingEpisodes({
  entries,
  isLoading,
  onSelect,
}: {
  entries: LibraryEntry[];
  isLoading: boolean;
  onSelect: (entry: LibraryEntry) => void;
}) {
  const candidates = useMemo(
    () =>
      entries.filter(
        (entry) =>
          entry.status === "watching" &&
          (entry.media.type === "series" || entry.media.type === "anime"),
      ),
    [entries],
  );

  const freshQueries = useQueries({
    queries: candidates.map((entry) => ({
      queryKey: queryKeys.mediaDetails(
        entry.media.provider,
        entry.media.type,
        entry.media.providerId,
      ),
      queryFn: () =>
        fetchMediaDetails(entry.media.provider, entry.media.type, entry.media.providerId),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const items = useMemo(() => {
    const resolved: UpcomingItem[] = [];
    candidates.forEach((entry, index) => {
      const fresh = freshQueries[index];
      const nextEpisode = fresh?.isSuccess ? fresh.data?.nextEpisode : entry.media.nextEpisode;
      if (!nextEpisode?.airDate) return;
      const days = daysUntil(nextEpisode.airDate);
      if (days < -RECENT_WINDOW_DAYS) return;
      resolved.push({ entry, nextEpisode, daysUntil: days });
    });
    return resolved.sort((a, b) => a.daysUntil - b.daysUntil);
  }, [candidates, freshQueries]);

  const firstLoad =
    candidates.length > 0 && items.length === 0 && freshQueries.some((query) => query.isLoading);

  if (isLoading || firstLoad) {
    return <UpcomingEpisodesSkeleton />;
  }

  if (items.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold tracking-tight">Próximos episodios</h2>
        <Badge variant="secondary">{items.length}</Badge>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map(({ entry, nextEpisode, daysUntil: days }) => (
          <Card
            key={entry.id}
            size="sm"
            className="hover-lift cursor-pointer"
            role="button"
            tabIndex={0}
            onClick={() => onSelect(entry)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect(entry);
              }
            }}
          >
            <CardContent className="flex items-center gap-3">
              <div className="border-border/60 bg-muted relative aspect-[2/3] w-12 shrink-0 overflow-hidden rounded-lg border">
                <PosterImage src={entry.media.posterUrl} alt={entry.media.title} sizes="48px" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="truncate text-sm font-medium leading-tight">{entry.media.title}</p>
                <p className="text-muted-foreground truncate text-xs">
                  Temporada {nextEpisode.season} · Episodio {nextEpisode.episode}
                </p>
                <p className="text-muted-foreground flex items-center gap-1 text-xs">
                  <CalendarClock className="size-3" />
                  {formatDate(nextEpisode.airDate)} · {relativeLabel(days)}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function UpcomingEpisodesSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-6 w-48" />
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <Skeleton key={index} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
