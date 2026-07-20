import type { MediaProviderId, MediaType } from "@/types/media";

/**
 * Centralized TanStack Query key factory. Keeping every key in one place
 * prevents typos and makes cache invalidation predictable across features.
 */
export const queryKeys = {
  search: (query: string, type: MediaType | "all") => ["search", type, query] as const,
  mediaDetails: (provider: MediaProviderId, type: MediaType, providerId: string) =>
    ["media", provider, type, providerId] as const,
  seasonEpisodes: (provider: MediaProviderId, providerId: string, seasonNumber: number) =>
    ["media", provider, "season", providerId, seasonNumber] as const,
  library: {
    all: ["library"] as const,
    detail: (id: string) => ["library", id] as const,
  },
  lists: {
    all: ["lists"] as const,
    detail: (id: string) => ["lists", id] as const,
  },
} as const;
