import type {
  EpisodeInfo,
  MediaDetails,
  MediaProviderId,
  MediaSearchResult,
  MediaType,
} from "@/types/media";

export interface MetadataSearchOptions {
  type?: MediaType;
  page?: number;
}

/**
 * Contract every external metadata source (TMDB, AniList, ...) must
 * implement. Adapters live in this folder and translate provider-specific
 * responses into the internal domain model from `@/types/media`.
 */
export interface MetadataProvider {
  readonly id: MediaProviderId;
  readonly supports: MediaType[];

  search(query: string, opts?: MetadataSearchOptions): Promise<MediaSearchResult[]>;

  getDetails(providerId: string, type: MediaType): Promise<MediaDetails>;

  /** On-demand per-season episode list. Only TMDB (series) implements this. */
  getSeasonEpisodes?(providerId: string, seasonNumber: number): Promise<EpisodeInfo[]>;
}
