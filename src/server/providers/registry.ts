import type { MediaProviderId, MediaType } from "@/types/media";
import type { MetadataProvider } from "@/server/providers/provider.interface";
import { tmdbProvider } from "@/server/providers/tmdb-provider";
import { anilistProvider } from "@/server/providers/anilist-provider";

/**
 * Concrete provider adapters are registered here. Adding a future source
 * (Jikan, Trakt, TVMaze, ...) is a one-line push — nothing else in the app
 * depends on a specific provider.
 */
const providers: MetadataProvider[] = [tmdbProvider, anilistProvider];

export function getProvider(id: MediaProviderId): MetadataProvider | undefined {
  return providers.find((provider) => provider.id === id);
}

export function getProvidersFor(type: MediaType): MetadataProvider[] {
  return providers.filter((provider) => provider.supports.includes(type));
}

export function getAllProviders(): MetadataProvider[] {
  return providers;
}
