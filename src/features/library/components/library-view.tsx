"use client";

import { useEffect, useMemo, useState } from "react";
import { Library, Search } from "lucide-react";

import type { LibraryEntry } from "@/types/media";
import { MEDIA_TYPE_LABELS } from "@/lib/format";
import { useLibraryFilters } from "@/stores/library-filters-store";
import { filterEntries } from "@/features/library/lib/filter-entries";
import { useLibrary } from "@/features/library/hooks/use-library";
import { LibraryFilters } from "@/features/library/components/library-filters";
import { LibraryBulkActionsBar } from "@/features/library/components/library-bulk-actions-bar";
import { StatusBadge } from "@/features/library/components/status-badge";
import { EntryDetailDialog } from "@/features/library/components/entry-detail-dialog";
import { LinkButton } from "@/components/shared/link-button";
import { MediaCard } from "@/components/shared/media-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function LibraryView() {
  const { data: entries = [], isLoading } = useLibrary();
  const filters = useLibraryFilters();
  const [selected, setSelected] = useState<LibraryEntry | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const visible = useMemo(
    () =>
      filterEntries(entries, {
        query: filters.query,
        status: filters.status,
        type: filters.type,
        tag: filters.tag,
        favoritesOnly: filters.favoritesOnly,
        sort: filters.sort,
      }),
    [entries, filters],
  );

  // Drop selected ids that fell out of the filtered view instead of acting on stale entries.
  useEffect(() => {
    setSelectedIds((prev) => {
      if (prev.size === 0) return prev;
      const next = new Set([...prev].filter((id) => visible.some((entry) => entry.id === id)));
      return next.size === prev.size ? prev : next;
    });
  }, [visible]);

  // Keep the open dialog in sync with optimistic cache updates.
  const selectedLive = selected
    ? (entries.find((entry) => entry.id === selected.id) ?? null)
    : null;

  function toggleSelectionMode() {
    setSelectionMode((prev) => !prev);
    setSelectedIds(new Set());
  }

  function toggleEntrySelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Biblioteca</h1>
          <p className="text-muted-foreground">
            {entries.length} {entries.length === 1 ? "título" : "títulos"} en tu vault.
          </p>
        </div>
        {entries.length > 0 && (
          <Button
            variant={selectionMode ? "secondary" : "outline"}
            size="sm"
            onClick={toggleSelectionMode}
          >
            {selectionMode ? "Cancelar selección" : "Seleccionar"}
          </Button>
        )}
      </div>

      {entries.length > 0 && <LibraryFilters entries={entries} />}

      {isLoading ? (
        <LibrarySkeleton />
      ) : entries.length === 0 ? (
        <EmptyLibrary />
      ) : visible.length === 0 ? (
        <div className="border-border/60 text-muted-foreground flex h-56 flex-col items-center justify-center gap-2 rounded-3xl border border-dashed text-center">
          <p className="text-foreground font-medium">Ningún título coincide con estos filtros</p>
          <Button variant="outline" size="sm" onClick={filters.reset}>
            Limpiar filtros
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {visible.map((entry) => (
            <MediaCard
              key={entry.id}
              posterUrl={entry.media.posterUrl}
              title={entry.media.title}
              subtitle={[entry.media.year, MEDIA_TYPE_LABELS[entry.media.type]]
                .filter(Boolean)
                .join(" · ")}
              rating={entry.personalRating}
              badge={<StatusBadge status={entry.status} />}
              selected={selectionMode ? selectedIds.has(entry.id) : undefined}
              onClick={() =>
                selectionMode ? toggleEntrySelected(entry.id) : setSelected(entry)
              }
            />
          ))}
        </div>
      )}

      {selectedIds.size > 0 && (
        <LibraryBulkActionsBar
          selectedIds={[...selectedIds]}
          onClearSelection={() => setSelectedIds(new Set())}
          onExit={() => {
            setSelectionMode(false);
            setSelectedIds(new Set());
          }}
        />
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

function EmptyLibrary() {
  return (
    <div className="border-border/60 flex h-72 flex-col items-center justify-center gap-3 rounded-3xl border border-dashed text-center">
      <span className="bg-accent text-primary grid size-14 place-items-center rounded-2xl">
        <Library className="size-7" />
      </span>
      <div>
        <p className="text-foreground font-medium">Tu vault está vacío</p>
        <p className="text-muted-foreground max-w-sm text-sm">
          Buscá en TMDB y AniList para agregar la primera película, serie o anime que hayas visto.
        </p>
      </div>
      <LinkButton href="/search" className="gap-1.5">
        <Search className="size-4" />
        Buscar títulos
      </LinkButton>
    </div>
  );
}

function LibrarySkeleton() {
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
