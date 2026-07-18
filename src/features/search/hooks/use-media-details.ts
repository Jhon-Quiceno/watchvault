"use client";

import { useQuery } from "@tanstack/react-query";

import type { MediaDetails, MediaProviderId, MediaType } from "@/types/media";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export async function fetchMediaDetails(
  provider: MediaProviderId,
  type: MediaType,
  providerId: string,
): Promise<MediaDetails> {
  const { data } = await apiClient.get<{ media: MediaDetails }>(
    `/media/${provider}/${type}/${providerId}`,
  );
  return data.media;
}

export function useMediaDetails(
  provider: MediaProviderId,
  type: MediaType,
  providerId: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: queryKeys.mediaDetails(provider, type, providerId),
    queryFn: () => fetchMediaDetails(provider, type, providerId),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
