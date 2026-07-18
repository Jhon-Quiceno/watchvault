"use client";

import { useMemo, useState } from "react";
import { Clock, Film, Sparkles, Star } from "lucide-react";

import type { LibraryEntry } from "@/types/media";
import { MEDIA_TYPE_LABELS } from "@/lib/format";
import { useLibrary } from "@/features/library/hooks/use-library";
import { StatusBadge } from "@/features/library/components/status-badge";
import { EntryDetailDialog } from "@/features/library/components/entry-detail-dialog";
import { UpcomingEpisodes } from "@/features/dashboard/components/upcoming-episodes";
import { LinkButton } from "@/components/shared/link-button";
import { MediaCard } from "@/components/shared/media-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardView() {
  const { data: entries = [], isLoading } = useLibrary();
  const [selected, setSelected] = useState<LibraryEntry | null>(null);
  const selectedLive = selected
    ? (entries.find((entry) => entry.id === selected.id) ?? null)
    : null;

  const shelves = useMemo(() => buildShelves(entries), [entries]);
  const stats = useMemo(() => buildStats(entries), [entries]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10">
      <Hero />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={Film} label="Títulos" value={stats.total} />
        <StatTile icon={Clock} label="Horas vistas" value={stats.hours} />
        <StatTile icon={Star} label="Calificación media" value={stats.avgRating} />
        <StatTile icon={Sparkles} label="Favoritos" value={stats.favorites} />
      </section>

      <UpcomingEpisodes entries={entries} isLoading={isLoading} onSelect={setSelected} />

      {isLoading ? (
        <ShelfSkeleton />
      ) : entries.length === 0 ? (
        <EmptyDashboard />
      ) : (
        shelves.map((shelf) =>
          shelf.entries.length > 0 ? (
            <Shelf
              key={shelf.id}
              title={shelf.title}
              entries={shelf.entries}
              onSelect={setSelected}
            />
          ) : null,
        )
      )}

      <EntryDetailDialog
        entry={selectedLive}
        open={selectedLive !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </div>
  );
}

function Hero() {
  return (
    <section className="border-border/60 bg-card/40 relative overflow-hidden rounded-3xl border p-8 lg:p-12">
      <div className="bg-gradient-brand absolute -right-24 -top-24 size-72 rounded-full opacity-20 blur-3xl" />
      <div className="relative flex flex-col gap-4">
        <Badge variant="secondary" className="w-fit gap-1.5">
          <Sparkles className="size-3.5" />
          Tu biblioteca personal
        </Badge>
        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight lg:text-4xl">
          Todo lo que viste, y todo lo que querés ver,{" "}
          <span className="text-gradient-brand">en un solo lugar</span>.
        </h1>
        <div className="flex flex-wrap gap-2">
          <LinkButton href="/search">Agregar título</LinkButton>
          <LinkButton href="/library" variant="outline">
            Ver biblioteca
          </LinkButton>
        </div>
      </div>
    </section>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Film;
  label: string;
  value: string;
}) {
  return (
    <Card className="hover-lift">
      <CardContent className="flex items-center gap-4">
        <span className="bg-accent text-primary grid size-11 shrink-0 place-items-center rounded-xl">
          <Icon className="size-5" />
        </span>
        <div className="flex flex-col">
          <span className="text-2xl font-semibold tabular-nums">{value}</span>
          <span className="text-muted-foreground text-sm">{label}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function Shelf({
  title,
  entries,
  onSelect,
}: {
  title: string;
  entries: LibraryEntry[];
  onSelect: (entry: LibraryEntry) => void;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <Badge variant="secondary">{entries.length}</Badge>
      </div>
      <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
        {entries.map((entry) => (
          <div key={entry.id} className="w-36 shrink-0 sm:w-40">
            <MediaCard
              posterUrl={entry.media.posterUrl}
              title={entry.media.title}
              subtitle={[entry.media.year, MEDIA_TYPE_LABELS[entry.media.type]]
                .filter(Boolean)
                .join(" · ")}
              rating={entry.personalRating}
              badge={<StatusBadge status={entry.status} />}
              onClick={() => onSelect(entry)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function EmptyDashboard() {
  return (
    <div className="border-border/60 flex h-64 flex-col items-center justify-center gap-3 rounded-3xl border border-dashed text-center">
      <div>
        <p className="text-foreground font-medium">Todavía no hay nada acá</p>
        <p className="text-muted-foreground max-w-sm text-sm">
          Agregá tu primer título y tus estanterías —Continúa viendo, Agregados recientemente,
          Favoritos— cobran vida.
        </p>
      </div>
      <LinkButton href="/search">Buscar títulos</LinkButton>
    </div>
  );
}

function ShelfSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-6 w-40" />
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="w-36 shrink-0 sm:w-40">
            <Skeleton className="aspect-[2/3] w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

interface Shelf {
  id: string;
  title: string;
  entries: LibraryEntry[];
}

function buildShelves(entries: LibraryEntry[]): Shelf[] {
  const byUpdated = [...entries].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const byAdded = [...entries].sort((a, b) => b.addedAt.localeCompare(a.addedAt));
  return [
    {
      id: "continue",
      title: "Continúa viendo",
      entries: byUpdated.filter((e) => e.status === "watching" || e.status === "rewatching"),
    },
    { id: "recent", title: "Agregados recientemente", entries: byAdded.slice(0, 12) },
    { id: "favorites", title: "Favoritos", entries: byUpdated.filter((e) => e.favorite) },
    {
      id: "plan",
      title: "Por ver",
      entries: byUpdated.filter((e) => e.status === "plan_to_watch"),
    },
  ];
}

function buildStats(entries: LibraryEntry[]) {
  const totalMinutes = entries.reduce((sum, entry) => {
    const runtime = entry.media.runtimeMinutes ?? 0;
    if (entry.media.type === "movie") {
      return sum + (entry.status === "completed" ? runtime : 0);
    }
    return sum + runtime * entry.progress.watchedEpisodes;
  }, 0);
  const rated = entries.filter((e) => e.personalRating != null);
  const avg =
    rated.length > 0
      ? rated.reduce((sum, e) => sum + (e.personalRating ?? 0), 0) / rated.length
      : 0;
  return {
    total: String(entries.length),
    hours: `${Math.round(totalMinutes / 60)}`,
    avgRating: rated.length ? avg.toFixed(1) : "—",
    favorites: String(entries.filter((e) => e.favorite).length),
  };
}
