"use client";

import { useQuery } from "@tanstack/react-query";

import type { EpisodeInfo, MediaProviderId, MediaType } from "@/types/media";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

async function fetchSeasonEpisodes(
  provider: MediaProviderId,
  type: MediaType,
  providerId: string,
  seasonNumber: number,
): Promise<EpisodeInfo[]> {
  const { data } = await apiClient.get<{ episodes: EpisodeInfo[] }>(
    `/media/${provider}/${type}/${providerId}/season/${seasonNumber}`,
  );
  return data.episodes;
}

/** On-demand episode list for one season, fetched only when a season is selected. */
export function useSeasonEpisodes(
  provider: MediaProviderId,
  type: MediaType,
  providerId: string,
  seasonNumber: number,
  enabled: boolean,
) {
  return useQuery({
    queryKey: queryKeys.seasonEpisodes(provider, providerId, seasonNumber),
    queryFn: () => fetchSeasonEpisodes(provider, type, providerId, seasonNumber),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
