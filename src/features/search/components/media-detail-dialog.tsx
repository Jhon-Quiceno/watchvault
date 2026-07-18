"use client";

import { AlertTriangle, Check, ChevronDown, Play, Plus, X } from "lucide-react";

import type { MediaSearchResult, WatchStatus } from "@/types/media";
import { cn } from "@/lib/utils";
import { MEDIA_TYPE_LABELS, WATCH_STATUSES, WATCH_STATUS_LABELS, formatRuntime } from "@/lib/format";
import { useMediaDetails } from "@/features/search/hooks/use-media-details";
import { useAddToLibrary } from "@/features/library/hooks/use-library";
import { PosterImage } from "@/components/shared/poster-image";
import { WatchProviders } from "@/components/shared/watch-providers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

export function MediaDetailDialog({
  result,
  open,
  onOpenChange,
  alreadyInLibrary,
}: {
  result: MediaSearchResult | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alreadyInLibrary: boolean;
}) {
  const addToLibrary = useAddToLibrary();
  const {
    data: media,
    isLoading,
    isError,
  } = useMediaDetails(
    result?.provider ?? "tmdb",
    result?.type ?? "movie",
    result?.providerId ?? "",
    open && Boolean(result),
  );

  if (!result) return null;

  function handleAdd(status: WatchStatus) {
    if (!result) return;
    addToLibrary.mutate(
      {
        provider: result.provider,
        providerId: result.providerId,
        type: result.type,
        status,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  const title = media?.title ?? result.title;
  const originalTitle = media?.originalTitle ?? result.originalTitle;
  const backdrop = media?.backdropUrl ?? result.backdropUrl ?? media?.posterUrl ?? result.posterUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[90vh] gap-0 overflow-y-auto p-0 sm:max-w-2xl lg:max-w-3xl"
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">Detalles de {title}.</DialogDescription>

        <div className="relative h-44 w-full overflow-hidden sm:h-52">
          <PosterImage
            src={backdrop}
            alt={title}
            sizes="(max-width: 1024px) 100vw, 768px"
          />
          <div className="from-popover absolute inset-0 bg-gradient-to-t via-popover/40 to-transparent" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            aria-label="Cerrar"
            className="absolute right-3 top-3 bg-black/40 text-white hover:bg-black/60"
          >
            <X />
          </Button>
          <div className="absolute bottom-4 left-6 right-6 flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{MEDIA_TYPE_LABELS[result.type]}</Badge>
              {result.year && <Badge variant="outline">{result.year}</Badge>}
              {media?.runtimeMinutes && (
                <Badge variant="outline">{formatRuntime(media.runtimeMinutes)}</Badge>
              )}
              {alreadyInLibrary && (
                <Badge variant="secondary" className="gap-1">
                  <Check className="size-3" />
                  En tu vault
                </Badge>
              )}
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
            {originalTitle && originalTitle !== title && (
              <p className="text-muted-foreground text-sm">{originalTitle}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6 p-6">
          {isLoading && <DetailSkeleton />}

          {isError && (
            <div className="text-muted-foreground flex flex-col items-center gap-2 py-8 text-center text-sm">
              <AlertTriangle className="size-6" />
              <p>No pudimos cargar los detalles de este título. Probá de nuevo más tarde.</p>
            </div>
          )}

          {media && (
            <div className="flex flex-col gap-4 text-sm">
              {media.overview && (
                <p className="text-muted-foreground leading-relaxed">{media.overview}</p>
              )}
              {media.genres.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {media.genres.map((genre) => (
                    <Badge key={genre} variant="secondary">
                      {genre}
                    </Badge>
                  ))}
                </div>
              )}
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                <InfoRow label="Director" value={media.director} />
                <InfoRow label="Estado" value={media.status || null} />
                <InfoRow
                  label="Episodios"
                  value={media.episodeCount ? String(media.episodeCount) : null}
                />
                <InfoRow
                  label="Temporadas"
                  value={media.seasonCount ? String(media.seasonCount) : null}
                />
                <InfoRow
                  label="Calificación del proveedor"
                  value={media.rating != null ? `${media.rating.toFixed(1)} / 10` : null}
                />
                <InfoRow
                  label="Estudios"
                  value={media.productionCompanies.slice(0, 2).join(", ") || null}
                />
              </dl>
              {media.cast.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                    Reparto
                  </p>
                  <p className="text-sm">
                    {media.cast.slice(0, 6).map((c) => c.name).join(", ")}
                  </p>
                </div>
              )}
              <WatchProviders providers={media.watchProviders} />
              {media.trailerUrl && (
                <a
                  href={media.trailerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary inline-flex w-fit items-center gap-1.5 text-sm font-medium hover:underline"
                >
                  <Play className="size-4" />
                  Ver tráiler
                </a>
              )}
            </div>
          )}

          <div className="flex w-full">
            <Button
              className={cn("flex-1 gap-1.5", !alreadyInLibrary && "rounded-r-none")}
              variant={alreadyInLibrary ? "secondary" : "default"}
              disabled={alreadyInLibrary || addToLibrary.isPending}
              onClick={() => handleAdd("plan_to_watch")}
            >
              {alreadyInLibrary ? <Check /> : <Plus />}
              {alreadyInLibrary ? "Ya está en tu vault" : "Agregar"}
            </Button>
            {!alreadyInLibrary && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="default"
                      className="rounded-l-none border-l border-l-primary-foreground/20 px-2"
                      disabled={addToLibrary.isPending}
                      aria-label="Elegir estado al agregar"
                    />
                  }
                >
                  <ChevronDown />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {WATCH_STATUSES.map((status) => (
                    <DropdownMenuItem key={status} onClick={() => handleAdd(status)}>
                      {WATCH_STATUS_LABELS[status]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  );
}
