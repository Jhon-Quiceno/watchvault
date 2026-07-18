"use client";

import { useQueries } from "@tanstack/react-query";

import type { MediaSearchResult } from "@/types/media";
import { queryKeys } from "@/lib/query-keys";
import { fetchSearch } from "@/features/search/hooks/use-search";
import type { ParsedNameItem } from "@/features/profile/lib/parse-names";

export interface NameResolutionRow {
  raw: string;
  yearHint: number | null;
  isLoading: boolean;
  isError: boolean;
  results: MediaSearchResult[];
  refetch: () => void;
}

export function useNameResolution(
  items: ParsedNameItem[],
  enabled: boolean,
): NameResolutionRow[] {
  const queries = useQueries({
    queries: items.map((item) => ({
      queryKey: queryKeys.search(item.query, "all"),
      queryFn: () => fetchSearch(item.query, "all"),
      enabled,
      staleTime: 5 * 60 * 1000,
    })),
  });

  return items.map((item, index) => {
    const query = queries[index];
    return {
      raw: item.raw,
      yearHint: item.yearHint,
      isLoading: query?.isLoading ?? false,
      isError: query?.isError ?? false,
      results: query?.data ?? [],
      refetch: () => {
        void query?.refetch();
      },
    };
  });
}
