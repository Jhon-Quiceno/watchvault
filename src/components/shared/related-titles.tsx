"use client";

import { useMemo } from "react";
import { Check, Plus } from "lucide-react";

import type { RelatedMedia } from "@/types/media";
import { useAddToLibrary, useLibrary } from "@/features/library/hooks/use-library";
import { PosterImage } from "@/components/shared/poster-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const RELATION_LABELS: Record<RelatedMedia["relation"], string> = {
  sequel: "Secuela",
  prequel: "Precuela",
  side_story: "Historia paralela",
  alternative: "Versión alternativa",
  summary: "Resumen",
  franchise: "Misma saga",
};

/**
 * Franchise continuations: sequels/prequels/side stories for anime (AniList's
 * relations graph) or same-collection movies for TMDB. Absent for TV series,
 * so the section naturally disappears there.
 */
export function RelatedTitles({ items }: { items: RelatedMedia[] }) {
  const { data: library = [] } = useLibrary();
  const addToLibrary = useAddToLibrary();

  const libraryKeys = useMemo(
    () => new Set(library.map((entry) => `${entry.media.provider}:${entry.media.providerId}`)),
    [library],
  );

  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
        Continúa la historia
      </p>
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
        {items.map((item) => {
          const key = `${item.provider}:${item.providerId}`;
          const inLibrary = libraryKeys.has(key);
          return (
            <div key={key} className="flex w-32 shrink-0 flex-col gap-1.5">
              <div className="border-border/60 bg-muted relative aspect-[2/3] overflow-hidden rounded-lg border">
                <PosterImage src={item.posterUrl} alt={item.title} sizes="128px" />
              </div>
              <Badge variant="secondary" className="max-w-full truncate">
                {RELATION_LABELS[item.relation]}
              </Badge>
              <div className="px-0.5">
                <p className="truncate text-xs font-medium leading-tight" title={item.title}>
                  {item.title}
                </p>
                {item.year && <p className="text-muted-foreground text-xs">{item.year}</p>}
              </div>
              <Button
                type="button"
                size="sm"
                variant={inLibrary ? "secondary" : "outline"}
                disabled={inLibrary || addToLibrary.isPending}
                className="h-7 gap-1 text-xs"
                onClick={() =>
                  addToLibrary.mutate({
                    provider: item.provider,
                    providerId: item.providerId,
                    type: item.type,
                    status: "plan_to_watch",
                  })
                }
              >
                {inLibrary ? (
                  <>
                    <Check className="size-3" />
                    Ya en tu vault
                  </>
                ) : (
                  <>
                    <Plus className="size-3" />
                    Agregar
                  </>
                )}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
