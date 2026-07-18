"use client";

import { useMemo } from "react";
import { BarChart3, Clock, Film, ListVideo, Star, Tv } from "lucide-react";

import type { RankedItem } from "@/features/stats/lib/compute-stats";
import { computeStats } from "@/features/stats/lib/compute-stats";
import { useLibrary } from "@/features/library/hooks/use-library";
import { ActivityHeatmap } from "@/features/stats/components/activity-heatmap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function StatsView() {
  const { data: entries = [], isLoading } = useLibrary();
  const stats = useMemo(() => computeStats(entries), [entries]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl">
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="border-border/60 text-muted-foreground mx-auto flex h-64 max-w-6xl flex-col items-center justify-center gap-2 rounded-3xl border border-dashed text-center">
        <BarChart3 className="size-8" />
        <p className="text-foreground font-medium">Todavía no hay estadísticas</p>
        <p className="max-w-sm text-sm">
          Agregá títulos a tu vault para ver tus estadísticas de visualización.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Estadísticas</h1>
        <p className="text-muted-foreground">Un vistazo a tus hábitos de visualización.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile icon={Film} label="Películas" value={stats.byType.movie} />
        <Tile icon={Tv} label="Series" value={stats.byType.series} />
        <Tile icon={ListVideo} label="Anime" value={stats.byType.anime} />
        <Tile icon={Clock} label="Horas vistas" value={stats.hoursWatched} />
        <Tile icon={BarChart3} label="Episodios vistos" value={stats.episodesWatched} />
        <Tile icon={Star} label="Calificación media" value={stats.avgRating ?? "—"} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <RankCard title="Géneros más vistos" items={stats.topGenres} />
        <RankCard title="Estudios más vistos" items={stats.topStudios} />
        <RankCard title="Directores más vistos" items={stats.topDirectors} />
        <RankCard title="Años con más títulos" items={stats.topYears} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actividad</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityHeatmap activity={stats.activityByDay} />
        </CardContent>
      </Card>
    </div>
  );
}

function Tile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Film;
  label: string;
  value: number | string;
}) {
  return (
    <Card>
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

function RankCard({ title, items }: { title: string; items: RankedItem[] }) {
  const max = items[0]?.count ?? 1;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5">
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">Todavía no hay suficientes datos.</p>
        ) : (
          items.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="w-32 shrink-0 truncate text-sm" title={item.label}>
                {item.label}
              </span>
              <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
                <div
                  className="bg-gradient-brand h-full rounded-full"
                  style={{ width: `${Math.max(6, (item.count / max) * 100)}%` }}
                />
              </div>
              <span className="text-muted-foreground w-6 shrink-0 text-right text-sm tabular-nums">
                {item.count}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
