import type { MediaDetails, MediaProviderId, MediaSearchResult, MediaType } from "@/types/media";
import {
  getAllProviders,
  getProvider,
  getProvidersFor,
} from "@/server/providers/registry";

/**
 * Aggregates metadata across every registered provider that supports the
 * requested type. Providers are queried in parallel and a single failing
 * source (e.g. a missing TMDB key) degrades gracefully to partial results
 * instead of failing the whole search.
 */
export async function searchMetadata(
  query: string,
  type?: MediaType,
): Promise<MediaSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const providers = type ? getProvidersFor(type) : getAllProviders();
  const settled = await Promise.allSettled(
    providers.map((provider) => provider.search(trimmed, { type })),
  );

  return settled
    .filter((result): result is PromiseFulfilledResult<MediaSearchResult[]> => result.status === "fulfilled")
    .flatMap((result) => result.value);
}

export async function getMediaDetails(
  provider: MediaProviderId,
  providerId: string,
  type: MediaType,
): Promise<MediaDetails> {
  const adapter = getProvider(provider);
  if (!adapter) {
    throw new Error(`Unknown provider: ${provider}`);
  }
  return adapter.getDetails(providerId, type);
}
