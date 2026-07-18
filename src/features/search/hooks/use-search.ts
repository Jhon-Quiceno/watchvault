"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import type { MediaSearchResult, MediaType } from "@/types/media";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

async function fetchSearch(
  query: string,
  type: MediaType | "all",
): Promise<MediaSearchResult[]> {
  const { data } = await apiClient.get<{ results: MediaSearchResult[] }>("/search", {
    params: { q: query, ...(type !== "all" ? { type } : {}) },
  });
  return data.results;
}

export function useSearch(query: string, type: MediaType | "all") {
  return useQuery({
    queryKey: queryKeys.search(query, type),
    queryFn: () => fetchSearch(query, type),
    enabled: query.trim().length >= 2,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });
}
