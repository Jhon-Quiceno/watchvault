"use client";

import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Heart, Play, Trash2, X } from "lucide-react";

import type { EpisodeInfo, LibraryEntry } from "@/types/media";
import { cn } from "@/lib/utils";
import {
  MEDIA_TYPE_LABELS,
  WATCH_STATUSES,
  WATCH_STATUS_LABELS,
  formatRuntime,
} from "@/lib/format";
import { entryProgressSchema, watchStatusSchema } from "@/lib/schemas/library";
import { useRemoveEntry, useUpdateEntry } from "@/features/library/hooks/use-library";
import { useSeasonEpisodes } from "@/features/library/hooks/use-season-episodes";
import {
  isSeasonComplete,
  toggleEpisodeKey,
  toggleSeasonCompletion,
} from "@/features/library/lib/episode-progress";
import { PosterImage } from "@/components/shared/poster-image";
import { SimpleSelect, type SelectOption } from "@/components/shared/simple-select";
import { WatchProviders } from "@/components/shared/watch-providers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const STATUS_OPTIONS: SelectOption[] = WATCH_STATUSES.map((status) => ({
  value: status,
  label: WATCH_STATUS_LABELS[status],
}));

const entryFormSchema = z.object({
  status: watchStatusSchema,
  personalRating: z.number().min(0).max(10).nullable(),
  favorite: z.boolean(),
  notes: z.string().max(5000),
  progress: entryProgressSchema,
});
type EntryFormValues = z.infer<typeof entryFormSchema>;

/**
 * Entries created before the episode checklist existed only have a plain
 * `watchedEpisodes` count. To avoid the visible count jumping backward the
 * first time someone uses the checklist, that old count is kept as a local
 * baseline and added on top of newly checked episodes.
 */
function computeLegacyBaseline(entry: LibraryEntry): number {
  const keys = entry.progress.watchedEpisodeKeys ?? [];
  return keys.length === 0 && entry.progress.watchedEpisodes > 0
    ? entry.progress.watchedEpisodes
    : 0;
}

