"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Loader2, Plus, SearchX } from "lucide-react";

import type { MediaSearchResult, MediaType, WatchStatus } from "@/types/media";
import { MEDIA_TYPE_LABELS, WATCH_STATUSES, WATCH_STATUS_LABELS } from "@/lib/format";
import { useDebounce } from "@/hooks/use-debounce";
import { MediaCard } from "@/components/shared/media-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearch } from "@/features/search/hooks/use-search";
import { MediaDetailDialog } from "@/features/search/components/media-detail-dialog";
import { useAddToLibrary, useLibrary } from "@/features/library/hooks/use-library";

type TypeFilter = MediaType | "all";

const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "movie", label: "Películas" },
  { value: "series", label: "Series" },
  { value: "anime", label: "Anime" },
];

const GROUP_ORDER: MediaType[] = ["movie", "series", "anime"];

export function SearchView() {
  const [rawQuery, setRawQuery] = useState("");
  const [type, setType] = useState<TypeFilter>("all");
  const [selectedResult, setSelectedResult] = useState<MediaSearchResult | null>(null);
  const query = useDebounce(rawQuery, 350);

  const { data: results = [], isFetching } = useSearch(query, type);
  const { data: library = [] } = useLibrary();
  const addToLibrary = useAddToLibrary();

  const libraryKeys = useMemo(
    () => new Set(library.map((entry) => `${entry.media.provider}:${entry.media.providerId}`)),
    [library],
  );

  const grouped = useMemo(() => {
    const map = new Map<MediaType, MediaSearchResult[]>();
    for (const result of results) {
      const bucket = map.get(result.type) ?? [];
      bucket.push(result);
      map.set(result.type, bucket);
    }
    return map;
  }, [results]);

  const hasQuery = query.trim().length >= 2;

  function addResult(result: MediaSearchResult, status: WatchStatus) {
    addToLibrary.mutate({
      provider: result.provider,
      providerId: result.providerId,
      type: result.type,
      status,
    });
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Buscar</h1>
          <p className="text-muted-foreground">
            Encontrá títulos en TMDB y AniList, y agregalos a tu vault.
          </p>
        </div>
        <Input
          autoFocus
          value={rawQuery}
          onChange={(event) => setRawQuery(event.target.value)}
          placeholder="Buscar películas, series, anime…"
          className="h-12 text-base"
        />
        <div className="flex flex-wrap gap-2">
          {TYPE_FILTERS.map((filter) => (
            <Button
              key={filter.value}
              size="sm"
              variant={type === filter.value ? "default" : "outline"}
              onClick={() => setType(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
          {isFetching && hasQuery && (
            <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Buscando…
            </span>
          )}
        </div>
      </div>

      {!hasQuery ? (
        <EmptyState
          title="Empezá a escribir para buscar"
          description="Los resultados aparecen a medida que escribís, agrupados por películas, series y anime."
        />
      ) : isFetching && results.length === 0 ? (
        <ResultsSkeleton />
      ) : results.length === 0 ? (
        <EmptyState
          title="Sin resultados"
          description={`No encontramos nada para “${query}”. Probá con otro título.`}
        />
      ) : (
        <div className="flex flex-col gap-10">
          {GROUP_ORDER.filter((groupType) => grouped.has(groupType)).map((groupType) => (
            <section key={groupType} className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{MEDIA_TYPE_LABELS[groupType]}</h2>
                <Badge variant="secondary">{grouped.get(groupType)?.length ?? 0}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {grouped.get(groupType)?.map((result) => {
                  const added = libraryKeys.has(`${result.provider}:${result.providerId}`);
                  return (
                    <MediaCard
                      key={result.id}
                      posterUrl={result.posterUrl}
                      title={result.title}
                      subtitle={[result.year, MEDIA_TYPE_LABELS[result.type]]
                        .filter(Boolean)
                        .join(" · ")}
                      rating={result.rating}
                      onClick={() => setSelectedResult(result)}
                      badge={
                        added ? (
                          <Badge variant="secondary" className="gap-1">
                            <Check className="size-3" />
                            En tu vault
                          </Badge>
                        ) : undefined
                      }
                      overlay={
                        added ? (
                          <Button
                            size="sm"
                            className="pointer-events-none w-full gap-1.5"
                            variant="secondary"
                            disabled
                          >
                            <Check />
                            En el vault
                          </Button>
                        ) : (
                          <div className="flex w-full">
                            <Button
                              size="sm"
                              className="flex-1 gap-1 rounded-r-none"
                              disabled={addToLibrary.isPending}
                              onClick={(event) => {
                                event.stopPropagation();
                                addResult(result, "plan_to_watch");
                              }}
                            >
                              <Plus />
                              Agregar
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button
                                    size="sm"
                                    className="rounded-l-none border-l border-l-primary-foreground/20 px-1.5"
                                    disabled={addToLibrary.isPending}
                                    aria-label="Elegir estado al agregar"
                                    onClick={(event) => event.stopPropagation()}
                                  />
                                }
                              >
                                <ChevronDown className="size-3.5" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                onClick={(event) => event.stopPropagation()}
                              >
                                {WATCH_STATUSES.map((status) => (
                                  <DropdownMenuItem
                                    key={status}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      addResult(result, status);
                                    }}
                                  >
                                    {WATCH_STATUS_LABELS[status]}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )
                      }
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <MediaDetailDialog
        result={selectedResult}
        open={selectedResult !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedResult(null);
        }}
        alreadyInLibrary={
          selectedResult !== null &&
          libraryKeys.has(`${selectedResult.provider}:${selectedResult.providerId}`)
        }
      />
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="border-border/60 text-muted-foreground flex h-64 flex-col items-center justify-center gap-2 rounded-3xl border border-dashed text-center">
      <SearchX className="size-8" />
      <p className="text-foreground font-medium">{title}</p>
      <p className="max-w-sm text-sm">{description}</p>
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {Array.from({ length: 10 }).map((_, index) => (
        <div key={index} className="flex flex-col gap-2">
          <Skeleton className="aspect-[2/3] w-full rounded-xl" />
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}
