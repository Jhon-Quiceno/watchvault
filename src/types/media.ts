/**
 * Internal domain model for Watchvault.
 *
 * This module is the anti-corruption boundary between external metadata
 * providers (TMDB, AniList, ...) and the rest of the application. Provider
 * adapters translate their own response shapes into these types; nothing
 * outside `src/server/providers` should depend on a provider's raw shape.
 */

export type MediaType = "movie" | "series" | "anime";

export type WatchStatus =
  | "watching"
  | "completed"
  | "plan_to_watch"
  | "on_hold"
  | "dropped"
  | "rewatching";

/**
 * Extensible union of supported metadata providers. Add new provider ids
 * here as adapters are implemented.
 */
export type MediaProviderId = "tmdb" | "anilist";

export interface MediaSearchResult {
  id: string;
  provider: MediaProviderId;
  providerId: string;
  type: MediaType;
  title: string;
  originalTitle: string;
  year: number | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  overview: string;
  rating: number | null;
}

export interface CastMember {
  name: string;
  character: string;
  profileUrl: string | null;
}

export interface NextEpisode {
  season: number;
  episode: number;
  airDate: string | null;
  name: string | null;
}

export interface WatchProvider {
  name: string;
  logoUrl: string | null;
  type: "stream" | "rent" | "buy";
}

export interface MediaCollection {
  id: string;
  name: string;
  posterUrl: string | null;
}

export interface SimilarMediaSummary {
  id: string;
  title: string;
  posterUrl: string | null;
}

export interface MediaDetails extends MediaSearchResult {
  genres: string[];
  runtimeMinutes: number | null;
  releaseDate: string | null;
  status: string;
  productionCompanies: string[];
  director: string | null;
  cast: CastMember[];
  seasonCount: number | null;
  episodeCount: number | null;
  nextEpisode?: NextEpisode;
  trailerUrl: string | null;
  watchProviders?: WatchProvider[];
  collections?: MediaCollection[];
  similar?: SimilarMediaSummary[];
}

export interface LibraryEntryProgress {
  watchedEpisodes: number;
  watchedSeasons: number;
}

/**
 * The user's own record of a media item. `media` is an embedded snapshot of
 * `MediaDetails` at the time it was added/last refreshed, so a library entry
 * remains readable even if the source provider later changes or removes it.
 */
export interface LibraryEntry {
  id: string;
  media: MediaDetails;
  status: WatchStatus;
  personalRating: number | null;
  favorite: boolean;
  notes: string;
  tags: string[];
  startedAt: string | null;
  finishedAt: string | null;
  rewatchCount: number;
  progress: LibraryEntryProgress;
  addedAt: string;
  updatedAt: string;
}

export interface CustomList {
  id: string;
  name: string;
  description: string;
  coverUrl: string | null;
  entryIds: string[];
  createdAt: string;
  updatedAt: string;
}
