"use client";

import { Heart, RotateCcw } from "lucide-react";

import type { LibraryEntry } from "@/types/media";
import { cn } from "@/lib/utils";
import { MEDIA_TYPE_LABELS, WATCH_STATUS_LABELS, WATCH_STATUSES, MEDIA_TYPES } from "@/lib/format";
import { useLibraryFilters } from "@/stores/library-filters-store";
import { collectTags } from "@/features/library/lib/filter-entries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SimpleSelect, type SelectOption } from "@/components/shared/simple-select";

const STATUS_OPTIONS: SelectOption[] = [
  { value: "all", label: "Todos los estados" },
  ...WATCH_STATUSES.map((status) => ({ value: status, label: WATCH_STATUS_LABELS[status] })),
];

const TYPE_OPTIONS: SelectOption[] = [
  { value: "all", label: "Todos los tipos" },
  ...MEDIA_TYPES.map((type) => ({ value: type, label: MEDIA_TYPE_LABELS[type] })),
];

const SORT_OPTIONS: SelectOption[] = [
  { value: "recent", label: "Actualizados recientemente" },
  { value: "title", label: "Título (A–Z)" },
  { value: "rating", label: "Mi calificación" },
  { value: "year", label: "Año de estreno" },
];

export function LibraryFilters({ entries }: { entries: LibraryEntry[] }) {
  const filters = useLibraryFilters();
  const tags = collectTags(entries);

  const tagOptions: SelectOption[] = [
    { value: "all", label: "Todas las etiquetas" },
    ...tags.map((tag) => ({ value: tag, label: tag })),
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        value={filters.query}
        onChange={(event) => filters.setQuery(event.target.value)}
        placeholder="Filtrar por título…"
        className="h-8 w-full max-w-xs"
      />
      <SimpleSelect
        value={filters.status}
        onValueChange={(value) => filters.setStatus(value as never)}
        options={STATUS_OPTIONS}
      />
      <SimpleSelect
        value={filters.type}
        onValueChange={(value) => filters.setType(value as never)}
        options={TYPE_OPTIONS}
      />
      {tags.length > 0 && (
        <SimpleSelect
          value={filters.tag ?? "all"}
          onValueChange={(value) => filters.setTag(value === "all" ? null : value)}
          options={tagOptions}
        />
      )}
      <SimpleSelect
        value={filters.sort}
        onValueChange={(value) => filters.setSort(value as never)}
        options={SORT_OPTIONS}
      />
      <Button
        variant={filters.favoritesOnly ? "default" : "outline"}
        size="icon"
        aria-pressed={filters.favoritesOnly}
        aria-label="Solo favoritos"
        onClick={filters.toggleFavoritesOnly}
      >
        <Heart className={cn(filters.favoritesOnly && "fill-current")} />
      </Button>
      <Button variant="ghost" size="icon" aria-label="Restablecer filtros" onClick={filters.reset}>
        <RotateCcw />
      </Button>
    </div>
  );
}
