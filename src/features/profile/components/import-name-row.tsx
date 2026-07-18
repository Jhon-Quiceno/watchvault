"use client";

import { useMemo } from "react";
import { Check } from "lucide-react";

import type { MediaProviderId, MediaSearchResult, MediaType } from "@/types/media";
import { MEDIA_TYPE_LABELS } from "@/lib/format";
import { SimpleSelect, type SelectOption } from "@/components/shared/simple-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const SKIP_VALUE = "__skip__";

/** Candidate select values are the search result's own id, formatted as `provider:type:providerId`. */
export function decodeCandidateId(
  value: string,
): { provider: MediaProviderId; type: MediaType; providerId: string } | null {
  const parts = value.split(":");
  if (parts.length !== 3) return null;
  const [provider, type, providerId] = parts;
  if (!provider || !type || !providerId) return null;
  return { provider: provider as MediaProviderId, type: type as MediaType, providerId };
}

export function ImportNameRow({
  raw,
  isLoading,
  isError,
  results,
  refetch,
  selectedValue,
  onSelectedChange,
  alreadyInLibraryIds,
}: {
  raw: string;
  yearHint: number | null;
  isLoading: boolean;
  isError: boolean;
  results: MediaSearchResult[];
  refetch: () => void;
  selectedValue: string;
  onSelectedChange: (value: string) => void;
  alreadyInLibraryIds: Set<string>;
}) {
  const options: SelectOption[] = useMemo(() => {
    const candidates = results.slice(0, 5).map((candidate) => ({
      value: candidate.id,
      label: `${candidate.title} (${candidate.year ?? "?"}) · ${MEDIA_TYPE_LABELS[candidate.type]}`,
    }));
    return [{ value: SKIP_VALUE, label: "No importar" }, ...candidates];
  }, [results]);

  const selectedInLibrary = useMemo(() => {
    if (selectedValue === SKIP_VALUE) return false;
    const decoded = decodeCandidateId(selectedValue);
    if (!decoded) return false;
    return alreadyInLibraryIds.has(`${decoded.provider}:${decoded.providerId}`);
  }, [selectedValue, alreadyInLibraryIds]);

  const noResults = !isLoading && !isError && results.length === 0;

  return (
    <div
      className={
        "border-border/60 flex flex-col gap-1.5 border-b py-3 last:border-b-0" +
        (noResults ? " opacity-50" : "")
      }
    >
      <p className="truncate text-sm font-medium">{raw}</p>

      {isLoading && <Skeleton className="h-8 w-full max-w-sm" />}

      {!isLoading && isError && (
        <div className="text-destructive flex items-center gap-2 text-sm">
          <span>Error al buscar</span>
          <Button variant="ghost" size="sm" onClick={refetch}>
            Reintentar
          </Button>
        </div>
      )}

      {noResults && <p className="text-muted-foreground text-sm">Sin resultados</p>}

      {!isLoading && !isError && results.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <SimpleSelect
            value={selectedValue}
            onValueChange={onSelectedChange}
            options={options}
            size="sm"
            className="max-w-sm"
          />
          {selectedInLibrary && (
            <Badge variant="secondary" className="gap-1">
              <Check className="size-3" />
              Ya en tu biblioteca
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
