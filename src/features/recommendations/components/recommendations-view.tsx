"use client";

import { useMemo } from "react";
import { Sparkles } from "lucide-react";

import { buildRecommendations } from "@/features/recommendations/lib/recommend";
import { useLibrary } from "@/features/library/hooks/use-library";
import { PosterImage } from "@/components/shared/poster-image";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export function RecommendationsView() {
  const { data: entries = [], isLoading } = useLibrary();
  const recommendations = useMemo(() => buildRecommendations(entries), [entries]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="bg-accent text-primary grid size-12 place-items-center rounded-2xl">
          <Sparkles className="size-6" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Recomendaciones</h1>
          <p className="text-muted-foreground">
            Según los géneros, estudios y directores que mejor calificás.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, index) => (
            <Skeleton key={index} className="aspect-[2/3] w-full rounded-xl" />
          ))}
        </div>
      ) : entries.length < 3 ? (
        <div className="border-border/60 text-muted-foreground flex h-64 flex-col items-center justify-center gap-2 rounded-3xl border border-dashed text-center">
          <p className="text-foreground font-medium">Todavía no hay suficientes datos</p>
          <p className="max-w-sm text-sm">
            Agregá y calificá algunos títulos más —las recomendaciones mejoran a medida que crece
            tu vault.
          </p>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="border-border/60 text-muted-foreground flex h-64 flex-col items-center justify-center gap-2 rounded-3xl border border-dashed text-center">
          <p className="text-foreground font-medium">Todavía no hay recomendaciones</p>
          <p className="max-w-sm text-sm">
            No encontramos títulos relacionados con tu vault actual. Seguí agregando títulos que
            veas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {recommendations.map((rec) => (
            <div key={rec.id} className="flex flex-col gap-2">
              <div className="border-border/60 bg-muted relative aspect-[2/3] overflow-hidden rounded-xl border">
                <PosterImage src={rec.posterUrl} alt={rec.title} />
              </div>
              <div className="px-0.5">
                <p className="truncate text-sm font-medium" title={rec.title}>
                  {rec.title}
                </p>
                <Badge variant="secondary" className="mt-1 text-[0.7rem]">
                  {rec.reason}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