export function EntryDetailDialog({
  entry,
  open,
  onOpenChange,
}: {
  entry: LibraryEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateEntry = useUpdateEntry();
  const removeEntry = useRemoveEntry();

  if (!entry) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[90vh] gap-0 overflow-y-auto p-0 sm:max-w-2xl lg:max-w-3xl"
      >
        <DialogTitle className="sr-only">{entry.media.title}</DialogTitle>
        <DialogDescription className="sr-only">
          Detalles y seguimiento personal de {entry.media.title}.
        </DialogDescription>
        <EntryHeader entry={entry} onClose={() => onOpenChange(false)} />
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_1.1fr]">
          <EntryInfo entry={entry} />
          <EntryEditForm
            entry={entry}
            saving={updateEntry.isPending}
            deleting={removeEntry.isPending}
            onSave={(patch) => {
              if (updateEntry.isPending) return;
              updateEntry.mutate(
                { id: entry.id, patch },
                { onSuccess: () => onOpenChange(false) },
              );
            }}
            onDelete={() =>
              removeEntry.mutate(entry.id, { onSuccess: () => onOpenChange(false) })
            }
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EntryHeader({ entry, onClose }: { entry: LibraryEntry; onClose: () => void }) {
  return (
    <div className="relative h-44 w-full overflow-hidden sm:h-52">
      <PosterImage
        src={entry.media.backdropUrl ?? entry.media.posterUrl}
        alt={entry.media.title}
        sizes="(max-width: 1024px) 100vw, 768px"
      />
      <div className="from-popover absolute inset-0 bg-gradient-to-t via-popover/40 to-transparent" />
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute right-3 top-3 bg-black/40 text-white hover:bg-black/60"
      >
        <X />
      </Button>
      <div className="absolute bottom-4 left-6 right-6 flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{MEDIA_TYPE_LABELS[entry.media.type]}</Badge>
          {entry.media.year && <Badge variant="outline">{entry.media.year}</Badge>}
          {entry.media.runtimeMinutes && (
            <Badge variant="outline">{formatRuntime(entry.media.runtimeMinutes)}</Badge>
          )}
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">{entry.media.title}</h2>
        {entry.media.originalTitle && entry.media.originalTitle !== entry.media.title && (
          <p className="text-muted-foreground text-sm">{entry.media.originalTitle}</p>
        )}
      </div>
    </div>
  );
}

function EntryInfo({ entry }: { entry: LibraryEntry }) {
  const { media } = entry;
  return (
    <div className="flex flex-col gap-4 text-sm">
      {media.overview && <p className="text-muted-foreground leading-relaxed">{media.overview}</p>}
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
        <InfoRow label="Temporadas" value={media.seasonCount ? String(media.seasonCount) : null} />
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
          <p className="text-sm">{media.cast.slice(0, 6).map((c) => c.name).join(", ")}</p>
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

function EntryEditForm({
  entry,
  saving,
  deleting,
  onSave,
  onDelete,
}: {
  entry: LibraryEntry;
  saving: boolean;
  deleting: boolean;
  onSave: (patch: EntryFormValues) => void;
  onDelete: () => void;
}) {
  const [legacyBaseline, setLegacyBaseline] = useState(() => computeLegacyBaseline(entry));
  const [selectedSeason, setSelectedSeason] = useState<number | null>(
    entry.media.seasonCount ? 1 : null,
  );

  const { control, register, handleSubmit, reset, getValues, setValue } =
    useForm<EntryFormValues>({
      resolver: zodResolver(entryFormSchema),
      defaultValues: {
        status: entry.status,
        personalRating: entry.personalRating,
        favorite: entry.favorite,
        notes: entry.notes,
        progress: {
          watchedEpisodes: entry.progress.watchedEpisodes,
          watchedSeasons: entry.progress.watchedSeasons,
          watchedEpisodeKeys: entry.progress.watchedEpisodeKeys ?? [],
          completedSeasons: entry.progress.completedSeasons ?? [],
        },
      },
    });

  useEffect(() => {
    reset({
      status: entry.status,
      personalRating: entry.personalRating,
      favorite: entry.favorite,
      notes: entry.notes,
      progress: {
        watchedEpisodes: entry.progress.watchedEpisodes,
        watchedSeasons: entry.progress.watchedSeasons,
        watchedEpisodeKeys: entry.progress.watchedEpisodeKeys ?? [],
        completedSeasons: entry.progress.completedSeasons ?? [],
      },
    });
    setLegacyBaseline(computeLegacyBaseline(entry));
    setSelectedSeason(entry.media.seasonCount ? 1 : null);
  }, [entry, reset]);

  const watchedEpisodeKeys = useWatch({ control, name: "progress.watchedEpisodeKeys" }) ?? [];
  const completedSeasons = useWatch({ control, name: "progress.completedSeasons" }) ?? [];

  function toggleEpisode(seasonNumber: number, episodeNumber: number, seasonEpisodeCount: number) {
    const nextKeys = toggleEpisodeKey(
      getValues("progress.watchedEpisodeKeys"),
      seasonNumber,
      episodeNumber,
    );
    const complete = isSeasonComplete(nextKeys, seasonNumber, seasonEpisodeCount);
    const nextCompleted = toggleSeasonCompletion(
      getValues("progress.completedSeasons"),
      seasonNumber,
      complete,
    );

    setValue("progress.watchedEpisodeKeys", nextKeys, { shouldDirty: true });
    setValue("progress.completedSeasons", nextCompleted, { shouldDirty: true });
    setValue("progress.watchedEpisodes", legacyBaseline + nextKeys.length, { shouldDirty: true });
    setValue("progress.watchedSeasons", nextCompleted.length, { shouldDirty: true });
  }

  const trackProgress = entry.media.type !== "movie";
  const seasonOptions: SelectOption[] = entry.media.seasonCount
    ? Array.from({ length: entry.media.seasonCount }, (_, index) => ({
        value: String(index + 1),
        label: `Temporada ${index + 1}`,
      }))
    : [];

  const seasonEpisodesQuery = useSeasonEpisodes(
    entry.media.provider,
    "series",
    entry.media.providerId,
    selectedSeason ?? 1,
    entry.media.type === "series" && selectedSeason != null,
  );

  return (
    <form
      onSubmit={handleSubmit(onSave)}
      className="border-border/60 flex flex-col gap-4 rounded-2xl border p-4"
    >
      <div className="flex items-center justify-between">
        <p className="font-semibold">Tu seguimiento</p>
        <Controller
          control={control}
          name="favorite"
          render={({ field }) => (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant={field.value ? "default" : "outline"}
                    size="icon"
                    onClick={() => field.onChange(!field.value)}
                  />
                }
              >
                <Heart className={cn("size-4", field.value && "fill-current")} />
              </TooltipTrigger>
              <TooltipContent>
                {field.value ? "Agregado a favoritos" : "Agregar a favoritos"}
              </TooltipContent>
            </Tooltip>
          )}
        />
      </div>

      <Field label="Estado">
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <SimpleSelect
              value={field.value}
              onValueChange={field.onChange}
              options={STATUS_OPTIONS}
              className="w-full"
            />
          )}
        />
      </Field>

      <Field label="Mi calificación (0–10)">
        <Controller
          control={control}
          name="personalRating"
          render={({ field }) => (
            <Input
              type="number"
              min={0}
              max={10}
              step={0.5}
              value={field.value ?? ""}
              onChange={(event) =>
                field.onChange(event.target.value === "" ? null : Number(event.target.value))
              }
            />
          )}
        />
      </Field>

      {trackProgress && (
        <div className="flex flex-col gap-3 rounded-xl border border-border/60 p-3">
          <div className="flex items-center justify-between text-sm">
            <span>
              Episodios vistos: <strong>{legacyBaseline + watchedEpisodeKeys.length}</strong>
            </span>
            <span>
              Temporadas vistas: <strong>{completedSeasons.length}</strong>
            </span>
          </div>

          {entry.media.type === "series" && seasonOptions.length > 0 && selectedSeason != null && (
            <>
              <SimpleSelect
                value={String(selectedSeason)}
                onValueChange={(value) => setSelectedSeason(Number(value))}
                options={seasonOptions}
                className="w-full"
              />
              <EpisodeChecklist
                episodes={seasonEpisodesQuery.data ?? []}
                seasonNumber={selectedSeason}
                watchedKeys={watchedEpisodeKeys}
                onToggle={toggleEpisode}
                loading={seasonEpisodesQuery.isLoading}
              />
            </>
          )}

          {entry.media.type === "anime" && (
            <EpisodeChecklist
              episodes={entry.media.episodes ?? []}
              seasonNumber={1}
              watchedKeys={watchedEpisodeKeys}
              onToggle={toggleEpisode}
            />
          )}
        </div>
      )}

      <Field label="Notas">
        <Textarea rows={3} placeholder="Notas personales…" {...register("notes")} />
      </Field>

      <Separator />
      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="gap-1.5"
          disabled={deleting}
          onClick={onDelete}
        >
          <Trash2 className="size-4" />
          Quitar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}

function EpisodeChecklist({
  episodes,
  seasonNumber,
  watchedKeys,
  onToggle,
  loading,
}: {
  episodes: EpisodeInfo[];
  seasonNumber: number;
  watchedKeys: string[];
  onToggle: (seasonNumber: number, episodeNumber: number, seasonEpisodeCount: number) => void;
  loading?: boolean;
}) {
  if (loading) {
    return <p className="text-muted-foreground px-1 text-xs">Cargando episodios…</p>;
  }
  if (episodes.length === 0) {
    return <p className="text-muted-foreground px-1 text-xs">No hay episodios disponibles.</p>;
  }
  return (
    <ScrollArea className="border-border/60 h-48 rounded-lg border">
      <div className="divide-border/60 flex flex-col divide-y">
        {episodes.map((episode) => {
          const key = `${seasonNumber}:${episode.episodeNumber}`;
          const checked = watchedKeys.includes(key);
          return (
            <label key={key} className="flex items-center gap-2 px-3 py-2 text-sm">
              <Checkbox
                checked={checked}
                onCheckedChange={() => onToggle(seasonNumber, episode.episodeNumber, episodes.length)}
              />
              <span className="flex-1 truncate">
                Episodio {episode.episodeNumber}: {episode.name}
              </span>
            </label>
          );
        })}
      </div>
    </ScrollArea>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-muted-foreground text-xs font-medium">{label}</span>
      {children}
    </label>
  );
}
